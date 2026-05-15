import sharp from "sharp";

export async function calculateContourDensity(buffer: Buffer) {
  const { data, info } = await sharp(buffer)
    .resize(300, 300, { fit: "inside" })
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  let contourPixels = 0;
  let checkedPixels = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;

      const current = data[index];
      const left = data[y * width + (x - 1)];
      const right = data[y * width + (x + 1)];
      const top = data[(y - 1) * width + x];
      const bottom = data[(y + 1) * width + x];

      const horizontalGradient = Math.abs(right - left);
      const verticalGradient = Math.abs(bottom - top);

      const contourStrength = horizontalGradient + verticalGradient;

      if (contourStrength > 90) {
        contourPixels++;
      }

      checkedPixels++;
    }
  }

  const contourRatio = contourPixels / checkedPixels;

  const score = Math.round(contourRatio * 700);

  return Math.max(0, Math.min(100, score));
}