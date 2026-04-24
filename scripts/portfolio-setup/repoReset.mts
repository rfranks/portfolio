import fs from "node:fs/promises";

function buildGenericFaviconIcoBuffer(): Buffer {
  const width = 32;
  const height = 32;
  const xorBytes = width * height * 4;
  const maskRowBytes = Math.ceil(width / 32) * 4;
  const andMaskBytes = maskRowBytes * height;

  const bitmapInfoHeaderSize = 40;
  const imageSize = bitmapInfoHeaderSize + xorBytes + andMaskBytes;

  const totalSize = 6 + 16 + imageSize;
  const buffer = Buffer.alloc(totalSize, 0);

  let offset = 0;

  buffer.writeUInt16LE(0, offset);
  offset += 2;
  buffer.writeUInt16LE(1, offset);
  offset += 2;
  buffer.writeUInt16LE(1, offset);
  offset += 2;

  buffer.writeUInt8(width, offset++);
  buffer.writeUInt8(height, offset++);
  buffer.writeUInt8(0, offset++);
  buffer.writeUInt8(0, offset++);
  buffer.writeUInt16LE(1, offset);
  offset += 2;
  buffer.writeUInt16LE(32, offset);
  offset += 2;
  buffer.writeUInt32LE(imageSize, offset);
  offset += 4;
  buffer.writeUInt32LE(6 + 16, offset);
  offset += 4;

  buffer.writeUInt32LE(40, offset);
  offset += 4;
  buffer.writeInt32LE(width, offset);
  offset += 4;
  buffer.writeInt32LE(height * 2, offset);
  offset += 4;
  buffer.writeUInt16LE(1, offset);
  offset += 2;
  buffer.writeUInt16LE(32, offset);
  offset += 2;
  buffer.writeUInt32LE(0, offset);
  offset += 4;
  buffer.writeUInt32LE(xorBytes, offset);
  offset += 4;
  buffer.writeInt32LE(0, offset);
  offset += 4;
  buffer.writeInt32LE(0, offset);
  offset += 4;
  buffer.writeUInt32LE(0, offset);
  offset += 4;
  buffer.writeUInt32LE(0, offset);
  offset += 4;

  const pixelStart = offset;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const drawY = height - 1 - y;
      const pixelOffset = pixelStart + (drawY * width + x) * 4;

      const radialX = (x - width / 2) / (width / 2);
      const radialY = (y - height / 2) / (height / 2);
      const radius = Math.sqrt(radialX * radialX + radialY * radialY);

      const bgBlue = 230;
      const bgGreen = 145 + Math.max(0, Math.floor((1 - radius) * 70));
      const bgRed = 60 + Math.max(0, Math.floor((1 - radius) * 50));

      let r = bgRed;
      let g = bgGreen;
      let b = bgBlue;
      let a = 255;

      if (radius > 0.97) {
        a = 0;
      }

      const px = x;
      const py = y;
      const isPStem = px >= 10 && px <= 13 && py >= 7 && py <= 24;
      const isPTop = px >= 13 && px <= 21 && py >= 7 && py <= 11;
      const isPRight = px >= 20 && px <= 23 && py >= 10 && py <= 17;
      const isPMid = px >= 13 && px <= 20 && py >= 16 && py <= 19;
      const isCutout = px >= 15 && px <= 19 && py >= 11 && py <= 15;

      if ((isPStem || isPTop || isPRight || isPMid) && !isCutout) {
        r = 248;
        g = 252;
        b = 255;
        a = 255;
      }

      buffer[pixelOffset] = b;
      buffer[pixelOffset + 1] = g;
      buffer[pixelOffset + 2] = r;
      buffer[pixelOffset + 3] = a;
    }
  }

  return buffer;
}

export async function replaceFaviconWithDefault(args: {
  faviconDefaultPath: string;
  faviconPath: string;
  pathExists: (p: string) => Promise<boolean>;
}): Promise<void> {
  const { faviconDefaultPath, faviconPath, pathExists } = args;
  if (!(await pathExists(faviconDefaultPath))) {
    const buffer = buildGenericFaviconIcoBuffer();
    await fs.writeFile(faviconDefaultPath, buffer);
  }
  await fs.copyFile(faviconDefaultPath, faviconPath);
}

export async function clearInitAssets(pathsToReset: string[]): Promise<void> {
  for (const target of pathsToReset) {
    await fs.rm(target, { recursive: true, force: true });
  }

  for (const dir of pathsToReset) {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(`${dir}/.gitkeep`, "", "utf8");
  }
}
