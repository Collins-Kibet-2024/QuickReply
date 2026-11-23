import { buildGroundedPrompt, DONT_KNOW_ANSWER } from './grounded-prompt.js';

// Short answers from a few excerpts need little reasoning.
const EFFORT = 'low';
const MAX_TOKENS = 1024;

/**
 * Wrap an Anthropic SDK client as the app's LLM interface: `answer({ question, sections })`.
 * The SDK client is passed in so tests can use a fake; only server.js builds a real one.
 */
export function createAnthropicLlm({ anthropic, model }) {
  return {
    async answer({ question, sections }) {
      const { system, messages } = buildGroundedPrompt({ question, sections });
      const response = await anthropic.beta.messages.create({
        model,
        max_tokens: MAX_TOKENS,
        system,
        messages,
        output_config: { effort: EFFORT },
        // If the model declines, the API retries on a fallback model in the same call.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      });

      if (response.stop_reason === 'refusal') return { text: DONT_KNOW_ANSWER };

      const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('')
        .trim();
      return { text: text || DONT_KNOW_ANSWER };
    },
  };
}
