# Current State

## Current systems
- React 18 + TypeScript + Vite idle game now uses screen-level composition for Currency, Upgrades, Maps, and Progress, with shared shell header/page-header layout pieces in `src/components/layout/`
- The old large wealth bar has been replaced by a compact top status strip that keeps stash value, value per second, and a few priority currencies visible without dominating vertical space
- `GameState` remains the single source of truth, with `src/hooks/useGameEngine.ts` still wiring UI actions into pure game modules for currencies, generators, upgrades, maps, prestige, talents, and save/load
- The Currency screen now owns the core loop, stash, unlock teasers, and manual conversion flow; the Maps screen owns atlas summary plus the staged map-prep workflow; the Progress screen composes dedicated prestige and talent sections
- Render pressure was reduced by stabilizing action callbacks in `src/hooks/useGameEngine.ts`, memoizing shell-adjacent UI like the sidebar/banner/status strip, and moving heavier map preview derivation behind `useMemo` in `src/components/MapPanel.tsx`
- Core loop in `src/game/gameEngine.ts` still ticks every 100 ms, recomputes derived state on each mutation, autosaves every 5 s, tracks map notifications, and grants offline progress capped at 8 h on load
- Progression still spans 11 currency tiers, manual adjacent-tier conversion, generator line scaling with owned-count milestones, wealth-aware map rewards, map unlocks, prestige resets, mirror-shard talents, and preserved save behavior

## Known issues
- There is still no test framework or lint setup, so regression coverage depends on manual checks plus `cmd /c npm run build`
- The repo still has several legacy default exports outside the files touched in this pass
- Talent branch icons are still placeholder glyphs in `src/game/talents.ts`
- Late-game balance still needs another dedicated pass now that generator milestones, wealth floors, map rewards, upgrade levers, and device tradeoffs all interact
- The map device flow is clearer and cheaper to render, but the underlying device system is still a first-draft slot loadout rather than a fully persistent socketing or progression layer

## Next 3 priorities
- Add lightweight automated coverage around save/load, map completion and queue chaining, prestige payout math, and upgrade interaction math
- Continue late-game balance tuning now that the UI architecture is cleaner and render costs are lower
- Keep converting remaining legacy UI pieces to named-export, alias-import screen/component modules so the new shell and screen boundaries stay consistent

## Files that matter most
- `src/App.tsx`
- `src/components/screens/CurrencyScreen.tsx`
- `src/components/screens/MapsScreen.tsx`
- `src/components/MapPanel.tsx`
- `src/hooks/useGameEngine.ts`
