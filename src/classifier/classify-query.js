import { TIERS, REASONS } from './tiers.js';

export function classifyQuery(text) {
  return { tier: TIERS.RESTRICTED, reasons: [REASONS.OTHERS_COMPENSATION] };
}
