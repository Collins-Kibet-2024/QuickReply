import { TIERS, REASONS } from './tiers.js';

// Evaluated top to bottom; the first match wins, so order is significant.
// SELF_RECORD comes first so "my salary" or "my 401k enrollment" isn't read as
// someone else's compensation or as a general policy question.
const RULES = [
  {
    pattern: /\b(my\s+(salary|pto|401k)|do\s+i\s+have)\b/i,
    tier: TIERS.PERSONAL,
    reason: REASONS.SELF_RECORD,
  },
  {
    pattern: /\b(make|makes|salary|bonus|pay|earns?|compensation)\b/i,
    tier: TIERS.RESTRICTED,
    reason: REASONS.OTHERS_COMPENSATION,
  },
  {
    pattern: /\b(polic(?:y|ies)|holidays?|enrollment|leave)\b/i,
    tier: TIERS.PUBLIC,
    reason: REASONS.GENERAL_POLICY,
  },
];

// A single word like "salary" could mean anything, so it is treated as ambiguous.
const MIN_WORDS = 2;

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Classify a user question into a data-sensitivity tier with reason codes. */
export function classifyQuery(text) {
  if (countWords(text) < MIN_WORDS) {
    return { tier: TIERS.RESTRICTED, reasons: [REASONS.AMBIGUOUS_INPUT] };
  }

  const rule = RULES.find(({ pattern }) => pattern.test(text));
  if (rule) {
    return { tier: rule.tier, reasons: [rule.reason] };
  }

  // When in doubt, restrict: unrecognized input is never PUBLIC.
  return { tier: TIERS.RESTRICTED, reasons: [] };
}
