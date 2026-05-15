import sharp from "sharp";

export async function calculateVisualClutter(buffer: Buffer) {
  const { data, info } = await sharp(buffer)
    .resize(300, 300, { fit: "inside" })
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  let edgePixels = 0;
  let checkedPixels = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;

      const current = data[index];
      const right = data[y * width + (x + 1)];
      const bottom = data[(y + 1) * width + x];

      const horizontalDifference = Math.abs(current - right);
      const verticalDifference = Math.abs(current - bottom);

      const edgeStrength = horizontalDifference + verticalDifference;

      if (edgeStrength > 50) {
        edgePixels++;
      }

      checkedPixels++;
    }
  }

  const edgeRatio = edgePixels / checkedPixels;

  const score = Math.round(edgeRatio * 600);

  return Math.max(0, Math.min(100, score));
}