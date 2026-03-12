# Current State

## Current systems
- Single-page React 18 + TypeScript + Vite idle game with sidebar-gated Play, Upgrades, Maps, Prestige, and Talents views plus nav badges for affordable upgrades, atlas status, and prestige readiness
- `GameState` remains the single source of truth, with `src/hooks/useGameEngine.ts` wiring UI actions into pure game modules for currencies, generators, upgrades, maps, prestige, talents, and save/load
- Core loop in `src/game/gameEngine.ts` ticks every 100 ms, recomputes derived state on each mutation, autosaves every 5 s, tracks map notifications, and grants offline progress capped at 8 h on load
- Progression now spans 11 currency tiers, manual adjacent-tier conversion, generator line scaling with owned-count milestones, generator cost reduction hooks, wealth-aware map rewards, map unlocks, prestige resets, and mirror-shard talent spend
- Map rewards now scale from both live production and current stash value, so runs stay relevant deeper into the economy instead of flattening into trivial payouts
- Upgrade progression is split across generators, economy, maps, automation, atlas, and relic categories, with stronger non-flat levers like generator discounts, map speed, and map cost reduction layered alongside reward scaling
- Maps are visible outside the map tab through the global atlas banner, while the map screen itself is broken into reusable base-selection, run-status, and preparation sections for clearer flow

## Known issues
- There is still no test framework or lint setup, so regression coverage depends on manual checks plus `cmd /c npx tsc -b`
- The repo still has several legacy default exports outside the files touched in this pass
- Talent branch icons are still placeholder glyphs in `src/game/talents.ts`
- Late-game balance still needs another dedicated pass now that generator milestones, wealth floors, and new upgrade levers all interact
- `cmd /c npm run build` succeeds here when run with elevated permissions, but plain sandboxed builds can still hit `esbuild` `spawn EPERM`

## Next 3 priorities
- Add lightweight automated coverage around save/load, map completion and queue chaining, prestige payout math, and upgrade interaction math
- Continue late-game balance tuning for the new generator milestones, wealth-scaled map rewards, and cost-reduction upgrades
- Keep trimming legacy UI defaults and older one-file components so the remaining screens match the newer component boundaries

## Files that matter most
- `src/game/gameEngine.ts`
- `src/game/maps.ts`
- `src/game/upgradeEngine.ts`
- `src/hooks/useGameEngine.ts`
- `src/components/MapPanel.tsx`
