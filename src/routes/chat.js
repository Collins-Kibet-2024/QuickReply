import { Router } from 'express';
import { classifyQuery } from '../classifier/classify-query.js';
import { TIERS } from '../classifier/tiers.js';
import { retrieveHandbook } from '../retrieval/retrieve-handbook.js';

// Fixed wording from docs/data-classification.md.
export const DEFLECTION_MESSAGE =
  "I can't help with that here. Please contact HR directly at hr@lumen.example.";
export const PERSONAL_REDIRECT_MESSAGE =
  'For your personal records, please check the Lumen self-service portal or contact HR.';

const FIXED_RESPONSES = {
  [TIERS.RESTRICTED]: { kind: 'deflection', answer: DEFLECTION_MESSAGE },
  [TIERS.PERSONAL]: { kind: 'redirect', answer: PERSONAL_REDIRECT_MESSAGE },
};

/** `POST /api/chat`. Every question is classified before anything else happens. */
export function createChatRouter({ llmClient, handbook }) {
  const router = Router();

  router.post('/chat', async (req, res) => {
    const message = req.body?.message ?? '';
    const { tier } = classifyQuery(message);

    const fixed = FIXED_RESPONSES[tier];
    if (fixed) {
      return res.json({ ...fixed, tier, sources: [] });
    }

    retrieveHandbook(message, handbook);
    // PUBLIC answers are added in the next step.
    return res.status(501).json({ error: 'Not implemented' });
  });

  return router;
}
