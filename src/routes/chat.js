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

    const sections = retrieveHandbook(message, handbook);
    if (sections.length === 0) {
      return res.json({ kind: 'no_match', tier, answer: NO_MATCH_MESSAGE, sources: [] });
    }

    const { text } = await llmClient.answer({ question: message, sections });
    return res.json({
      kind: 'answer',
      tier,
      answer: redactPII(text),
      sources: sections.map(({ title, source }) => ({ title, source })),
    });
  });

  return router;
}
