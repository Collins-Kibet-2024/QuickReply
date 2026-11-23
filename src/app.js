import express from 'express';
import { createChatRouter } from './routes/chat.js';

const noop = () => {};

/** Return JSON for body-parsing errors and anything unexpected; never a stack trace. */
function jsonErrorHandler(err, req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The request body is too large.' });
  }
  return res.status(500).json({ error: 'Something went wrong.' });
}

/**
 * Build the Express app without listening. `llmClient` must provide
 * `answer({ question, sections })`; tests pass a mock. `logger` receives
 * one entry per request with no user text.
 */
export function createApp({ llmClient, handbook, logger = noop }) {
  const app = express();
  app.use(express.json({ limit: '10kb' }));
  app.use('/api', createChatRouter({ llmClient, handbook, logger }));
  app.use(jsonErrorHandler);
  return app;
}
