import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { classifyQuery } from '../classifier/classify-query.js';
import { TIERS } from '../classifier/tiers.js';
import { retrieveHandbook } from '../retrieval/retrieve-handbook.js';
import { redactPII } from '../classifier/redact-pii.js';

// Fixed wording from docs/data-classification.md.
export const DEFLECTION_MESSAGE =
  "I can't help with that here. Please contact HR directly at hr@lumen.example.";
export const PERSONAL_REDIRECT_MESSAGE =
  'For your personal records, please check the Lumen self-service portal or contact HR.';
export const NO_MATCH_MESSAGE =
  "I couldn't find that in the Lumen handbook. Please contact HR at hr@lumen.example.";

const MAX_MESSAGE_LENGTH = 1000;

const FIXED_RESPONSES = {
  [TIERS.RESTRICTED]: { kind: 'deflection', answer: DEFLECTION_MESSAGE },
  [TIERS.PERSONAL]: { kind: 'redirect', answer: PERSONAL_REDIRECT_MESSAGE },
};

function validationError(message) {
  if (typeof message !== 'string') return '"message" must be a string.';
  if (message.length > MAX_MESSAGE_LENGTH) {
    return `"message" must be at most ${MAX_MESSAGE_LENGTH} characters.`;
  }
  return null;
}

/**
 * `POST /api/chat`. Every question is classified before anything else happens.
 * `logger` receives only the request ID, tier, reason codes, and an error name; never user text.
 */
export function createChatRouter({ llmClient, handbook, logger }) {
  const router = Router();

  router.post('/chat', async (req, res) => {
    const message = req.body?.message;
    const error = validationError(message);
    if (error) return res.status(400).json({ error });

    const requestId = randomUUID();
    res.set('X-Request-Id', requestId);
    const { tier, reasons } = classifyQuery(message);

    const fixed = FIXED_RESPONSES[tier];
    if (fixed) {
      logger({ requestId, tier, reasons });
      return res.json({ ...fixed, tier, sources: [] });
    }

    const sections = retrieveHandbook(message, handbook);
    if (sections.length === 0) {
      logger({ requestId, tier, reasons });
      return res.json({ kind: 'no_match', tier, answer: NO_MATCH_MESSAGE, sources: [] });
    }

    let text;
    try {
      ({ text } = await llmClient.answer({ question: message, sections }));
    } catch (err) {
      logger({ requestId, tier, reasons, error: err.name });
      return res.status(502).json({ error: 'The assistant is unavailable right now. Please try again later.' });
    }

    logger({ requestId, tier, reasons });
    return res.json({
      kind: 'answer',
      tier,
      answer: redactPII(text),
      sources: sections.map(({ title, source }) => ({ title, source })),
    });
  });

  return router;
}
