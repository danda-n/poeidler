# Current State

## Current systems
- React 18 + TypeScript + Vite idle game uses screen-level composition for Currency, Upgrades, Maps, and Progress, with shared shell header/page-header layout pieces in `src/components/layout/`
- Root-level view state for page unlocks, page badges, top status strip data, and page copy lives in `src/components/app/useAppViewModel.ts`, while `src/App.tsx` now also assigns wide shell content width to management screens so Upgrades, Maps, and Progress can use the available horizontal space
- `GameState` remains the single source of truth, with `src/hooks/useGameEngine.ts` wiring UI actions into pure game modules for currencies, generators, upgrades, maps, prestige, talents, and save/load
- The game simulation still advances every 100 ms in `src/game/gameEngine.ts`, but passive display publishes in `src/hooks/useGameEngine.ts` now stay on the 200 ms cadence and are pushed through `startTransition` so scrolling/input stays responsive while user-triggered actions still sync immediately
- The Upgrades screen now uses a category rail, grouped progression rows, and a details panel in `src/components/UpgradePanel.tsx`, keeping upgrade data, costs, and prerequisites intact while replacing the old dependency-line tree presentation
- Repository stats for commits, contributors, tracked source lines, largest files, and recent history now refresh into `README.MD` through `npm run gitstats`, powered by `scripts/gitstats.ps1`

## Known issues
- There is still no test framework or lint setup, so regression coverage depends on manual checks plus `cmd /c npm run build`
- The repo still has several legacy default exports outside the files touched in these passes
- Talent branch icons are still placeholder glyphs in `src/game/talents.ts`
- Late-game balance still needs another dedicated pass now that generator milestones, wealth floors, map rewards, upgrade levers, and device tradeoffs all interact
- The README stats are generated from the local checkout history, so they need `npm run gitstats` rerun after meaningful git history changes before committing updates

## Next 3 priorities
- Add lightweight automated coverage around save/load, map completion and queue chaining, prestige payout math, and upgrade interaction math
- Profile the remaining page-level derived view models and high-frequency stash summaries now that passive engine publishes are lower priority and major management screens are wider by default
- Decide whether the README stats refresh should stay manual or move into a repo automation path once the format stabilizes

## Files that matter most
- `README.MD`
- `scripts/gitstats.ps1`
- `package.json`
- `src/components/UpgradePanel.tsx`
- `src/styles/styles.css`
