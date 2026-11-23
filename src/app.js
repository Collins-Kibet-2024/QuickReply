import express from 'express';
import { createChatRouter } from './routes/chat.js';

/**
 * Build the Express app without listening. `llmClient` must provide
 * `answer({ question, sections })`; tests pass a mock.
 */
export function createApp({ llmClient, handbook }) {
  const app = express();
  app.use(express.json({ limit: '10kb' }));
  app.use('/api', createChatRouter({ llmClient, handbook }));
  return app;
}
