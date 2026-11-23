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
