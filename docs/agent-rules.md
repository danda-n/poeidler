# Agent Rules

Shared project rules for repository agents.

## Build & Dev

- `npm run dev` - start Vite dev server
- `npm run build` - type-check and production build
- `npm run preview` - serve production build locally
- No test framework is configured
- No linter is configured

## Deployment

- Pushes to `master` auto-deploy to GitHub Pages via `.github/workflows/deploy-pages.yml`
- Base path: `/poeidler/`
- Check `vite.config.ts` before changing paths or asset URLs

## Architecture

Stack:
- React 18
- TypeScript
- Vite
- Zustand (state management)
- Tailwind CSS (alongside legacy `styles.css`)

Project type:
- Idle / incremental game themed around Path of Exile currency

Code structure:
- `src/game/` - pure game logic, no React imports
- `src/game/registry.ts` - centralized content registry with lookup helpers
- `src/store/gameStore.ts` - Zustand store with all game state and actions
- `src/store/useGameStore.ts` - React hook for store access with selectors
- `src/components/` - React UI
- `src/game/saveSystem.ts` - persistence and offline progress

State rules:
- Zustand store is the single source of truth (replaces the old `useGameEngine` hook)
- Game loop runs outside React via `startStoreGameLoop()`, calling `runGameTick` every 100ms
- Components read state via `useGameStore(selector)` (currently through App.tsx props)
- Keep state updates predictable; use `synchronizeGameState` after mutations to recompute derived values
- Keep game logic in `src/game/`, not inside React components or the store

Content extensibility:
- `CurrencyId`, `GeneratorId`, `UpgradeId` are plain `string` types
- Content is defined as data arrays in `src/game/` modules (currencies, generators, upgrades, maps, talents, etc.)
- Initial state derives automatically from the data arrays
- Adding new content = adding an entry to the appropriate data array
- Use registry helpers (`getCurrency(id)`, `getGenerator(id)`, `getBaseMap(id)`) for cross-module lookups

Styling:
- Tailwind CSS utilities for new and migrated components
- Design tokens (colors, spacing) in `src/styles/tailwind.css` `@theme` block
- Legacy component styles in `src/styles/styles.css` (being migrated incrementally)
- Preserve the dark color scheme and visual identity

Design rules:
- Prefer extending existing systems over adding one-off logic
- Keep currency, generator, upgrade, and conversion systems scalable
- Preserve progressive disclosure in the UI
- Keep the layout simple and readable in a single main column unless there is a strong reason to change it

## Git

- Use short-lived branches and merge back frequently

Branch naming:
- `<type>/<short-description>`
- Optional ticket id if available

Commit format:
- Conventional Commits
- `<type>(ticket-id-optional): <short description>`

Types:
- `feat` - new feature
- `fix` - bug fix
- `chore` - maintenance, dependency updates, config changes
- `refactor` - code change that neither fixes a bug nor adds a feature
- `docs` - documentation only
- `test` - adding or updating tests
- `ci` - CI/CD configuration changes

## Project State Handoff

Use `docs/current-state.md` as the shared compact handoff document.

Update it only when a meaningful implementation step changes:
- Current systems
- Known issues
- Next 3 priorities
- Files that matter most

Handoff rules:
- Short bullet points only
- Current truth only
- Replace stale content instead of appending history
- Do not duplicate stable rules from this file
- Keep it compact and easy to scan
- Keep `Files that matter most` limited to the few files most relevant to current work

## Do Not

- Do not write JavaScript, use TypeScript only
- Do not use default exports for components or hooks
- Do not use relative `../../` imports, use `@/*`
- Do not add `eslint-disable` without explaining why
- Do not leave `console.log` in committed code
- Do not hardcode env-specific values
- Do not install a package before checking if the project already covers the need
