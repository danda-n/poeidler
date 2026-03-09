# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

- `npm run dev` — Start Vite dev server (usually port 5173)
- `npm run build` — TypeScript check (`tsc -b`) then Vite production build to `./dist`
- `npm run preview` — Serve production build locally

No test framework is configured. No linter is configured.

## Deployment

Pushes to `master` auto-deploy to GitHub Pages via `.github/workflows/deploy-pages.yml`. The site is served at `/poeidler/` (configured in `vite.config.ts` base path).

## Architecture

React 18 + TypeScript 5.6 + Vite 5.4 idle/incremental game themed around Path of Exile currency.

### Game Logic (`src/game/`) — Pure TypeScript, zero React dependencies

- **gameEngine.ts** — Core loop: `runGameTick()` runs every 100ms via `setInterval`, calls `synchronizeGameState()` to derive computed state (multipliers, production rates, unlocks) from core state, then applies passive generation and auto-conversion.
- **currencies.ts** — 10-tier currency definitions (`as const` tuples → derived types), conversion ratios (must be integers via `getConversionRatio`), unlock thresholds, formatting (`formatCurrencyValue` with K/M/B/T suffixes).
- **generators.ts** — Generator definitions with exponential cost scaling (`baseCost * costMultiplier^owned`). Tiers 1-3 cost fragments, tiers 4-10 cost previous tier's currency. `generatorByCurrency` provides O(1) lookup.
- **upgradeEngine.ts** — Upgrade system with three effect types: `percentProduction`, `percentClickPower`, `unlockFeature`. Breakpoint bonuses (x2 every 25 levels). `getClickPower()` scales click value with production rate (0.3 coefficient).
- **conversionEngine.ts** — Currency conversion and auto-conversion logic.
- **saveSystem.ts** — LocalStorage persistence with offline progress (max 8 hours). Auto-saves on interval + beforeunload.

### State Pattern

Immutable state with reducer-style updates. `GameState` is the single source of truth. `synchronizeGameState()` re-derives all computed fields (production rates, multipliers, unlocks) from core state — call it after any mutation.

### UI Layer (`src/components/`) — React components

- **App.tsx** — Progressive disclosure orchestrator. Computes visibility flags (`showCurrencyList`, `showTeasers`, `showConversions`, `showUpgrades`) from game state. Sections appear as the player progresses.
- **ClickPanel.tsx** — Central click button + fragment counter (always visible).
- **CurrencyPanel.tsx / CurrencyRow.tsx** — Unlocked currencies with integrated generator buy buttons.
- **MysteryRow.tsx** — Locked currency teasers with scrambled names and progress bars.
- **UpgradePanel.tsx** — All upgrades in one panel with category pill tabs.
- **ConversionPanel.tsx** — Manual conversion buttons (visible after autoConversion unlocked).
- **SettingsPanel.tsx** — Gear icon dropdown with version and reset.
- **useGameEngine.ts** — Central hook managing state, tick loop, save/load, and all player actions.

### Key Design Decisions

- All game logic is testable without React — `src/game/` has no React imports.
- Currency IDs and generator IDs are derived from `as const` tuple definitions, providing type safety without manual union types.
- Progressive disclosure: UI sections appear based on game state milestones, with mystery teasers for next 2 locked currencies.
- Single centered column layout (max 720px) with minimalistic dark theme.
