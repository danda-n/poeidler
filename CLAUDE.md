# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Build & Dev

- `npm run dev` — start Vite dev server
- `npm run build` — type-check and production build
- `npm run preview` — serve production build locally

No test framework is configured.
No linter is configured.

## Deployment

Pushes to `master` auto-deploy to GitHub Pages via `.github/workflows/deploy-pages.yml`.

- Base path: `/poeidler/`
- Check `vite.config.ts` before changing paths or asset URLs

## Architecture

Stack:
- React 18
- TypeScript
- Vite

Project type:
- Idle / incremental game themed around Path of Exile currency

Code structure:
- `src/game/` — pure game logic, no React imports
- `src/components/` — React UI
- `src/hooks/useGameEngine.ts` — connects UI and game engine
- `src/game/saveSystem.ts` — persistence and offline progress

State rules:
- `GameState` is the single source of truth
- Keep state updates predictable and reducer-like
- Recompute derived values after mutations instead of storing duplicated truth
- Keep game logic in `src/game/`, not inside React components

Design rules:
- Prefer extending existing systems over adding one-off logic
- Keep currency, generator, upgrade, and conversion systems scalable
- Preserve progressive disclosure in the UI
- Keep the layout simple and readable in a single main column unless there is a strong reason to change it
- When starting a task, read only files relevant to the task and avoid scanning the full repository unless needed

## Git

Use short-lived branches and merge back frequently.

Branch naming:
- `<type>/<short-description>`
- optional ticket id if available

Commit format:
- Conventional Commits
- `<type>(ticket-id-optional): <short description>`
Types:
- feat — new feature
- fix — bug fix
- chore — maintenance, dependency updates, config changes
- refactor — code change that neither fixes a bug nor adds a feature
- docs — documentation only
- test — adding or updating tests
- ci — CI/CD configuration changes

## Project State Handoff

Maintain `docs/current-state.md` as a compact handoff document.

Update it only when a meaningful implementation step changes the current project state, known issues, priorities, or key files.

Structure:
- Current systems
- Known issues
- Next 3 priorities
- Files that matter most

Rules:
- Use short bullet points only
- Keep current truth only
- Replace stale content instead of appending history
- Do not duplicate stable rules already covered in `CLAUDE.md`
- Keep the file compact and easy to scan
- Keep `Files that matter most` limited to the few files most relevant to current work

## Do Not

- Do not write JavaScript, use TypeScript only
- Do not use default exports for components or hooks
- Do not use relative `../../` imports, use `@/*`
- Do not add `eslint-disable` without explaining why
- Do not leave `console.log` in committed code
- Do not hardcode env-specific values
- Do not install a package before checking if the project already covers the need