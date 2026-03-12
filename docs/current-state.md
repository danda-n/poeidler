# Current State

## Current systems
- React 18 + TypeScript + Vite idle game uses a shell layout with a persistent top wealth bar, an expanded text-first sidebar, and clearer major screens for Home, Upgrades, Map Device, and Progress
- `GameState` remains the single source of truth, with `src/hooks/useGameEngine.ts` still wiring UI actions into pure game modules for currencies, generators, upgrades, maps, prestige, talents, and save/load
- Core loop in `src/game/gameEngine.ts` still ticks every 100 ms, recomputes derived state on each mutation, autosaves every 5 s, tracks map notifications, and grants offline progress capped at 8 h on load
- The Upgrades screen now uses a category-based branching node board with lane/tier metadata from `src/game/upgradeTree.ts`, a visual connection graph, compact node labels, and a focused detail panel for purchasing
- Progression still spans 11 currency tiers, manual adjacent-tier conversion, generator line scaling with owned-count milestones, wealth-aware map rewards, map unlocks, prestige resets, mirror-shard talents, and preserved save behavior
- Prestige and talents still share the Progress screen, while maps stay isolated in the Map Device screen and unlocked currencies with meaningful amounts or income stay visible in the wealth bar

## Known issues
- There is still no test framework or lint setup, so regression coverage depends on manual checks plus `cmd /c npm run build`
- The repo still has several legacy default exports outside the files touched in this pass
- Talent branch icons are still placeholder glyphs in `src/game/talents.ts`
- Late-game balance still needs another dedicated pass now that generator milestones, wealth floors, map rewards, and upgrade levers all interact
- The upgrade tree is a structured first pass with explicit tiers, lanes, and visual parent links, but it is still a guided branching board rather than a fully freeform passive-web editor

## Next 3 priorities
- Add lightweight automated coverage around save/load, map completion and queue chaining, prestige payout math, and upgrade interaction math
- Continue late-game balance tuning for the generator milestones, wealth-scaled map rewards, and the now-more-visible upgrade paths
- Keep breaking older one-file UI surfaces into cleaner screen-level components as more long-term systems are added

## Files that matter most
- `src/components/UpgradePanel.tsx`
- `src/game/upgradeTree.ts`
- `src/game/upgradeEngine.ts`
- `src/App.tsx`
- `src/hooks/useGameEngine.ts`
