import { describe, it, expect } from 'vitest';
import { TIERS, REASONS } from '../../src/classifier/tiers.js';

// Values must match docs/data-classification.md exactly; they are part of the API.
describe('classification constants', () => {
  it.each(['PUBLIC', 'PERSONAL', 'RESTRICTED'])('tier %s matches the policy doc', (name) => {
    expect(TIERS[name]).toBe(name);
  });

  it.each(['OTHERS_COMPENSATION', 'GENERAL_POLICY'])(
    'reason code %s matches the policy doc',
    (code) => {
      expect(REASONS[code]).toBe(code);
    },
  );
});
