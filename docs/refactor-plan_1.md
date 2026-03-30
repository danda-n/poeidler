# refactor: Registry-based architecture with Zustand store and Tailwind CSS

## Quick summary of the phases:
Phase 1 (Commits 1–6): Registry pattern — Convert hardcoded type unions to string-keyed Records and centralize content lookups. After this phase, adding a new currency is a single-array-entry change.
Phase 2 (Commits 7–23): Zustand store — Replace useGameEngine with a Zustand store organized into 6 system slices. Components subscribe to only what they render. The game loop runs outside React entirely.
Phase 3 (Commits 24–33): Tailwind CSS — Migrate from the 3,610-line monolithic stylesheet to Tailwind utilities, component by component.
Phase 4 (Commits 34–36): Documentation — Update current-state.md, agent-rules.md, and CLAUDE.md to reflect the new architecture.
The highest-risk commits are 15 (map slice extraction, due to cross-system coupling), 18 (tick coordinator, replacing the core loop), and the Tailwind batch (visual regressions). I'd recommend manual playtesting at each of those checkpoints.


## Problem Statement

Adding new game content (currencies, maps, upgrades, encounters) requires shotgun edits across 6+ files because the architecture couples content definitions to infrastructure through hardcoded TypeScript union types and a monolithic state hook.

Specifically:
- **`CurrencyId` is a string literal union** used in 87+ locations across game logic and components. Adding one currency means editing the union, every `Record<CurrencyId, ...>` initial state, generators, upgrade costs, map rewards, and save hydration.
- **`useGameEngine` is a 378-line god hook** that defines all 11 action callbacks inline, mixes orchestration (ref management, autosave, deferred publishing) with domain logic (generator cost reduction, map bonus stacking), and forces a full React tree re-render on every state change because the entire `GameState` object is the single state atom.
- **`GameState` is a flat bag** with no system boundaries. `runGameTick` touches currencies, prestige, maps, and notifications in one function. Map completion directly mutates prestige state inline.
- **Derived state recomputation is ad-hoc.** The `syncCache` in gameEngine.ts helps, but affordability checks, upgrade visibility, and map previews recompute from scratch on every render cycle.
- **A single 3,610-line CSS file** makes styling changes error-prone and doesn't scale with new components.

The result: every new feature requires understanding the full dependency graph instead of working in an isolated system.

## Solution

Restructure the codebase around three architectural changes:

### 1. Runtime content registry (replace hardcoded unions)

Replace `CurrencyId` string literal union with a runtime registry pattern. Currency, generator, upgrade, and map definitions become data entries registered at startup. Types become `string`-keyed Records. Adding a new currency = adding one data entry to the registry array, not editing type unions across 6 files.

### 2. Zustand store with system slices (replace useGameEngine)

Replace the monolithic `useGameEngine` hook with a Zustand store organized into system slices:
- **Currency slice** — owns `currencies`, `currencyProduction`, `currencyMultipliers`, `unlockedCurrencies`, `clickMultiplier`
- **Generator slice** — owns `generatorsOwned`, exposes buy actions
- **Upgrade slice** — owns `purchasedUpgrades`, `unlockedFeatures`, exposes purchase actions
- **Map slice** — owns `activeMap`, `lastMapResult`, `queuedMap`, `mapNotification`, `mapDevice`, exposes map lifecycle actions
- **Prestige slice** — owns `prestige`, `talentsPurchased`, exposes prestige/talent actions
- **Settings slice** — owns `settings`, `lastSaveTime`, exposes save/reset actions

A central **tick coordinator** calls each system's tick handler in a defined order (currency production → map progress → notification cleanup). This keeps the tick sequence explicit and debuggable without over-formalizing a system registration protocol.

Components subscribe to only the slices they need via Zustand selectors. UpgradePanel re-renders only when `currencies` + `purchasedUpgrades` change, not when a map completes.

### 3. Tailwind CSS (replace monolithic stylesheet)

