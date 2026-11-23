import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { createApp } from './app.js';
import { createAnthropicLlm } from './llm/anthropic-client.js';
import { loadHandbook } from './retrieval/load-handbook.js';

// The only place that reads config and builds the real Anthropic client.
// The SDK reads ANTHROPIC_API_KEY from the environment.
const port = Number(process.env.PORT ?? 3000);
const model = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5-5';

const handbook = await loadHandbook('data/handbook');
const llmClient = createAnthropicLlm({ anthropic: new Anthropic(), model });
const logger = (entry) => console.log(JSON.stringify(entry));

createApp({ llmClient, handbook, logger }).listen(port, () => {
  console.log(`QuickReply listening on http://localhost:${port} (${handbook.length} handbook sections)`);
});
