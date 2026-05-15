import sharp from "sharp";

export async function calculateFigureGroundContrast(buffer: Buffer) {
  const { data, info } = await sharp(buffer)
    .resize(300, 300, { fit: "inside" })
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  let totalDifference = 0;
  let comparisons = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;

      const current = data[index];
      const right = data[y * width + (x + 1)];
      const bottom = data[(y + 1) * width + x];

      totalDifference += Math.abs(current - right);
      totalDifference += Math.abs(current - bottom);

      comparisons += 2;
    }
  }

  const averageLocalDifference = totalDifference / comparisons;

  const score = Math.round((averageLocalDifference / 55) * 100);

  return Math.max(0, Math.min(100, score));
}