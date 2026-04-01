# Current State

## Current systems
- React 18 + TypeScript + Vite idle game with Zustand store for state management
- `CurrencyId`, `GeneratorId`, `UpgradeId` are plain strings; content is data-driven via arrays in `src/game/`
- `src/game/registry.ts` provides centralized lookup helpers (`getCurrency`, `getGenerator`, `getBaseMap`, etc.) with runtime validation
- `src/store/gameStore.ts` composes 5 action slices from `src/store/slices/` (currency, economy, map, prestige, system); game loop and autosave run outside React
- `src/store/useGameStore.ts` exposes a selector-based React hook for components
- `src/game/gameEngine.ts` contains the pure tick function (`runGameTick`) and derived state sync (`synchronizeGameState`) with caching
- Tailwind CSS utilities in all components; design tokens in `src/styles/tailwind.css`; `styles.css` contains global resets and keyframes
- Responsive root font-size: `clamp(15px, 1.05vw, 20px)` — scales from 15px at ~1430px width to 20px at 1920px+; all component font sizes use rem to scale with root
- **UI layout**: 3-zone shell (ResourceBar top, NavRail left + CenterStage, FooterBar bottom) — no page-level scrolling; `h-screen overflow-hidden` root
- **NavRail**: 48px icon-only rail (desktop `lg+`) / bottom tab bar (mobile `<lg`), progressive unlock with pop-in animation, badge dots with 3 tones (active/ready/alert)
- **ResourceBar**: compact pills showing top 5 currencies (highest tier + actively producing), hover for details; no stash/rate summary pills
- **FooterBar**: contextual — shows active map timer with progress bar, hidden when idle; slide-up animation on appear
- **ProductionView**: AD-style compact horizontal rows (ClickRow + GeneratorRows) with buy 1/10/max toggle, max-width 800px centered; ghost row teaser for next locked generator (shows ??? + current/target production rate, no name spoiler)
- **UpgradePanel**: smart queue showing 6-9 most relevant upgrades as compact cards (affordable first, cheapest first), "show all" toggle reveals full categorized list as simple rows; no detail panel, no category tabs in default view
- **MapsScreen**: compact stats header + visual MapDevice centered with 3 accordion stems (Encounter/Craft/Mods); MapBasePicker as horizontal card row; MapRunStatus inline; max-width 600px centered
- **ProgressView**: Prestige/Talents sub-tabs; full-screen prestige overlay for first 5 resets
- **TalentPanel**: interactive SVG node graph with 13 talent nodes (110x48px) across 3 color-coded branches (cartography=gold, economy=cyan, reflection=purple); SVG connection lines (dashed when locked, solid when active); click-to-purchase; hover tooltip shows name, description, cost
- **SettingsPanel**: full CenterStage view with save info, version, reset button
- Design principles: data over prose (labels, numbers, controls only); show less, mean more (reduce cognitive load per screen)
- ESLint with typescript-eslint recommended rules; Vitest covers core game logic (58 tests)
- The game simulation advances every 100 ms; display publishes on every tick via Zustand subscriptions
- Conversion system removed from UI (ConversionStrip, ManualConversionRow deleted); store action `manualConvert` still exists but unused
- Old card-based components deleted: GeneratorCard, ClickCard, ConversionStrip, NextUnlockTeaser, ManualConversionRow, MapBaseSelector

## Known issues
- Store actions split into 5 slices; state shape still flat (not nested by domain)
- Late-game balance needs a dedicated pass
- Talent node positions are hardcoded in `talentLayout.ts`; may need tuning for visual balance on different screen sizes
- `manualConvert` store action is dead code (UI removed); should be cleaned up if conversion is permanently gone
- `getVisibleAdjacentConversions`, `getConversionRatio`, `scrambleName` in `currencies.ts` are now unused

## Next 3 priorities
- Late-game balance pass
- Visual polish pass on production rows, map device, and talent graph (proper icons, hover states, animations)
- Expand test coverage to map completion, prestige payout, and upgrade interaction edge cases

## Files that matter most
- `src/styles/styles.css` — root font-size, keyframes, global resets
- `src/components/layout/NewAppShell.tsx` — 3-zone shell root
- `src/components/layout/NavRail.tsx` — nav rail + mobile tab bar
- `src/components/layout/ResourceBar.tsx` — top currency pills
- `src/components/production/ProductionView.tsx` — generator rows + ghost teaser
- `src/components/production/GeneratorRow.tsx` — single generator row
- `src/components/production/ClickRow.tsx` — click action row
- `src/components/UpgradePanel.tsx` — smart queue + show all
- `src/components/upgrades/UpgradeCard.tsx` — individual upgrade card
- `src/components/MapPanel.tsx` — map device orchestrator
- `src/components/maps/MapDevice.tsx` — central visual map element
- `src/components/maps/MapPreparationPanel.tsx` — accordion stems (encounter/craft/mods)
- `src/components/maps/MapBasePicker.tsx` — base map selection cards
- `src/components/maps/MapRunStatus.tsx` — active/queued/last map display
- `src/components/TalentPanel.tsx` — talent graph wrapper
- `src/components/talents/TalentGraph.tsx` — SVG graph with nodes + edges
- `src/components/talents/TalentNode.tsx` — individual talent node
- `src/components/talents/talentLayout.ts` — static node positions + colors
- `src/components/progress/ProgressView.tsx` — prestige/talents sub-tabs
- `src/components/progress/PrestigeOverlay.tsx` — dramatic prestige portal
- `src/components/app/useAppViewModel.ts` — page-level unlock/badge logic
- `src/store/gameStore.ts` — Zustand store composition
