import sharp from 'sharp';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import icojs from 'icojs';
import pngToIco from 'png-to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const faviconBuffer = readFileSync(resolve(__dirname, 'public/favicon.ico'));
const parsedIcons = await icojs.decodeIco(faviconBuffer);
const appxAssetsDir = resolve(__dirname, 'build/appx');

if (!parsedIcons || parsedIcons.length === 0) {
  throw new Error('Nao foi possivel extrair imagem do favicon.ico');
}

// Usa a maior imagem disponivel no ICO para manter qualidade ao redimensionar.
const largestIcon = parsedIcons.reduce((best, current) => {
  const bestArea = best.width * best.height;
  const currentArea = current.width * current.height;
  return currentArea > bestArea ? current : best;
});

const sourcePngBuffer = Buffer.from(largestIcon.buffer);

mkdirSync(appxAssetsDir, { recursive: true });

// Cria uma base em alta resolução para melhorar consistencia visual entre artefatos.
const masterIconBuffer = await sharp(sourcePngBuffer)
  .resize(1024, 1024, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    kernel: sharp.kernel.lanczos3,
  })
  .sharpen({ sigma: 0.9, m1: 0.8, m2: 2.0 })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// PWA icons
for (const size of sizes) {
  await sharp(masterIconBuffer)
    .resize(size, size)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(resolve(__dirname, `public/icon-${size}x${size}.png`));
  console.log(`✓ icon-${size}x${size}.png`);
}

// maskable com area segura (icone em ~80% da area total)
await sharp(masterIconBuffer)
  .resize(410, 410, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({
    top: 51,
    bottom: 51,
    left: 51,
    right: 51,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(resolve(__dirname, 'public/icon-maskable-512x512.png'));
console.log('✓ icon-maskable-512x512.png');

// apple touch icon
await sharp(masterIconBuffer)
  .resize(180, 180)
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(resolve(__dirname, 'public/apple-touch-icon.png'));
console.log('✓ apple-touch-icon.png');

// screenshot para Microsoft Store (1280x800)
await sharp(masterIconBuffer)
  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: 144, bottom: 144, left: 384, right: 384, background: '#5e72e4' })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(resolve(__dirname, 'public/screenshot-wide.png'));
console.log('✓ screenshot-wide.png');

// Icone Windows multi-resolucao para EXE/AppX.
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoPngBuffers = await Promise.all(
  icoSizes.map((size) =>
    sharp(masterIconBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer()
  )
);
const icoBuffer = await pngToIco(icoPngBuffers);
writeFileSync(resolve(__dirname, 'public/app-icon.ico'), icoBuffer);
console.log('✓ app-icon.ico');

// Assets AppX obrigatorios para evitar fallback para os logos padrao do electron-builder.
async function createAppxAsset(fileName, width, height, iconScale = 0.7) {
  const iconSize = Math.round(Math.min(width, height) * iconScale);
  const iconBuffer = await sharp(masterIconBuffer)
    .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  const iconX = Math.round((width - iconSize) / 2);
  const iconY = Math.round((height - iconSize) / 2);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: '#5e72e4',
    },
  })
    .composite([{ input: iconBuffer, top: iconY, left: iconX }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(resolve(appxAssetsDir, fileName));
}

await createAppxAsset('StoreLogo.png', 50, 50, 0.7);
console.log('✓ build/appx/StoreLogo.png');

await createAppxAsset('Square44x44Logo.png', 44, 44, 0.72);
console.log('✓ build/appx/Square44x44Logo.png');

await createAppxAsset('Square150x150Logo.png', 150, 150, 0.7);
console.log('✓ build/appx/Square150x150Logo.png');

await createAppxAsset('Wide310x150Logo.png', 310, 150, 0.8);
console.log('✓ build/appx/Wide310x150Logo.png');

console.log('\nTodos os ícones gerados com sucesso!');
