import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, body, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
  // RGBA buffer
  const scanlines = [];
  const bgR = 0x12, bgG = 0x13, bgB = 0x16; // #121316
  const coralR = 0xE0, coralG = 0x56, coralB = 0x38; // #E05638
  const amberR = 0xF5, amberG = 0xA6, amberB = 0x23; // #F5A623

  const scale = width / 512;
  const radius = isMaskable ? 0 : 96 * scale;

  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      let r = bgR, g = bgG, b = bgB, a = 255;

      // Rounded rect check (if not maskable)
      if (!isMaskable) {
        let inside = true;
        const cornerDist = (px, py, cx, cy) => Math.hypot(px - cx, py - cy);
        if (x < radius && y < radius && cornerDist(x, y, radius, radius) > radius) inside = false;
        if (x > width - radius && y < radius && cornerDist(x, y, width - radius, radius) > radius) inside = false;
        if (x < radius && y > height - radius && cornerDist(x, y, radius, height - radius) > radius) inside = false;
        if (x > width - radius && y > height - radius && cornerDist(x, y, width - radius, height - radius) > radius) inside = false;
        if (!inside) {
          a = 0;
        }
      }

      if (a > 0) {
        // Draw stylized letter "J" in the center
        // Center coordinates normalized to 512x512
        const nx = x / scale;
        const ny = y / scale;

        // Top bar of J: x from 220 to 360, y from 130 to 180
        const isTopBar = nx >= 220 && nx <= 350 && ny >= 130 && ny <= 180;
        // Vertical stem of J: x from 290 to 350, y from 170 to 330
        const isStem = nx >= 290 && nx <= 350 && ny >= 170 && ny <= 330;
        // Bottom curve of J: center at (255, 330), outer radius 95, inner radius 35, angle between 0 and PI
        const dx = nx - 255;
        const dy = ny - 330;
        const dist = Math.hypot(dx, dy);
        const isCurve = ny >= 330 && dist >= 35 && dist <= 95 && nx <= 350 && nx >= 160;
        // Tip of the curve going up on the left: x from 160 to 220, y from 280 to 330
        const isLeftTip = nx >= 160 && nx <= 220 && ny >= 280 && ny <= 330;

        // Accent dot on top left (as in dice / badge): center at (200, 155), radius 22
        const isDot = Math.hypot(nx - 180, ny - 155) <= 24;

        if (isTopBar || isStem || isCurve || isLeftTip) {
          r = coralR;
          g = coralG;
          b = coralB;
        } else if (isDot) {
          r = amberR;
          g = amberG;
          b = amberB;
        }
      }

      const offset = 1 + x * 4;
      row[offset] = r;
      row[offset + 1] = g;
      row[offset + 2] = b;
      row[offset + 3] = a;
    }
    scanlines.push(row);
  }

  const rawData = Buffer.concat(scanlines);
  const compressed = zlib.deflateSync(rawData);

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const publicDir = path.resolve('public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), createPng(512, 512, true));
console.log('PNG icons created successfully.');
