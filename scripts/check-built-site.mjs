import { access, readdir, readFile } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const externalReference = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;
const htmlAttribute = /\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi;
const srcsetAttribute = /\bsrcset\s*=\s*(["'])(.*?)\1/gi;
const cssUrl = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
const fragmentTarget = /\b(?:id|name)\s*=\s*(["'])(.*?)\1/gi;

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    if (entry.isFile()) files.push(path);
  }

  return files;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function extractReferences(content, extension) {
  const references = [];
  const patterns = extension === ".css" ? [cssUrl] : [htmlAttribute];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) references.push(match[2].trim());
  }

  if (extension === ".html") {
    srcsetAttribute.lastIndex = 0;
    for (const match of content.matchAll(srcsetAttribute)) {
      for (const candidate of match[2].split(",")) {
        const source = candidate.trim().split(/\s+/, 1)[0];
        if (source) references.push(source);
      }
    }
  }

  return references;
}

function splitReference(reference) {
  const hashIndex = reference.indexOf("#");
  const beforeHash = hashIndex >= 0 ? reference.slice(0, hashIndex) : reference;
  const fragment = hashIndex >= 0 ? reference.slice(hashIndex + 1) : "";
  const queryIndex = beforeHash.indexOf("?");
  return {
    pathname: queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash,
    fragment: decodeURIComponent(fragment),
  };
}

async function resolveTarget(root, sourceFile, pathname) {
  if (!pathname) return sourceFile;

  const decoded = decodeURIComponent(pathname);
  const requested = decoded.startsWith("/")
    ? resolve(root, `.${decoded}`)
    : resolve(dirname(sourceFile), decoded);
  const rootPrefix = `${resolve(root)}${sep}`;

  if (requested !== resolve(root) && !requested.startsWith(rootPrefix)) {
    throw new Error(`reference escapes the build directory: ${pathname}`);
  }

  const candidates = extname(requested)
    ? [requested]
    : [requested, `${requested}.html`, resolve(requested, "index.html")];
  if (decoded.endsWith("/")) candidates.unshift(resolve(requested, "index.html"));
  if (requested === resolve(root)) candidates.unshift(resolve(root, "index.html"));

  for (const candidate of [...new Set(candidates)]) {
    if (await exists(candidate)) return candidate;
  }

  return null;
}

async function hasFragment(target, fragment) {
  if (!fragment) return true;
  if (extname(target) !== ".html") return false;

  const html = await readFile(target, "utf8");
  fragmentTarget.lastIndex = 0;
  return Array.from(html.matchAll(fragmentTarget), (match) => match[2]).includes(fragment);
}

export async function scanBuiltSite(rootDirectory) {
  const root = resolve(rootDirectory);
  const files = await collectFiles(root);
  const sourceFiles = files.filter((file) => [".html", ".css"].includes(extname(file)));
  const htmlFiles = sourceFiles.filter((file) => extname(file) === ".html");
  const failures = [];
  let checkedReferences = 0;

  for (const sourceFile of sourceFiles) {
    const content = await readFile(sourceFile, "utf8");
    for (const reference of extractReferences(content, extname(sourceFile))) {
      if (!reference || externalReference.test(reference) || reference.startsWith("data:")) continue;
      checkedReferences += 1;

      try {
        const { pathname, fragment } = splitReference(reference);
        const target = await resolveTarget(root, sourceFile, pathname);
        const source = relative(root, sourceFile).replaceAll(sep, "/");

        if (!target) {
          failures.push(`${source} -> ${reference} (missing file)`);
        } else if (!(await hasFragment(target, fragment))) {
          failures.push(
            `${source} -> ${relative(root, target).replaceAll(sep, "/")}#${fragment} (missing fragment)`,
          );
        }
      } catch (error) {
        const source = relative(root, sourceFile).replaceAll(sep, "/");
        failures.push(`${source} -> ${reference} (${error.message})`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`Built-site reference check failed:\n${failures.join("\n")}`);
  }

  return { htmlFiles: htmlFiles.length, checkedReferences };
}

async function main() {
  const root = process.argv[2] ?? "dist";
  const result = await scanBuiltSite(root);
  console.log(
    `Built-site references passed: ${result.htmlFiles} HTML files, ${result.checkedReferences} internal references.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
