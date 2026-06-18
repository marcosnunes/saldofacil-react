import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgBuffer = readFileSync(resolve(__dirname, 'public/icon.svg'));

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// PWA icons
for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(resolve(__dirname, `public/icon-${size}x${size}.png`));
  console.log(`✓ icon-${size}x${size}.png`);
}

// maskable (com padding extra para safe area)
await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile(resolve(__dirname, 'public/icon-maskable-512x512.png'));
console.log('✓ icon-maskable-512x512.png');

// apple touch icon
await sharp(svgBuffer)
  .resize(180, 180)
  .png()
  .toFile(resolve(__dirname, 'public/apple-touch-icon.png'));
console.log('✓ apple-touch-icon.png');

// screenshot para Microsoft Store (1280x800)
await sharp(svgBuffer)
  .resize(512, 512)
  .extend({ top: 144, bottom: 144, left: 384, right: 384, background: '#1a7a4a' })
  .png()
  .toFile(resolve(__dirname, 'public/screenshot-wide.png'));
console.log('✓ screenshot-wide.png');

console.log('\nTodos os ícones gerados com sucesso!');
