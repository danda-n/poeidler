# Current State

## Current systems
- React 18 + TypeScript + Vite idle game with Zustand store for state management
- `CurrencyId`, `GeneratorId`, `UpgradeId` are plain strings; content is data-driven via arrays in `src/game/`
- `src/game/registry.ts` provides centralized lookup helpers (`getCurrency`, `getGenerator`, `getBaseMap`, etc.) with runtime validation
- `src/store/gameStore.ts` composes 6 action slices from `src/store/slices/` (currency, economy, map, prestige, system, quest); game loop and autosave run outside React
- `src/store/useGameStore.ts` exposes a selector-based React hook for components
- `src/game/gameEngine.ts` contains the pure tick function (`runGameTick`) and derived state sync (`synchronizeGameState`) with caching; also evaluates quest progress and passive map fragment drops each tick
- Tailwind CSS utilities in all components; design tokens in `src/styles/tailwind.css`; `styles.css` contains global resets and keyframes
- Responsive root font-size: `clamp(15px, 1.05vw, 20px)` — scales from 15px at ~1430px width to 20px at 1920px+; all component font sizes use rem to scale with root
- **UI layout**: 4-zone shell (ResourceBar top, QuestBar, NavRail left + CenterStage, FooterBar bottom) — no page-level scrolling; `h-screen overflow-hidden` root
- **Quest system**: 7 data-driven quests (`src/game/quests.ts`) guide first 10 minutes; quest bar persistent between ResourceBar and content; quest log overlay shows completed/active/upcoming/hidden quests; quest completion toast (gold) and map fragment DING toast (purple); quest rewards: auto-generators, permanent click bonus, permanent generator speed, map fragments, feature unlocks
- **Map Fragments**: collectible resource (not a currency) gating map device access; primary source = quest rewards; secondary source = passive generator drops (~0.05%/s after first fragment); shown as purple indicator in ResourceBar; 3 fragments needed for first map run
- **Quest-gated unlocks**: Upgrade tab unlocks via "Reach 10 Fragment/s" quest (fallback: any generator owned); Map Device unlocks via "Collect 3 Map Fragments" quest (fallback: alteration currency unlocked)
- **NavRail**: 48px icon-only rail (desktop `lg+`) / bottom tab bar (mobile `<lg`), progressive unlock with pop-in animation, badge dots with 3 tones (active/ready/alert)
- **ResourceBar**: compact pills showing top 5 currencies + map fragment count (purple accent when >0); hover for details
- **FooterBar**: contextual — shows active map timer with progress bar, hidden when idle; slide-up animation on appear
- **ProductionView**: AD-style compact horizontal rows (ClickRow + GeneratorRows) with buy 1/10/max toggle, max-width 800px centered; generator milestone glow (4 levels at 10/25/50/100 owned) with next milestone indicator; ghost row teaser for next locked generator (??? + current/target production rate)
- **UpgradePanel**: smart queue showing 6-9 most relevant upgrades as compact cards (affordable first, cheapest first), "show all" toggle reveals full categorized list as simple rows; no detail panel, no category tabs in default view
- **MapsScreen**: compact stats header + visual MapDevice centered with 3 accordion stems (Encounter/Craft/Mods); MapBasePicker as horizontal card row; MapRunStatus inline; max-width 600px centered
- **ProgressView**: Prestige/Talents sub-tabs; full-screen prestige overlay for first 5 resets
- **TalentPanel**: interactive SVG node graph with 13 talent nodes (110x48px) across 3 color-coded branches (cartography=gold, economy=cyan, reflection=purple); SVG connection lines (dashed when locked, solid when active); click-to-purchase; hover tooltip shows name, description, cost
- **SettingsPanel**: full CenterStage view with save info, version, reset button
- **Currency identity**: each currency has a `purpose` field (Fragment="Basic economy", Transmutation="Craft upgrades", Augmentation="Enhance generators", Alteration="Reroll map mods", etc.)
- Design principles: data over prose (labels, numbers, controls only); show less, mean more; every minute should have a goal
- ESLint with typescript-eslint recommended rules; Vitest covers core game logic (58 tests)
- The game simulation advances every 100 ms; display publishes on every tick via Zustand subscriptions
- Conversion system removed from UI (ConversionStrip, ManualConversionRow deleted); store action `manualConvert` still exists but unused

## Known issues
- Store actions split into 6 slices; state shape still flat (not nested by domain)
- Late-game balance needs a dedicated pass
- Talent node positions are hardcoded in `talentLayout.ts`; may need tuning for visual balance on different screen sizes
- `manualConvert` store action is dead code (UI removed); should be cleaned up if conversion is permanently gone
- `getVisibleAdjacentConversions`, `getConversionRatio`, `scrambleName` in `currencies.ts` are now unused
- Currency `purpose` field is defined but not yet surfaced in UI (planned: show on first unlock as tooltip/toast)
- Quest system only covers first 10 minutes (7 quests); needs expansion for mid/late game

## Next 3 priorities
- Playtest and tune the first-session flow (quest timing, reward values, fragment drop rates)
- Currency purpose surfacing in UI (unlock toast or tooltip showing what each orb does)
- Late-game balance pass and quest expansion beyond the initial 7

## Files that matter most
- `src/game/quests.ts` — quest definitions, conditions, rewards, evaluation logic
- `src/game/gameEngine.ts` — tick loop, quest evaluation, fragment drops, state sync
- `src/game/saveSystem.ts` — save/load with quest state and map fragment migration
- `src/store/slices/questSlice.ts` — quest actions (dismiss notification)
- `src/store/gameStore.ts` — 6-slice Zustand store composition
- `src/components/quest/QuestBar.tsx` — persistent quest progress bar
- `src/components/quest/QuestLog.tsx` — quest log overlay (portal)
- `src/components/quest/QuestToast.tsx` — quest completion notification
- `src/components/quest/FragmentToast.tsx` — map fragment DING notification
- `src/components/layout/NewAppShell.tsx` — 4-zone shell (ResourceBar + QuestBar + content + Footer)
- `src/components/layout/ResourceBar.tsx` — currency pills + map fragment indicator
- `src/components/production/ProductionView.tsx` — generator rows + milestone data + ghost teaser
- `src/components/production/GeneratorRow.tsx` — single row with milestone glow + next milestone
- `src/components/app/useAppViewModel.ts` — quest-gated page unlock logic
- `src/styles/styles.css` — root font-size, keyframes, global resets
- `src/components/layout/NavRail.tsx` — nav rail + mobile tab bar
- `src/components/production/ClickRow.tsx` — click action row
- `src/components/UpgradePanel.tsx` — smart queue + show all
- `src/components/MapPanel.tsx` — map device orchestrator
- `src/components/TalentPanel.tsx` — talent graph wrapper
- `src/components/talents/TalentGraph.tsx` — SVG graph with nodes + edges
- `src/components/progress/ProgressView.tsx` — prestige/talents sub-tabs
- `src/game/currencies.ts` — currency definitions with purpose field
