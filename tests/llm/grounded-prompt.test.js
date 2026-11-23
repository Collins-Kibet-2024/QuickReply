import { describe, it, expect } from 'vitest';
import { buildGroundedPrompt, DONT_KNOW_ANSWER } from '../../src/llm/grounded-prompt.js';

const SECTIONS = [
  {
    title: 'Company Holidays › Paid holidays',
    content: 'Lumen Systems observes 11 paid holidays each year.',
    source: 'data/handbook/holidays.md',
  },
  {
    title: 'Company Holidays › Floating holidays',
    content: 'Every employee receives 2 floating holidays.',
    source: 'data/handbook/holidays.md',
  },
];

describe('buildGroundedPrompt', () => {
  it('AC2.3: the fallback answer is the exact wording from the PRD', () => {
    expect(DONT_KNOW_ANSWER).toBe("I don't know — please contact HR.");
  });

  it('AC2.3: the system prompt restricts answers to the excerpts', () => {
    const { system } = buildGroundedPrompt({ question: 'How many holidays?', sections: SECTIONS });

    expect(system).toMatch(/only/i);
    expect(system).toMatch(/excerpts/i);
    expect(system).toContain(DONT_KNOW_ANSWER);
  });

  it('keeps the system prompt identical across questions so it can be cached', () => {
    const first = buildGroundedPrompt({ question: 'How many holidays?', sections: SECTIONS });
    const second = buildGroundedPrompt({ question: 'What about PTO?', sections: [] });

    expect(first.system).toBe(second.system);
  });

  it('AC2.3: sends the question and every excerpt with its title and source in one user message', () => {
    const { messages } = buildGroundedPrompt({ question: 'How many holidays?', sections: SECTIONS });

    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
    const text = messages[0].content;
    expect(text).toContain('How many holidays?');
    for (const section of SECTIONS) {
      expect(text).toContain(section.title);
      expect(text).toContain(section.source);
      expect(text).toContain(section.content);
    }
  });
});
