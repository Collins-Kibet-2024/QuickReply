import { TIERS, REASONS } from './tiers.js';

const COMPENSATION_WORDS = String.raw`make|makes|salary|bonus|pay|earns?|compensation`;

// Every rule is checked; when several match, the most restrictive tier wins (AC1.7).
const RULES = [
  {
    // Compensation that isn't introduced by "my", e.g. "What does Sarah make?"
    pattern: new RegExp(String.raw`(?<!\bmy\s+)\b(${COMPENSATION_WORDS})\b`, 'i'),
    tier: TIERS.RESTRICTED,
    reason: REASONS.OTHERS_COMPENSATION,
  },
  {
    // Compensation compared against someone else, e.g. "my salary vs Jen's".
    pattern: new RegExp(
      String.raw`^(?=.*\b(${COMPENSATION_WORDS})\b)(?=.*\b(compared|comparison|versus|vs|than)\b)`,
      'is',
    ),
    tier: TIERS.RESTRICTED,
    reason: REASONS.OTHERS_COMPENSATION,
  },
  {
    // Someone being on leave ("is Dan on leave", "is my teammate on FMLA")
    // or having an accommodation ("does Ana have a disability accommodation").
    pattern:
      /\b(is|was|are|were)\s+(\w+\s+){1,3}on\s+(\w+\s+)?(leave|fmla)\b|\b(has|have|had|gets?|got)\s+an?\s+(\w+\s+)?accommodations?\b/i,
    tier: TIERS.RESTRICTED,
    reason: REASONS.MEDICAL_ACCOMMODATION,
  },
  {
    pattern: /\b(my\s+(salary|pto|401k)|do\s+i\s+have)\b/i,
    tier: TIERS.PERSONAL,
    reason: REASONS.SELF_RECORD,
  },
  {
    pattern: /\b(polic(?:y|ies)|holidays?|enrollment|leave)\b/i,
    tier: TIERS.PUBLIC,
    reason: REASONS.GENERAL_POLICY,
  },
];

const TIER_RANK = {
  [TIERS.PUBLIC]: 0,
  [TIERS.PERSONAL]: 1,
  [TIERS.RESTRICTED]: 2,
};

// A single word like "salary" could mean anything, so it is treated as ambiguous.
const MIN_WORDS = 2;

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function mostRestrictiveTier(rules) {
  return rules.reduce(
    (tier, rule) => (TIER_RANK[rule.tier] > TIER_RANK[tier] ? rule.tier : tier),
    TIERS.PUBLIC,
  );
}

/** Classify a user question into a data-sensitivity tier with reason codes. */
export function classifyQuery(text) {
  if (countWords(text) < MIN_WORDS) {
    return { tier: TIERS.RESTRICTED, reasons: [REASONS.AMBIGUOUS_INPUT] };
  }

  const matched = RULES.filter(({ pattern }) => pattern.test(text));
  if (matched.length === 0) {
    // When in doubt, restrict: unrecognized input is never PUBLIC.
    return { tier: TIERS.RESTRICTED, reasons: [] };
  }

  const tier = mostRestrictiveTier(matched);
  const reasons = [
    ...new Set(matched.filter((rule) => rule.tier === tier).map((rule) => rule.reason)),
  ];
  return { tier, reasons };
}
