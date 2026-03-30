# Refactor Plan — 2026-03-30

## Status Snapshot

| Area | Progress | Notes |
|------|----------|-------|
| Test infrastructure | Done | Vitest installed, 58 tests across 5 files |
| Tailwind migration | Done | All components use Tailwind utilities |
| styles.css cleanup | Done | Pruned from 4,258 to 70 lines (globals + keyframes only); CSS bundle 93→40 KB |
| Store slicing | Done | 5 slices in src/store/slices/, composed in gameStore.ts (85 lines) |
| Per-component selectors | Done | Selectors in src/store/selectors/; screens read from store directly |

## Phase 1 — Safety Net (test infrastructure)

**Goal:** Add Vitest and cover core game logic so later refactors don't silently break things.

1. Install `vitest` + `@testing-library/react` (dev deps)
2. Add `"test"` script to `package.json`
3. Write tests for the highest-risk pure functions:
   - `src/game/gameEngine.ts` — `runGameTick`, `synchronizeGameState`, `calculateCurrencyProduction`
   - `src/game/currencies.ts` — conversion logic
   - `src/game/upgradeEngine.ts` — cost calculations, effect application
   - `src/game/prestige.ts` — shard calculation, reset
   - `src/game/maps.ts` — map completion, reward resolution
4. Verify: `npm test` passes, covers the critical calculation paths

## Phase 2 — Tailwind Migration (component-by-component)

**Goal:** Replace legacy CSS classes with Tailwind utilities using existing design tokens in `src/styles/tailwind.css`.

Migration order (leaf-first, smallest-first):

### Batch A — Quick wins (tiny leaf components)
- `InfoIcon.tsx` (14 lines, 1 class)
- `Tooltip.tsx` (15 lines, 2 classes)
- `FoldablePanel.tsx` (21 lines, 4 classes)
- `GameLayout.tsx` (11 lines, 1 class)
- `ShellPageHeader.tsx` (16 lines, 4 classes)

### Batch B — Small leaf components
- `TopStatusStrip.tsx` (50 lines, 10 classes)
- `ManualConversionRow.tsx` (32 lines, 4 classes)
- `MysteryRow.tsx` (35 lines, 7 classes)
- `CurrencyRow.tsx` (51 lines, 10 classes)
- `ClickPanel.tsx` (36 lines, 6 classes)

### Batch C — Medium components
- `CurrencyPanel.tsx` (82 lines, 1 class + children from Batch B)
- `MapToast.tsx` (40 lines, 10 classes)
- `WealthBar.tsx` (49 lines, 12 classes)
- `ActiveMapBanner.tsx` (93 lines, 11 classes)
- `SettingsPanel.tsx` (52 lines, 8 classes)
- `Sidebar.tsx` (77 lines, 12 classes)
- `MapBaseSelector.tsx` (42 lines, 10 classes)

### Batch D — Large components
- `MapRunStatus.tsx` (107 lines, 23 classes)
- `OtherUpgradesBar.tsx` (105 lines, 15 classes)
- `PrestigePanel.tsx` (120 lines, 26 classes)
- `TalentPanel.tsx` (85 lines, 23 classes)

### Batch E — Screen wrappers
- `CurrencyScreen.tsx` (189 lines, 16 classes)
- `MapsScreen.tsx` (59 lines, 13 classes)
- `ProgressScreen.tsx` (77 lines, 11 classes)
- `PrestigeScreen.tsx` (25 lines, 5 classes)
- `TalentsScreen.tsx` (30 lines, 5 classes)

### Batch F — Heaviest components
- `MapPanel.tsx` (270 lines, 7 classes)
- `MapPreparationPanel.tsx` (433 lines, 50+ classes)
- `UpgradePanel.tsx` (499 lines, 60+ classes)

After each batch: `npm run build` to verify, then prune corresponding dead CSS from `styles.css`.

## Phase 3 — Store Slicing

**Goal:** Split the monolithic Zustand store into domain slices for better separation.

### Identified slices

| Slice | State properties | Actions |
|-------|-----------------|---------|
| currency | `currencies`, `currencyProduction`, `currencyMultipliers`, `clickMultiplier` | `generateFragment`, `manualConvert` |
| economy | `generatorsOwned`, `purchasedUpgrades` | `buyUpgrade`, `buyGenerator` |
| maps | `activeMap`, `lastMapResult`, `queuedMap`, `mapNotification`, `mapDevice` | `craftMap`, `startMap`, `queueMap`, `cancelQueue` |
| prestige | `prestige`, `talentsPurchased` | `prestige`, `purchaseTalent` |
| system | `unlockedFeatures`, `unlockedCurrencies`, `settings`, `lastSaveTime` | `resetSave` |

### Steps
1. Create `src/store/slices/` directory
2. Extract each slice as a Zustand slice creator function
3. Compose slices back into the root store
4. Keep `synchronizeGameState` calls in the root store (cross-slice concern)
5. Ensure game loop and autosave continue to work against the composed store
6. Verify: `npm test` + `npm run build` + manual play-through

## Phase 4 — Per-Component Selectors

**Goal:** Components read from the store directly instead of receiving props from App.tsx.

### Steps
1. Create domain selector hooks in `src/store/selectors/` (e.g., `useCurrencies()`, `useMapState()`, `usePrestige()`)
2. Migrate components bottom-up: replace props with selector hooks
3. Simplify App.tsx — remove prop-drilling, keep only view routing
4. Verify: no re-render regressions (React DevTools profiler), `npm run build`

## Phase 5 — Cleanup

- Delete `src/styles/styles.css` once fully migrated
- Remove unused type exports and dead code surfaced during migration
- Final `npm run build` + manual smoke test

## Verification Checklist (after each phase)

- [ ] `npm run build` succeeds
- [ ] `npm test` passes (Phase 1+)
- [ ] Manual play-through: currency gen, upgrades, maps, prestige cycle
- [ ] No visual regressions (dark theme preserved)
- [ ] No console errors
