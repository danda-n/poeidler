# Current State

## Current systems
- React 18 + TypeScript + Vite idle game with Zustand store for state management
- `CurrencyId`, `GeneratorId`, `UpgradeId` are plain strings; content is data-driven via arrays in `src/game/`
- `src/game/registry.ts` provides centralized lookup helpers (`getCurrency`, `getGenerator`, `getBaseMap`, etc.) with runtime validation
- `src/store/gameStore.ts` composes 5 action slices from `src/store/slices/` (currency, economy, map, prestige, system); game loop and autosave run outside React
- `src/store/useGameStore.ts` exposes a selector-based React hook with `useShallow` for all selectors to prevent infinite re-render loops
- `src/game/gameEngine.ts` contains the pure tick function (`runGameTick`) and derived state sync (`synchronizeGameState`) with caching
- Tailwind CSS utilities in all components; design tokens in `src/styles/tailwind.css`; `styles.css` contains only global resets and keyframes
- All screen/panel components read from the Zustand store directly; `useAppViewModel` provides only page-level flags (unlocks, badges, prestige readiness)
- Responsive layout: sidebar collapses to a mobile drawer below `lg` breakpoint; UpgradePanel grid adapts from 1 to 3 columns; main content padding scales with screen size
- ESLint with typescript-eslint recommended rules; `npm run lint` checks `src/`
- Vitest covers core game logic (58 tests); `npm run test`
- The game simulation advances every 100 ms; display publishes on every tick via Zustand subscriptions
- MapPreparationPanel derived values (appliedMods, cost rows, summary rows) are memoized to avoid per-render recomputation

## Known issues
- Store actions are split into 5 slices; state shape is still flat (not nested by domain) which keeps `synchronizeGameState` and game tick simple
- Late-game balance needs a dedicated pass

## Next 3 priorities
- Late-game balance pass
- Expand test coverage to map completion, prestige payout, and upgrade interaction edge cases
- Consider adding pre-commit hook to run lint + type-check

## Files that matter most
- `src/store/gameStore.ts`
- `src/store/useGameStore.ts`
- `src/game/gameEngine.ts`
- `src/components/AppShell.tsx`
- `src/components/app/useAppViewModel.ts`
- `eslint.config.js`
