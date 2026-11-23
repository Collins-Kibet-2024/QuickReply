import { describe, it, expect } from 'vitest';
import { classifyQuery } from '../../src/classifier/classify-query.js';

describe('classifyQuery', () => {
  describe("AC1.1: others' compensation is RESTRICTED", () => {
    const examples = [
      'What does Sarah on my team make?',
      'Who got the biggest bonus?',
      'What does the SWE II on my team make?',
      "How much is my manager's salary?",
    ];

    it.each(examples)(
      "AC1.1: others' compensation is RESTRICTED — %s",
      (question) => {
        const result = classifyQuery(question);

        expect(result.tier).toBe('RESTRICTED');
        expect(result.reasons).toContain('OTHERS_COMPENSATION');
      },
    );
  });
});
