# Current State

## Current systems
- Single-page React/Vite idle game with sidebar-gated Play, Upgrades, Maps, Prestige, and Talents views plus lightweight nav status badges for active maps, ready prestige, and affordable upgrades
- Core loop runs in `src/game/gameEngine.ts` with 100 ms ticks, derived-state resync, autosave every 5 s, and offline progress capped at 8 h
- Play screen stays focused on click generation, currencies/generators, manual conversion, teaser rows, and global map status
- Upgrades now use compact category tabs, grouped sections, unlock requirements, affordability states, and deeper automation/atlas/relic layers instead of first-pass placeholders
- Maps scale from current production value per second, snapshot reward power at run start, and now pick up queued-run, streak, tier, and shard-linked upgrade bonuses
- Prestige rewards, manual conversion, and queued maps all hook into upgrade progression through shared game-logic helpers

## Known issues
- Repo rules say not to use default exports, but `src/App.tsx` and many components still export default
- Full `vite build` is still blocked in this environment by an `esbuild` spawn permission issue even though `tsc -b` passes
- Generator cost previews on the Play screen still show base costs rather than any future dynamic cost modifiers if those are added later

## Next 3 priorities
- Add more map/content mechanics so atlas and relic upgrades unlock richer choices than pure multiplier routing
- Add a small reusable cost/effect preview layer so screen UIs can reflect dynamic upgrade modifiers consistently
- Balance the new upgrade chains and shard-linked bonuses against late-game generator growth and prestige pacing

## Files that matter most
- `src/App.tsx`
- `src/components/Sidebar.tsx`
- `src/components/UpgradePanel.tsx`
- `src/game/upgradeEngine.ts`
- `src/game/gameEngine.ts`
