# UI Rebuild Plan: "Always-Visible Center Stage"

## Context

The current UI uses a full sidebar + 4 pages with page-level scrolling. This overwhelms new players and hides critical info when navigating between pages. The rebuild creates a desktop-first layout with: persistent resource bar, slim nav rail with progressive unlock, a viewport-filling center stage (no page scroll), and a contextual footer for background processes. Inspired by Antimatter Dimensions / Melvor Idle.

## Target Layout

```
┌─────────────────────────────────────────────────┐
│  RESOURCE BAR  (unlocked currencies, top 3 w/   │
│  inline rates, others amount-only, hover detail) │
├──────┬──────────────────────────────────────────┤
│ NAV  │  CENTER STAGE                            │
│ RAIL │  (viewport-filling, internal scroll only)│
│ 48px │                                          │
│ icons│  Production | Upgrades | Maps | Progress │
│      │  | Settings                              │
│ ──── │                                          │
│ [⚙] │                                          │
├──────┴──────────────────────────────────────────┤
│  FOOTER BAR (map timer, auto-prestige, offline) │
└─────────────────────────────────────────────────┘
```

Root enforces `h-screen overflow-hidden`. No page-level scrolling anywhere.

## Progressive Disclosure

| Stage | Nav Icons | Resource Bar | Center | Footer |
|-------|-----------|-------------|--------|--------|
| First 30s | Production | Fragments | Click button + first gen | Hidden |
| First gen bought | Production | +Transmutation | Generator grid (2 cards) | Hidden |
| 3+ generators | +Upgrades | 3-4 currencies | Upgrades tab worthwhile | Hidden |
| Alteration unlocked | +Maps | 4+ currencies | Map device | Map timer |
| Prestige ready | +Progress | All + Shards | Full-screen prestige overlay | Hidden |
| Post 5th prestige | All 4 + Settings | All currencies | Normal tabs | Auto-prestige |

---

## Phase 1: Shell Skeleton

**Goal:** Replace outer shell. All existing views render inside CenterStage unchanged.

### New files
- `src/components/layout/NewAppShell.tsx` -- `h-screen flex flex-col overflow-hidden` root; ResourceBar top, NavRail+CenterStage middle, FooterBar bottom
- `src/components/layout/NavRail.tsx` -- 48px icon-only rail, progressive unlock, badge dots, settings at bottom, tooltips on hover
- `src/components/layout/ResourceBar.tsx` -- port from TopStatusStrip selectors; show unlocked currencies, top 3 with rates, adaptive compression
- `src/components/layout/FooterBar.tsx` -- subscribe to activeMap; show map timer when running; hidden otherwise; slide-up transition
- `src/components/layout/CenterStage.tsx` -- `flex-1 overflow-hidden` wrapper for active view

### Modify
- `src/App.tsx` -- swap `<AppShell>` for `<NewAppShell>`, remove Sidebar/TopStatusStrip/ActiveMapBanner, add "settings" to PageId, pass existing page content into CenterStage

### Reuse
- `useAppViewModel.ts` unlock/badge logic (same contract)
- `Tooltip.tsx` for rail hover labels

---

## Phase 2: Production View (Generator Cards)

**Goal:** Replace CurrencyScreen with card-based generator grid.

### New files
- `src/components/production/ProductionView.tsx` -- `h-full flex flex-col`; buy-amount toggle (1/10/max) at top, generator grid fills remaining space (`grid grid-cols-2 lg:grid-cols-3 gap-2 flex-1 overflow-y-auto`), ConversionStrip fixed below, NextUnlockTeaser at bottom
- `src/components/production/GeneratorCard.tsx` -- compact ~120px card: icon + name, count, rate, buy button with cost; styled like AD dimension buttons
- `src/components/production/ClickCard.tsx` -- port from ClickPanel; prominent (2-col span) before first generator, compact (1-col) after; golden gradient click button
- `src/components/production/ConversionStrip.tsx` -- thin wrapper around ManualConversionRow, horizontal strip with `overflow-x-auto`
- `src/components/production/NextUnlockTeaser.tsx` -- port from MysteryRow; compact single line per upcoming currency

### Modify
- `src/App.tsx` -- replace CurrencyScreen import with ProductionView

### Keep
- `ManualConversionRow.tsx` (used inside ConversionStrip)

---

## Phase 3: Viewport-Constrained Upgrades & Maps

**Goal:** Make UpgradePanel and MapPanel fit CenterStage without page scroll.

### Modify
- `src/components/UpgradePanel.tsx`:
  - Root: `h-full flex flex-col overflow-hidden`
  - Both columns: `flex-1 overflow-y-auto`
  - No explicit heights, flexbox fills space

- `src/components/MapPanel.tsx`:
  - Root: `h-full flex flex-col overflow-hidden`
  - MapRunStatus: fixed height top
  - MapPreparationPanel: `flex-1 overflow-y-auto`

- `src/components/maps/MapPreparationPanel.tsx`:
  - Wrap 4 sections in `flex-1 overflow-y-auto`
  - Commit button: `sticky bottom-0` so always visible
  - Affix list: `max-h-[200px] overflow-y-auto` to cap height

