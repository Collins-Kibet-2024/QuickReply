import { describe, it, expect } from 'vitest';
import { classifyQuery } from '../../src/classifier/classify-query.js';
import { TIERS, REASONS } from '../../src/classifier/tiers.js';

const OTHERS_COMPENSATION_QUESTIONS = [
  'What does Sarah on my team make?',
  'Who got the biggest bonus?',
  'What does the SWE II on my team make?',
  "How much is my manager's salary?",
];

const GENERAL_POLICY_QUESTIONS = [
  'How many paid holidays do we get?',
  'When is open enrollment?',
  'What is the parental leave policy?',
  'How does FMLA leave work?',
];

describe('classifyQuery', () => {
  describe("AC1.1: others' compensation is RESTRICTED", () => {
    it.each(OTHERS_COMPENSATION_QUESTIONS)('%s', (question) => {
      const { tier, reasons } = classifyQuery(question);

      expect(tier).toBe(TIERS.RESTRICTED);
      expect(reasons).toContain(REASONS.OTHERS_COMPENSATION);
    });
  });

  describe('AC1.3: general policy questions are PUBLIC', () => {
    it.each(GENERAL_POLICY_QUESTIONS)('%s', (question) => {
      const { tier, reasons } = classifyQuery(question);

      expect(tier).toBe(TIERS.PUBLIC);
      expect(reasons).toContain(REASONS.GENERAL_POLICY);
    });
  });
});
