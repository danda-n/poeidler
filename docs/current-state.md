# Current State

## Current systems
- Single-page React/Vite idle game with sidebar-gated Play, Upgrades, Maps, Prestige, and Talents views plus lightweight nav status badges for active maps, ready prestige, and affordable upgrades
- Core loop runs in `src/game/gameEngine.ts` with 100 ms ticks, derived-state resync, autosave every 5 s, and offline progress capped at 8 h
- Play screen stays focused on click generation, currencies/generators, manual conversion, teaser rows, and global map status
- Upgrades use compact category tabs, grouped sections, unlock requirements, affordability states, and now include encounter-focused map/atlas/relic layers
- Maps scale from current production, snapshot run reward power at start, support queued runs, streaks, device mods, and now add selectable Expedition, Ritual, and Delirium encounters with previewed risk/reward tradeoffs plus encounter specialization from rarity, affixes, content tags, and expedition chain routing
- Prestige and Talents now read encounter activity through encounter-map completion bonuses, encounter-specific cartography talents, and encounter-linked relic upgrades

## Known issues
- Repo rules say not to use default exports, but `src/App.tsx` and many components still export default
- Full `vite build` is still blocked in this environment by an `esbuild` spawn permission issue even though `tsc -b` passes
- Generator cost previews on the Play screen still show base costs rather than any future dynamic cost modifiers if those are added later

## Next 3 priorities
- Add deeper encounter variation through unique affixes, quality crafting, or map-family-specific encounter hooks instead of only universal map crafting
- Add a small reusable cost/effect preview layer so screen UIs can reflect dynamic upgrade modifiers consistently
- Balance encounter rewards, shard pacing, and prestige cadence against late-game generator growth, expedition chains, and queued-map scaling

## Files that matter most
- `src/game/maps.ts`
- `src/game/gameEngine.ts`
- `src/game/prestige.ts`
- `src/game/saveSystem.ts`
- `src/components/MapPanel.tsx`
