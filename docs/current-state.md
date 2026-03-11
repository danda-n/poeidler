# Current State

## Current systems
- Single-page React/Vite idle game with sidebar-gated Currency, Upgrades, Maps, Prestige, and Talents views
- Core loop runs in `src/game/gameEngine.ts` with 100 ms ticks, derived-state resync, autosave every 5 s, and offline progress capped at 8 h
- Currency screen stays focused on the active loop: click generation, currencies/generators, manual conversion, teaser rows, and global map status
- Upgrades live in their own top-level screen using grouped foldable categories and the existing upgrade progression rules
- Maps now scale from current production value per second, snapshot reward power at run start, support affix/device modifiers, queue the next run, and surface global active/completion status
- Crafted map data now carries tier, rarity, quality, affixes, and content tags to prepare for future map expansion

## Known issues
- Repo rules say not to use default exports, but `src/App.tsx` and many components still export default
- Full `vite build` is still blocked in this environment by an `esbuild` spawn permission issue even though `tsc -b` passes
- Atlas and relic upgrade categories are only first-pass scaffolding; deeper progression hooks are still thin

## Next 3 priorities
- Expand map crafting beyond rarity/affixes by adding real quality/content mechanics and more modifier families
- Add more upgrades for atlas, relics, and automation so all categories carry meaningful progression instead of placeholders
- Balance the new production-scaled map formulas against late-game generator growth and prestige pacing

## Files that matter most
- `src/App.tsx`
- `src/components/Sidebar.tsx`
- `src/components/UpgradePanel.tsx`
- `src/game/maps.ts`
- `src/game/upgradeEngine.ts`
