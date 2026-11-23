// Words too common to tell sections apart. "policy", "lumen", and "employee"
// appear throughout the handbook, so they are treated as common words too.
const STOPWORDS = new Set([
  'a', 'about', 'after', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'before',
  'by', 'can', 'could', 'did', 'do', 'does', 'for', 'from', 'get', 'go', 'had', 'has', 'have',
  'how', 'i', 'if', 'in', 'is', 'it', 'its', 'many', 'me', 'much', 'my', 'of', 'on', 'or',
  'our', 'should', 'so', 'than', 'that', 'the', 'their', 'there', 'they', 'this', 'to', 'us',
  'was', 'we', 'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'work', 'would',
  'you', 'your',
  'company', 'employee', 'employees', 'lumen', 'policies', 'policy',
]);

const TITLE_WEIGHT = 3;
const DEFAULT_LIMIT = 3;

/** Reduce a simple plural to its singular: "holidays" -> "holiday". */
function singular(word) {
  return word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/401\(k\)/g, '401k')
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !STOPWORDS.has(word))
    .map(singular);
}

function countOf(term, words) {
  return words.filter((word) => word === term).length;
}

function scoreSection(terms, section) {
  const titleWords = tokenize(section.title);
  const contentWords = tokenize(section.content);
  return terms.reduce(
    (score, term) => score + TITLE_WEIGHT * countOf(term, titleWords) + countOf(term, contentWords),
    0,
  );
}

/**
 * Return the handbook sections that best match the question, best first.
 * Sections with no matching keyword are never returned.
 */
export function retrieveHandbook(text, sections, { limit = DEFAULT_LIMIT } = {}) {
  const terms = [...new Set(tokenize(text))];
  if (terms.length === 0) return [];

  return sections
    .map((section) => ({ section, score: scoreSection(terms, section) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ section: { title, content, source } }) => ({ title, content, source }));
}
