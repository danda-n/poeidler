# Current State

## Current systems
- Single-page React 18 + TypeScript + Vite idle game with sidebar-gated Play, Upgrades, Maps, Prestige, and Talents views plus nav badges for affordable upgrades, live maps, queued maps, and prestige readiness
- `GameState` remains the single source of truth, with `src/hooks/useGameEngine.ts` wiring UI actions into pure game modules for currencies, generators, upgrades, maps, prestige, talents, and save/load
- Core loop in `src/game/gameEngine.ts` ticks every 100 ms, recomputes derived state on each mutation, autosaves every 5 s, tracks map notifications, and grants offline progress capped at 8 h on load
- Progression now spans 11 currency tiers, manual adjacent-tier conversion, scalable generator costs, upgrade breakpoints, map unlocks, prestige resets, and mirror-shard talent spend
- Maps are the biggest complexity area: base maps scale from current production, crafted rarity/affixes alter cost-duration-reward-shard math, encounters specialize runs, device loadouts add per-run modifiers, and one queued follow-up run can inherit separate queued bonuses
- Upgrade progression is now split across generators, economy, maps, automation, atlas, and relic categories, with requirements tied to currencies, map count, prestige count, shard totals, and upgrade chains
- Prestige and talent systems are tightly coupled to map play through map-count bonuses, encounter-map bonuses, lingering low-tier carryover, encounter prestige scaling, and shard-fed live map upgrades

## Known issues
- Repo rules say not to use default exports, but `src/App.tsx` and many UI components still export default
- `cmd /c npm run build` still fails in this environment with `esbuild` `spawn EPERM` while `cmd /c npx tsc -b` passes
- There is still no test framework or lint setup, so regression coverage depends on manual checks
- `src/components/MapPanel.tsx` has become a dense all-in-one screen that owns map selection, encounter routing, crafting, device loadouts, previews, queueing, and result display in one component
- Talent branch icons are still placeholder glyphs in `src/game/talents.ts`

## Next 3 priorities
- Break map prep UI into smaller reusable pieces so loadout, encounter, crafting, and reward-preview logic are easier to reason about and extend
- Balance the now-intertwined map, encounter, queue, shard, prestige, and talent loops against late-game generator growth
- Add lightweight automated coverage around save/load, map completion and queue chaining, prestige payout math, and upgrade/talent bonus interactions

## Files that matter most
- `src/game/maps.ts`
- `src/game/gameEngine.ts`
- `src/game/upgradeEngine.ts`
- `src/game/saveSystem.ts`
- `src/components/MapPanel.tsx`
