# Current State

## Current systems
- React 18 + TypeScript + Vite idle game uses screen-level composition for Currency, Upgrades, Maps, and Progress, with shared shell header/page-header layout pieces in `src/components/layout/`
- Root-level view state for page unlocks, page badges, top status strip data, and page copy lives in `src/components/app/useAppViewModel.ts`, while `src/App.tsx` now also owns smooth page-to-page scroll resets through the shared shell main-scroll ref
- `GameState` remains the single source of truth, with `src/hooks/useGameEngine.ts` wiring UI actions into pure game modules for currencies, generators, upgrades, maps, prestige, talents, and save/load
- The game simulation still advances every 100 ms in `src/game/gameEngine.ts`, but passive display publishes in `src/hooks/useGameEngine.ts` now stay on the 200 ms cadence and are pushed through `startTransition` so scrolling/input stays responsive while user-triggered actions still sync immediately
- Upgrade tree rendering still uses cached static structure in `src/game/upgradeTree.ts` and memoized runtime cards in `src/components/UpgradePanel.tsx`, while the broader shell/list screens now also use scroll-container hints plus selective containment/content-visibility in `src/styles/styles.css`
- Currency stash rows and base-map selection now follow the repo alias-import/named-export rules in `src/components/CurrencyPanel.tsx`, `src/components/CurrencyRow.tsx`, and `src/components/maps/MapBaseSelector.tsx`, reducing per-render closure churn on the busiest list views
- Progression still spans 11 currency tiers, manual adjacent-tier conversion, generator line scaling with owned-count milestones, wealth-aware map rewards, map unlocks, prestige resets, mirror-shard talents, and preserved save behavior

## Known issues
- There is still no test framework or lint setup, so regression coverage depends on manual checks plus `cmd /c npm run build`
- The repo still has several legacy default exports outside the files touched in these passes
- Talent branch icons are still placeholder glyphs in `src/game/talents.ts`
- Late-game balance still needs another dedicated pass now that generator milestones, wealth floors, map rewards, upgrade levers, and device tradeoffs all interact
- Some page-level derived view models still rebuild from live economy state on each published tick, so the next likely optimization pass after these scroll/render-priority changes is further memoization or selector splitting in shared view-model code

## Next 3 priorities
- Add lightweight automated coverage around save/load, map completion and queue chaining, prestige payout math, and upgrade interaction math
- Profile the remaining page-level derived view models and high-frequency stash summaries now that passive engine publishes are lower priority and scroll containers have browser hints
- Continue converting remaining legacy UI pieces to named-export, alias-import screen/component modules so the new shell and screen boundaries stay consistent

## Files that matter most
- `src/hooks/useGameEngine.ts`
- `src/App.tsx`
- `src/components/AppShell.tsx`
- `src/components/CurrencyPanel.tsx`
- `src/styles/styles.css`
