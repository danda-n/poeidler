# Current State

## Current systems
- React 18 + TypeScript + Vite idle game uses screen-level composition for Currency, Upgrades, Maps, and Progress, with shared shell header/page-header layout pieces in `src/components/layout/`
- Root-level view state in `src/components/app/useAppViewModel.ts` is split into granular memos (flags, topStripState, pageMeta, unlockedPages) with throttled affordable-upgrade badge computation (1 s cadence)
- `GameState` remains the single source of truth, with `src/hooks/useGameEngine.ts` wiring UI actions into pure game modules for currencies, generators, upgrades, maps, prestige, talents, and save/load
- The game simulation advances every 100 ms in `src/game/gameEngine.ts`; `synchronizeGameState` now caches derived values (multipliers, production, unlocks) via reference-equality checks on `purchasedUpgrades`, `generatorsOwned`, and `talentsPurchased`, so the expensive recomputation only runs when those inputs actually change
- Passive display publishes stay on the 200 ms cadence pushed through `startTransition`; user-triggered actions still sync immediately
- The Upgrades screen in `src/components/UpgradePanel.tsx` splits structural row data (recomputed only on purchase) from affordability enrichment (recomputed only for the active category), with throttled category stats; the component is wrapped in `React.memo`
- `FoldablePanel` uses CSS `display: none` instead of conditional rendering to avoid mount/unmount cycles
- MapPanel progress timer runs at 500 ms instead of 100 ms to reduce re-renders during active maps
- CSS transitions on `.upgrade-node` and `.upgrade-category-button` are limited to `background-color` and `border-color` to reduce paint thrashing on scroll
- Repository stats refresh into `README.MD` through `npm run gitstats`, powered by `scripts/gitstats.ps1`

## Known issues
- There is still no test framework or lint setup, so regression coverage depends on manual checks plus `npm run build`
- The repo still has several legacy default exports outside the files touched in these passes
- Talent branch icons are still placeholder glyphs in `src/game/talents.ts`
- Late-game balance still needs another dedicated pass now that generator milestones, wealth floors, map rewards, upgrade levers, and device tradeoffs all interact
- Throttled badge/stat computations (1 s) may feel slightly stale in edge cases — acceptable for now

## Next 3 priorities
- Add lightweight automated coverage around save/load, map completion and queue chaining, prestige payout math, and upgrade interaction math
- Profile remaining UI hotspots: MapPreparationPanel device-mod grid (unvirtualized), large upgrade lists, and sticky-layout paint cost in UpgradePanel
- Decide whether the README stats refresh should stay manual or move into a repo automation path once the format stabilizes

## Files that matter most
- `src/game/gameEngine.ts`
- `src/components/app/useAppViewModel.ts`
- `src/components/UpgradePanel.tsx`
- `src/components/MapPanel.tsx`
- `src/components/FoldablePanel.tsx`
