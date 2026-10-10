import { ref, get, set } from 'firebase/database';
import { database } from '../config/firebase';

export const EMPTY_MEMORY = { facts: [], aliases: [], examples: [] };
export const MEMORY_LIMITS = { facts: 30, aliases: 50, examples: 5 };

const clip = (text, max) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, max);
const norm = text => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function sanitizeMemory(raw) {
  const list = value => (Array.isArray(value) ? value : value && typeof value === 'object' ? Object.values(value) : []);
  return {
    facts: list(raw?.facts).map(f => clip(f, 200)).filter(Boolean).slice(-MEMORY_LIMITS.facts),
    aliases: list(raw?.aliases)
      .map(a => ({ term: clip(a?.term, 40), category: clip(a?.category, 40) }))
      .filter(a => a.term && a.category)
      .slice(-MEMORY_LIMITS.aliases),
    examples: list(raw?.examples)
      .map(e => ({ q: clip(e?.q, 160), a: clip(e?.a, 400) }))
      .filter(e => e.q && e.a)
      .slice(-MEMORY_LIMITS.examples),
  };
}

export async function loadAIMemory(uid) {
  const snapshot = await get(ref(database, `aiMemory/${uid}`));
  return snapshot.exists() ? sanitizeMemory(snapshot.val()) : { ...EMPTY_MEMORY };
}

export async function saveAIMemory(uid, memory) {
  await set(ref(database, `aiMemory/${uid}`), sanitizeMemory(memory));
}

export function hasMemory(memory) {
  return Boolean(memory && (memory.facts.length || memory.aliases.length || memory.examples.length));
}

// Texto estável (mesma memória => mesmo texto) para não invalidar o cache do prompt.
export function memoryToPrompt(memory) {
  if (!hasMemory(memory)) return '';
  const parts = ['MEMÓRIA SOBRE O USUÁRIO (aprendida nas conversas; respeite sempre):'];
  memory.facts.forEach(f => parts.push(`- ${f}`));
  if (memory.aliases.length) {
    parts.push(`Categorias definidas pelo usuário: ${memory.aliases.map(a => `"${a.term}" = ${a.category}`).join('; ')}`);
  }
  if (memory.examples.length) {
    parts.push('Exemplos de respostas que o usuário aprovou (use como guia de estilo):');
    memory.examples.slice(-3).forEach(e => parts.push(`P: ${e.q}\nR: ${e.a}`));
  }
  return parts.join('\n');
}

export function findCategory(description, aliases) {
  const text = norm(description);
  const match = (aliases || []).find(a => text.includes(norm(a.term)));
  return match ? match.category : null;
}

// Comandos em linguagem natural: "lembre que...", "considere X como Y".
export function parseMemoryCommand(question) {
  const text = clip(question, 300);
  const fact = text.match(/^(?:lembre(?:-se)?|guarde|anote|memorize)(?:\s+que|:)?\s+(.{3,})$/i);
  if (fact) return { type: 'fact', text: clip(fact[1], 200) };
  const alias = text.match(/^(?:considere|classifique|categorize)\s+(.{2,40}?)\s+como\s+(.{2,40})$/i);
  if (alias) return { type: 'alias', term: clip(alias[1], 40), category: clip(alias[2].replace(/[.!]+$/, ''), 40) };
  return null;
}

export function addFact(memory, text) {
  const clean = clip(text, 200);
  if (!clean || memory.facts.some(f => norm(f) === norm(clean))) return memory;
  return sanitizeMemory({ ...memory, facts: [...memory.facts, clean] });
}

export function addAlias(memory, term, category) {
  const t = clip(term, 40);
  const c = clip(category, 40);
  if (!t || !c) return memory;
  const aliases = memory.aliases.filter(a => norm(a.term) !== norm(t));
  return sanitizeMemory({ ...memory, aliases: [...aliases, { term: t, category: c }] });
}

export function addExample(memory, q, a) {
  return sanitizeMemory({ ...memory, examples: [...memory.examples, { q, a }] });
}
