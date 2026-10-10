import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(projectRoot, 'assets', 'branding', 'saldofacil-icon-source.png');
const outputDirectory = path.join(projectRoot, 'store-assets', 'logos');
const outputPath = path.join(outputDirectory, 'store-tile-300x300.png');
const guidePath = path.join(projectRoot, 'store-assets', 'ASSET-GUIDE.txt');

const metadata = await sharp(sourcePath).metadata();
if (metadata.width < 400 || metadata.height < 400) {
  throw new Error(`A imagem de marca precisa ter pelo menos 400x400 pixels: ${sourcePath}`);
}

await mkdir(outputDirectory, { recursive: true });
const icon = await sharp(sourcePath)
  .resize(270, 270, { fit: 'contain', background: { r: 242, g: 242, b: 242, alpha: 1 } })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

await sharp({
  create: {
    width: 300,
    height: 300,
    channels: 4,
    background: '#f2f2f2',
  },
})
  .composite([{ input: icon, left: 15, top: 15 }])
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(outputPath);

await writeFile(
  guidePath,
  [
    'Microsoft Store assets - Saldo Facil',
    '',
    'Listing app tile icon: logos/store-tile-300x300.png (300 x 300 PNG).',
    'Desktop listing screenshots: use genuine app captures in screenshots/.',
    'Current Microsoft guidance: desktop PNGs from 1366 x 768 up to 3840 x 2160; maximum 50 MB each; up to 10 screenshots.',
    'Review screenshots for personal or financial data before publishing.',
    'Do not submit files named workspace-*; these are illustrative mockups, not captures of the released app.',
    'Package icons are generated separately by npm run assets:icons.',
    '',
  ].join('\n'),
  'utf8',
);

console.log(`Microsoft Store app tile icon generated: ${outputPath}`);
console.log('Store screenshots must be genuine captures of the released app; this script does not fabricate screenshots.');
