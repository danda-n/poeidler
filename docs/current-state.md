# Current State

## Current systems
- React 18 + TypeScript + Vite idle game uses a shell layout with a persistent top wealth bar, an expanded text-first sidebar, and clearer major screens for Home, Upgrades, Map Device, and Progress
- `GameState` remains the single source of truth, with `src/hooks/useGameEngine.ts` still wiring UI actions into pure game modules for currencies, generators, upgrades, maps, prestige, talents, and save/load
- Core loop in `src/game/gameEngine.ts` still ticks every 100 ms, recomputes derived state on each mutation, autosaves every 5 s, tracks map notifications, and grants offline progress capped at 8 h on load
- The Upgrades screen uses a category-based branching node board with lane/tier metadata from `src/game/upgradeTree.ts`, a visual connection graph, compact node labels, and a focused detail panel for purchasing
- The Map Device screen now follows a staged setup flow: choose the base map and encounter target, craft the map, socket categorized device mods, review reward and cost tradeoffs, then start or queue the run
- Device mods now have explicit categories (`reward`, `duration/risk`, `utility`, `special/synergy`) and richer metadata in `src/game/mapDevice.ts`, making them easier to scan and more extensible without changing save compatibility
- Progression still spans 11 currency tiers, manual adjacent-tier conversion, generator line scaling with owned-count milestones, wealth-aware map rewards, map unlocks, prestige resets, mirror-shard talents, and preserved save behavior

## Known issues
- There is still no test framework or lint setup, so regression coverage depends on manual checks plus `cmd /c npm run build`
- The repo still has several legacy default exports outside the files touched in this pass
- Talent branch icons are still placeholder glyphs in `src/game/talents.ts`
- Late-game balance still needs another dedicated pass now that generator milestones, wealth floors, map rewards, upgrade levers, and device tradeoffs all interact
- The Map Device is now much clearer, but the underlying device system is still a first-draft slot loadout rather than a fully persistent socketing or progression layer

## Next 3 priorities
- Add lightweight automated coverage around save/load, map completion and queue chaining, prestige payout math, and upgrade interaction math
- Continue late-game balance tuning for generator milestones, wealth-scaled map rewards, upgrade paths, and the new device-mod tradeoffs
- Keep breaking older one-file UI surfaces into cleaner screen-level components as more long-term systems are added

## Files that matter most
- `src/components/maps/MapPreparationPanel.tsx`
- `src/components/MapPanel.tsx`
- `src/game/mapDevice.ts`
- `src/game/maps.ts`
- `src/hooks/useGameEngine.ts`
