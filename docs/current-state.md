# Current State

## Current systems
- React 18 + TypeScript + Vite idle game with Zustand store for state management
- `CurrencyId`, `GeneratorId`, `UpgradeId` are plain strings; content is data-driven via arrays in `src/game/`
- `src/game/registry.ts` provides centralized lookup helpers (`getCurrency`, `getGenerator`, `getBaseMap`, etc.) with runtime validation
- `src/store/gameStore.ts` composes 5 action slices from `src/store/slices/` (currency, economy, map, prestige, system); game loop and autosave run outside React
- `src/store/useGameStore.ts` exposes a selector-based React hook for components
- `src/game/gameEngine.ts` contains the pure tick function (`runGameTick`) and derived state sync (`synchronizeGameState`) with caching
- Tailwind CSS utilities in all components; design tokens in `src/styles/tailwind.css`; `styles.css` contains global resets and keyframes
- **UI layout**: 3-zone shell (ResourceBar top, NavRail left + CenterStage, FooterBar bottom) — no page-level scrolling
- **NavRail**: 48px icon-only rail (desktop) / bottom tab bar (mobile), progressive unlock with pop-in animation, badge dots
- **ResourceBar**: persistent currency display, top 3 producers show inline rates, adaptive compression
- **FooterBar**: contextual — shows active map timer, hidden when idle
- **ProductionView**: card-based generator grid (2-3 cols) with buy 1/10/max toggle, click card, conversion strip
- **UpgradePanel**: category tabs + upgrade list (internal scroll) + detail panel, no flavor text
- **MapsScreen**: compact stats header + scrollable MapPanel
- **ProgressView**: Prestige/Talents sub-tabs; full-screen prestige overlay for first 5 resets
- **SettingsPanel**: full CenterStage view with save info, version, reset
- Design principle: data over prose — labels, numbers, controls only; no explanatory sentences
- ESLint with typescript-eslint recommended rules; Vitest covers core game logic (58 tests)
- The game simulation advances every 100 ms; display publishes on every tick via Zustand subscriptions

## Known issues
- Store actions split into 5 slices; state shape still flat (not nested by domain)
- Late-game balance needs a dedicated pass
- MapPreparationPanel is the tallest single component; may need further internal sectioning on small viewports

## Next 3 priorities
- Late-game balance pass
- Expand test coverage to map completion, prestige payout, and upgrade interaction edge cases
- Visual polish pass on generator cards and nav rail (proper icons, hover states, responsive grid tuning)

## Files that matter most
- `src/components/layout/NewAppShell.tsx`
- `src/components/layout/NavRail.tsx`
- `src/components/layout/ResourceBar.tsx`
- `src/components/production/ProductionView.tsx`
- `src/components/app/useAppViewModel.ts`
- `src/store/gameStore.ts`
