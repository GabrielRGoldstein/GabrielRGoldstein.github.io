#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import { assertDecodedPixelLimit, MAX_INPUT_PIXELS } from "./lib/project-image-policy.mjs";
import { sameCanonicalPath, snapshotRegularFile } from "./lib/snapshot-regular-file.mjs";
import { projectsSchema } from "../src/schemas/content.ts";

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_PROJECTS_BYTES = 2 * 1024 * 1024;

const MIN_SOURCE_WIDTH = 1600;
const MIN_SOURCE_HEIGHT = 1000;
const SUPPORTED_FORMATS = new Set(["jpeg", "png", "webp", "heif"]);
const CARD_VARIANTS = [
  { suffix: "-640", width: 640, height: 400 },
  { suffix: "-800", width: 800, height: 500 },
  { suffix: "", width: 1600, height: 1000 },
];
const DETAIL_MAXIMUM = 1600;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TAR_BLOCK_BYTES = 512;

function usage() {
  return [
    "Usage:",
    "  NODE_DISABLE_COMPILE_CACHE=1 npm run --silent project:image -- --slug <project-slug> --source <image> --alt <text> [--root <repo>] > project-image-bundle.tar",
    "",
    "The command reads canonical repository inputs and streams a deterministic review archive to stdout.",
    "It performs no output filesystem writes. Diagnostics are written only to stderr.",
  ].join("\n");
}

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    if (values.has(token)) throw new Error(`Duplicate argument: ${token}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${token}`);
    }
    values.set(token, value);
    index += 1;
  }

  for (const required of ["--slug", "--source", "--alt"]) {
    if (!values.has(required)) throw new Error(`Missing required argument ${required}`);
  }
  for (const key of values.keys()) {
    if (!["--slug", "--source", "--alt", "--root"].includes(key)) {
      throw new Error(`Unknown argument ${key}`);
    }
  }

  const slug = values.get("--slug");
  if (slug.length > 64 || !SLUG_PATTERN.test(slug)) {
    throw new Error(
      "Slug must be at most 64 lowercase letters/numbers separated by single hyphens",
    );
  }

  return {
    slug,
    source: values.get("--source"),
    alt: values.get("--alt"),
    root: values.get("--root") ?? process.cwd(),
  };
}

async function canonicalRepositoryRoot(rootInput) {
  const resolved = path.resolve(rootInput);
  const stat = await lstat(resolved);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error("Repository root must be a real directory, not a link");
  }
  const canonical = await realpath(resolved);
  if (!sameCanonicalPath(resolved, canonical)) {
    throw new Error("Repository root must be addressed by its canonical path");
  }
  return canonical;
}


function parseJsonWithoutDuplicateKeys(text) {
  let index = 0;
  const skipWhitespace = () => {
    while (/[\t\n\r ]/.test(text[index] ?? "")) index += 1;
  };
  const parseString = () => {
    if (text[index] !== '"') throw new Error("Expected a JSON string");
    const start = index;
    index += 1;
    while (index < text.length) {
      if (text[index] === "\\") {
        index += 2;
        continue;
      }
      if (text[index] === '"') {
        index += 1;
        return JSON.parse(text.slice(start, index));
      }
      if (text.charCodeAt(index) < 0x20) {
        throw new Error("Unescaped control character in JSON string");
      }
      index += 1;
    }
    throw new Error("Unterminated JSON string");
  };
  const parseValue = (depth = 0) => {
    if (depth > 100) throw new Error("JSON nesting exceeds 100 levels");
    skipWhitespace();
    if (text[index] === '"') return parseString();
    if (text[index] === "{") {
      index += 1;
      const object = {};
      const keys = new Set();
      skipWhitespace();
      if (text[index] === "}") {
        index += 1;
        return object;
      }
      while (index < text.length) {
        skipWhitespace();
        const key = parseString();
        if (keys.has(key)) throw new Error(`Duplicate JSON object key "${key}"`);
        keys.add(key);
        skipWhitespace();
        if (text[index] !== ":") throw new Error("Expected ':' after JSON key");
        index += 1;
        Object.defineProperty(object, key, {
          value: parseValue(depth + 1),
          enumerable: true,
          writable: true,
          configurable: true,
        });
        skipWhitespace();
        if (text[index] === "}") {
          index += 1;
          return object;
        }
        if (text[index] !== ",") throw new Error("Expected ',' in JSON object");
        index += 1;
      }
      throw new Error("Unterminated JSON object");
    }
    if (text[index] === "[") {
      index += 1;
      const array = [];
      skipWhitespace();
      if (text[index] === "]") {
        index += 1;
        return array;
      }
      while (index < text.length) {
        array.push(parseValue(depth + 1));
        skipWhitespace();
        if (text[index] === "]") {
          index += 1;
          return array;
        }
        if (text[index] !== ",") throw new Error("Expected ',' in JSON array");
        index += 1;
      }
      throw new Error("Unterminated JSON array");
    }
    for (const [literal, value] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ]) {
      if (text.startsWith(literal, index)) {
        index += literal.length;
        return value;
      }
    }
    const number = text.slice(index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (number) {
      index += number[0].length;
      const value = Number(number[0]);
      if (!Number.isFinite(value)) throw new Error("JSON number is not finite");
      return value;
    }
    throw new Error("Unexpected JSON token");
  };

  const value = parseValue();
  skipWhitespace();
  if (index !== text.length) throw new Error("Unexpected trailing JSON content");
  return value;
}

