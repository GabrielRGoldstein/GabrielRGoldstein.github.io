import { createHash } from "node:crypto";
import { execFile } from "node:child_process";

import {
  chmod,
  copyFile,
  link,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  truncate,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";

import { assertDecodedPixelLimit } from "../../scripts/lib/project-image-policy.mjs";
import { snapshotRegularFile } from "../../scripts/lib/snapshot-regular-file.mjs";

const SCRIPT = fileURLToPath(
  new URL("../../scripts/ingest-project-image.mjs", import.meta.url),
);
const SITE_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ALL_METADATA_FIXTURE = fileURLToPath(
  new URL("./fixtures/project-image-all-metadata.jpg", import.meta.url),
);

const roots: string[] = [];

const baseProject = (overrides: Record<string, unknown> = {}) => ({
  id: "demo-project",
  slug: "demo-project",
  selected: true,
  order: 1,
  title: "Demo Project",
  category: "product",
  summary: "A complete project summary.",
  stack: ["TypeScript"],
  cover: {
    src: "/images/projects/existing.webp",
    alt: "Existing authored cover",
    width: 1600,
    height: 1000,
  },
  repositoryUrl: null,
  liveUrl: null,
  ...overrides,
});

async function createRepository(projects = [baseProject()]) {
  const root = await mkdtemp(path.join(tmpdir(), "portfolio-image-test-"));
  roots.push(root);
  const projectsPath = path.join(root, "src", "data", "projects.json");
  await mkdir(path.dirname(projectsPath), { recursive: true });
  const original = `${JSON.stringify(projects, null, 2)}\n`;
  await writeFile(projectsPath, original);
  await writeFile(path.join(root, "sentinel.txt"), "must remain unchanged\n");
  return { root, projectsPath, original };
}

async function createSource(
  root: string,
  options: {
    orientation?: number;
    width?: number;
    height?: number;
    format?: "jpeg" | "png" | "webp" | "avif";
  } = {},
) {
  const format = options.format ?? "jpeg";
  const sourcePath = path.join(root, `source.${format}`);
  const width = options.width ?? (options.orientation ? 1000 : 1800);
  const height = options.height ?? (options.orientation ? 1600 : 1200);
  let image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 24, g: 58, b: 86 },
    },
  });
  if (options.orientation) image = image.withMetadata({ orientation: options.orientation });
  const encoded = await image.toFormat(format).toBuffer();
  await writeFile(sourcePath, encoded);
  return sourcePath;
}

function sha256(content: Buffer) {
  return createHash("sha256").update(content).digest("hex");
}

function parseOctal(field: Buffer) {
  const value = field.toString("ascii").replace(/\0.*$/, "").trim();
  return value === "" ? 0 : Number.parseInt(value, 8);
}

function parseTar(archive: Buffer) {
  const entries = new Map<string, Buffer>();
  let offset = 0;
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const storedChecksum = parseOctal(header.subarray(148, 156));
    const checksumHeader = Buffer.from(header);
    checksumHeader.fill(0x20, 148, 156);
    expect(checksumHeader.reduce((sum, byte) => sum + byte, 0)).toBe(
      storedChecksum,
    );
    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    const size = parseOctal(header.subarray(124, 136));
    if (entries.has(name)) throw new Error(`Duplicate tar entry: ${name}`);
    offset += 512;
    const data = Buffer.from(archive.subarray(offset, offset + size));
    entries.set(name, data);
    offset += Math.ceil(size / 512) * 512;
  }
  expect(archive.subarray(offset).length).toBe(1024);
  expect(archive.subarray(offset).every((byte) => byte === 0)).toBe(true);
  return entries;
}

function runCommand(
  root: string,
  source: string,
  options: { alt?: string; slug?: string; env?: NodeJS.ProcessEnv } = {},
): Promise<Buffer> {
  const args = [
    SCRIPT,
    "--slug",
    options.slug ?? "demo-project",
    "--source",
    source,
    "--alt",
    options.alt ?? "Prepared project image",
    "--root",
    root,
  ];
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      args,
      {
        cwd: root,
        encoding: "buffer",
        env: { ...process.env, ...options.env },
        maxBuffer: 50 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          if (stdout.length > 0) {
            reject(new Error(`Command emitted ${stdout.length} partial stdout bytes before failing`));
            return;
          }
          reject(new Error(stderr.toString("utf8") || error.message));
          return;
        }
        resolve(stdout);
      },
    );
  });
}

