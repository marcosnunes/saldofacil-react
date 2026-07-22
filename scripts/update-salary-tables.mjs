import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataFilePath = path.join(projectRoot, 'src', 'data', 'salaryTaxTables.json');

const args = process.argv.slice(2);

function getArg(name, fallback = null) {
  const index = args.indexOf(name);
  if (index === -1) {
    return fallback;
  }

  const value = args[index + 1];
  return value && !value.startsWith('--') ? value : fallback;
}

function parseMoney(value) {
  if (!value) return 0;
  const normalized = String(value)
    .replace(/\s/g, '')
    .replace(/R\$/gi, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parsePercent(value) {
  const normalized = String(value).replace('%', '').replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed / 100 : 0;
}

function cleanText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTables(html) {
  return [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map((match) => match[1]);
}

function extractRows(tableHtml) {
  return [...tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => {
    const rowHtml = match[1];
    return [...rowHtml.matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)].map((cellMatch) => cleanText(cellMatch[1]));
  });
}

function parseBracketTable(html, headerPredicates) {
  const tables = extractTables(html);

  for (const tableHtml of tables) {
    const rows = extractRows(tableHtml).filter((row) => row.length > 0);
    if (rows.length < 2) continue;

    const headers = rows[0].map((value) => value.toLowerCase());
    const headerMatch = headerPredicates.every((predicate) => predicate(headers));
    if (!headerMatch) continue;

    const brackets = [];
    for (const row of rows.slice(1)) {
      const [first, second, third] = row;
      if (!first) continue;

      let limit = null;
      if (/até\s*R\$/i.test(first)) {
        limit = parseMoney(first);
      } else if (/de\s*R\$/i.test(first)) {
        const untilMatch = first.match(/até\s*R\$\s*([\d.,]+)/i);
        limit = untilMatch ? parseMoney(untilMatch[1]) : null;
      }

      brackets.push({
        limit,
        rate: parsePercent(second),
        deduction: parseMoney(third)
      });
    }

    return brackets;
  }

  return null;
}

function parseDependantDeduction(html) {
  const text = cleanText(html);
  const match = text.match(/Dedução mensal por dependente:\s*R\$\s*([\d.,]+)/i);
  return match ? parseMoney(match[1]) : null;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (SalaryTablesUpdater)'
    }
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar ${url}: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

async function main() {
  const targetYear = Number(getArg('--year', new Date().getFullYear()));
  const irrfUrl = getArg('--irrf-url', `https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/${targetYear}`);
  const inssUrl = getArg('--inss-url', '');

  const fileContent = await fs.readFile(dataFilePath, 'utf8');
  const currentTables = JSON.parse(fileContent);
  const currentYearTables = currentTables[String(targetYear)] || {};
  const sortedYears = Object.keys(currentTables).map(Number).sort((a, b) => a - b);
  const latestKnownYear = sortedYears[sortedYears.length - 1];
  const fallbackYearTables = currentTables[String(latestKnownYear)] || {};

  console.log(`Atualizando tabelas salariais para ${targetYear}`);

  const irrfHtml = await fetchHtml(irrfUrl);
  const irrfBrackets = parseBracketTable(irrfHtml, [
    (headers) => headers.some((header) => header.includes('base de cálculo')),
    (headers) => headers.some((header) => header.includes('alíquota')),
    (headers) => headers.some((header) => header.includes('dedução'))
  ]);

  if (!irrfBrackets || irrfBrackets.length === 0) {
    throw new Error('Não foi possível extrair a tabela de IRRF da fonte oficial.');
  }

  const dependentDeduction = parseDependantDeduction(irrfHtml);

  let inssBrackets = currentYearTables.inss || fallbackYearTables.inss || [];
  if (inssUrl) {
    const inssHtml = await fetchHtml(inssUrl);
    const parsedInss = parseBracketTable(inssHtml, [
      (headers) => headers.some((header) => header.includes('base de cálculo')),
      (headers) => headers.some((header) => header.includes('alíquota')),
      (headers) => headers.some((header) => header.includes('dedução'))
    ]);

    if (!parsedInss || parsedInss.length === 0) {
      throw new Error('Não foi possível extrair a tabela de INSS da fonte oficial informada.');
    }

    inssBrackets = parsedInss;
  }

  currentTables[String(targetYear)] = {
    ...fallbackYearTables,
    ...currentYearTables,
    inss: inssBrackets,
    irrf: irrfBrackets,
    dependentDeduction: dependentDeduction ?? currentYearTables.dependentDeduction ?? fallbackYearTables.dependentDeduction ?? 0,
    irrfExemptionFloor: irrfBrackets[0]?.limit ?? currentYearTables.irrfExemptionFloor ?? fallbackYearTables.irrfExemptionFloor ?? 0
  };

  await fs.writeFile(dataFilePath, `${JSON.stringify(currentTables, null, 2)}\n`, 'utf8');

  console.log(`Tabelas atualizadas com sucesso em ${path.relative(projectRoot, dataFilePath)}`);
  console.log(`IRRF atualizado de ${irrfUrl}`);
  if (inssUrl) {
    console.log(`INSS atualizado de ${inssUrl}`);
  } else {
    console.log('INSS mantido a partir do histórico local existente.');
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});