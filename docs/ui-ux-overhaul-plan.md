# UI/UX Overhaul Plan: "Less Is More"

## Context

After the Phase 1 shell rebuild (NavRail, ResourceBar, CenterStage, FooterBar), the layout is solid but the content inside each view is overwhelming. Too many numbers, too much information density, no visual hierarchy. Every screen feels like a data dashboard rather than a game. This overhaul focuses on **reducing cognitive load** — each screen should serve one clear purpose with one clear action.

Core principle: **Show less, mean more.** Players should glance and know what to do.

---

## Phase 1: Production View — Compact Rows

**Problem:** Card grid with 9+ generators, click card, conversion strip, and unlock teasers creates a wall of numbers. Everything screams for attention equally.

**Solution:** Replace card grid with Antimatter Dimensions-style horizontal rows. Single column, clean rhythm.

### Layout
```
┌─────────────────────────────────────────────────┐
│  [x1] [x10] [Max]                    buy toggle │
├─────────────────────────────────────────────────┤
│  ⊕  Click  ·  +92 Fragment           [Click]    │  ← compact click row (same height as generators)
├─────────────────────────────────────────────────┤
│  F  Fragment         x27   7.38M  +84.6/s  [Buy]│  ← generator row
│  T  Transmutation    x12   680K   +7.6/s   [Buy]│
│  A  Augmentation     x16   572K   +6.4/s   [Buy]│
│  …                                               │
└─────────────────────────────────────────────────┘
```

### Changes
- **Delete** `GeneratorCard.tsx` — replaced by `GeneratorRow.tsx`
- **Delete** `ClickCard.tsx` — replaced by `ClickRow.tsx` (same row height as generators)
- **Delete** `ConversionStrip.tsx` — removed entirely
- **Delete** `ManualConversionRow.tsx` — removed entirely (no auto-conversion either)
- **Delete** `NextUnlockTeaser.tsx` — removed entirely; generators just appear with pop-in
- **Rewrite** `ProductionView.tsx` — single flex column with buy toggle + scrollable row list
- **New** `GeneratorRow.tsx` — single row: `icon | name | count | amount | rate | buy button`
- **New** `ClickRow.tsx` — top row with click button, fragment count, passive rate

### Key Decisions
- Max width ~700px centered, so rows don't stretch absurdly on wide screens
- Buy button shows cost on hover/focus (tooltip), not inline — reduces visual noise
- Row highlight on hover for clear interaction target
- Rows use alternating subtle backgrounds for scanability
- Click row has a distinct golden left-border accent to stand out without being huge
- `manualConvert` action removed from ProductionView (store action stays for now)

### Files
- Modify: `src/components/production/ProductionView.tsx`
- Create: `src/components/production/GeneratorRow.tsx`
- Create: `src/components/production/ClickRow.tsx`
- Delete: `src/components/production/GeneratorCard.tsx`
- Delete: `src/components/production/ClickCard.tsx`
- Delete: `src/components/production/ConversionStrip.tsx`
- Delete: `src/components/production/NextUnlockTeaser.tsx`
- Delete: `src/components/ManualConversionRow.tsx`

---

## Phase 2: Upgrades — Smart Queue

**Problem:** 32 upgrades across 6 categories with tabs + detail sidebar = information overload. Feels like reading a spreadsheet, not playing a game.

**Solution:** Smart queue showing the most relevant upgrades as compact cards. No categories, no detail panel, no long scrollable list.

### Layout
```
┌─────────────────────────────────────────────────┐
│  Upgrades                    8 owned · 12 ready │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Fragment  │  │ Transm.  │  │ Augment. │      │
│  │ Efficiency│  │ Tuning   │  │ Refine.  │      │
│  │ Lv 12     │  │ Lv 16    │  │ Lv 17    │      │
│  │ +130% →   │  │ +170% →  │  │ +180% →  │      │
│  │           │  │           │  │           │      │
│  │ [446 Frag]│  │ [56 Tran]│  │ [67 Aug] │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Alterat. │  │ Jeweller │  │ Fusing   │      │
│  │ Mastery  │  │ Precision│  │ Synergy  │      │
│  │ …        │  │ …        │  │ …        │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│              [Show all upgrades ▾]               │
└─────────────────────────────────────────────────┘
```

