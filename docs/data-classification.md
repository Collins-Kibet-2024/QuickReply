# QuickReply — Data Classification Policy

This document defines how QuickReply classifies every incoming question. It is the source of truth for the `classifyQuery` function and its test suite. If code and this document disagree, this document wins — update the code (and tests), or update this document deliberately.

## Guiding principles

1. **Most restrictive wins.** If a question matches more than one tier, use the most restrictive one.
2. **When in doubt, restrict.** Ambiguous, empty, or very short input is never treated as `PUBLIC`.
3. **Restricted data never reaches the LLM.** Classification happens before any model call.
4. **Never log raw text.** Logs record request ID, tier, and reason codes only. If text must be stored for debugging, store the redacted version.

## Tiers

### Tier 0 — PUBLIC (general policy)

Information that applies to all employees and is (or could be) published in the employee handbook.

**Examples**
- "How many paid holidays do we get?"
- "When is benefits open enrollment?"
- "What is the parental leave policy?"
- "How do I submit an expense report?"

**Bot behavior:** Retrieve matching handbook sections and answer only from them, citing the source. If nothing relevant is found, say so and point to HR.

### Tier 1 — PERSONAL (the requester's own records)

Information about the person asking, which requires authentication the prototype does not have.

**Examples**
- "How many PTO days do I have left?"
- "What is my salary?"
- "When is my next performance review?"
- "Did my 401k enrollment go through?"



**Bot behavior:** Do not call the LLM. Respond with a redirect: "For your personal records, please check the Lumen self-service portal or contact HR."

### Tier 2 — RESTRICTED (sensitive or about other people)

Information that could harm an individual or the company if disclosed, or that concerns someone other than the requester.

**Categories and example signals**

| Category | Example questions |
|---|---|
| Others' compensation | "What does Sarah on my team make?", "Who got the biggest bonus?" |
| Performance and discipline | "Is Mark on a PIP?", "What rating did my coworker get?" |
| Investigations and terminations | "Why was Priya fired?", "Is there an investigation into my manager?" |
| Medical, leave reasons, accommodations | "Why is Dan on leave?", "Does Ana have a disability accommodation?" |
| Protected characteristics | Questions about anyone's religion, ethnicity, sexual orientation, immigration status, etc. |
| Sensitive identifiers (PII) | Text containing SSN-like patterns (`123-45-6789`), bank account or routing numbers |

**Bot behavior:** Do not call the LLM. Respond with a neutral deflection: "I can't help with that here. Please contact HR directly at hr@lumen.example." Never confirm or deny anything about the person mentioned.

## Sensitive personal disclosures

Sometimes employees share their own sensitive situation, e.g., "I'm dealing with a medical issue and need time off" or "My manager is harassing me."

- Classify as `RESTRICTED` (the text itself contains sensitive information).
- Respond with a supportive, non-judgmental redirect to HR or Employee Relations, and include general handbook links (e.g., leave policy, reporting policy) only if they can be returned without sending the user's text to the LLM.
- Never echo the sensitive details back.

## Edge cases

| Question | Tier | Why |
|---|---|---|
| "What does the SWE II on my team make?" | RESTRICTED | Identifies an individual's compensation |
| "How does FMLA leave work?" | PUBLIC | General policy |
| "Why is my teammate on FMLA?" | RESTRICTED | Another person's leave reason |
| "What's my salary?" | PERSONAL | Requester's own record |
| "What's my salary compared to Jen's?" | RESTRICTED | Involves another person — most restrictive wins |
| "" (empty) or "salary" (single word) | RESTRICTED | Too ambiguous to answer safely |
| "My SSN is 123-45-6789, update my W-4" | RESTRICTED | Contains PII; redact before logging |

## Reason codes

`classifyQuery` returns reason codes so behavior is explainable and testable without logging raw text.

| Code | Meaning |
|---|---|
| `OTHERS_COMPENSATION` | Compensation of another person |
| `PERFORMANCE_DISCIPLINE` | Reviews, ratings, PIPs, discipline |
| `INVESTIGATION_TERMINATION` | Investigations, firings, misconduct |
| `MEDICAL_ACCOMMODATION` | Health, leave reasons, accommodations |
| `PROTECTED_CHARACTERISTIC` | Protected attributes of any person |
| `PII_DETECTED` | SSN, bank account, or similar identifier pattern |
| `SELF_RECORD` | Requester's own records (PERSONAL) |
| `AMBIGUOUS_INPUT` | Empty, very short, or unclear input |
| `GENERAL_POLICY` | General handbook question (PUBLIC) |

## Change process

Any change to tiers, categories, or edge cases requires:
1. A failing test that captures the new rule.
2. The code change to make it pass.
3. An update to this document in the same pull request or commit series.
