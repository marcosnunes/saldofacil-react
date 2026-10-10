import { copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(projectRoot, 'build', 'appx');
const destinationDirectory = path.join(projectRoot, 'release', 'win-unpacked', 'Assets');
const assets = [
  ['StoreLogo.png', 'StoreLogo.png'],
  ['Square150x150Logo.png', 'MedTile.png'],
  ['Square44x44Logo.png', 'AppList.png'],
  ['Wide310x150Logo.png', 'WideTile.png'],
];

await mkdir(destinationDirectory, { recursive: true });
for (const [sourceName, destinationName] of assets) {
  const sourcePath = path.join(sourceDirectory, sourceName);
  const sourceFile = await stat(sourcePath);
  if (!sourceFile.isFile() || sourceFile.size === 0) {
    throw new Error(`Asset MSIX ausente ou vazio: ${sourcePath}`);
  }
  await copyFile(sourcePath, path.join(destinationDirectory, destinationName));
}

console.log(`Assets do manifesto WinApp preparados em ${destinationDirectory}.`);
