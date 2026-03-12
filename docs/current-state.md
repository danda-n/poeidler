# Current State

## Current systems
- React 18 + TypeScript + Vite idle game now uses screen-level composition for Currency, Upgrades, Maps, and Progress, with shared shell header/page-header layout pieces in `src/components/layout/`
- Root-level view state for page unlocks, page badges, top status strip data, and page copy now lives in `src/components/app/useAppViewModel.ts`, keeping `src/App.tsx` focused on shell wiring and active-screen selection
- `GameState` remains the single source of truth, with `src/hooks/useGameEngine.ts` still wiring UI actions into pure game modules for currencies, generators, upgrades, maps, prestige, talents, and save/load
- The game simulation still advances every 100 ms in `src/game/gameEngine.ts`, but `src/hooks/useGameEngine.ts` now publishes display state to React on a slower 200 ms cadence during passive ticking while still syncing user-triggered actions immediately
- The Currency screen owns the core loop, stash, unlock teasers, and manual conversion flow; the Maps screen owns atlas summary plus the staged map-prep workflow; the Progress screen composes dedicated prestige and talent sections
- Render pressure is now reduced by combining stable action callbacks, extracted root selectors, memoized shell-adjacent UI, and deferred passive display publishing so the whole app no longer repaints on every simulation tick
- Progression still spans 11 currency tiers, manual adjacent-tier conversion, generator line scaling with owned-count milestones, wealth-aware map rewards, map unlocks, prestige resets, mirror-shard talents, and preserved save behavior

## Known issues
- There is still no test framework or lint setup, so regression coverage depends on manual checks plus `cmd /c npm run build`
- The repo still has several legacy default exports outside the files touched in these passes
- Talent branch icons are still placeholder glyphs in `src/game/talents.ts`
- Late-game balance still needs another dedicated pass now that generator milestones, wealth floors, map rewards, upgrade levers, and device tradeoffs all interact
- The upgrade tree still recomputes graph layout and affordability-driven presentation from fast-changing economy state, so it remains a likely future hotspot if upgrade-screen scrolling or interaction starts to feel heavy

## Next 3 priorities
- Add lightweight automated coverage around save/load, map completion and queue chaining, prestige payout math, and upgrade interaction math
- Profile the upgrade screen and other remaining fast-changing economy views now that root-level render pressure is lower
- Continue converting remaining legacy UI pieces to named-export, alias-import screen/component modules so the new shell and screen boundaries stay consistent

## Files that matter most
- `src/App.tsx`
- `src/components/app/useAppViewModel.ts`
- `src/components/MapPanel.tsx`
- `src/components/screens/CurrencyScreen.tsx`
- `src/hooks/useGameEngine.ts`
