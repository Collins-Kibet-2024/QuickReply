import { describe, it, expect, vi } from 'vitest';
import { createAnthropicLlm } from '../../src/llm/anthropic-client.js';
import { buildGroundedPrompt, DONT_KNOW_ANSWER } from '../../src/llm/grounded-prompt.js';

const SECTIONS = [
  {
    title: 'Company Holidays › Paid holidays',
    content: 'Lumen Systems observes 11 paid holidays each year.',
    source: 'data/handbook/holidays.md',
  },
];

// A stand-in for the Anthropic SDK. Never calls the network.
function fakeAnthropic(response) {
  const create = vi.fn().mockResolvedValue(response);
  return { anthropic: { beta: { messages: { create } } }, create };
}

const reply = (content, stop_reason = 'end_turn') => ({ content, stop_reason });

describe('createAnthropicLlm', () => {
  it('AC2.3: sends the grounded prompt to the configured model', async () => {
    const { anthropic, create } = fakeAnthropic(reply([{ type: 'text', text: '11 holidays.' }]));
    const llm = createAnthropicLlm({ anthropic, model: 'claude-opus-5-5' });
    const question = 'How many paid holidays do we get?';

    await llm.answer({ question, sections: SECTIONS });

    const { system, messages } = buildGroundedPrompt({ question, sections: SECTIONS });
    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0]).toMatchObject({
      model: 'claude-opus-5-5',
      system,
      messages,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
  });

  it('returns the text blocks joined, skipping other block types', async () => {
    const { anthropic } = fakeAnthropic(
      reply([
        { type: 'thinking', thinking: '' },
        { type: 'text', text: 'Lumen observes ' },
        { type: 'text', text: '11 paid holidays.' },
      ]),
    );
    const llm = createAnthropicLlm({ anthropic, model: 'claude-opus-5-5' });

    const { text } = await llm.answer({ question: 'How many holidays?', sections: SECTIONS });

    expect(text).toBe('Lumen observes 11 paid holidays.');
  });

  it('AC2.3: a refusal becomes the "contact HR" answer', async () => {
    const { anthropic } = fakeAnthropic(reply([], 'refusal'));
    const llm = createAnthropicLlm({ anthropic, model: 'claude-opus-5-5' });

    const { text } = await llm.answer({ question: 'How many holidays?', sections: SECTIONS });

    expect(text).toBe(DONT_KNOW_ANSWER);
  });

  it('AC2.3: an empty answer becomes the "contact HR" answer', async () => {
    const { anthropic } = fakeAnthropic(reply([{ type: 'text', text: '   ' }]));
    const llm = createAnthropicLlm({ anthropic, model: 'claude-opus-5-5' });

    const { text } = await llm.answer({ question: 'How many holidays?', sections: SECTIONS });

    expect(text).toBe(DONT_KNOW_ANSWER);
  });

  it('passes SDK errors up to the caller', async () => {
    const create = vi.fn().mockRejectedValue(new Error('rate limited'));
    const llm = createAnthropicLlm({
      anthropic: { beta: { messages: { create } } },
      model: 'claude-opus-5-5',
    });

    await expect(llm.answer({ question: 'How many holidays?', sections: SECTIONS })).rejects.toThrow(
      'rate limited',
    );
  });
});
