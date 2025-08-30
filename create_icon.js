const fs = require('fs');

// Create a simple 256x256 PNG icon programmatically
const width = 256;
const height = 256;

// PNG header and basic structure
const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

// IHDR chunk
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(width, 0);
ihdrData.writeUInt32BE(height, 4);
ihdrData[8] = 8; // bit depth
ihdrData[9] = 2; // color type (RGB)
ihdrData[10] = 0; // compression
ihdrData[11] = 0; // filter
ihdrData[12] = 0; // interlace

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crc ^ data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

// Create simple blue square with white center
const imageData = Buffer.alloc(width * height * 3);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 3;
    // Blue background
    imageData[idx] = 0x3B;     // R
    imageData[idx + 1] = 0x82; // G
    imageData[idx + 2] = 0xF6; // B
    
    // White center circle
    const centerX = width / 2;
    const centerY = height / 2;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    if (distance < 50) {
      imageData[idx] = 0xFF;     // R
      imageData[idx + 1] = 0xFF; // G
      imageData[idx + 2] = 0xFF; // B
    }
  }
}

// Compress image data (simplified - just add filter bytes)
const compressedData = Buffer.alloc(height * (width * 3 + 1));
for (let y = 0; y < height; y++) {
  compressedData[y * (width * 3 + 1)] = 0; // No filter
  imageData.copy(compressedData, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
}

const ihdrChunk = createChunk('IHDR', ihdrData);
const idatChunk = createChunk('IDAT', compressedData);
const iendChunk = createChunk('IEND', Buffer.alloc(0));

const png = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
fs.writeFileSync('public/icon.png', png);
console.log('Simple PNG icon created');
