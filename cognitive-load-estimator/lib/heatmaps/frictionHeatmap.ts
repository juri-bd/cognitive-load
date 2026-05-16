import sharp from "sharp";

const maxWidth = 1920;
const maxHeight = 1080;

export async function generateFrictionHeatmap(buffer: Buffer) {
  const tileSize = 20;
  const threshold = 0.22;

  const resizedImage = sharp(buffer).resize({
    width: maxWidth,
    height: maxHeight,
    fit: "inside",
    withoutEnlargement: true,
  });

  const { data, info } = await resizedImage
    .clone()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  const overlay = Buffer.alloc(width * height * 4);

  for (let tileY = 0; tileY < height; tileY += tileSize) {
    for (let tileX = 0; tileX < width; tileX += tileSize) {
      const tileScore = calculateTileFriction(
        data,
        width,
        height,
        channels,
        tileX,
        tileY,
        tileSize
      );

      const intensity =
        tileScore < threshold
          ? 0
          : Math.min(135, Math.round((tileScore - threshold) * 420));

      for (let y = tileY; y < Math.min(tileY + tileSize, height); y++) {
        for (let x = tileX; x < Math.min(tileX + tileSize, width); x++) {
          const overlayIndex = (y * width + x) * 4;

          overlay[overlayIndex] = 255;
          overlay[overlayIndex + 1] = 45;
          overlay[overlayIndex + 2] = 45;
          overlay[overlayIndex + 3] = intensity;
        }
      }
    }
  }

  const originalResized = await sharp(buffer)
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  const heatmap = await sharp(originalResized)
    .composite([
      {
        input: overlay,
        raw: {
          width,
          height,
          channels: 4,
        },
      },
    ])
    .png()
    .toBuffer();

  return `data:image/png;base64,${heatmap.toString("base64")}`;
}

function calculateTileFriction(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  tileX: number,
  tileY: number,
  tileSize: number
) {
  let edgeTotal = 0;
  let contrastTotal = 0;
  let occupiedPixels = 0;
  let checkedPixels = 0;

  const colors = new Set<string>();

  const maxY = Math.min(tileY + tileSize, height - 1);
  const maxX = Math.min(tileX + tileSize, width - 1);

  for (let y = tileY + 1; y < maxY; y++) {
    for (let x = tileX + 1; x < maxX; x++) {
      const index = (y * width + x) * channels;

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      const brightness = getBrightness(r, g, b);

      const rightIndex = (y * width + (x + 1)) * channels;
      const bottomIndex = ((y + 1) * width + x) * channels;

      const rightBrightness = getBrightness(
        data[rightIndex],
        data[rightIndex + 1],
        data[rightIndex + 2]
      );

      const bottomBrightness = getBrightness(
        data[bottomIndex],
        data[bottomIndex + 1],
        data[bottomIndex + 2]
      );

      const localContrast =
        Math.abs(brightness - rightBrightness) +
        Math.abs(brightness - bottomBrightness);

      if (localContrast > 45) {
        edgeTotal++;
      }

      contrastTotal += localContrast;

      if (brightness < 245) {
        occupiedPixels++;
      }

      const bucketR = Math.floor(r / 48);
      const bucketG = Math.floor(g / 48);
      const bucketB = Math.floor(b / 48);

      colors.add(`${bucketR}-${bucketG}-${bucketB}`);

      checkedPixels++;
    }
  }

  if (checkedPixels === 0) return 0;

  const edgeDensity = edgeTotal / checkedPixels;
  const averageContrast = contrastTotal / checkedPixels / 120;
  const occupiedDensity = occupiedPixels / checkedPixels;
  const colorVariation = Math.min(1, colors.size / 24);

  const score =
    0.4 * normalize(edgeDensity, 0.16) +
    0.25 * normalize(colorVariation, 1) +
    0.2 * normalize(averageContrast, 1) +
    0.15 * normalize(occupiedDensity, 1);

  return Math.max(0, Math.min(1, score));
}

function getBrightness(r: number, g: number, b: number) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function normalize(value: number, max: number) {
  return Math.max(0, Math.min(1, value / max));
}