import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import icojs from 'icojs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const outputBase = resolve(projectRoot, 'store-assets');
const screenshotsDir = resolve(outputBase, 'screenshots');
const logosDir = resolve(outputBase, 'logos');

mkdirSync(screenshotsDir, { recursive: true });
mkdirSync(logosDir, { recursive: true });

const faviconBuffer = readFileSync(resolve(projectRoot, 'public/favicon.ico'));
const parsedIcons = await icojs.decodeIco(faviconBuffer);

if (!parsedIcons || parsedIcons.length === 0) {
  throw new Error('Nao foi possivel extrair imagem do favicon.ico');
}

const largestIcon = parsedIcons.reduce((best, current) => {
  const bestArea = best.width * best.height;
  const currentArea = current.width * current.height;
  return currentArea > bestArea ? current : best;
});

const sourceIcon = Buffer.from(largestIcon.buffer);
const masterIcon = await sharp(sourceIcon)
  .resize(1024, 1024, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    kernel: sharp.kernel.lanczos3,
  })
  .sharpen({ sigma: 0.9, m1: 0.8, m2: 2.0 })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

function brandingSvg(width, height) {
  const titleSize = Math.round(width * 0.055);
  const subtitleSize = Math.round(width * 0.02);
  return Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5e72e4" />
      <stop offset="100%" stop-color="#4a5cc5" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <circle cx="${Math.round(width * 0.15)}" cy="${Math.round(height * 0.2)}" r="${Math.round(width * 0.12)}" fill="rgba(255,255,255,0.08)" />
  <circle cx="${Math.round(width * 0.85)}" cy="${Math.round(height * 0.82)}" r="${Math.round(width * 0.1)}" fill="rgba(255,255,255,0.08)" />
  <text x="${Math.round(width * 0.5)}" y="${Math.round(height * 0.78)}" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="${titleSize}" font-weight="700">Saldo Facil</text>
  <text x="${Math.round(width * 0.5)}" y="${Math.round(height * 0.84)}" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Segoe UI, Arial, sans-serif" font-size="${subtitleSize}">Controle financeiro pessoal</text>
</svg>`);
}

async function createAsset(outputPath, width, height, iconScale = 0.45) {
  const iconSize = Math.round(Math.min(width, height) * iconScale);
  const iconBuffer = await sharp(masterIcon)
    .resize(iconSize, iconSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  const iconX = Math.round((width - iconSize) / 2);
  const iconY = Math.round(height * 0.2);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: '#5e72e4',
    },
  })
    .composite([
      { input: brandingSvg(width, height), top: 0, left: 0 },
      { input: iconBuffer, top: iconY, left: iconX },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
}

const screenshotTargets = [
  { file: 'workspace-1366x768.png', width: 1366, height: 768, scale: 0.5 },
  { file: 'workspace-1600x900.png', width: 1600, height: 900, scale: 0.5 },
  { file: 'workspace-1920x1080.png', width: 1920, height: 1080, scale: 0.5 },
];

const logoTargets = [
  { file: 'poster-720x1080.png', width: 720, height: 1080, scale: 0.46 },
  { file: 'poster-1440x2160.png', width: 1440, height: 2160, scale: 0.46 },
  { file: 'box-1080x1080.png', width: 1080, height: 1080, scale: 0.5 },
  { file: 'box-2160x2160.png', width: 2160, height: 2160, scale: 0.5 },
  { file: 'store-tile-300x300.png', width: 300, height: 300, scale: 0.56 },
  { file: 'store-tile-150x150.png', width: 150, height: 150, scale: 0.56 },
  { file: 'store-tile-71x71.png', width: 71, height: 71, scale: 0.56 },
];

for (const target of screenshotTargets) {
  await createAsset(resolve(screenshotsDir, target.file), target.width, target.height, target.scale);
  console.log(`✓ screenshots/${target.file}`);
}

for (const target of logoTargets) {
  await createAsset(resolve(logosDir, target.file), target.width, target.height, target.scale);
  console.log(`✓ logos/${target.file}`);
}

console.log('\nArtefatos da Store gerados em: store-assets/');
