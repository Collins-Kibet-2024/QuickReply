# Session Notes

## Session 0 — Nov 22, 2026
- Initialized git repo and npm project
- Added .gitignore to protect .env (API key) and raw data
- Created folder structure (docs, data/handbook, src, tests, public)
- Pushed to GitHub
- Note: first attempt pasted .gitignore contents into terminal by mistake; fixed with heredoc

## Session 1 — Nov 22, 2026

**`/init` baseline**
- Ran `/init` to generate the first `CLAUDE.md` from the PRD and data classification policy (no app code existed yet)
- Flagged a conflict: the generic `~/Desktop/AGENTS.md` describes React + Vite + Tailwind + Supabase; the PRD specifies Express + static HTML + vanilla JS. `CLAUDE.md` follows the PRD
- Added a root `AGENTS.md` that points other agents to `CLAUDE.md`
- Installed Express and Vitest; set `test` (`vitest run`) and `test:watch` scripts; updated the Commands section to match

**Refinement prompt**
- Asked Claude to refine `CLAUDE.md` to cover: project overview with `@docs/PRD.md` and `@docs/data-classification.md` imports, tech stack, architecture decisions, folder structure, coding conventions, testing strategy, commit conventions, do's and don'ts, and context management
- Result: the imports replaced the tier and reason-code details copied in earlier, and Claude proposed a target folder layout (`src/app.js` builds the app with an injected `llmClient`; `src/server.js` is the only place the real Anthropic client is created). Added an AC-based test naming convention and `(red)`/`(green)`/`(refactor)` commit labels

**After reviewing the diff**
- Accepted Claude's proposed folder layout and AC-based test naming
- Resolved conflicts with `~/Desktop/AGENTS.md` in favor of the refinement prompt: tests go in `tests/` (not colocated), and commits use plain conventional commits (no required issue number)
- The ES-modules convention required `"type": "module"` in `package.json`; committed that separately (`chore: switch package to ES modules`) so the docs and config match

**Permissions setup**
- Added `.claude/settings.json`:
  - Allow: `npm test`, `npx vitest`, `npm install`, read-only git commands, `git add`/`git commit`, and edits under `src/`, `tests/`, `public/`
  - Deny: reading `.env`, `.env.*`, and `data/raw/**`; `git push`
- Verified: the deny rule blocked Claude's `git push` right away, so pushes are done manually
- Open gap: `Read` deny rules don't stop shell reads like `cat .env`; consider Bash deny patterns or the sandbox

## Session 2 — Nov 23, 2026

**F1 safety fixes before F2**
- Explored the classifier, tests, and handbook before starting F2. Running the policy doc's examples through the classifier found two unsafe results:
  - "Why is Dan on leave?" was `PUBLIC` because of the `leave` keyword, so it would have reached the LLM
  - "What's my salary compared to Jen's?" was `PERSONAL` because the first matching rule (`SELF_RECORD`) won
- Pulled AC1.7 forward and part of AC1.2, using TDD (red → green):
  - The classifier now checks every rule; the most restrictive tier wins, and `reasons` lists only the winning tier's codes
  - New `MEDICAL_ACCOMMODATION` rule covers another person being on leave or FMLA, or having an accommodation
  - The generic compensation rule skips "my salary"; a separate rule catches comparisons ("vs", "compared to", "than")
- Updated the PRD (AC status), `data-classification.md` (how reasons work with multiple matches), and the CLAUDE.md status line

**Decisions**
- Broadening the PUBLIC keywords is deferred. Expense, PTO-accrual, and 401(k) questions still classify as `RESTRICTED`, so those handbook sections can't be answered yet
- `redactPII` starts as a no-op stub when F2 wires it in; the real version comes with AC1.5
