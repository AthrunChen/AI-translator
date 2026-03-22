const sharp = require('sharp');
const fs = require('fs');

// 普通状态和悬浮状态的 SVG
const svgBuffer = fs.readFileSync('icon.svg');
const svgHoverBuffer = fs.readFileSync('icon-hover.svg');
const svgToolbarBuffer = fs.readFileSync('icon-toolbar.svg');
const svgToolbarHoverBuffer = fs.readFileSync('icon-toolbar-hover.svg');

const sizes = [
  { name: 'icon16.png', size: 16 },
  { name: 'icon48.png', size: 48 },
  { name: 'icon128.png', size: 128 },
  // 悬浮状态
  { name: 'icon16-hover.png', size: 16, svg: svgHoverBuffer },
  { name: 'icon48-hover.png', size: 48, svg: svgHoverBuffer },
  { name: 'icon128-hover.png', size: 128, svg: svgHoverBuffer },
];

async function generateIcons() {
  // 生成普通状态图标
  for (const { name, size, svg } of sizes) {
    const svgData = svg || svgBuffer;
    await sharp(svgData)
      .resize(size, size)
      .png()
      .toFile(name);
    console.log(`Generated ${name} (${size}x${size})`);
  }
}

generateIcons().catch(console.error);
