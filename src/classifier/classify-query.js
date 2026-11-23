import { TIERS, REASONS } from './tiers.js';

const COMPENSATION_PATTERN = /\b(make|makes|salary|bonus|pay|earns?|compensation)\b/i;
const SELF_RECORD_PATTERN = /\b(my\s+(salary|pto|401k)|do\s+i\s+have)\b/i;
const GENERAL_POLICY_PATTERN = /\b(polic(?:y|ies)|holidays?|enrollment|leave)\b/i;

/** Classify a user question into a data-sensitivity tier with reason codes. */
export function classifyQuery(text) {
  // Checked before compensation and policy so "my salary" or "my 401k enrollment" isn't misread.
  if (SELF_RECORD_PATTERN.test(text)) {
    return { tier: TIERS.PERSONAL, reasons: [REASONS.SELF_RECORD] };
  }

  if (COMPENSATION_PATTERN.test(text)) {
    return { tier: TIERS.RESTRICTED, reasons: [REASONS.OTHERS_COMPENSATION] };
  }

  if (GENERAL_POLICY_PATTERN.test(text)) {
    return { tier: TIERS.PUBLIC, reasons: [REASONS.GENERAL_POLICY] };
  }

  // When in doubt, restrict: unrecognized input is never PUBLIC.
  return { tier: TIERS.RESTRICTED, reasons: [] };
}
