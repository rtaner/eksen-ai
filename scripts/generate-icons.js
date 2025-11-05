const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

const maskableSizes = [
  { size: 192, name: 'icon-maskable-192x192.png' },
  { size: 512, name: 'icon-maskable-512x512.png' },
];

const sourcePath = path.join(__dirname, '../public/logo-source.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // Check if source file exists
  if (!fs.existsSync(sourcePath)) {
    console.error('❌ Source file not found: public/logo-source.png');
    process.exit(1);
  }

  // Generate regular icons
  for (const { size, name } of sizes) {
    try {
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(path.join(outputDir, name));
      
      console.log(`✅ Generated ${name}`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }

  // Generate maskable icons (with padding for safe zone)
  for (const { size, name } of maskableSizes) {
    try {
      const padding = Math.floor(size * 0.1); // 10% padding for safe zone
      const innerSize = size - (padding * 2);
      
      await sharp(sourcePath)
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 11, g: 42, b: 76, alpha: 1 } // #0B2A4C
        })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(path.join(outputDir, name));
      
      console.log(`✅ Generated ${name} (maskable)`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }

  // Generate favicon
  try {
    await sharp(sourcePath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, 'favicon-32x32.png'));
    
    console.log('✅ Generated favicon-32x32.png');
  } catch (error) {
    console.error('❌ Failed to generate favicon:', error.message);
  }

  // Generate Apple Touch Icon
  try {
    await sharp(sourcePath)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 11, g: 42, b: 76, alpha: 1 } // #0B2A4C
      })
      .png({ quality: 100 })
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    
    console.log('✅ Generated apple-touch-icon.png');
  } catch (error) {
    console.error('❌ Failed to generate apple-touch-icon:', error.message);
  }

  console.log('\n🎉 Icon generation complete!');
}

generateIcons().catch(console.error);
