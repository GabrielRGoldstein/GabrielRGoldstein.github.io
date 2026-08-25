import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";

export function sameCanonicalPath(left, right) {
  const normalize = (value) => {
    const resolved = path.resolve(value);
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
  };
  return normalize(left) === normalize(right);
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function assertSafeReadPath(root, candidate, label) {
  const resolved = path.resolve(candidate);
  if (!isInside(root, resolved)) throw new Error(`${label} escapes repository root`);

  const relative = path.relative(root, resolved);
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) throw new Error(`${label} contains a symbolic link`);
    const canonical = await realpath(current);
    if (!sameCanonicalPath(current, canonical)) {
      throw new Error(`${label} contains a junction or redirected path component`);
    }
  }
  return resolved;
}

/**
 * @typedef {object} SnapshotTestHooks
 * @property {(resolved: string) => void | Promise<void>} [afterSafePath]
 * @property {(resolved: string) => void | Promise<void>} [afterOpen]
 */

/**
 * @param {string} root
 * @param {string} filePath
 * @param {number} maximumBytes
 * @param {string} label
 * @param {boolean} rejectHardLinks
 * @param {SnapshotTestHooks} [testHooks]
 */
export async function snapshotRegularFile(
  root,
  filePath,
  maximumBytes,
  label,
  rejectHardLinks,
  testHooks,
) {
  const resolved = await assertSafeReadPath(root, filePath, label);
  await testHooks?.afterSafePath?.(resolved);
  const before = await lstat(resolved);
  if (!before.isFile() || before.isSymbolicLink()) {
    throw new Error(`${label} must be a regular file, not a link`);
  }
  if (rejectHardLinks && before.nlink !== 1) {
    throw new Error(`${label} must not be hard-linked`);
  }
  if (before.size <= 0 || before.size > maximumBytes) {
    throw new Error(`${label} must be between 1 byte and ${maximumBytes} bytes`);
  }

  const noFollow = constants.O_NOFOLLOW ?? 0;
  const handle = await open(resolved, constants.O_RDONLY | noFollow);
  try {
    const opened = await handle.stat();
    const canonicalAfterOpen = await realpath(resolved);
    const pathAfterOpen = await lstat(resolved);
    if (
      !sameCanonicalPath(resolved, canonicalAfterOpen) ||
      !isInside(root, canonicalAfterOpen) ||
      !opened.isFile() ||
      opened.dev !== before.dev ||
      opened.ino !== before.ino ||
      opened.dev !== pathAfterOpen.dev ||
      opened.ino !== pathAfterOpen.ino ||
      opened.size !== before.size ||
      (rejectHardLinks && opened.nlink !== 1)
    ) {
      throw new Error(`${label} changed or was redirected while it was being opened`);
    }
    await testHooks?.afterOpen?.(resolved);
    const content = await handle.readFile();
    const after = await handle.stat();
    if (
      after.dev !== opened.dev ||
      after.ino !== opened.ino ||
      after.size !== opened.size ||
      after.mtimeMs !== opened.mtimeMs ||
      after.ctimeMs !== opened.ctimeMs
    ) {
      throw new Error(`${label} changed while it was being read`);
    }
    return content;
  } finally {
    await handle.close();
  }
}