Replace `src/styles/styles.css` with Tailwind utility classes applied directly in components. This eliminates the single-file bottleneck, co-locates styling with markup, and scales naturally with new components.

## Commits

The implementation is broken into the smallest possible commits, each leaving the codebase in a building, working state. Commits are grouped into phases for clarity but each commit is independently valid.

---

### Phase 1: Foundation — Registry pattern for content definitions

**Commit 1: Convert CurrencyId from union to branded string type**
Change `CurrencyId` from a string literal union to `string` (or a branded `string & { __brand: 'CurrencyId' }` for discoverability). Update `CurrencyState`, `CurrencyProduction`, `CurrencyMultipliers`, and `UnlockedCurrencyState` to use `Record<string, number>` / `Record<string, boolean>`. Update all `as CurrencyId` casts to use the new type. Run `npm run build` to verify. No runtime behavior change.

**Commit 2: Make currency registration derive initial state automatically**
Move `initialCurrencies`, `initialCurrencyProduction`, `initialCurrencyMultipliers`, `initialUnlockedCurrencies` from manually-built reduce loops to functions that derive from the `currencies` array. This means adding a currency to the array automatically creates the right initial state entries. Verify build passes.

**Commit 3: Convert GeneratorId from const-derived union to string-keyed**
Same pattern as currencies. Change `GeneratorId` from `(typeof generators)[number]["id"]` to a plain string key. Update `GeneratorOwnedState` to `Record<string, number>`. Update `initialGeneratorsOwned` to derive from the array. Verify build.

**Commit 4: Convert UpgradeId and PurchasedUpgradeState to string-keyed**
Change `UpgradeId` to string. Update `PurchasedUpgradeState` to `Record<string, number>`. Update `initialPurchasedUpgrades` to derive from the upgrades array. Verify build.

**Commit 5: Create a content registry module**
Create `src/game/registry.ts` that exports a `GameRegistry` object holding the canonical currency, generator, upgrade, map, encounter, talent, and device mod arrays. Each game module still defines its own data array, but the registry re-exports them as the single lookup point. Add lookup helpers (`getCurrency(id)`, `getGenerator(id)`, etc.) with runtime validation that throws on unknown IDs during development. Verify build.

**Commit 6: Migrate all cross-module lookups to use registry helpers**
Replace direct array finds and map lookups (`currencyMap[id]`, `generatorMap[id]`, `baseMapMap[id]`) with registry helper calls. This centralizes the "does this ID exist?" validation. Verify build and manual playtest.

---

### Phase 2: Zustand store — state management overhaul

**Commit 7: Install Zustand**
`npm install zustand`. No code changes. Verify build.

**Commit 8: Create the store skeleton with a single monolithic slice**
Create `src/store/gameStore.ts` that wraps the existing `GameState` shape in a Zustand store. Expose `getState()` and `subscribe()`. Do not connect to React yet — this is infrastructure only. Export the store instance. Verify build.

**Commit 9: Wire the game tick loop to the Zustand store**
Move the `setInterval` game loop from `useGameEngine` into a `startGameLoop()` function that calls `gameStore.setState()` with the result of `runGameTick`. The loop reads from `gameStore.getState()` instead of a React ref. Verify build.

**Commit 10: Create a `useGameStore` hook with selector support**
Create `src/store/useGameStore.ts` that wraps `zustand`'s `useStore` with the game store instance. Components can now call `useGameStore(state => state.currencies)` to subscribe to a specific slice. Verify build.

**Commit 11: Migrate App.tsx to read from the Zustand store**
Replace `useGameEngine()` usage in `App.tsx` with `useGameStore` selectors. Keep the existing action callbacks temporarily wired through the store. The game should function identically. Verify build and manual playtest.

**Commit 12: Extract currency slice — state + actions**
Create `src/store/slices/currencySlice.ts`. Move currency-related state (`currencies`, `currencyProduction`, `currencyMultipliers`, `unlockedCurrencies`, `clickMultiplier`) and actions (`generateFragment`, `manualConvert`) into the slice. The slice defines its own state shape, initial state, and action creators. Wire into the main store via Zustand's slice pattern. Verify build.