### Smart Queue Logic
1. Filter to upgrades where `state === "ready"` (requirements met, not maxed)
2. Sort by: affordable first, then by cost ascending (cheapest first)
3. Show top 6-9 cards (2-3 rows of 3)
4. "Show all" toggle reveals full list grouped by category (simple rows, not cards)

### Upgrade Card Design
- Compact card (~140px wide): name, current level, next effect preview (e.g., "+130% →"), buy button with cost
- Click anywhere on card to purchase (not just a button)
- Affordable cards: accent border (gold). Locked/expensive: muted
- Maxed upgrades don't appear in queue (they're done)
- Keystones/unlocks get a subtle different border color (cyan)

### Changes
- **Rewrite** `UpgradePanel.tsx` — smart queue grid + "show all" expandable section
- **New** `UpgradeCard.tsx` — compact card for smart queue
- No detail panel. No category tabs in default view.

### Files
- Rewrite: `src/components/UpgradePanel.tsx`
- Create: `src/components/upgrades/UpgradeCard.tsx`

---

## Phase 3: Maps — Visual Map Device

**Problem:** 4-step form (select → craft → socket → launch) is too many decisions at once. Text-heavy, feels like a configuration wizard rather than a game action.

**Solution:** Visual map device in center with a simplified flow. The map device is a central visual element with branching stems for customization.

### Layout
```
┌─────────────────────────────────────────────────┐
│                  Map Device                      │
│                                                  │
│         [Currency Stash]  ← base picker          │
│         [Jeweller's Workshop]   (small cards)    │
│         [Fractured Realm]                        │
│                                                  │
│              ┌─────────────┐                     │
│              │  MAP DEVICE  │  ← central visual  │
│              │   ◆ Tier 2   │                    │
│              │  3 affixes   │                    │
│              └──────┬───────┘                    │
│           ┌─────────┼─────────┐                  │
│      [Encounter] [Craft] [Device Mods]           │
│       ← stems that expand on click               │
│                                                  │
│            ══════════════════                     │
│            ║   Run Map   ║  ← prominent action   │
│            ══════════════════                     │
│                                                  │
│  ── Active: Jeweller's T2 ██████░░ 18s/25s ──   │
└─────────────────────────────────────────────────┘
```

### Simplified Flow
1. **Pick base map** — 3 small selectable cards at top (tier + name + cost preview)
2. **Central device** — shows the resulting map with rolled affixes as icons/badges
3. **3 stems** — expandable sections branching from device:
   - **Encounter**: Pick encounter type (3 icon buttons: expedition/ritual/delirium)
   - **Craft**: Action buttons (transmute/augment/alter etc.) shown as icon-only with tooltip costs
   - **Device Mods**: Mod slots shown as small socket icons, click to cycle/add
4. **Run button** — always visible at bottom, shows total cost, disabled if can't afford
5. **Active map** — compact inline status (same as FooterBar but more detail when on Maps page)

### Key Decisions
- Stems are collapsed by default → device shows summary. Click to expand one at a time (accordion)
- Crafting actions shown as currency icons (not text buttons) — hover shows cost
- Map cost total always visible near the Run button
- Encounter selection is 3 simple icon buttons with labels, not a section with descriptions
- Queue button appears next to Run when a map is active

### Changes
- **Rewrite** `MapPanel.tsx` — visual device layout with stem sections
- **Rewrite** `maps/MapPreparationPanel.tsx` — replace 4-step form with accordion stems
- **New** `maps/MapDevice.tsx` — central visual element showing crafted map state
- **New** `maps/MapBasePicker.tsx` — horizontal card picker for base maps
- **Modify** `maps/MapRunStatus.tsx` — more compact, inline with device

### Files
- Rewrite: `src/components/MapPanel.tsx`
- Rewrite: `src/components/maps/MapPreparationPanel.tsx`
- Create: `src/components/maps/MapDevice.tsx`
- Create: `src/components/maps/MapBasePicker.tsx`
- Modify: `src/components/maps/MapRunStatus.tsx`

---

## Phase 4: Talents — Node Graph

