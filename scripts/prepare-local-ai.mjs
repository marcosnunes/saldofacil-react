import { copyFile, mkdir, open, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const sourceRuntime = path.join(projectRoot, 'runtime-ai');
const sourceModel = path.join(sourceRuntime, 'models', 'claude2-alpaca-7b.Q4_K_M.gguf');
const sourceBinaryDirectory = path.join(sourceRuntime, 'bin');
const sourceNotices = path.join(projectRoot, 'workspace-ai-models', 'claude2-alpaca-7B-GGUF');
const llamaLicense = path.join(projectRoot, 'scripts', 'licenses', 'LLAMA-CPP-MIT-LICENSE.txt');
const destination = path.join(projectRoot, 'build', 'ai-runtime');
const destinationBinaryDirectory = path.join(destination, 'bin');
const destinationModelDirectory = path.join(destination, 'models');
const destinationNotices = path.join(destination, 'licenses');

const requiredNotices = ['LICENSE.txt', 'Notice', 'USE_POLICY.md', 'README.md'];

async function requireFile(filePath, label) {
  try {
    const file = await stat(filePath);
    if (!file.isFile() || file.size === 0) throw new Error('arquivo vazio ou inválido');
  } catch (error) {
    throw new Error(`${label} não encontrado em ${filePath}: ${error.message}`);
  }
}

async function main() {
  if (process.platform !== 'win32' || process.arch !== 'x64') {
    throw new Error('O runtime local fornecido é compatível somente com Windows x64.');
  }

  const serverPath = path.join(sourceBinaryDirectory, 'llama-server.exe');
  await rm(destination, { recursive: true, force: true });
  await Promise.all([
    requireFile(serverPath, 'llama-server.exe'),
    requireFile(sourceModel, 'Modelo GGUF'),
    requireFile(llamaLicense, 'Licença MIT do llama.cpp'),
    ...requiredNotices.map(name => requireFile(path.join(sourceNotices, name), `Aviso de licença ${name}`)),
  ]);

  const modelFile = await open(sourceModel, 'r');
  try {
    const modelHeader = Buffer.alloc(4);
    await modelFile.read(modelHeader, 0, modelHeader.length, 0);
    if (modelHeader.toString('ascii') !== 'GGUF') {
      throw new Error(`O modelo ${sourceModel} não possui um cabeçalho GGUF válido.`);
    }
  } finally {
    await modelFile.close();
  }

  const runtimeFiles = await readdir(sourceBinaryDirectory, { withFileTypes: true });
  const runtimeLibraries = runtimeFiles
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.dll'))
    .map(entry => entry.name);
  if (runtimeLibraries.length === 0) {
    throw new Error(`Nenhuma DLL do runtime foi encontrada em ${sourceBinaryDirectory}.`);
  }

  await Promise.all([
    mkdir(destinationBinaryDirectory, { recursive: true }),
    mkdir(destinationModelDirectory, { recursive: true }),
    mkdir(destinationNotices, { recursive: true }),
  ]);

  await Promise.all([
    copyFile(serverPath, path.join(destinationBinaryDirectory, 'llama-server.exe')),
    copyFile(sourceModel, path.join(destinationModelDirectory, path.basename(sourceModel))),
    ...runtimeLibraries.map(name =>
      copyFile(path.join(sourceBinaryDirectory, name), path.join(destinationBinaryDirectory, name))),
    ...requiredNotices.map(name =>
      copyFile(path.join(sourceNotices, name), path.join(destinationNotices, name))),
    copyFile(llamaLicense, path.join(destinationNotices, 'LLAMA-CPP-MIT-LICENSE.txt')),
  ]);

  const modelSize = (await stat(sourceModel)).size;
  await writeFile(
    path.join(destinationNotices, 'SaldoFacil-AI-MODEL.txt'),
    [
      'Embedded local AI model',
      'Model: Claude2 Alpaca 7B, GGUF Q4_K_M',
      'Model file: models/claude2-alpaca-7b.Q4_K_M.gguf',
      'Model source: https://huggingface.co/TheBloke/claude2-alpaca-7B-GGUF',
      'Base model: https://huggingface.co/umd-zhou-lab/claude2-alpaca-7B',
      `Model file size: ${modelSize} bytes`,
      'License: Llama 2 Community License Agreement (see LICENSE.txt)',
      'The Llama 2 Acceptable Use Policy is included in USE_POLICY.md.',
      'llama.cpp is distributed under the MIT License (see LLAMA-CPP-MIT-LICENSE.txt).',
      '',
    ].join('\n'),
    'utf8',
  );

  console.log(`Runtime llama.cpp e modelo GGUF locais preparados em ${destination}.`);
  console.log(`Modelo incluído: ${(modelSize / 1024 ** 3).toFixed(2)} GiB.`);
}

main().catch(error => {
  console.error(`Falha ao preparar a IA local: ${error.message}`);
  process.exitCode = 1;
});
