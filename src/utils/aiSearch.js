const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "a", "o", "as", "os", "e", "em", "no", "na", "nos", "nas",
  "um", "uma", "que", "qual", "quais", "quanto", "quantos", "com", "por", "para", "pra",
  "meu", "minha", "foi", "fui", "ano", "mes", "gastei", "gasto", "gastos", "paguei",
]);

export function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

// Índice invertido (tabela hash: termo -> postings) com ranking BM25.
export function buildIndex(docs) {
  const postings = new Map();
  const lengths = [];
  docs.forEach((doc, id) => {
    const tokens = tokenize(doc.text);
    lengths[id] = tokens.length;
    const freq = new Map();
    tokens.forEach(t => freq.set(t, (freq.get(t) || 0) + 1));
    freq.forEach((tf, term) => {
      if (!postings.has(term)) postings.set(term, []);
      postings.get(term).push([id, tf]);
    });
  });
  const avgLen = lengths.reduce((s, l) => s + l, 0) / (lengths.length || 1) || 1;
  return { docs, postings, lengths, avgLen };
}

export function search(index, query, limit = 25) {
  const { docs, postings, lengths, avgLen } = index;
  const N = docs.length;
  const k1 = 1.5;
  const b = 0.75;
  const scores = new Map();
  new Set(tokenize(query)).forEach(term => {
    // Casa o termo exato e prefixos (ex.: "mercado" ~ "mercadinho").
    const keys = postings.has(term) ? [term] : [...postings.keys()].filter(k => k.startsWith(term) || (term.length > 3 && term.startsWith(k) && k.length > 3));
    keys.forEach(key => {
      const list = postings.get(key);
      const idf = Math.log(1 + (N - list.length + 0.5) / (list.length + 0.5));
      list.forEach(([id, tf]) => {
        const score = idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * lengths[id] / avgLen));
        scores.set(id, (scores.get(id) || 0) + score);
      });
    });
  });
  return [...scores.entries()]
    .sort((a, b2) => b2[1] - a[1])
    .slice(0, limit)
    .map(([id]) => docs[id]);
}
