# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

QuickReply is an HR self-service chat assistant prototype for a fictional company (Lumen Systems). It is at the scaffolding stage: `src/`, `public/`, `tests/`, and `data/handbook/` exist but are empty. Express and Vitest are installed, but there's no application code yet. Read `docs/PRD.md` and `docs/data-classification.md` before any implementation work. They are the source of truth. `docs/session-notes.md` is a running log of work sessions; add an entry when a session finishes meaningful work.

## Stack (per PRD, overrides the generic Desktop/AGENTS.md)

The parent `~/Desktop/AGENTS.md` describes a generic React + Vite + Tailwind + Supabase stack. **For this project the PRD wins**:

- Node.js + Express backend
- Anthropic API via `@anthropic-ai/sdk`, called **server-side only**. The key is in `.env`, which is gitignored.
- Frontend: one static HTML page plus vanilla JS, served by Express. No React, no build step.
- Vitest for unit tests, Supertest for API routes
- Synthetic handbook stored as markdown in `data/handbook/`
- Out of scope: auth/SSO, HRIS integration, conversation storage, production deployment

The workflow rules in `AGENTS.md` still apply: GitHub Issues, `type/<issue>-<desc>` branches, `<type>(<scope>): <summary> (#<issue>)` commits, colocated `*.test.js` files, and `TODO(#issue)`. If the PRD and AGENTS.md conflict on something else, raise it with the user rather than picking one silently.

## Commands

```bash
npm install
npm test                                # vitest run: all tests, once
npm run test:watch                      # vitest in watch mode
npm test -- src/path/file.test.js       # one file
npm test -- -t "test name"              # tests matching a name
```

Vitest exits with code 1 when no test files exist. There's no server entry point or `start` script yet; add one here once the Express app exists.

## Architecture (planned; see PRD §6)

Every request to `POST /api/chat` goes through a classify-first pipeline:

```
classifyQuery(text) → { tier, reasons }
  RESTRICTED → fixed deflection to hr@lumen.example   (no LLM call)
  PERSONAL   → fixed self-service-portal redirect     (no LLM call)
  PUBLIC     → retrieveHandbook(text)  (keyword scoring over data/handbook/*.md)
               → no matches: "not found" reply, no LLM call
               → else LLM answers ONLY from the excerpts, citing sources
               → redactPII(output)
```

Invariants the code and tests must enforce:

- **The classifier runs before anything else.** RESTRICTED or PERSONAL text must never reach the LLM client. Tests verify this with a mocked LLM client, so keep the client injectable.
- **Most restrictive tier wins.** Empty, single-word, or ambiguous input is classified `RESTRICTED` (`AMBIGUOUS_INPUT`), never `PUBLIC`.
- **Never log raw user text.** Logs hold only request ID, tier, and reason codes. If text must be kept, store the redacted version (for example, SSN patterns removed).
- Deflection responses never confirm or deny anything about the person named, and never echo sensitive details back.
- All repository data is synthetic: no real names, salaries, or IDs.

## Classifier change process

`docs/data-classification.md` defines the tiers, reason codes (`OTHERS_COMPENSATION`, `PII_DETECTED`, `SELF_RECORD`, `AMBIGUOUS_INPUT`, `GENERAL_POLICY`, etc.), and edge-case table. If code and that document disagree, the document wins. The classifier (F1) is built with strict TDD, so any rule change needs:

1. A failing test first
2. The code change
3. An update to `data-classification.md` in the same PR or commit series