function parseCanonicalProjects(buffer) {
  let raw;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    raw = parseJsonWithoutDuplicateKeys(text);
  } catch {
    throw new Error(
      "src/data/projects.json is not strict UTF-8 JSON or contains duplicate keys",
    );
  }
  const result = projectsSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`src/data/projects.json failed validation: ${result.error.message}`);
  }
  if (!isDeepStrictEqual(raw, result.data)) {
    throw new Error(
      "src/data/projects.json must already be canonical; schema coercion or trimming is not allowed",
    );
  }
  return raw;
}

async function inspectSource(buffer) {
  const image = sharp(buffer, {
    animated: false,
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
    sequentialRead: true,
  });
  let metadata;
  try {
    metadata = await image.metadata();
  } finally {
    image.destroy();
  }
  if ((metadata.pages ?? 1) !== 1) {
    throw new Error("Animated or multi-page sources are not supported");
  }
  if (
    !metadata.format ||
    !SUPPORTED_FORMATS.has(metadata.format) ||
    (metadata.format === "heif" && metadata.mediaType !== "image/avif")
  ) {
    throw new Error("Source format must be JPEG, PNG, WebP, or AVIF");
  }
  if (!metadata.width || !metadata.height) {
    throw new Error("Source dimensions could not be read");
  }
  const swapsAxes = [5, 6, 7, 8].includes(metadata.orientation ?? 1);
  const width = swapsAxes ? metadata.height : metadata.width;
  const height = swapsAxes ? metadata.width : metadata.height;
  assertDecodedPixelLimit(width, height);
  if (width < MIN_SOURCE_WIDTH || height < MIN_SOURCE_HEIGHT) {
    throw new Error(
      `Source must be at least ${MIN_SOURCE_WIDTH}x${MIN_SOURCE_HEIGHT} after EXIF orientation`,
    );
  }
  return {
    width,
    height,
    format: metadata.mediaType === "image/avif" ? "avif" : metadata.format,
  };
}

