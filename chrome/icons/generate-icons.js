const sharp = require('sharp');
const fs = require('fs');

const svgBuffer = fs.readFileSync('icon.svg');

const sizes = [
  { name: 'icon16.png', size: 16 },
  { name: 'icon48.png', size: 48 },
  { name: 'icon128.png', size: 128 }
];

async function generateIcons() {
  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(name);
    console.log(`Generated ${name} (${size}x${size})`);
  }
}

generateIcons().catch(console.error);
