# Early-Game Hook System: "The First 10 Minutes"

## Context

The game's shell and views are clean, but the first 10 minutes lack hooks. Players buy generators, see numbers go up, but have no goal, no excitement, no reason to care about new currencies. This plan adds: a quest system that guides the first session, map fragments as a collectible "DING" moment, generator milestone glow for visual investment feedback, and currency identity so each orb has purpose.

Core principle: **Every minute should have a goal. Every unlock should change what the player can DO.**

---

## Target First-Session Flow

| Time | Event | Player Feels |
|------|-------|-------------|
| 0:00 | Game starts, quest bar shows "Gather 50 Fragments" | Clear goal |
| 0:30 | Quest complete → first generator auto-purchased | "It plays itself!" |
| 2:00 | "Own 5 Fragment Farmers" complete → +25% click power | Power spike |
| 3:30 | "Reach 10 Fragment/s" complete → Upgrade tab unlocks with badge pulse | Discovery |
| 5:00 | "Buy your first upgrade" → generator speed boost | Investment payoff |
| 6:30 | "Unlock Transmutation" → **MAP FRAGMENT DROPS** (DING!) | Surprise + new goal |
| 8:00 | "3 currencies producing" → second Map Fragment | Building toward something |
| 10:00 | "Collect 3 Map Fragments" → **MAP DEVICE UNLOCKS** | Major expansion |

---

## Phase 1: Quest Data + Map Fragment State

**Goal:** Define quest definitions, add map fragment counter, add currency purpose field. No UI, no engine changes.

### New file: `src/game/quests.ts`
Data-driven quest definitions array (same pattern as generators/currencies):
- `QuestDefinition`: id, title, condition, rewards, prerequisiteQuestId, hidden, sortOrder
- `QuestCondition` union type: currencyAmount, generatorCount, productionRate, purchasedUpgrade, unlockedCurrencyCount, mapFragmentCount
- `QuestReward` union type: mapFragment, permanentClickBonus, permanentGeneratorSpeed, unlockFeature
- Helper functions: `getQuestById`, `getNextAvailableQuest`, `evaluateQuestCondition`, `isQuestUnlocked`
- 7 initial quests for the first-session sequence (chained via prerequisiteQuestId)

### Modify: `src/game/currencies.ts`
- Add `purpose?: string` field to `CurrencyDefinition`
- Add purpose strings: Fragment="Basic economy", Transmutation="Craft upgrades", Augmentation="Enhance generators", Alteration="Reroll map mods", etc.

### Modify: `src/game/gameEngine.ts`
- Add `mapFragments: number` to `GameState` type
- Add `mapFragments: 0` to `createInitialGameState()`

### Files
- Create: `src/game/quests.ts`
- Modify: `src/game/currencies.ts`
- Modify: `src/game/gameEngine.ts` (state type only)

---

## Phase 2: Quest Slice + Engine Integration

**Goal:** Quest state in store, quest evaluation in tick loop, map fragment passive drops, save/load.

### New file: `src/store/slices/questSlice.ts`
State:
- `completedQuests: Record<QuestId, number>` (questId → completion timestamp)
- `activeQuestId: QuestId | null`
- `questNotification: { questId: string; title: string; timestamp: number } | null`
- `fragmentNotification: { timestamp: number } | null`

Actions:
- `dismissQuestNotification()`

### Modify: `src/store/gameStore.ts`
- Import and compose questSlice (6th slice)
- Add quest state to store type

### Modify: `src/game/gameEngine.ts`
Add `evaluateQuests(state)` called in `runGameTick` after passive generation:
1. If no active quest, find first available (prerequisite met, not completed) → set active
2. Check active quest condition against current state
3. On completion: mark completed, apply rewards (add mapFragments, set permanent bonuses), set notification, advance to next quest
4. Clear notification after 8s TTL (same pattern as mapNotification)

Add passive fragment drops:
- After `applyPassiveGeneration`, if any generator produces and `mapFragments` feature is unlocked (after first quest-granted fragment): roll `Math.random() < 0.0005 * deltaTimeSeconds` (~0.05%/s)
- On hit: increment `mapFragments`, set `fragmentNotification`

### Modify: `src/game/gameEngine.ts` — `synchronizeGameState`
- Derive quest permanent bonuses (click power, generator speed) from `completedQuests`
- Add to existing multiplier calculations alongside upgrade effects

### Modify: save/load system
- Add `questState`, `mapFragments` to save payload with defaults for migration

### Files
- Create: `src/store/slices/questSlice.ts`
- Modify: `src/store/gameStore.ts`
- Modify: `src/game/gameEngine.ts`
- Modify: save/load (wherever `SavePayload` is defined)

---

## Phase 3: Quest Bar + Notifications UI

**Goal:** Persistent quest bar at top of every page, quest log overlay, completion toasts, fragment DING.