async function renderCard(buffer, width, height) {
  const result = await sharp(buffer, {
    animated: false,
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
  })
    .rotate()
    .resize(width, height, { fit: "cover", position: "centre" })
    .webp({ quality: 84, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  if (
    result.info.format !== "webp" ||
    result.info.width !== width ||
    result.info.height !== height
  ) {
    throw new Error(`Generated card metadata did not match ${width}x${height} WebP`);
  }
  return result.data;
}

async function renderDetail(buffer) {
  const result = await sharp(buffer, {
    animated: false,
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
  })
    .rotate()
    .resize(DETAIL_MAXIMUM, DETAIL_MAXIMUM, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 86, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  if (
    result.info.format !== "webp" ||
    result.info.width > DETAIL_MAXIMUM ||
    result.info.height > DETAIL_MAXIMUM
  ) {
    throw new Error("Generated detail image metadata is invalid");
  }
  return {
    data: result.data,
    width: result.info.width,
    height: result.info.height,
  };
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function writeTarString(header, offset, length, value) {
  const encoded = Buffer.from(value, "utf8");
  if (encoded.length > length) throw new Error(`Tar field is too long: ${value}`);
  encoded.copy(header, offset);
}

function writeTarOctal(header, offset, length, value) {
  const encoded = value.toString(8).padStart(length - 1, "0");
  if (encoded.length >= length) throw new Error("Tar numeric field overflow");
  writeTarString(header, offset, length, `${encoded}\0`);
}

function createTarHeader(name, size) {
  const header = Buffer.alloc(TAR_BLOCK_BYTES);
  writeTarString(header, 0, 100, name);
  writeTarOctal(header, 100, 8, 0o600);
  writeTarOctal(header, 108, 8, 0);
  writeTarOctal(header, 116, 8, 0);
  writeTarOctal(header, 124, 12, size);
  writeTarOctal(header, 136, 12, 0);
  header.fill(0x20, 148, 156);
  header[156] = "0".charCodeAt(0);
  writeTarString(header, 257, 6, "ustar\0");
  writeTarString(header, 263, 2, "00");
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  const encodedChecksum = checksum.toString(8).padStart(6, "0");
  writeTarString(header, 148, 8, `${encodedChecksum}\0 `);
  return header;
}

function createTar(entries) {
  const parts = [];
  for (const entry of entries) {
    parts.push(createTarHeader(entry.name, entry.data.length), entry.data);
    const remainder = entry.data.length % TAR_BLOCK_BYTES;
    if (remainder !== 0) {
      parts.push(Buffer.alloc(TAR_BLOCK_BYTES - remainder));
    }
  }
  parts.push(Buffer.alloc(TAR_BLOCK_BYTES * 2));
  return Buffer.concat(parts);
}

async function prepareArchive({ root, slug, source, alt }) {
  const projectsPath = path.join(root, "src", "data", "projects.json");
  const projectsBuffer = await snapshotRegularFile(
    root,
    projectsPath,
    MAX_PROJECTS_BYTES,
    "projects.json",
    true,
  );
  const projects = parseCanonicalProjects(projectsBuffer);
  const projectIndex = projects.findIndex((project) => project.slug === slug);
  if (projectIndex === -1) throw new Error(`No project found for slug "${slug}"`);

  const sourceBuffer = await snapshotRegularFile(
    root,
    path.resolve(source),
    MAX_SOURCE_BYTES,
    "Source image",
    true,
  );
  const sourceMetadata = await inspectSource(sourceBuffer);

  const archiveEntries = [];
  const files = [];
  for (const variant of CARD_VARIANTS) {
    const name = `${slug}${variant.suffix}.webp`;
    const data = await renderCard(sourceBuffer, variant.width, variant.height);
    archiveEntries.push({ name, data });
    files.push({
      name,
      proposedPath: `/images/projects/${name}`,
      bytes: data.length,
      sha256: sha256(data),
      width: variant.width,
      height: variant.height,
    });
  }

  const detailName = `${slug}-detail.webp`;
  const detail = await renderDetail(sourceBuffer);
  archiveEntries.push({ name: detailName, data: detail.data });
  files.push({
    name: detailName,
    proposedPath: `/images/projects/${detailName}`,
    bytes: detail.data.length,
    sha256: sha256(detail.data),
    width: detail.width,
    height: detail.height,
  });

  const existing = projects[projectIndex];
  const detailPath = `/images/projects/${detailName}`;
  const updatedProject = {
    ...existing,
    cover: {
      ...existing.cover,
      src: `/images/projects/${slug}.webp`,
      alt,
      width: 1600,
      height: 1000,
      sources: CARD_VARIANTS.filter(({ suffix }) => suffix !== "").map(
        ({ suffix, width }) => ({
          src: `/images/projects/${slug}${suffix}.webp`,
          width,
        }),
      ),
    },
    gallery: [
      {
        src: detailPath,
        alt,
        width: detail.width,
        height: detail.height,
      },
      ...(existing.gallery ?? []).filter((image) => image.src !== detailPath),
    ],
  };
  const proposedProjects = projects.map((project, index) =>
    index === projectIndex ? updatedProject : project,
  );
  const result = projectsSchema.safeParse(proposedProjects);
  if (!result.success || !isDeepStrictEqual(proposedProjects, result.data)) {
    throw new Error(
      `Proposed projects.json failed canonical validation: ${result.success ? "schema transformed authored data" : result.error.message}`,
    );
  }

  const proposedBuffer = Buffer.from(
    `${JSON.stringify(proposedProjects, null, 2)}\n`,
    "utf8",
  );
  archiveEntries.push({ name: "projects.json.proposed", data: proposedBuffer });
  const manifest = {
    version: 2,
    mode: "stdout-tar-prepare-only",
    slug,
    source: {
      bytes: sourceBuffer.length,
      sha256: sha256(sourceBuffer),
      format: sourceMetadata.format,
      orientedWidth: sourceMetadata.width,
      orientedHeight: sourceMetadata.height,
    },
    repository: {
      projectsPath: "src/data/projects.json",
      projectsSourceSha256: sha256(projectsBuffer),
    },
    files,
    proposedProjects: {
      name: "projects.json.proposed",
      bytes: proposedBuffer.length,
      sha256: sha256(proposedBuffer),
    },
  };
  const manifestBuffer = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  archiveEntries.push({ name: "manifest.json", data: manifestBuffer });

  return createTar(archiveEntries);
}

async function writeStdout(content) {
  if (process.stdout.write(content)) return;
  await new Promise((resolve, reject) => {
    process.stdout.once("drain", resolve);
    process.stdout.once("error", reject);
  });
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const root = await canonicalRepositoryRoot(options.root);
  const archive = await prepareArchive({ ...options, root });
  await writeStdout(archive);
}

const isMainModule =
  typeof process.argv[1] === "string" &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    const message =
      error instanceof Error ? error.message : "Unknown image-preparation error";
    process.stderr.write(`Image archive preparation failed: ${message}\n\n${usage()}\n`);
    process.exitCode = 1;
  });
}
