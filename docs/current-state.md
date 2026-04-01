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
- **ResourceBar**: compact pills showing top 5 currencies (highest tier + actively producing), hover for details
- **FooterBar**: contextual — shows active map timer, hidden when idle
- **ProductionView**: AD-style compact horizontal rows (ClickRow + GeneratorRows) with buy 1/10/max toggle, max-width 700px centered
- **UpgradePanel**: smart queue showing 6-9 most relevant upgrades as cards (affordable first, cheapest), "show all" expandable list grouped by category
- **MapsScreen**: compact stats header + visual MapDevice centered with accordion stems (Encounter/Craft/Mods), MapBasePicker cards, MapRunStatus inline
- **ProgressView**: Prestige/Talents sub-tabs; full-screen prestige overlay for first 5 resets
- **TalentPanel**: interactive SVG node graph with 13 talent nodes across 3 branches (cartography/economy/reflection), connection lines, click-to-purchase
- **SettingsPanel**: full CenterStage view with save info, version, reset
- Design principle: data over prose — labels, numbers, controls only; show less, mean more
- ESLint with typescript-eslint recommended rules; Vitest covers core game logic (58 tests)
- The game simulation advances every 100 ms; display publishes on every tick via Zustand subscriptions

## Known issues
- Store actions split into 5 slices; state shape still flat (not nested by domain)
- Late-game balance needs a dedicated pass
- Talent node graph positions are hardcoded; may need tuning for visual balance
- Conversion system removed from UI but store action (`manualConvert`) still exists

## Next 3 priorities
- Late-game balance pass
- Visual polish pass on production rows, map device, and talent graph (proper icons, hover states, animations)
- Expand test coverage to map completion, prestige payout, and upgrade interaction edge cases

## Files that matter most
- `src/components/layout/NewAppShell.tsx`
- `src/components/layout/NavRail.tsx`
- `src/components/layout/ResourceBar.tsx`
- `src/components/production/ProductionView.tsx`
- `src/components/UpgradePanel.tsx`
- `src/components/MapPanel.tsx`
- `src/components/TalentPanel.tsx`
- `src/components/talents/TalentGraph.tsx`
- `src/components/talents/talentLayout.ts`
- `src/components/app/useAppViewModel.ts`
- `src/store/gameStore.ts`
