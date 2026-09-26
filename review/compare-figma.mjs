// Review-only side-by-side study, prior candidate, and current candidate captures.
import sharp from "sharp";
import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = "Usage: node review/compare-figma.mjs <study-directory>";
if (process.argv.length !== 3) {
  console.error(usage);
  process.exit(2);
}
const study = resolve(process.argv[2]);
if (!(await stat(study).catch(() => null))?.isDirectory()) {
  console.error(`Study directory must exist and be a directory. ${usage}`);
  process.exit(2);
}
const comparisons = [];
for (const [label, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
  const images = [
    [join(study, `candidate-${label}-figma-dialog.png`), `study/candidate-${label}-figma-dialog.png`],
    [`review/before/${label}-figma-dialog.png`, `review/before/${label}-figma-dialog.png`],
    [`review/${label}-figma-dialog.png`, `review/${label}-figma-dialog.png`],
  ];
  const titleHeight = 36;
  const banner = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width * 3}" height="${titleHeight}"><rect width="100%" height="100%" fill="#202731"/><g fill="white" font-family="Arial" font-size="16"><text x="16" y="25">Approved study</text><text x="${width + 16}" y="25">Before correction</text><text x="${width * 2 + 16}" y="25">After correction</text></g></svg>`);
  const layers = [{ input: banner, left: 0, top: 0 }];
  for (const [index, [file, imageLabel]] of images.entries()) {
    try {
      layers.push({ input: await sharp(file).resize(width, height, { fit: "fill" }).png().toBuffer(), left: index * width, top: titleHeight });
    } catch {
      console.error(`Required ${label} image is missing or invalid: ${imageLabel}`);
      process.exit(1);
    }
  }
  const path = `review/${label}-figma-dialog-comparison.png`;
  comparisons.push({ path, width, height, titleHeight, layers });
}
for (const { path, width, height, titleHeight, layers } of comparisons) {
  try {
    await sharp({ create: { width: width * 3, height: height + titleHeight, channels: 4, background: "#202731" } }).composite(layers).png().toFile(path);
  } catch {
    console.error(`Could not write comparison image: ${path}`);
    process.exit(1);
  }
  console.log(path);
}
