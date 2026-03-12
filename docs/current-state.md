# Current State

## Current systems
- React 18 + TypeScript + Vite idle game now uses screen-level composition for Currency, Upgrades, Maps, and Progress, with shared shell header/page-header layout pieces in `src/components/layout/`
- Root-level view state for page unlocks, page badges, top status strip data, and page copy now lives in `src/components/app/useAppViewModel.ts`, keeping `src/App.tsx` focused on shell wiring and active-screen selection
- `GameState` remains the single source of truth, with `src/hooks/useGameEngine.ts` still wiring UI actions into pure game modules for currencies, generators, upgrades, maps, prestige, talents, and save/load
- The game simulation still advances every 100 ms in `src/game/gameEngine.ts`, but `src/hooks/useGameEngine.ts` now publishes display state to React on a slower 200 ms cadence during passive ticking while still syncing user-triggered actions immediately
- The upgrade screen now splits cached static tree structure in `src/game/upgradeTree.ts` from live affordability/state in `src/components/UpgradePanel.tsx`, so node layout, grid templates, and edge geometry are no longer rebuilt from every economy update
- Upgrade tree rendering now uses memoized node cards, lightweight edge-tone updates, and containment on the heavy tree/focus regions to reduce rerender cost and improve scroll smoothness on the densest screen
- Progression still spans 11 currency tiers, manual adjacent-tier conversion, generator line scaling with owned-count milestones, wealth-aware map rewards, map unlocks, prestige resets, mirror-shard talents, and preserved save behavior

## Known issues
- There is still no test framework or lint setup, so regression coverage depends on manual checks plus `cmd /c npm run build`
- The repo still has several legacy default exports outside the files touched in these passes
- Talent branch icons are still placeholder glyphs in `src/game/talents.ts`
- Late-game balance still needs another dedicated pass now that generator milestones, wealth floors, map rewards, upgrade levers, and device tradeoffs all interact
- Other economy-heavy views still derive some summaries directly from live currency and production objects, so the next likely hotspots after the upgrade screen are broader list-style stash views rather than the tree itself

## Next 3 priorities
- Add lightweight automated coverage around save/load, map completion and queue chaining, prestige payout math, and upgrade interaction math
- Profile the currency/stash views and any remaining fast-changing summaries now that the upgrade tree is less coupled to passive economy updates
- Continue converting remaining legacy UI pieces to named-export, alias-import screen/component modules so the new shell and screen boundaries stay consistent

## Files that matter most
- `src/components/UpgradePanel.tsx`
- `src/game/upgradeTree.ts`
- `src/App.tsx`
- `src/components/app/useAppViewModel.ts`
- `src/hooks/useGameEngine.ts`
