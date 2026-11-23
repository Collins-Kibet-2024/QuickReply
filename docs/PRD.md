# QuickReply — Product Requirements Document

**Status:** Draft v0.1 (prototype)
**Owner:** Collins Kibet
**Fictional customer:** Lumen Systems, Inc. — a ~2,000-person software company with offices in the US and remote employees across several states.

---

## 1. Problem

HR and People Analytics teams at mid-size companies spend a large share of their week answering routine questions that are already answered in the employee handbook or benefits site: "How many holidays do we get?", "When is open enrollment?", "How do I submit an expense?". These ad-hoc requests crowd out strategic work (workforce planning, attrition analysis, DEI and engagement analytics).

At the same time, HR data is among the most sensitive data a company holds. Any tool that answers employee questions must make it impossible to leak compensation, performance, medical, or investigation information.

## 2. Product summary

QuickReply is a web-based HR self-service chat assistant. It:

1. Answers general policy questions using only Lumen's (synthetic) employee handbook.
2. Detects questions that involve personal or restricted HR data and **deflects them before any LLM sees them**, pointing the employee to the right channel.

## 3. Goals and non-goals

**Goals (prototype)**
- Answer Tier 0 (public policy) questions accurately, grounded in handbook text, with the source section cited.
- Correctly classify every incoming question into a data-sensitivity tier (see `data-classification.md`).
- Never send restricted questions or PII to the LLM.
- Demonstrate a disciplined Claude Code workflow (CLAUDE.md, permissions, TDD, Explore→Plan→Implement→Commit).

**Non-goals (prototype)**
- Real authentication or SSO.
- Connecting to a real HRIS (Workday, BambooHR, etc.).
- Answering questions about an individual's own records (Tier 1 is stubbed with a redirect).
- Storing conversation history.
- Production deployment.

## 4. Users

| User | Need |
|---|---|
| Employee | Quick, accurate answers to policy questions without emailing HR |
| HR generalist / People Analytics | Fewer repetitive tickets; confidence that the bot will not expose sensitive data |
| HR leadership | Evidence that self-service can safely reduce ad-hoc load |

## 5. Tech stack

- **Runtime:** Node.js, Express
- **LLM:** Anthropic API via `@anthropic-ai/sdk` (server-side only)
- **Frontend:** single static HTML page + vanilla JS served by Express
- **Testing:** Vitest (unit), Supertest (API routes)
- **Data:** synthetic handbook stored as markdown in `data/handbook/`

## 6. Request flow

```
Browser → POST /api/chat
  → classifyQuery(text)
     ├─ RESTRICTED → deflection message + HR contact (no LLM call)
     ├─ PERSONAL   → redirect to self-service portal (stubbed, no LLM call)
     └─ PUBLIC     → retrieveHandbook(text)
                     → LLM answers ONLY from retrieved excerpts
                     → redactPII(output)
  → JSON response → chat UI
```

## 7. Features and acceptance criteria

### F1 — Query sensitivity classifier (built with strict TDD)

`classifyQuery(text)` returns `{ tier, reasons }` where `tier` is `PUBLIC`, `PERSONAL`, or `RESTRICTED`.

- **AC1.1** Questions about another person's compensation return `RESTRICTED`.
- **AC1.3** General policy questions return `PUBLIC`.
- **AC1.4** Questions about the requester's own records ("my PTO balance", "my salary") return `PERSONAL`.
- **AC1.6** Empty, very short, or ambiguous input defaults to the more restrictive tier.
- **AC1.7** When signals for multiple tiers are present, the most restrictive tier wins.

AC1.2 is partly implemented: questions about another person's leave or accommodations return `RESTRICTED`. The rest of AC1.2 and all of AC1.5 are deferred to Future work (§10).

### F2 — Handbook retrieval + chat endpoint (built with Explore→Plan→Implement→Commit)

- **AC2.1** `retrieveHandbook(text)` returns the top matching handbook sections (title + content + source file) using simple keyword scoring.
- **AC2.2** `POST /api/chat` runs the classifier first on every request.
- **AC2.3** For `PUBLIC` queries, the LLM is instructed to answer only from the provided excerpts and to say "I don't know — please contact HR" if the answer is not in them.
- **AC2.4** Responses include the source handbook section(s).
- **AC2.5** If no relevant section is found, the bot says so without calling the LLM.

### F3 — Web chat UI

- **AC3.1** A user can type a question and see the response in a chat-style layout.
- **AC3.2** Deflected answers are visually distinct (e.g., a "Contact HR" style card).
- **AC3.3** The UI shows a short notice that the assistant only answers general policy questions.

## 8. Security and privacy requirements

- The Anthropic API key lives only in `.env` on the server and is never committed or sent to the browser.
- Restricted and personal queries never reach the LLM.
- Raw user messages are never logged; logs contain only request ID, tier, and reason codes.
- All data in the repository is synthetic. No real names, salaries, or employee IDs.
- When in doubt, classify to the more restrictive tier.

## 9. Success metrics (for the prototype demo)

- 100% of the classifier test suite passes, including all restricted examples.
- 0 restricted test queries result in an LLM call (verified by tests with a mocked LLM client).
- Public handbook questions in the demo set are answered with a correct source citation.

## 10. Future work (out of scope)

- SSO and real Tier 1 answers from an HRIS.
- LLM-assisted classification layered on top of the rule-based classifier.
- Analytics dashboard for HR on question volume and topics (where people analytics comes back in).
- Slack/Teams integration.
- Deferred F1 classifier criteria:
  - **AC1.2** Questions about performance reviews, disciplinary action, investigations, terminations of named people, or anyone's medical/accommodation information return `RESTRICTED`. (Others' leave and accommodations are already implemented.)
  - **AC1.5** Input containing an SSN-like pattern or bank account number returns `RESTRICTED`, and a redacted copy of the text is available for logging.
