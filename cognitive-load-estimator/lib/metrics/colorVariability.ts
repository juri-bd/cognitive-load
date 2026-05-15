import sharp from "sharp";

export async function calculateColorVariability(buffer: Buffer) {
  const { data, info } = await sharp(buffer)
    .resize(250, 250, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const colorBuckets = new Set<string>();

  let totalSaturation = 0;
  let pixelCount = 0;

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const bucketR = Math.floor(r / 32);
    const bucketG = Math.floor(g / 32);
    const bucketB = Math.floor(b / 32);

    colorBuckets.add(`${bucketR}-${bucketG}-${bucketB}`);

    const saturation = getSaturation(r, g, b);
    totalSaturation += saturation;

    pixelCount++;
  }

  const uniqueColorGroups = colorBuckets.size;
  const averageSaturation = totalSaturation / pixelCount;

  const colorGroupScore = Math.min(100, (uniqueColorGroups / 160) * 100);
  const saturationScore = averageSaturation * 100;

  const score = Math.round(
    0.65 * colorGroupScore + 0.35 * saturationScore
  );

  return Math.max(0, Math.min(100, score));
}

function getSaturation(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);

  if (max === 0) return 0;

  return (max - min) / max;
}