**Problem:** Flat list of talent rows is boring, hard to navigate, no sense of progression or "building toward something."

**Solution:** Interactive node graph with 3 branches radiating from a central prestige node. Nodes connect with visible lines. Purchased nodes light up with animation.

### Layout
```
                    ┌──────────┐
                    │ PRESTIGE │  ← central hub
                    └─────┬────┘
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        CARTOGRAPHY   ECONOMY    REFLECTION
              │           │           │
         [Surveyor]  [Firm Hand] [Cracked Mirror]
         [Hidden S]  [Bulk Cont] [Lingering W.]
         [Effic.R.]  [Compound.] [Echoing Arch.]
              │       [Streaml.]
         [Path Mem]
         [Field R.]
         [Hazard C.]
```

### Node Graph Design
- **CSS/SVG positioned** nodes (CSS positioning + SVG lines)
- Central "Prestige" hub node at top-center
- 3 branches spread downward/outward
- Each node: circular or rounded-rect, ~60px, shows icon + short name
- **Connection lines**: SVG paths between prerequisite nodes
- **States**:
  - Purchased (ranked): glowing border (gold for cartography, purple for reflection, cyan for economy), filled background
  - Available: outlined, slightly pulsing, clickable
  - Locked (prereq not met): dimmed, no interaction
  - Maxed: solid filled, checkmark or star badge
- **Click to purchase**: click an available node → immediate purchase if affordable, cost shown on hover
- **Rank indicator**: small badge on node showing current/max rank (e.g., "3/5")
- **Shard balance**: always visible at top-right of the graph

### Talent Dependency Tree (13 nodes, 3 branches)
```
Cartography (6 nodes):
  surveyorsEye (root) ─── no children
  hiddenStashes (root) → pathMemory → fieldReports → hazardCharts
  efficientRolling (root) ─── no children

Economy (4 nodes):
  firmHand (root) → compoundingCraft
  bulkContracts (root) ─── no children
  streamlinedConversion (root) ─── no children

Reflection (3 nodes):
  crackedMirror (root) → lingeringWealth → echoingArchives
```

### Implementation Approach
- Use CSS positioning with `position: absolute` nodes inside a `position: relative` container
- Pre-calculate node positions in a layout config (not dynamic graph layout — only 13 nodes)
- SVG overlay for connection lines between nodes
- Each node is a button component with hover tooltip showing: name, description, rank, cost
- Purchase animation: node scales up briefly, connection line to next node brightens

### Changes
- **Rewrite** `TalentPanel.tsx` — node graph layout replacing flat list
- **New** `talents/TalentNode.tsx` — individual node component
- **New** `talents/TalentGraph.tsx` — graph container with SVG lines + positioned nodes
- **New** `talents/talentLayout.ts` — static position config for all 13 nodes

### Files
- Rewrite: `src/components/TalentPanel.tsx`
- Create: `src/components/talents/TalentNode.tsx`
- Create: `src/components/talents/TalentGraph.tsx`
- Create: `src/components/talents/talentLayout.ts`

---

## Phase 5: Resource Bar Refinement

**Problem:** Resource bar contributes to information overload — showing 7+ currencies with rates.

**Solution:** Simplify to show only the most relevant currencies based on what the player is currently doing.

### Changes
- Show max 5 currencies in bar (highest tier unlocked + actively producing)
- Remove "STASH" and "RATE" summary pills — they add noise without actionable info
- Hover on any currency pill shows detailed breakdown tooltip
- Shrink pill size slightly (smaller font, tighter padding)

### Files
- Modify: `src/components/layout/ResourceBar.tsx`

---

## Verification

After each phase:
1. `npm run build` — zero errors
2. `npm run dev` — game fully playable
3. Manual check: no page-level scroll on any view
4. Visual check: information density feels comfortable, not overwhelming

Phase-specific:
- Phase 1: Generator rows display correctly, buying works, no conversion strip, no teasers
- Phase 2: Smart queue shows affordable upgrades first, purchasing works, "show all" works
- Phase 3: Map device visual works, can select base + craft + add mods + run map
- Phase 4: Node graph renders all 13 talents, connections visible, purchasing works, rank badges update
- Phase 5: Resource bar shows ≤5 currencies, hover tooltips work