**Commit 13: Extract generator slice — state + actions**
Create `src/store/slices/generatorSlice.ts`. Move `generatorsOwned` and `buyGenerator` action (including the buy-max logic currently inline in useGameEngine). Verify build.

**Commit 14: Extract upgrade slice — state + actions**
Create `src/store/slices/upgradeSlice.ts`. Move `purchasedUpgrades`, `unlockedFeatures`, and `buyUpgrade` action. Verify build.

**Commit 15: Extract map slice — state + actions**
Create `src/store/slices/mapSlice.ts`. Move `activeMap`, `lastMapResult`, `queuedMap`, `mapNotification`, `mapDevice` and all map actions (`startMap`, `queueMap`, `cancelQueue`, `craftMap`). This is the largest extraction because the map system currently reaches into prestige state on completion — handle this by having the map tick handler return a "completion event" that the tick coordinator forwards to the prestige slice. Verify build.

**Commit 16: Extract prestige slice — state + actions**
Create `src/store/slices/prestigeSlice.ts`. Move `prestige`, `talentsPurchased`, and actions (`prestige`, `purchaseTalent`). Add a `handleMapCompletion` method that the tick coordinator calls when the map slice signals a completed map. Verify build.

**Commit 17: Extract settings slice — state + actions**
Create `src/store/slices/settingsSlice.ts`. Move `settings`, `lastSaveTime`, autosave logic, and `resetSave`. Verify build.

**Commit 18: Implement the tick coordinator**
Create `src/store/tickCoordinator.ts`. Replace the monolithic `runGameTick` with a coordinator that calls each slice's tick handler in sequence: (1) synchronize derived values, (2) apply passive currency generation, (3) advance map progress and handle completion events, (4) update prestige from map events, (5) clean up expired notifications. Each step operates on the store's current state. Verify build and manual playtest thoroughly.

**Commit 19: Delete useGameEngine.ts**
Remove the old hook entirely. All consumers now use the Zustand store. Verify build.

**Commit 20: Migrate all components to use store selectors**
Go through each component and replace prop-drilled `gameState` fields with targeted `useGameStore` selectors. This is a file-by-file sweep: CurrencyScreen, UpgradePanel, MapsScreen, ProgressScreen, ActiveMapBanner, TopStatusStrip, MapToast, Sidebar. Each component subscribes only to the state it renders. Verify build after each file.

**Commit 21: Simplify App.tsx prop drilling**
With components subscribing to their own state, App.tsx no longer needs to thread `gameState` and `actions` through props. Simplify it to just layout orchestration and page routing. Verify build.

**Commit 22: Move derived state computations into Zustand middleware or selectors**
Replace the `syncCache` pattern in `gameEngine.ts` with Zustand's `subscribeWithSelector` middleware. Derived values (multipliers, production rates, unlock states) recompute only when their input slices change, with automatic memoization. Remove the manual cache. Verify build and playtest.

**Commit 23: Optimize the display sync cadence**
Replace the manual `DISPLAY_SYNC_INTERVAL_MS` throttle (currently 200ms with `startTransition`) with Zustand's built-in batching. Since components now subscribe to specific slices, passive generation ticks only re-render currency displays, not the entire tree. Remove the `lastPublishedAtRef` machinery. Verify build and performance.

---

### Phase 3: Tailwind CSS migration

**Commit 24: Install and configure Tailwind CSS**
`npm install -D tailwindcss @tailwindcss/vite`. Configure `vite.config.ts` to include the Tailwind plugin. Create `tailwind.config.ts` with content paths pointing to `src/**/*.{tsx,ts}`. Add `@import "tailwindcss"` to the main CSS entry point. Add a Tailwind-based CSS reset. Verify build — existing styles should still work since they're in a separate CSS file.

