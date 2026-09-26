// Review-only lineage: preserve the full editor; mask only the canvas-floating placeholder.
// Usage: node review/generate-figma-crop.mjs <canonical-owner-supplied-png>
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const source = process.argv[2];
if (!source) throw new Error("Provide the canonical owner-supplied PNG path");
const bytes = await readFile(source);
const digest = buffer => createHash("sha256").update(buffer).digest("hex");
const sourceHash = digest(bytes);
if (sourceHash !== "3260e780d47d946602a6f9ee483cdfcc77af6d2ce0bd494c840d03a74970e5c1") {
  throw new Error("Canonical Figma screenshot checksum mismatch");
}
const metadata = await sharp(bytes).metadata();
if (metadata.width !== 2559 || metadata.height !== 1274 || metadata.format !== "png") {
  throw new Error("Canonical Figma screenshot geometry mismatch");
}

// Native-pixel inspection: bright circular placeholder occupies inclusive x=1896..1931,
// y=243..278, with an additional bright rim fragment at x=1893..1898,y=241..247.
// A 27px-radius disc centered at (1913.5, 260.5) covers the diagonal outer
// rim as well, without reaching the nearby triangle or controls.
// The contrasting rim makes the small neutral mask visible rather than silently
// reconstructing the UI. Nothing is painted into the canonical original.
const mask = Buffer.from(`<svg width="2559" height="1274" xmlns="http://www.w3.org/2000/svg"><circle cx="1913.5" cy="260.5" r="27" fill="#202731" stroke="#596576" stroke-width="1"/></svg>`);
const masked = await sharp(bytes).composite([{ input: mask }]).png().toBuffer();
const [originalPixels, maskedPixels] = await Promise.all([
  sharp(bytes).removeAlpha().raw().toBuffer(),
  sharp(masked).removeAlpha().raw().toBuffer(),
]);
let altered = 0;
let minX = metadata.width, maxX = 0, minY = metadata.height, maxY = 0;
for (let offset = 0; offset < originalPixels.length; offset += 3) {
  if (originalPixels[offset] === maskedPixels[offset] &&
      originalPixels[offset + 1] === maskedPixels[offset + 1] &&
      originalPixels[offset + 2] === maskedPixels[offset + 2]) continue;
  const pixel = offset / 3;
  const x = pixel % metadata.width;
  const y = Math.floor(pixel / metadata.width);
  if (x < 1885 || x > 1942 || y < 232 || y > 289) {
    throw new Error(`Mask changed an editor pixel outside the placeholder: ${x},${y}`);
  }
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  altered++;
}
if (altered < 1000) throw new Error("Placeholder mask did not cover the source region");
// The bright source rim at the diagonal corner escaped the earlier radius-20 mask.
for (let y = 243; y <= 278; y++) {
  for (let x = 1896; x <= 1931; x++) {
    const offset = (y * metadata.width + x) * 3;
    if (originalPixels[offset] > 180 && originalPixels[offset + 1] > 180 && originalPixels[offset + 2] > 180 &&
        maskedPixels[offset] > 135 && maskedPixels[offset + 1] > 135 && maskedPixels[offset + 2] > 135) {
      throw new Error(`Bright original placeholder rim survived at ${x},${y}`);
    }
  }
}
console.log("canonical", metadata.width, metadata.height, sourceHash);
console.log("mask", "circle center=(1913.5,260.5), radius=27, fill=#202731, stroke=#596576 width=1", `altered pixels=${altered}, bounds=x[${minX},${maxX}],y[${minY},${maxY}]`);

const variants = [
  ["figma-clone-640.webp", 640, 400],
  ["figma-clone-800.webp", 800, 500],
  ["figma-clone.webp", 1600, 1000],
];
for (const [name, width, height] of variants) {
  // Contain, rather than center-crop: both sidebars, toolbar and full triangle survive.
  const result = await sharp(masked)
    .resize(width, height, { fit: "contain", background: "#202731" })
    .webp({ quality: 84, effort: 5 }).toBuffer();
  await writeFile(`public/images/projects/${name}`, result);
  console.log(name, width, height, digest(result));
}
const detail = await sharp(masked)
  .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
  .webp({ quality: 86, effort: 5 }).toBuffer();
const result = await sharp(detail).metadata();
if (result.width !== 1600 || result.height !== 797) throw new Error("Unexpected detail dimensions");
await writeFile("public/images/projects/figma-clone-detail.webp", detail);
console.log("figma-clone-detail.webp", result.width, result.height, digest(detail));
if (digest(await readFile(source)) !== sourceHash) throw new Error("Canonical Figma screenshot changed");