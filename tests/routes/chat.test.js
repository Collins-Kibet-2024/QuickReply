import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { DEFLECTION_MESSAGE, PERSONAL_REDIRECT_MESSAGE } from '../../src/routes/chat.js';
import { classifyQuery } from '../../src/classifier/classify-query.js';
import { retrieveHandbook } from '../../src/retrieval/retrieve-handbook.js';

// Spy on the real functions so call order can be checked without changing behavior.
vi.mock('../../src/classifier/classify-query.js', { spy: true });
vi.mock('../../src/retrieval/retrieve-handbook.js', { spy: true });

const HANDBOOK = [
  {
    title: 'Company Holidays › Paid holidays',
    content: 'Lumen Systems observes 11 paid holidays each year.',
    source: 'data/handbook/holidays.md',
  },
];

// Every RESTRICTED example in docs/data-classification.md.
const RESTRICTED_QUESTIONS = [
  'What does Sarah on my team make?',
  'Who got the biggest bonus?',
  'Is Mark on a PIP?',
  'What rating did my coworker get?',
  'Why was Priya fired?',
  'Is there an investigation into my manager?',
  'Why is Dan on leave?',
  'Does Ana have a disability accommodation?',
  'What does the SWE II on my team make?',
  'Why is my teammate on FMLA?',
  "What's my salary compared to Jen's?",
  '',
  'salary',
  'My SSN is 123-45-6789, update my W-4',
  "What is Sarah's PTO balance?",
  'Is Dan on PTO?',
];

const PERSONAL_QUESTIONS = [
  'How many PTO days do I have left?',
  'What is my salary?',
  'Did my 401k enrollment go through?',
];

function setup() {
  const llmClient = { answer: vi.fn() };
  const app = createApp({ llmClient, handbook: HANDBOOK });
  return { app, llmClient };
}

const ask = (app, message) => request(app).post('/api/chat').send({ message });

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RESTRICTED questions never reach the LLM', () => {
    it.each(RESTRICTED_QUESTIONS)('%j gets the HR deflection', async (message) => {
      const { app, llmClient } = setup();

      const res = await ask(app, message);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        kind: 'deflection',
        tier: 'RESTRICTED',
        answer: DEFLECTION_MESSAGE,
        sources: [],
      });
      expect(llmClient.answer).not.toHaveBeenCalled();
      expect(retrieveHandbook).not.toHaveBeenCalled();
    });
  });

  describe('PERSONAL questions never reach the LLM', () => {
    it.each(PERSONAL_QUESTIONS)('%j gets the self-service redirect', async (message) => {
      const { app, llmClient } = setup();

      const res = await ask(app, message);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        kind: 'redirect',
        tier: 'PERSONAL',
        answer: PERSONAL_REDIRECT_MESSAGE,
        sources: [],
      });
      expect(llmClient.answer).not.toHaveBeenCalled();
      expect(retrieveHandbook).not.toHaveBeenCalled();
    });
  });

  it('AC2.2: classifies the question before anything else', async () => {
    const { app } = setup();

    await ask(app, 'How many paid holidays do we get?');

    expect(classifyQuery).toHaveBeenCalledWith('How many paid holidays do we get?');
    expect(retrieveHandbook).toHaveBeenCalled();
    expect(vi.mocked(classifyQuery).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(retrieveHandbook).mock.invocationCallOrder[0],
    );
  });

  it('uses the fixed messages from the classification policy', () => {
    expect(DEFLECTION_MESSAGE).toBe(
      "I can't help with that here. Please contact HR directly at hr@lumen.example.",
    );
    expect(PERSONAL_REDIRECT_MESSAGE).toBe(
      'For your personal records, please check the Lumen self-service portal or contact HR.',
    );
  });
});
