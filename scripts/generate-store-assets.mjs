import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import icojs from 'icojs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const outputBase = resolve(projectRoot, 'store-assets');
const screenshotsDir = resolve(outputBase, 'screenshots');
const logosDir = resolve(outputBase, 'logos');
const sourceDir = resolve(outputBase, 'source');

mkdirSync(screenshotsDir, { recursive: true });
mkdirSync(logosDir, { recursive: true });
mkdirSync(sourceDir, { recursive: true });

const brandSourcePath = resolve(sourceDir, 'brand-master.png');
const realScreenshotPath = resolve(projectRoot, 'public', 'screenshot-wide.png');

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

function gradientBackdropSvg(width, height) {
  const titleSize = Math.round(width * 0.06);
  const subtitleSize = Math.round(width * 0.022);
  return Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgMain" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#13203f" />
      <stop offset="45%" stop-color="#1f3d72" />
      <stop offset="100%" stop-color="#0b1731" />
    </linearGradient>
    <radialGradient id="orbA" cx="0.2" cy="0.2" r="0.65">
      <stop offset="0%" stop-color="rgba(255,211,117,0.22)" />
      <stop offset="100%" stop-color="rgba(255,211,117,0)" />
    </radialGradient>
    <radialGradient id="orbB" cx="0.85" cy="0.82" r="0.55">
      <stop offset="0%" stop-color="rgba(255,255,255,0.13)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bgMain)" />
  <rect width="${width}" height="${height}" fill="url(#orbA)" />
  <rect width="${width}" height="${height}" fill="url(#orbB)" />
  <circle cx="${Math.round(width * 0.14)}" cy="${Math.round(height * 0.22)}" r="${Math.round(width * 0.12)}" fill="rgba(255,255,255,0.06)" />
  <circle cx="${Math.round(width * 0.85)}" cy="${Math.round(height * 0.78)}" r="${Math.round(width * 0.1)}" fill="rgba(255,255,255,0.08)" />
  <text x="${Math.round(width * 0.5)}" y="${Math.round(height * 0.82)}" text-anchor="middle" fill="#f6f8ff" font-family="Segoe UI, Arial, sans-serif" font-size="${titleSize}" font-weight="700">Saldo Facil</text>
  <text x="${Math.round(width * 0.5)}" y="${Math.round(height * 0.88)}" text-anchor="middle" fill="rgba(246,248,255,0.9)" font-family="Segoe UI, Arial, sans-serif" font-size="${subtitleSize}">Seu controle financeiro, sem complicacao</text>
</svg>`);
}

function getBrandInputPath() {
  if (existsSync(brandSourcePath)) {
    return brandSourcePath;
  }

  throw new Error('Arquivo de marca obrigatorio ausente: store-assets/source/brand-master.png');
}

async function getMasterBrand() {
  return sharp(getBrandInputPath())
    .resize(1600, 1600, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function createLogoAsset(outputPath, width, height, iconScale = 0.86) {
  const brandMaster = await getMasterBrand();
  const iconSize = Math.round(Math.min(width, height) * iconScale);
  const iconBuffer = await sharp(brandMaster)
    .resize(iconSize, iconSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  const iconX = Math.round((width - iconSize) / 2);
  const iconY = Math.round((height - iconSize) / 2);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: '#f2f2f2',
    },
  })
    .composite([{ input: iconBuffer, top: iconY, left: iconX }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
}

async function createScreenshotAsset(outputPath, width, height, iconScale = 0.38) {
  const frameW = Math.round(width * 0.58);
  const frameH = Math.round(height * 0.68);
  const frameX = Math.round(width * 0.05);
  const frameY = Math.round(height * 0.16);

  const screenInnerW = frameW - 28;
  const screenInnerH = frameH - 28;
  const appPreviewSvg = Buffer.from(`
<svg width="${screenInnerW}" height="${screenInnerH}" viewBox="0 0 ${screenInnerW} ${screenInnerH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${screenInnerW}" height="${screenInnerH}" fill="#ffffff" />
  <rect x="0" y="0" width="${screenInnerW}" height="${Math.round(screenInnerH * 0.14)}" fill="#f8fafc" />
  <text x="${Math.round(screenInnerW * 0.04)}" y="${Math.round(screenInnerH * 0.09)}" fill="#0f172a" font-family="Segoe UI, Arial, sans-serif" font-size="${Math.round(screenInnerW * 0.038)}" font-weight="700">Saldo Facil - Visao mensal</text>

  <rect x="${Math.round(screenInnerW * 0.04)}" y="${Math.round(screenInnerH * 0.19)}" width="${Math.round(screenInnerW * 0.42)}" height="${Math.round(screenInnerH * 0.2)}" rx="12" fill="#eff6ff" />
  <text x="${Math.round(screenInnerW * 0.07)}" y="${Math.round(screenInnerH * 0.26)}" fill="#1e3a8a" font-family="Segoe UI, Arial, sans-serif" font-size="${Math.round(screenInnerW * 0.03)}">Saldo Atual</text>
  <text x="${Math.round(screenInnerW * 0.07)}" y="${Math.round(screenInnerH * 0.34)}" fill="#0f172a" font-family="Segoe UI, Arial, sans-serif" font-size="${Math.round(screenInnerW * 0.045)}" font-weight="700">R$ 12.540,00</text>

  <rect x="${Math.round(screenInnerW * 0.52)}" y="${Math.round(screenInnerH * 0.19)}" width="${Math.round(screenInnerW * 0.44)}" height="${Math.round(screenInnerH * 0.2)}" rx="12" fill="#ecfdf3" />
  <text x="${Math.round(screenInnerW * 0.55)}" y="${Math.round(screenInnerH * 0.26)}" fill="#166534" font-family="Segoe UI, Arial, sans-serif" font-size="${Math.round(screenInnerW * 0.03)}">Meta do Mes</text>
  <text x="${Math.round(screenInnerW * 0.55)}" y="${Math.round(screenInnerH * 0.34)}" fill="#14532d" font-family="Segoe UI, Arial, sans-serif" font-size="${Math.round(screenInnerW * 0.042)}" font-weight="700">85% concluido</text>

  <rect x="${Math.round(screenInnerW * 0.04)}" y="${Math.round(screenInnerH * 0.45)}" width="${Math.round(screenInnerW * 0.92)}" height="${Math.round(screenInnerH * 0.44)}" rx="12" fill="#f8fafc" />
  <text x="${Math.round(screenInnerW * 0.07)}" y="${Math.round(screenInnerH * 0.54)}" fill="#334155" font-family="Segoe UI, Arial, sans-serif" font-size="${Math.round(screenInnerW * 0.03)}">Despesas por categoria</text>

  <rect x="${Math.round(screenInnerW * 0.07)}" y="${Math.round(screenInnerH * 0.61)}" width="${Math.round(screenInnerW * 0.16)}" height="${Math.round(screenInnerH * 0.2)}" rx="8" fill="#dbeafe" />
  <rect x="${Math.round(screenInnerW * 0.28)}" y="${Math.round(screenInnerH * 0.66)}" width="${Math.round(screenInnerW * 0.16)}" height="${Math.round(screenInnerH * 0.15)}" rx="8" fill="#bfdbfe" />
  <rect x="${Math.round(screenInnerW * 0.49)}" y="${Math.round(screenInnerH * 0.58)}" width="${Math.round(screenInnerW * 0.16)}" height="${Math.round(screenInnerH * 0.23)}" rx="8" fill="#93c5fd" />
  <rect x="${Math.round(screenInnerW * 0.70)}" y="${Math.round(screenInnerH * 0.64)}" width="${Math.round(screenInnerW * 0.16)}" height="${Math.round(screenInnerH * 0.17)}" rx="8" fill="#60a5fa" />
</svg>`);

  const frameSvg = Buffer.from(`
<svg width="${frameW}" height="${frameH}" viewBox="0 0 ${frameW} ${frameH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="frameStroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.22" />
    </linearGradient>
    <filter id="drop" x="-20%" y="-20%" width="160%" height="180%">
      <feDropShadow dx="0" dy="${Math.round(height * 0.02)}" stdDeviation="${Math.round(height * 0.018)}" flood-color="#000" flood-opacity="0.35" />
    </filter>
  </defs>
  <g filter="url(#drop)">
    <rect x="0" y="0" width="${frameW}" height="${frameH}" rx="28" ry="28" fill="#ffffff" />
    <rect x="1" y="1" width="${frameW - 2}" height="${frameH - 2}" rx="28" ry="28" fill="none" stroke="#e5e7eb" stroke-width="2" />
  </g>
</svg>`);

  const rightPanelX = Math.round(width * 0.67);
  const rightPanelY = Math.round(height * 0.2);
  const headlineSize = Math.round(width * 0.04);
  const bodySize = Math.round(width * 0.018);
  const rightPanelSvg = Buffer.from(`
<svg width="${Math.round(width * 0.29)}" height="${Math.round(height * 0.6)}" viewBox="0 0 ${Math.round(width * 0.29)} ${Math.round(height * 0.6)}" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="${Math.round(height * 0.08)}" fill="#0f172a" font-family="Segoe UI, Arial, sans-serif" font-size="${headlineSize}" font-weight="700">Controle</text>
  <text x="0" y="${Math.round(height * 0.135)}" fill="#0f172a" font-family="Segoe UI, Arial, sans-serif" font-size="${headlineSize}" font-weight="700">financeiro</text>
  <text x="0" y="${Math.round(height * 0.19)}" fill="#1d4ed8" font-family="Segoe UI, Arial, sans-serif" font-size="${headlineSize}" font-weight="700">com clareza</text>
  <text x="0" y="${Math.round(height * 0.27)}" fill="#334155" font-family="Segoe UI, Arial, sans-serif" font-size="${bodySize}">Acompanhe saldo mensal,</text>
  <text x="0" y="${Math.round(height * 0.31)}" fill="#334155" font-family="Segoe UI, Arial, sans-serif" font-size="${bodySize}">cartao, investimentos</text>
  <text x="0" y="${Math.round(height * 0.35)}" fill="#334155" font-family="Segoe UI, Arial, sans-serif" font-size="${bodySize}">e relatorios em um so lugar.</text>
  <text x="0" y="${Math.round(height * 0.44)}" fill="#64748b" font-family="Segoe UI, Arial, sans-serif" font-size="${Math.round(bodySize * 0.88)}">Tela promocional ilustrativa</text>
</svg>`);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: '#ffffff',
    },
  })
    .composite([
      { input: frameSvg, top: frameY, left: frameX },
      { input: appPreviewSvg, top: frameY + 14, left: frameX + 14 },
      { input: rightPanelSvg, top: rightPanelY, left: rightPanelX },
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
  { file: 'poster-720x1080.png', width: 720, height: 1080, scale: 0.85 },
  { file: 'poster-1440x2160.png', width: 1440, height: 2160, scale: 0.85 },
  { file: 'box-1080x1080.png', width: 1080, height: 1080, scale: 0.88 },
  { file: 'box-2160x2160.png', width: 2160, height: 2160, scale: 0.88 },
  { file: 'store-tile-300x300.png', width: 300, height: 300, scale: 0.9 },
  { file: 'store-tile-150x150.png', width: 150, height: 150, scale: 0.9 },
  { file: 'store-tile-71x71.png', width: 71, height: 71, scale: 0.9 },
];

for (const target of screenshotTargets) {
  await createScreenshotAsset(resolve(screenshotsDir, target.file), target.width, target.height, target.scale);
  console.log(`✓ screenshots/${target.file}`);
}

for (const target of logoTargets) {
  await createLogoAsset(resolve(logosDir, target.file), target.width, target.height, target.scale);
  console.log(`✓ logos/${target.file}`);
}

if (existsSync(brandSourcePath)) {
  console.log('\nFonte de marca utilizada: store-assets/source/brand-master.png');
} else {
  console.log('\nFonte de marca utilizada: vetor interno (adicione store-assets/source/brand-master.png para usar sua arte em alta).');
}

console.log('Artefatos da Store gerados em: store-assets/');