### Delete
- `src/components/screens/MapsScreen.tsx` -- stats header moves into MapPanel top area

---

## Phase 4: Progress View + Prestige Overlay

**Goal:** Unified Progress view with dramatic prestige for first 5 resets.

### New files
- `src/components/progress/ProgressView.tsx` -- `h-full flex flex-col`; sub-tab toggle (Prestige | Talents) at top; content fills remaining space
- `src/components/progress/PrestigeOverlay.tsx` -- portal overlay `fixed inset-0 z-50 bg-black/80 backdrop-blur-md`; dramatic animation (scale-in, golden glow, shard count reveal); projected shards + confirm/cancel; used when `prestigeCount < 5`

### Modify
- `src/components/PrestigePanel.tsx` -- add overlay trigger mode; when `prestigeCount < 5` clicking prestige opens overlay; otherwise inline confirm
- `src/components/TalentPanel.tsx` -- `h-full overflow-y-auto`; consider 2-col grid for branches to reduce height

### Delete
- `src/components/screens/progress/PrestigeScreen.tsx`
- `src/components/screens/progress/TalentsScreen.tsx`
- `src/components/ProgressScreen.tsx`

---

## Phase 5: Polish + Progressive Disclosure Animations

**Goal:** Animate nav rail unlocks, finalize footer bar, resource bar compression, cleanup.

### Enhance
- `NavRail.tsx` -- animate icon entrance (`@keyframes pop-in` scale 0→1 on unlock)
- `ResourceBar.tsx` -- 3-tier compression: <=5 currencies (label+amount+rate), 6-8 (label+amount), 9+ (icon-only for lowest tiers)
- `FooterBar.tsx` -- add auto-prestige status, offline earnings toast slot
- `useAppViewModel.ts` -- add `footerState` computed, settings page entry

### Delete (dead code cleanup)
- `src/components/AppShell.tsx`
- `src/components/layout/ShellHeader.tsx`
- `src/components/layout/ShellPageHeader.tsx`
- `src/components/Sidebar.tsx`
- `src/components/TopStatusStrip.tsx`
- `src/components/ActiveMapBanner.tsx`
- `src/components/screens/CurrencyScreen.tsx`
- `src/components/CurrencyPanel.tsx`
- `src/components/CurrencyRow.tsx`
- `src/components/ClickPanel.tsx`
- `src/components/MysteryRow.tsx`
- `src/components/WealthBar.tsx`
- `src/components/OtherUpgradesBar.tsx`

---

## Phase 6: Settings View + Mobile Basics

### Modify
- `src/components/SettingsPanel.tsx` -- expand to full CenterStage view (save info, version, reset, toggles)

### Mobile adjustments
- NavRail: `<lg` breakpoint → bottom tab bar (`fixed bottom-0 w-full h-12 flex-row`)
- ResourceBar: limit to top 3 currencies on mobile, tap to expand
- ProductionView grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- FooterBar: above bottom tab bar on mobile

---

## Cross-Cutting: Strip Flavor Text

Applies across all phases. Remove all "tutorial-style" descriptive text that adds no actionable value:

- **Nav rail**: no subtitles under icons (old sidebar had "Core loop and stash", "Economy and system boosts", etc.)
- **Page headers**: no instructional descriptions ("Browse one category at a time...")
- **Upgrade categories**: no prose descriptions on category cards ("Immediate output boosts across currency lines..."). Keep only: category name + counts (unlocked/ready)
- **Upgrade rows**: no flavor text descriptions ("Scale fragment production for the opening loop."). Keep only: name, tier badge, level, cost, current/next effect values
- **Selected upgrade detail panel**: no description paragraph. Keep only: status, level, effects, cost, prerequisite, buy button
- **Category selection panel**: no instructional text ("Choose a progression track", "Each category keeps its own upgrade lane..."). Just show the selectable categories

**Principle**: every piece of text on screen should be either a label, a number, or an actionable control. If it's a sentence explaining what the user is looking at, remove it.

## Key Decisions

1. **Store unchanged** -- all `useGameStore` selectors stay the same. New components subscribe the same way.
2. **Buy amount** -- local `useState<1 | 10 | 'max'>` in ProductionView (not store), since it's UI-only state.
3. **No default exports** -- all new components use named exports per project convention.
4. **Tailwind tokens reused** -- existing theme (bg-base, bg-surface, accent-gold, accent-cyan, border-subtle) applies throughout.
5. **Click card shrinks, never disappears** -- stays in grid as single-column card once generators exist.
6. **No flavor text** -- strip all tutorial-style descriptions. Labels + numbers + controls only.

## Verification

After each phase:
1. `npm run build` -- must pass with zero errors
2. `npm run dev` -- game must be fully playable
3. Manual check: no page-level scroll on any view
4. Manual check: resource bar visible from every tab
5. After Phase 2: generator cards display correctly, buying works
6. After Phase 4: prestige overlay triggers for first 5, inline after
7. After Phase 5: nav icons animate on unlock, footer shows map timer
8. After Phase 6: resize to mobile width, bottom tab bar appears
