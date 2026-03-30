# Current State

## Current systems
- React 18 + TypeScript + Vite idle game with Zustand store for state management
- `CurrencyId`, `GeneratorId`, `UpgradeId` are plain strings; content is data-driven via arrays in `src/game/`
- `src/game/registry.ts` provides centralized lookup helpers (`getCurrency`, `getGenerator`, `getBaseMap`, etc.) with runtime validation
- `src/store/gameStore.ts` holds all game state and actions; game loop and autosave run outside React via `startStoreGameLoop()` / `startStoreAutosave()`
- `src/store/useGameStore.ts` exposes a selector-based React hook for components
- `src/game/gameEngine.ts` contains the pure tick function (`runGameTick`) and derived state sync (`synchronizeGameState`) with caching
- Tailwind CSS is installed alongside the existing `styles.css`; design tokens live in `src/styles/tailwind.css`; layout shell uses Tailwind utilities, other components still use CSS classes
- Screen-level composition for Currency, Upgrades, Maps, and Progress with shared shell layout in `src/components/layout/`
- Root-level view state in `src/components/app/useAppViewModel.ts` with throttled badge computation (1 s cadence)
- The game simulation advances every 100 ms; display publishes on every tick via Zustand subscriptions

## Known issues
- No test framework or lint setup; regression coverage depends on manual checks plus `npm run build`
- Tailwind migration is partial: layout shell migrated, component-level styles remain in `styles.css`
- Components still receive state via props from App.tsx; per-component store selectors not yet implemented
- Zustand store is monolithic (not split into slices); works correctly but slice extraction would improve code organization
- Late-game balance needs a dedicated pass
- Talent branch icons are still placeholder glyphs

## Next 3 priorities
- Continue Tailwind CSS migration component by component (TopStatusStrip, CurrencyPanel, UpgradePanel, MapPanel, etc.)
- Extract Zustand store into system slices (currency, generator, upgrade, map, prestige, settings) for better separation
- Add lightweight automated test coverage around core game logic

## Files that matter most
- `src/store/gameStore.ts`
- `src/store/useGameStore.ts`
- `src/game/gameEngine.ts`
- `src/game/registry.ts`
- `src/styles/tailwind.css`
- `src/App.tsx`