### New file: `src/components/quest/QuestBar.tsx`
Compact bar (~32px) between ResourceBar and content:
- Shows: quest title, progress ("47/50 Fragments"), reward preview icon
- Click to expand quest log
- Only renders when quests are active or completed
- `shrink-0` to not break no-scroll constraint

### New file: `src/components/quest/QuestLog.tsx`
Overlay panel (portal, like PrestigeOverlay):
- **Completed**: green checkmark, title, reward summary
- **Active**: highlighted with progress bar
- **Upcoming**: visible title, dimmed, shows prerequisite
- **Hidden**: "???" with "Complete more quests to discover"

### New file: `src/components/quest/QuestToast.tsx`
Fixed-position toast for quest completion:
- Gold accent, quest title, reward list
- 5s auto-dismiss with slide-out animation

### New file: `src/components/quest/FragmentToast.tsx`
Fixed-position toast for fragment drops (DING moment):
- Purple accent, "MAP FRAGMENT" text, dramatic scale-in animation
- Brief golden particle/glow effect
- Distinct from quest toast — this is THE exciting moment

### Modify: `src/components/layout/NewAppShell.tsx`
- Insert `<QuestBar />` between `<ResourceBar />` and the NavRail+CenterStage flex row

### Modify: `src/App.tsx`
- Render `<QuestToast />` and `<FragmentToast />` alongside existing app content

### Files
- Create: `src/components/quest/QuestBar.tsx`
- Create: `src/components/quest/QuestLog.tsx`
- Create: `src/components/quest/QuestToast.tsx`
- Create: `src/components/quest/FragmentToast.tsx`
- Modify: `src/components/layout/NewAppShell.tsx`
- Modify: `src/App.tsx`

---

## Phase 4: Map Fragment in ResourceBar + Currency Purpose

**Goal:** Show map fragments as a special indicator, show currency purpose on first unlock.

### Modify: `src/components/layout/ResourceBar.tsx`
- Add Map Fragment indicator after currency pills (purple accent, distinct icon, count badge)
- Only visible when `mapFragments > 0`
- Pulsing animation when fragment count increases

### Currency unlock hint
- When a new currency unlocks, briefly show its `purpose` text as a toast or inline flash
- Track `previouslyUnlockedCount` in local ref to detect new unlocks

### Files
- Modify: `src/components/layout/ResourceBar.tsx`

---

## Phase 5: Generator Milestone Glow

**Goal:** Visual feedback showing generator investment. Rows glow brighter at milestones.

### Modify: `src/components/production/ProductionView.tsx`
- Compute `milestoneLevel` (0-4) for each generator using `getGeneratorMilestoneBonus`
- Compute `nextMilestone` and `milestoneProgress` using `getNextGeneratorMilestone`
- Pass as props to `GeneratorRow`

### Modify: `src/components/production/GeneratorRow.tsx`
- Add `milestoneLevel` and `nextMilestone` props
- Apply escalating glow shadow based on milestone level:
  - 0: none
  - 1 (10+): faint gold glow
  - 2 (25+): medium glow
  - 3 (50+): strong glow
  - 4 (100+): intense glow with golden border
- Show next milestone as small text: "→ 25" next to generator count
- On milestone hit (detected via previous count ref): brief pulse animation

### New keyframe in `src/styles/styles.css`
```css
@keyframes milestone-pulse {
  0% { box-shadow: 0 0 0 0 rgba(244,213,140,0.4); }
  50% { box-shadow: 0 0 20px 4px rgba(244,213,140,0.3); }
  100% { box-shadow: 0 0 0 0 rgba(244,213,140,0); }
}
```

### Files
- Modify: `src/components/production/ProductionView.tsx`
- Modify: `src/components/production/GeneratorRow.tsx`
- Modify: `src/styles/styles.css`

---

## Phase 6: Quest-Gated Page Unlocks

**Goal:** Upgrade tab and Map Device don't appear until earned via quests. This makes unlocks feel dramatic.

### Modify: `src/components/app/useAppViewModel.ts`
- Change upgrade page unlock: instead of "any generator owned", require quest "Reach 10 Fragment/s" completed
- Change map device unlock: instead of "alteration unlocked", require quest "Collect 3 Map Fragments" completed
- When a page unlocks via quest completion, the NavRail pop-in animation already handles the dramatic reveal

### Files
- Modify: `src/components/app/useAppViewModel.ts`

---

## Verification

After each phase:
1. `npm run build` — zero errors
2. `npx vitest run` — all tests pass
3. `npm run dev` — game fully playable

Phase-specific:
- Phase 2: Quest advances automatically as conditions are met, fragments increment, save/load preserves quest state
- Phase 3: Quest bar visible, progress updates live, toasts fire on completion, fragment DING is visually dramatic
- Phase 4: Fragments appear in resource bar, currency purpose shows on unlock
- Phase 5: Generator rows glow at milestones, next milestone indicator visible
- Phase 6: Upgrade tab hidden until quest unlocks it, map device hidden until fragments collected

End-to-end: fresh save → play 10 minutes → all 7 quests complete → map device unlocked → first map run possible
