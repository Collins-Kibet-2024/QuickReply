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

const SELF_RECORD_QUESTIONS = [
  'What is my salary?',
  'What is my PTO balance?',
  'How many PTO days do I have left?',
  'Did my 401k enrollment go through?',
];

// Leave and accommodation questions about someone other than the requester.
const OTHERS_MEDICAL_QUESTIONS = [
  'Why is Dan on leave?',
  'Is Dan on medical leave?',
  'Why is my teammate on FMLA?',
  'Does Ana have a disability accommodation?',
];

// Each mixes a PERSONAL signal ("my salary") with someone else's compensation.
const CONFLICTING_SIGNAL_QUESTIONS = [
  "What's my salary compared to Jen's?",
  "Is my salary higher than Jen's?",
  "My salary vs my teammate's salary",
];

const AMBIGUOUS_INPUTS = ['', '   ', 'salary', 'holidays'];

const CASES = [
  [
    "AC1.1: others' compensation is RESTRICTED",
    OTHERS_COMPENSATION_QUESTIONS,
    TIERS.RESTRICTED,
    REASONS.OTHERS_COMPENSATION,
  ],
  [
    'AC1.3: general policy questions are PUBLIC',
    GENERAL_POLICY_QUESTIONS,
    TIERS.PUBLIC,
    REASONS.GENERAL_POLICY,
  ],
  [
    "AC1.4: requester's own records are PERSONAL",
    SELF_RECORD_QUESTIONS,
    TIERS.PERSONAL,
    REASONS.SELF_RECORD,
  ],
  [
    "AC1.2 (partial): others' leave reasons and accommodations are RESTRICTED",
    OTHERS_MEDICAL_QUESTIONS,
    TIERS.RESTRICTED,
    REASONS.MEDICAL_ACCOMMODATION,
  ],
  [
    'AC1.7: the most restrictive tier wins when signals conflict',
    CONFLICTING_SIGNAL_QUESTIONS,
    TIERS.RESTRICTED,
    REASONS.OTHERS_COMPENSATION,
  ],
  [
    'AC1.6: empty or single-word input is RESTRICTED',
    AMBIGUOUS_INPUTS,
    TIERS.RESTRICTED,
    REASONS.AMBIGUOUS_INPUT,
  ],
];

describe('classifyQuery', () => {
  describe.each(CASES)('%s', (_label, inputs, expectedTier, expectedReason) => {
    it.each(inputs)('%j', (input) => {
      const { tier, reasons } = classifyQuery(input);

      expect(tier).toBe(expectedTier);
      expect(reasons).toContain(expectedReason);
    });
  });

  it('AC1.7: reports only the reasons for the winning tier', () => {
    const { reasons } = classifyQuery("What's my salary compared to Jen's?");

    expect(reasons).toEqual([REASONS.OTHERS_COMPENSATION]);
  });
});
