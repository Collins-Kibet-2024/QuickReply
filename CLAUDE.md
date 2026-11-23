# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

QuickReply is an HR self-service chat assistant for Lumen Systems, a fictional software company with about 2,000 employees. It answers general policy questions from a synthetic employee handbook. Questions involving personal or restricted HR data are deflected before any LLM sees them.

Requirements and classification rules (source of truth; if code disagrees, these win):

@docs/PRD.md
@docs/data-classification.md

`docs/session-notes.md` is a running log of work sessions. Add an entry when a session finishes meaningful work.

**Status:** F1 (classifier) is in `src/classifier/` and covers AC1.1, AC1.3, AC1.4, AC1.6, AC1.7, and the leave/accommodation part of AC1.2. F2 and F3 are not started. Express, `@anthropic-ai/sdk`, `dotenv`, Vitest, and Supertest are installed.

This file overrides the generic `~/Desktop/AGENTS.md` (React/Vite/Tailwind stack, colocated tests, issue-scoped commits) wherever they differ.

## Tech stack

- **Server:** Node.js, Express
- **LLM:** `@anthropic-ai/sdk`, **server-side only**. The API key lives in `.env`.
- **Frontend:** one static HTML page plus vanilla JS, served by Express. No framework, no build step.
- **Tests:** Vitest (unit), Supertest (API routes)

## Commands

```bash
npm install
npm test                                # vitest run: all tests, once
npm run test:watch                      # vitest in watch mode
npm test -- tests/path/file.test.js     # one file
npm test -- -t "test name"              # tests matching a name
```

Vitest exits with code 1 when no test files exist. Add a `start` script here once the server entry point exists.

## Architecture decisions

- **Classify first.** Every request goes through `classifyQuery(text)` → `{ tier, reasons }` before anything else (PRD §6).
- **RESTRICTED and PERSONAL never reach the LLM.** They get fixed, templated responses.
- **Grounded answers only.** For PUBLIC questions, `retrieveHandbook(text)` keyword-scores `data/handbook/*.md`. The LLM answers only from those excerpts and cites the sources. If nothing matches, the bot replies without calling the LLM.
- **The LLM client is injected.** The Express app is built by a factory that takes the client as a parameter, so tests pass a mock. Only the server entry point constructs the real Anthropic client.
- **Output is redacted.** `redactPII` runs on LLM output before it's returned.

## Folder structure

Target layout; create files as features need them.

| Path | What belongs there |
|---|---|
| `src/app.js` | `createApp({ llmClient })`: builds and returns the Express app, without listening |
| `src/server.js` | Entry point: loads env, creates the real Anthropic client, calls `listen` |
| `src/classifier/` | `classifyQuery`, `redactPII`, pattern definitions (F1) |
| `src/retrieval/` | Handbook loading and `retrieveHandbook` (F2) |
| `src/llm/` | Anthropic client wrapper and the grounded-answer prompt |
| `src/routes/` | Route handlers such as `POST /api/chat` |
| `public/` | Static chat UI: `index.html`, JS, CSS (F3) |
| `data/handbook/` | Synthetic handbook sections as markdown |
| `data/raw/` | Gitignored scratch data; never commit |
| `tests/` | All tests, mirroring `src/` (for example `tests/classifier/classify-query.test.js`) |
| `docs/` | PRD, classification policy, session notes |

## Coding conventions

- ES modules (`import`/`export`; `package.json` has `"type": "module"`), and named exports only.
- Small, pure functions. Keep I/O (filesystem, network, env) at the edges, such as `server.js` and the handbook loader.
- Use descriptive names. Files are `kebab-case.js`.
- No secrets in code. Read config from `process.env` in `server.js` only.

## Testing strategy

- **Strict TDD:** write a failing test, make it pass, then refactor.
- Tests live in `tests/`, not next to the source.
- **Never call the real Anthropic API in tests.** Inject a mock client and assert it was *not* called for RESTRICTED, PERSONAL, and no-match cases.
- Every PRD acceptance criterion (AC1.x, AC2.x, AC3.x) gets at least one test. Name tests after the AC, for example `it('AC1.1: others\' compensation is RESTRICTED')`. Cover the edge-case table in `data-classification.md` too.
- Changing a classification rule requires a failing test, then the code, then an update to `data-classification.md` in the same commit series.

## Commit conventions

Use conventional commits: `test:`, `feat:`, `refactor:`, `docs:`, `chore:`, with an optional scope. Label TDD steps:

```
test(classifier): AC1.1 others' compensation is RESTRICTED (red)
feat(classifier): detect others' compensation (green)
refactor(classifier): extract keyword patterns (refactor)
```

## Do's and don'ts

- **Do** call `classifyQuery` first in every route that handles user text.
- **Do** classify to the more restrictive tier when unsure.
- **Don't** log raw user messages. Log only request ID, tier, and reason codes, and use redacted text if anything more is needed.
- **Don't** read, print, or commit `.env`.
- **Don't** add real names, salaries, or employee IDs. All data is synthetic.

## Context management

- Run `/clear` between features (F1, F2, F3) or between phases (explore, plan, implement).
- In long sessions, run `/compact` with a focus instruction, for example `/compact keep classifier test status and open ACs`.
- Run `claude --continue` to resume the last session.
