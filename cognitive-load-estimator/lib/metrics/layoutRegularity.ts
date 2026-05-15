import sharp from "sharp";

export async function calculateLayoutRegularity(buffer: Buffer) {
  const { data, info } = await sharp(buffer)
    .resize(300, 300, { fit: "inside" })
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  const rowAverages: number[] = [];

  for (let y = 0; y < height; y++) {
    let rowTotal = 0;

    for (let x = 0; x < width; x++) {
      rowTotal += data[y * width + x];
    }

    rowAverages.push(rowTotal / width);
  }

  let variationTotal = 0;

  for (let i = 1; i < rowAverages.length; i++) {
    variationTotal += Math.abs(rowAverages[i] - rowAverages[i - 1]);
  }

  const averageVariation =
    variationTotal / (rowAverages.length - 1);

  const score = Math.round((averageVariation / 35) * 100);

  return Math.max(0, Math.min(100, score));
}