const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgBuffer = fs.readFileSync('icon.svg');
const svgHoverBuffer = fs.readFileSync('icon-hover.svg');
const svgToolbarBuffer = fs.readFileSync('icon-toolbar.svg');
const svgToolbarHoverBuffer = fs.readFileSync('icon-toolbar-hover.svg');

// macOS App Icon 尺寸
const macOSIconSizes = [
  { name: 'icon_16x16.png', size: 16 },
  { name: 'icon_16x16@2x.png', size: 32 },
  { name: 'icon_32x32.png', size: 32 },
  { name: 'icon_32x32@2x.png', size: 64 },
  { name: 'icon_128x128.png', size: 128 },
  { name: 'icon_128x128@2x.png', size: 256 },
  { name: 'icon_256x256.png', size: 256 },
  { name: 'icon_256x256@2x.png', size: 512 },
  { name: 'icon_512x512.png', size: 512 },
  { name: 'icon_512x512@2x.png', size: 1024 },
];

// Toolbar 图标尺寸
const toolbarSizes = [
  { name: 'toolbar-icon-16.png', size: 16 },
  { name: 'toolbar-icon-19.png', size: 19 },
  { name: 'toolbar-icon-32.png', size: 32 },
  { name: 'toolbar-icon-38.png', size: 38 },
  { name: 'toolbar-icon-48.png', size: 48 },
  { name: 'toolbar-icon-72.png', size: 72 },
  // 悬浮状态
  { name: 'toolbar-icon-16-hover.png', size: 16, hover: true },
  { name: 'toolbar-icon-19-hover.png', size: 19, hover: true },
  { name: 'toolbar-icon-32-hover.png', size: 32, hover: true },
  { name: 'toolbar-icon-38-hover.png', size: 38, hover: true },
  { name: 'toolbar-icon-48-hover.png', size: 48, hover: true },
  { name: 'toolbar-icon-72-hover.png', size: 72, hover: true },
];

async function generateIcons() {
  // 生成 macOS App Icons
  const macOSDir = path.join(__dirname, 'AppIcon.iconset');
  if (!fs.existsSync(macOSDir)) {
    fs.mkdirSync(macOSDir, { recursive: true });
  }

  for (const { name, size } of macOSIconSizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(macOSDir, name));
    console.log(`Generated macOS ${name} (${size}x${size})`);
  }

  // 生成 Toolbar Icons
  const toolbarDir = path.join(__dirname, 'toolbar');
  if (!fs.existsSync(toolbarDir)) {
    fs.mkdirSync(toolbarDir, { recursive: true });
  }

  for (const { name, size, hover } of toolbarSizes) {
    const svgData = hover ? svgToolbarHoverBuffer : svgToolbarBuffer;
    await sharp(svgData)
      .resize(size, size)
      .png()
      .toFile(path.join(toolbarDir, name));
    console.log(`Generated Toolbar ${name} (${size}x${size})${hover ? ' [hover]' : ''}`);
  }

  console.log('\n✅ Done! All icons generated.');
}

generateIcons().catch(console.error);