**Commit 25: Define the design token layer in Tailwind config**
Extract the existing color palette, spacing scale, and typography from `styles.css` into Tailwind's `theme.extend` configuration. Map the current CSS custom properties (if any) to Tailwind theme tokens. This creates the bridge between old and new styling. Verify build.

**Commit 26: Migrate layout components to Tailwind (AppShell, GameLayout, Sidebar)**
Convert the shell/layout CSS classes to Tailwind utilities. These components have the most structural CSS and the least visual complexity, making them safe first targets. Remove the corresponding CSS blocks from `styles.css`. Verify build and visual check.

**Commit 27: Migrate TopStatusStrip and WealthBar to Tailwind**
Convert the top bar components. These are small, self-contained, and visible on every page — good for catching visual regressions early. Remove old CSS. Verify.

**Commit 28: Migrate CurrencyPanel, CurrencyRow, ClickPanel to Tailwind**
Convert the currency screen components. Verify.

**Commit 29: Migrate UpgradePanel and OtherUpgradesBar to Tailwind**
Convert the upgrade screen. This is one of the largest component CSS surfaces. Pay attention to the affordability styling and category tab states. Remove old CSS. Verify.

**Commit 30: Migrate MapPanel, MapPreparationPanel, MapRunStatus, MapBaseSelector to Tailwind**
Convert the maps screen components. Verify.

**Commit 31: Migrate PrestigePanel, TalentPanel, ProgressScreen to Tailwind**
Convert the progress screen components. Verify.

**Commit 32: Migrate remaining components (ActiveMapBanner, MapToast, FoldablePanel, Tooltip, InfoIcon, SettingsPanel, MysteryRow, ManualConversionRow) to Tailwind**
Sweep all remaining components. Verify.

**Commit 33: Delete styles.css**
Remove the now-empty monolithic stylesheet. Update any remaining CSS imports. Verify build and full visual regression check.

---

### Phase 4: Cleanup and documentation

**Commit 34: Update docs/current-state.md**
Rewrite the current state document to reflect the new architecture: Zustand store with slices, registry pattern, Tailwind CSS, tick coordinator. Update the "files that matter most" section. Update known issues and next priorities.

**Commit 35: Update docs/agent-rules.md**
Add architectural rules: how to add a new currency (registry entry only), how to add a new game system (create a slice, wire into tick coordinator), styling convention (Tailwind utilities, no CSS files).

**Commit 36: Update CLAUDE.md**
Reflect the new project structure and conventions.

## Decision Document

### State management
- **Zustand** replaces the monolithic `useGameEngine` hook and React `useState`/`useRef` machinery
- Store is organized into system slices (currency, generator, upgrade, map, prestige, settings)
- Components subscribe to specific slices via selectors, eliminating full-tree re-renders
- The game tick loop runs outside React, calling `store.setState()` directly
- Derived values (multipliers, production rates) are computed via memoized selectors or Zustand middleware, replacing the manual `syncCache`

### Content extensibility
- `CurrencyId`, `GeneratorId`, `UpgradeId` become plain strings (not union types)
- All content types (currencies, generators, upgrades, maps, encounters, talents, device mods) are data arrays registered in a central `GameRegistry`
- Lookup helpers (`getCurrency(id)`, `getGenerator(id)`) provide runtime validation
- Adding new content = adding an entry to the appropriate data array; no type edits, no multi-file changes

### System boundaries
- Each game system owns its state slice and actions
- Cross-system communication happens through the tick coordinator via "events" (e.g., map completion triggers prestige update)
- Systems do not directly import or mutate other systems' state
- The tick coordinator defines the execution order explicitly

### Styling
- Tailwind CSS replaces the monolithic `styles.css`
- Design tokens (colors, spacing, typography) live in `tailwind.config.ts`
- Components use utility classes directly; no separate CSS files per component
- The existing dark color scheme and visual identity are preserved through theme configuration

