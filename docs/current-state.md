# Current State

## Current systems
- React 18 + TypeScript + Vite idle game now uses a shell layout with a persistent top wealth bar, an expanded text-first sidebar, and clearer major screens for Home, Upgrades, Map Device, and Progress
- `GameState` remains the single source of truth, with `src/hooks/useGameEngine.ts` still wiring UI actions into pure game modules for currencies, generators, upgrades, maps, prestige, talents, and save/load
- Core loop in `src/game/gameEngine.ts` still ticks every 100 ms, recomputes derived state on each mutation, autosaves every 5 s, tracks map notifications, and grants offline progress capped at 8 h on load
- Home now focuses on the click loop, stash, next unlocks, and manual conversion, while long-term systems are split into dedicated screens so adding future systems does not keep bloating one page
- Progression still spans 11 currency tiers, manual adjacent-tier conversion, generator line scaling with owned-count milestones, wealth-aware map rewards, map unlocks, prestige resets, mirror-shard talents, and preserved save behavior
- Prestige and talents now share the Progress screen, while maps stay isolated in the Map Device screen and unlocked currencies with meaningful amounts or income stay visible in the wealth bar

## Known issues
- There is still no test framework or lint setup, so regression coverage depends on manual checks plus `cmd /c npm run build`
- The repo still has several legacy default exports outside the files touched in this pass
- Talent branch icons are still placeholder glyphs in `src/game/talents.ts`
- Late-game balance still needs another dedicated pass now that generator milestones, wealth floors, map rewards, and upgrade levers all interact
- The wealth bar intentionally caps visible currencies for readability, so very wide late-game inventories roll extra unlocked currencies into a `+N more unlocked` summary chip

## Next 3 priorities
- Add lightweight automated coverage around save/load, map completion and queue chaining, prestige payout math, and upgrade interaction math
- Continue late-game balance tuning for the generator milestones, wealth-scaled map rewards, and cost-reduction upgrades
- Keep breaking older one-file UI surfaces into cleaner screen-level components as more long-term systems are added

## Files that matter most
- `src/App.tsx`
- `src/components/AppShell.tsx`
- `src/components/Sidebar.tsx`
- `src/components/WealthBar.tsx`
- `src/hooks/useGameEngine.ts`