function runPublicCommand(
  root: string,
  source: string,
  options: { alt?: string; slug?: string; env?: NodeJS.ProcessEnv } = {},
): Promise<Buffer> {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("npm_execpath is required to test the public npm command");
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...options.env,
    NODE_DISABLE_COMPILE_CACHE: "1",
  };

  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [
        npmCli,
        "run",
        "--silent",
        "project:image",
        "--",
        "--slug",
        options.slug ?? "demo-project",
        "--source",
        source,
        "--alt",
        options.alt ?? "Prepared project image",
        "--root",
        root,
      ],
      {
        cwd: SITE_ROOT,
        encoding: "buffer",
        env,
        maxBuffer: 50 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          if (stdout.length > 0) {
            reject(new Error(`Public command emitted ${stdout.length} partial stdout bytes`));
            return;
          }
          reject(new Error(stderr.toString("utf8") || error.message));
          return;
        }
        resolve(stdout);
      },
    );
  });
}

async function inventory(root: string, current = root): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    const relative = path.relative(root, absolute).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      result[`${relative}/`] = "directory";
      Object.assign(result, await inventory(root, absolute));
    } else if (entry.isFile()) {
      result[relative] = sha256(await readFile(absolute));
    } else {
      result[relative] = `non-file:${entry.isSymbolicLink()}`;
    }
  }
  return result;
}

afterEach(async () => {
  for (const root of roots.splice(0)) {
    await chmod(root, 0o700).catch(() => undefined);
    await rm(root, { recursive: true, force: true });
  }
});