### Module structure after refactor
- `src/game/registry.ts` — content registry and lookup helpers
- `src/game/currencies.ts` — currency definitions and pure functions
- `src/game/generators.ts` — generator definitions and pure functions
- `src/game/upgradeEngine.ts` — upgrade definitions, effects, and pure functions
- `src/game/maps.ts` — map definitions, crafting, completion logic
- `src/game/prestige.ts` — prestige calculation and reset logic
- `src/game/talents.ts` — talent definitions and bonus calculations
- `src/game/mapDevice.ts` — device mod definitions and loadout logic
- `src/game/mapAffixes.ts` — affix definitions and rolling logic
- `src/game/conversionEngine.ts` — currency conversion logic
- `src/store/gameStore.ts` — Zustand store composition
- `src/store/useGameStore.ts` — React hook for store access
- `src/store/tickCoordinator.ts` — game loop and cross-system tick orchestration
- `src/store/slices/currencySlice.ts` — currency state + actions
- `src/store/slices/generatorSlice.ts` — generator state + actions
- `src/store/slices/upgradeSlice.ts` — upgrade state + actions
- `src/store/slices/mapSlice.ts` — map lifecycle state + actions
- `src/store/slices/prestigeSlice.ts` — prestige/talent state + actions
- `src/store/slices/settingsSlice.ts` — settings/save state + actions

### Save system
- Save format will change (string-keyed Records instead of union-keyed)
- Existing saves are not migrated — a save reset is acceptable
- Save/load logic moves into the settings slice
- Offline progress calculation stays in `saveSystem.ts` but reads from the store

## Testing Decisions

Testing is explicitly out of scope for this refactor. It will be addressed as a separate follow-up effort. However, the refactored architecture is designed to be highly testable:

- Pure game logic modules (`src/game/*`) remain free of React imports and side effects — trivially unit-testable
- Zustand slices can be tested by creating isolated store instances and asserting state transitions
- The tick coordinator can be tested by mocking system tick handlers
- The registry pattern enables property-based testing (register random content, verify system invariants)

## Out of Scope

- **New game content** — no new currencies, maps, encounters, or upgrades added during refactor
- **Balance tuning** — all numeric values preserved exactly as-is
- **Save migration** — existing saves will not load after the refactor; a reset is acceptable
- **Test framework setup** — deferred to a dedicated follow-up
- **Linter setup** — deferred to a dedicated follow-up
- **Build system changes** — Vite config stays the same (aside from Tailwind plugin)
- **Performance profiling** — the architectural changes should improve performance by design (selective re-rendering, memoized derived state), but formal profiling is a separate effort

## Further Notes

### Migration risk mitigation
Each commit is designed to be independently buildable and playtestable. The highest-risk commits are:
- **Commit 15 (map slice extraction)** — the map system has the deepest cross-system coupling (map completion → prestige update → queue chain). The "completion event" pattern handles this but needs careful manual testing.
- **Commit 18 (tick coordinator)** — replaces the core game loop. Test by comparing currency production rates, map completion timing, and prestige shard calculations before and after.
- **Commits 26-33 (Tailwind migration)** — visual regressions are the main risk. Each commit should be visually inspected on all four screens (Currency, Upgrades, Maps, Progress).

### Recommended branch strategy
Work on a single `refactor/zustand-registry-tailwind` branch. Commits within each phase can be squash-merged if the intermediate states aren't valuable for git history. Phases themselves should land as separate merge commits for easy revert if needed.

### Why Zustand over alternatives
- **vs Redux**: Zustand is 1.2KB vs Redux Toolkit's 11KB. The slice pattern is equivalent but with less ceremony. No action type strings, no reducers, no provider wrapper.
- **vs Jotai/Recoil**: Atom-based stores work bottom-up; this game needs top-down tick orchestration where systems update in sequence. Zustand's single-store model fits better.
- **vs custom store**: Would mean reimplementing subscription management, shallow equality, and middleware — exactly what Zustand provides out of the box.
- **vs keeping React state**: The fundamental problem is that `useState` forces re-renders at the component that owns the state (App.tsx in this case), and there's no built-in selector mechanism. Zustand solves this directly.
