// Capitalized words that appear mid-sentence in handbook questions but are not people.
// Compared in lowercase. Add to this list when a real policy question is wrongly restricted.
const NOT_PERSON_NAMES = new Set([
  // Company
  'lumen',
  // Holidays
  'new', 'year', 'years', 'day', 'martin', 'luther', 'king', 'jr', 'presidents', 'memorial',
  'juneteenth', 'independence', 'labor', 'thanksgiving', 'christmas', 'eve',
  // Days and months
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september',
  'october', 'november', 'december',
  // Laws, plans, and programs
  'family', 'medical', 'leave', 'act', 'federal', 'health', 'savings', 'account',
  'employee', 'assistance', 'program',
]);

const SENTENCE_END = /[.?!]$/;

/** Return the bare word: no surrounding punctuation, no trailing possessive. */
function cleanWord(token) {
  return token.replace(/^[^\w]+|[^\w]+$/g, '').replace(/['’]s$/i, '');
}

function looksLikeName(word) {
  // "Dan" or "Priya" qualifies; "PTO", "I", and "401k" do not.
  return /^[A-Z][a-z]+$/.test(word) && !NOT_PERSON_NAMES.has(word.toLowerCase());
}

/**
 * True when the text has a capitalized word mid-sentence that isn't a known
 * non-person word. Lowercase names ("is dan on pto") are not detected.
 */
export function mentionsPersonName(text) {
  const tokens = text.split(/\s+/).filter(Boolean);
  return tokens.some((token, index) => {
    const startsSentence = index === 0 || SENTENCE_END.test(tokens[index - 1]);
    return !startsSentence && looksLikeName(cleanWord(token));
  });
}