describe("prepare-only project image command", () => {
  it("streams exact verified archive entries without modifying any repository path", async () => {
    const { root } = await createRepository();
    const source = await createSource(root);
    const before = await inventory(root);

    const archive = await runPublicCommand(root, source, {
      env: {
        TMP: root,
        TEMP: root,
        TMPDIR: root,
        NODE_COMPILE_CACHE: path.join(root, "hostile-node-compile-cache"),
      },
    });
    expect(await inventory(root)).toEqual(before);
    await expect(
      runPublicCommand(root, source, {
        slug: "missing-project",
        env: {
          TMP: root,
          TEMP: root,
          TMPDIR: root,
          NODE_COMPILE_CACHE: path.join(root, "hostile-node-compile-cache"),
        },
      }),
    ).rejects.toThrow(/no project found/i);
    expect(await inventory(root)).toEqual(before);

    const entries = parseTar(archive);
    expect([...entries.keys()]).toEqual([
      "demo-project-640.webp",
      "demo-project-800.webp",
      "demo-project.webp",
      "demo-project-detail.webp",
      "projects.json.proposed",
      "manifest.json",
    ]);
    const manifest = JSON.parse(entries.get("manifest.json")!.toString("utf8"));
    expect(manifest.mode).toBe("stdout-tar-prepare-only");
    expect(manifest.repository.projectsPath).toBe("src/data/projects.json");
    expect(manifest.repository.projectsSourceSha256).toBe(
      before["src/data/projects.json"],
    );
    expect(manifest.files.map(({ name }: { name: string }) => name)).toEqual([
      "demo-project-640.webp",
      "demo-project-800.webp",
      "demo-project.webp",
      "demo-project-detail.webp",
    ]);
    expect(
      manifest.files.map(({ proposedPath }: { proposedPath: string }) => proposedPath),
    ).toEqual([
      "/images/projects/demo-project-640.webp",
      "/images/projects/demo-project-800.webp",
      "/images/projects/demo-project.webp",
      "/images/projects/demo-project-detail.webp",
    ]);
    for (const expected of manifest.files) {
      const data = entries.get(expected.name)!;
      const metadata = await sharp(data).metadata();
      expect(data.length).toBe(expected.bytes);
      expect(sha256(data)).toBe(expected.sha256);
      expect(metadata.format).toBe("webp");
      expect(metadata.width).toBe(expected.width);
      expect(metadata.height).toBe(expected.height);
    }
    const proposed = entries.get("projects.json.proposed")!;
    expect(manifest.proposedProjects.name).toBe("projects.json.proposed");
    expect(manifest.proposedProjects.bytes).toBe(proposed.length);
    expect(manifest.proposedProjects.sha256).toBe(sha256(proposed));
    const proposedProject = JSON.parse(proposed.toString("utf8"))[0];
    expect(proposedProject.cover).toMatchObject({
      src: "/images/projects/demo-project.webp",
      alt: "Prepared project image",
      width: 1600,
      height: 1000,
      sources: [
        { src: "/images/projects/demo-project-640.webp", width: 640 },
        { src: "/images/projects/demo-project-800.webp", width: 800 },
      ],
    });
    expect(proposedProject.gallery.at(-1)).toMatchObject({
      src: "/images/projects/demo-project-detail.webp",
    });
  });

  it("produces deterministic archive bytes for identical canonical inputs", async () => {
    const { root } = await createRepository();
    const source = await createSource(root);
    expect(await runCommand(root, source)).toEqual(await runCommand(root, source));
  });

  it("uses orientation-corrected dimensions for every generated derivative", async () => {
    const { root } = await createRepository();
    const source = path.join(root, "source.jpeg");
    await copyFile(ALL_METADATA_FIXTURE, source);
    const sourceMetadata = await sharp(source).metadata();
    expect(sourceMetadata.exif).toBeDefined();
    expect(sourceMetadata.icc).toBeDefined();
    expect(sourceMetadata.iptc).toBeDefined();
    expect(sourceMetadata.xmp).toBeDefined();
    const entries = parseTar(await runCommand(root, source));
    const manifest = JSON.parse(entries.get("manifest.json")!.toString("utf8"));
    expect(manifest.source).toMatchObject({ orientedWidth: 1600, orientedHeight: 1000 });
    for (const expected of manifest.files) {
      const metadata = await sharp(entries.get(expected.name)!).metadata();
      expect(metadata).toMatchObject({
        format: "webp",
        width: expected.width,
        height: expected.height,
      });
      expect(metadata.orientation).toBeUndefined();
      expect(metadata.exif).toBeUndefined();
      expect(metadata.icc).toBeUndefined();
      expect(metadata.iptc).toBeUndefined();
      expect(metadata.xmp).toBeUndefined();
    }
  });

  it("rejects raw-pass but EXIF-oriented-fail dimensions without stdout", async () => {
    const { root } = await createRepository();
    const source = await createSource(root, {
      orientation: 6,
      width: 1600,
      height: 1000,
    });
    await expect(runCommand(root, source)).rejects.toThrow(
      /at least 1600x1000 after EXIF orientation/i,
    );
  });

  it("rejects aggregate, unknown-field, malformed UTF-8, and duplicate-key violations", async () => {
    const duplicate = baseProject({ id: "duplicate", order: 2 });
    const aggregate = await createRepository([
      baseProject(),
      { ...duplicate, slug: "demo-project" },
    ]);
    const aggregateSource = await createSource(aggregate.root);
    await expect(runCommand(aggregate.root, aggregateSource)).rejects.toThrow(
      /failed validation|duplicate project slug/i,
    );

    const unknown = await createRepository([
      baseProject(),
      baseProject({ id: "other", slug: "other", order: 2, reviewNote: "must not disappear" }),
    ]);
    const unknownSource = await createSource(unknown.root);
    await expect(runCommand(unknown.root, unknownSource)).rejects.toThrow(
      /failed validation|unrecognized/i,
    );

    const malformed = await createRepository();
    const malformedBytes = await readFile(malformed.projectsPath);
    malformedBytes[malformedBytes.indexOf(Buffer.from("Demo Project"))] = 0x80;
    await writeFile(malformed.projectsPath, malformedBytes);
    const malformedSource = await createSource(malformed.root);
    await expect(runCommand(malformed.root, malformedSource)).rejects.toThrow(
      /strict UTF-8 JSON/i,
    );

    const duplicateKey = await createRepository();
    const duplicateText = (await readFile(duplicateKey.projectsPath, "utf8")).replace(
      '    "id": "demo-project",\n',
      '    "id": "demo-project",\n    "id": "demo-project",\n',
    );
    await writeFile(duplicateKey.projectsPath, duplicateText);
    const duplicateSource = await createSource(duplicateKey.root);
    await expect(runCommand(duplicateKey.root, duplicateSource)).rejects.toThrow(
      /strict UTF-8 JSON|duplicate keys/i,
    );

    const escapedDuplicate = await createRepository();
    const escapedDuplicateText = (await readFile(
      escapedDuplicate.projectsPath,
      "utf8",
    )).replace(
      '    "id": "demo-project",\n',
      '    "id": "demo-project",\n    "\\u0069d": "demo-project",\n',
    );
    await writeFile(escapedDuplicate.projectsPath, escapedDuplicateText);
    const escapedDuplicateSource = await createSource(escapedDuplicate.root);
    await expect(runCommand(escapedDuplicate.root, escapedDuplicateSource)).rejects.toThrow(
      /strict UTF-8 JSON|duplicate keys/i,
    );

    const specialKey = await createRepository();
    const specialKeyText = (await readFile(specialKey.projectsPath, "utf8")).replace(
      '    "id": "demo-project",\n',
      '    "id": "demo-project",\n    "__proto__": { "polluted": true },\n',
    );
    await writeFile(specialKey.projectsPath, specialKeyText);
    const specialKeySource = await createSource(specialKey.root);
    await expect(runCommand(specialKey.root, specialKeySource)).rejects.toThrow(
      /failed validation|unrecognized|must already be canonical|schema coercion/i,
    );
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();

    const malformedToken = await createRepository();
    const malformedTokenText = (await readFile(
      malformedToken.projectsPath,
      "utf8",
    )).replace('    "order": 1,', '    "order": 01,');
    await writeFile(malformedToken.projectsPath, malformedTokenText);
    const malformedTokenSource = await createSource(malformedToken.root);
    await expect(runCommand(malformedToken.root, malformedTokenSource)).rejects.toThrow(
      /strict UTF-8 JSON|expected|invalid|trailing/i,
    );

    const excessiveDepth = await createRepository();
    const nestedValue = `${"[".repeat(102)}null${"]".repeat(102)}`;
    const excessiveDepthText = (await readFile(
      excessiveDepth.projectsPath,
      "utf8",
    )).replace('    "id": "demo-project",\n', `    "deep": ${nestedValue},\n    "id": "demo-project",\n`);
    await writeFile(excessiveDepth.projectsPath, excessiveDepthText);
    const excessiveDepthSource = await createSource(excessiveDepth.root);
    await expect(runCommand(excessiveDepth.root, excessiveDepthSource)).rejects.toThrow(
      /nesting exceeds 100 levels|strict UTF-8 JSON/i,
    );
  });

  it("enforces the gallery N-1 success and N failure boundaries", async () => {
    const gallery = Array.from({ length: 7 }, (_, index) => ({
      src: `/images/projects/existing-${index}.webp`,
      alt: `Existing image ${index}`,
      width: 1200,
      height: 800,
    }));
    const success = await createRepository([baseProject({ gallery })]);
    const successSource = await createSource(success.root);
    const proposed = JSON.parse(
      parseTar(await runCommand(success.root, successSource))
        .get("projects.json.proposed")!
        .toString("utf8"),
    );
    expect(proposed[0].gallery).toHaveLength(8);

    const failure = await createRepository([
      baseProject({
        gallery: [
          ...gallery,
          {
            src: "/images/projects/eighth.webp",
            alt: "Eighth existing image",
            width: 1200,
            height: 800,
          },
        ],
      }),
    ]);
    const failureSource = await createSource(failure.root);
    await expect(runCommand(failure.root, failureSource)).rejects.toThrow(
      /proposed projects.json failed canonical validation|too_big|at most 8/i,
    );
  });

  it("is idempotent after the proposed project JSON is promoted", async () => {
    const { root, projectsPath } = await createRepository();
    const source = await createSource(root);
    const firstEntries = parseTar(await runCommand(root, source));
    const firstProposal = firstEntries.get("projects.json.proposed")!;
    await writeFile(projectsPath, firstProposal);

    const secondEntries = parseTar(await runCommand(root, source));
    expect(secondEntries.get("projects.json.proposed")).toEqual(firstProposal);
    const proposed = JSON.parse(firstProposal.toString("utf8"));
    expect(
      proposed[0].gallery.filter(
        (image: { src: string }) => image.src === "/images/projects/demo-project-detail.webp",
      ),
    ).toHaveLength(1);
  });

  it("enforces the exact decoded-pixel policy boundary", () => {
    expect(() => assertDecodedPixelLimit(40_000_000, 1)).not.toThrow();
    expect(() => assertDecodedPixelLimit(40_000_001, 1)).toThrow(/pixel|limit/i);
  });

  it("deterministically rejects same-file and parent-redirection races", async () => {
    const sameFile = await createRepository();
    const sameFileSource = await createSource(sameFile.root);
    const replacement = Buffer.alloc((await readFile(sameFileSource)).length, 0x5a);
    await expect(
      snapshotRegularFile(
        sameFile.root,
        sameFileSource,
        25 * 1024 * 1024,
        "Source image",
        true,
        { afterOpen: () => writeFile(sameFileSource, replacement) },
      ),
    ).rejects.toThrow(/changed while it was being read/i);

    const parentRace = await createRepository();
    const inputParent = path.join(parentRace.root, "inputs");
    await mkdir(inputParent);
    const racedSource = await createSource(inputParent);
    const outside = await mkdtemp(path.join(tmpdir(), "portfolio-race-outside-"));
    roots.push(outside);
    await createSource(outside);
    await expect(
      snapshotRegularFile(
        parentRace.root,
        racedSource,
        25 * 1024 * 1024,
        "Source image",
        true,
        {
          afterSafePath: async () => {
            await rename(inputParent, `${inputParent}-original`);
            await symlink(outside, inputParent, "junction");
          },
        },
      ),
    ).rejects.toThrow(/changed|redirected|junction/i);
  });

  it("rejects hard-linked, symbolic, redirected, and out-of-root inputs", async () => {
    const hardProjects = await createRepository();
    const hardProjectsSource = await createSource(hardProjects.root);
    await link(hardProjects.projectsPath, path.join(hardProjects.root, "projects-hardlink.json"));
    await expect(runCommand(hardProjects.root, hardProjectsSource)).rejects.toThrow(/hard-linked/i);

    const linkedProjects = await createRepository();
    const linkedProjectsSource = await createSource(linkedProjects.root);
    const realProjectsPath = path.join(path.dirname(linkedProjects.projectsPath), "projects-real.json");
    await rename(linkedProjects.projectsPath, realProjectsPath);
    try {
      await symlink(realProjectsPath, linkedProjects.projectsPath, "file");
      await expect(runCommand(linkedProjects.root, linkedProjectsSource)).rejects.toThrow(
        /symbolic link/i,
      );
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "EPERM") {
        throw error;
      }
    }

    const hard = await createRepository();
    const hardSource = await createSource(hard.root);
    const hardLink = path.join(hard.root, "hard-source.jpg");
    await link(hardSource, hardLink);
    await expect(runCommand(hard.root, hardSource)).rejects.toThrow(/hard-linked/i);

    const symbolic = await createRepository();
    const symbolicSource = await createSource(symbolic.root);
    const symbolicLink = path.join(symbolic.root, "linked-source.jpg");
    try {
      await symlink(symbolicSource, symbolicLink, "file");
      await expect(runCommand(symbolic.root, symbolicLink)).rejects.toThrow(
        /symbolic link/i,
      );
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "EPERM") {
        throw error;
      }
    }

    const redirected = await createRepository();
    const redirectedSource = await createSource(redirected.root);
    const outside = await mkdtemp(path.join(tmpdir(), "portfolio-projects-outside-"));
    roots.push(outside);
    await copyFile(redirected.projectsPath, path.join(outside, "projects.json"));
    await rm(path.dirname(redirected.projectsPath), { recursive: true });
    await symlink(outside, path.dirname(redirected.projectsPath), "junction");
    await expect(runCommand(redirected.root, redirectedSource)).rejects.toThrow(
      /symbolic link|junction|redirected/i,
    );

    const linkedSourceParent = await createRepository();
    const outsideSourceParent = await mkdtemp(
      path.join(tmpdir(), "portfolio-source-parent-outside-"),
    );
    roots.push(outsideSourceParent);
    const outsideSource = await createSource(outsideSourceParent);
    const linkedParent = path.join(linkedSourceParent.root, "linked-source-parent");
    await symlink(outsideSourceParent, linkedParent, "junction");
    await expect(
      runCommand(linkedSourceParent.root, path.join(linkedParent, path.basename(outsideSource))),
    ).rejects.toThrow(/symbolic link|junction|redirected|escapes repository root/i);

    const external = await mkdtemp(path.join(tmpdir(), "portfolio-source-outside-"));
    roots.push(external);
    const externalSource = await createSource(external);
    const contained = await createRepository();
    await expect(runCommand(contained.root, externalSource)).rejects.toThrow(
      /escapes repository root/i,
    );
  });

  it(
    "accepts sources at the exact byte and decoded-pixel ceilings",
    async () => {
      const exactBytes = await createRepository();
      const exactByteSource = await createSource(exactBytes.root);
      const authoredBytes = await readFile(exactByteSource);
      const maximumBytes = 25 * 1024 * 1024;
      expect(authoredBytes.length).toBeLessThan(maximumBytes);
      await writeFile(
        exactByteSource,
        Buffer.concat([authoredBytes, Buffer.alloc(maximumBytes - authoredBytes.length)]),
      );
      expect((await readFile(exactByteSource)).length).toBe(maximumBytes);
      const exactByteArchive = parseTar(await runCommand(exactBytes.root, exactByteSource));
      expect(exactByteArchive.size).toBe(6);

      const exactPixels = await createRepository();
      const exactPixelSource = await createSource(exactPixels.root, {
        width: 8000,
        height: 5000,
      });
      const exactPixelArchive = parseTar(await runCommand(exactPixels.root, exactPixelSource));
      expect(exactPixelArchive.has("manifest.json")).toBe(true);
    },
    30_000,
  );

  it("enforces source byte, pixel, format, page, and minimum-dimension limits", async () => {
    const oversized = await createRepository();
    const oversizedSource = path.join(oversized.root, "oversized.bin");
    await writeFile(oversizedSource, Buffer.from([0]));
    await truncate(oversizedSource, 25 * 1024 * 1024 + 1);
    await expect(runCommand(oversized.root, oversizedSource)).rejects.toThrow(
      /between 1 byte and 26214400 bytes/i,
    );

    const pixels = await createRepository();
    const pixelSource = await createSource(pixels.root, { width: 7000, height: 6000 });
    await expect(runCommand(pixels.root, pixelSource)).rejects.toThrow(/pixel|limit/i);

    const unsupported = await createRepository();
    const unsupportedSource = path.join(unsupported.root, "source.gif");
    await sharp({
      create: { width: 1600, height: 1000, channels: 3, background: "navy" },
    })
      .gif()
      .toFile(unsupportedSource);
    await expect(runCommand(unsupported.root, unsupportedSource)).rejects.toThrow(
      /format must be JPEG, PNG, WebP, or AVIF/i,
    );

    const animated = await createRepository();
    const animatedSource = path.join(animated.root, "animated.gif");
    await writeFile(
      animatedSource,
      Buffer.from("R0lGODlhAQABAIAAAExpcf8AACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFCgAAACwAAAAAAQABAAACAkwBACH5BAUKAAAALAAAAAABAAEAgExpcQAA/wICTAEAOw==", "base64"),
    );
    await expect(runCommand(animated.root, animatedSource)).rejects.toThrow(
      /animated or multi-page/i,
    );

    const small = await createRepository();
    const smallSource = await createSource(small.root, { width: 1599, height: 1000 });
    await expect(runCommand(small.root, smallSource)).rejects.toThrow(/at least 1600x1000/i);
  });

  it.each(["jpeg", "png", "webp", "avif"] as const)(
    "accepts a canonical single-image %s source",
    async (format) => {
      const { root } = await createRepository();
      const source = await createSource(root, { format });
      expect(parseTar(await runCommand(root, source)).has("manifest.json")).toBe(true);
    },
  );
});
