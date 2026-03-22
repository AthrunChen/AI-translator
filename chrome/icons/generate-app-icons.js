const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgBuffer = fs.readFileSync('icon.svg');

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

// 扩展图标尺寸（已生成）
const extensionSizes = [
  { name: 'icon16.png', size: 16 },
  { name: 'icon48.png', size: 48 },
  { name: 'icon128.png', size: 128 },
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

  // 生成 Toolbar Icons (Safari 扩展按钮)
  const toolbarSizes = [
    { name: 'toolbar-icon-16.png', size: 16 },
    { name: 'toolbar-icon-19.png', size: 19 },
    { name: 'toolbar-icon-32.png', size: 32 },
    { name: 'toolbar-icon-38.png', size: 38 },
    { name: 'toolbar-icon-48.png', size: 48 },
    { name: 'toolbar-icon-72.png', size: 72 },
  ];

  const toolbarDir = path.join(__dirname, 'toolbar');
  if (!fs.existsSync(toolbarDir)) {
    fs.mkdirSync(toolbarDir, { recursive: true });
  }

  // Toolbar 版本使用更简洁的设计（去掉 AI 指示器）
  const toolbarSvg = svgBuffer.toString()
    .replace(/<circle cx="100" cy="28" r="10" fill="#34D399"\/>/, '')
    .replace(/<path d="M 96,28 L 99,31 L 104,25"[^>]*\/>/, '');

  for (const { name, size } of toolbarSizes) {
    await sharp(Buffer.from(toolbarSvg))
      .resize(size, size)
      .png()
      .toFile(path.join(toolbarDir, name));
    console.log(`Generated Toolbar ${name} (${size}x${size})`);
  }

  console.log('\nDone! All icons generated.');
}

generateIcons().catch(console.error);
