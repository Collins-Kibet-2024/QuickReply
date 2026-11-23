import { describe, it, expect } from 'vitest';
import { classifyQuery } from '../../src/classifier/classify-query.js';
import { TIERS, REASONS } from '../../src/classifier/tiers.js';

const OTHERS_COMPENSATION_QUESTIONS = [
  'What does Sarah on my team make?',
  'Who got the biggest bonus?',
  'What does the SWE II on my team make?',
  "How much is my manager's salary?",
];

describe('classifyQuery', () => {
  describe("AC1.1: others' compensation is RESTRICTED", () => {
    it.each(OTHERS_COMPENSATION_QUESTIONS)('%s', (question) => {
      const { tier, reasons } = classifyQuery(question);

      expect(tier).toBe(TIERS.RESTRICTED);
      expect(reasons).toContain(REASONS.OTHERS_COMPENSATION);
    });
  });
});
