export const MAX_INPUT_PIXELS = 40_000_000;

export function assertDecodedPixelLimit(width, height) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    throw new Error("Decoded image dimensions must be positive safe integers");
  }
  if (BigInt(width) * BigInt(height) > BigInt(MAX_INPUT_PIXELS)) {
    throw new Error(`Source exceeds the ${MAX_INPUT_PIXELS}-pixel decoded limit`);
  }
}
