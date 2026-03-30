# Current State

## Current systems
- React 18 + TypeScript + Vite idle game with Zustand store for state management
- `CurrencyId`, `GeneratorId`, `UpgradeId` are plain strings; content is data-driven via arrays in `src/game/`
- `src/game/registry.ts` provides centralized lookup helpers (`getCurrency`, `getGenerator`, `getBaseMap`, etc.) with runtime validation
- `src/store/gameStore.ts` composes 5 action slices from `src/store/slices/` (currency, economy, map, prestige, system); game loop and autosave run outside React
- `src/store/useGameStore.ts` exposes a selector-based React hook for components
- `src/game/gameEngine.ts` contains the pure tick function (`runGameTick`) and derived state sync (`synchronizeGameState`) with caching
- Tailwind CSS utilities in all components; design tokens in `src/styles/tailwind.css`; `styles.css` contains only global resets and keyframes (70 lines)
- Screen-level composition for Currency, Upgrades, Maps, and Progress with shared shell layout in `src/components/layout/`
- Root-level view state in `src/components/app/useAppViewModel.ts` with throttled badge computation (1 s cadence)
- The game simulation advances every 100 ms; display publishes on every tick via Zustand subscriptions

## Known issues
- Vitest covers core game logic (58 tests); no lint setup yet
- TopStatusStrip and Sidebar still receive props (view-model data from useAppViewModel); all other screen/panel components read from the store directly
- Store actions are split into 5 slices; state shape is still flat (not nested by domain) which keeps `synchronizeGameState` and game tick simple
- Late-game balance needs a dedicated pass
- Talent branch icons are still placeholder glyphs

## Next 3 priorities
- Add responsive breakpoints via Tailwind (the old media queries were pruned with styles.css)
- Late-game balance pass
- Migrate TopStatusStrip to read from store (last prop-heavy component)

## Files that matter most
- `src/store/gameStore.ts`
- `src/store/useGameStore.ts`
- `src/game/gameEngine.ts`
- `src/game/registry.ts`
- `src/styles/tailwind.css`
- `src/App.tsx`
