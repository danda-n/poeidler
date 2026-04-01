import { memo, useRef } from "react";
import { useAppViewModel } from "@/components/app/useAppViewModel";

export type PageId = "home" | "upgrades" | "mapDevice" | "progress" | "settings";

export type PageMeta = {
  badge?: string;
  tone?: "active" | "ready" | "alert";
};

type NavItem = {
  id: PageId;
  label: string;
  icon: ReactNode;
  unlockKey?: PageId;
  pinBottom?: boolean;
};

import type { ReactNode } from "react";

const navItems: NavItem[] = [
  {
    id: "home",
    label: "Production",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="7" />
        <path d="M10 7v6M7 10h6" />
      </svg>
    ),
  },
  {
    id: "upgrades",
    label: "Upgrades",
    unlockKey: "upgrades",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 3v14M10 3l-4 4M10 3l4 4" />
      </svg>
    ),
  },
  {
    id: "mapDevice",
    label: "Maps",
    unlockKey: "mapDevice",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7l5-3 4 3 5-3v10l-5 3-4-3-5 3z" />
      </svg>
    ),
  },
  {
    id: "progress",
    label: "Progress",
    unlockKey: "progress",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="10,2 12.5,7.5 18,8 14,12 15,17.5 10,15 5,17.5 6,12 2,8 7.5,7.5" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    pinBottom: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="2.5" />
        <path d="M10 1.5v2M10 16.5v2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M1.5 10h2M16.5 10h2M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" />
      </svg>
    ),
  },
];

type NavRailProps = {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  layout?: "rail" | "bar";
};

export const NavRail = memo(function NavRail({ activePage, onNavigate, layout = "rail" }: NavRailProps) {
  const { unlockedPages, pageMeta } = useAppViewModel();
  const prevUnlockedRef = useRef<Set<string>>(new Set(["home"]));

  const topItems = navItems.filter((item) => !item.pinBottom);
  const bottomItems = navItems.filter((item) => item.pinBottom);

  // Track newly unlocked items for animation
  const currentUnlocked = new Set<string>(["home"]);
  topItems.forEach((item) => {
    if (!item.unlockKey || unlockedPages[item.unlockKey]) {
      currentUnlocked.add(item.id);
    }
  });
  const newlyUnlocked = new Set<string>();
  currentUnlocked.forEach((id) => {
    if (!prevUnlockedRef.current.has(id)) newlyUnlocked.add(id);
  });
  prevUnlockedRef.current = currentUnlocked;

  const allVisibleItems = [...topItems, ...bottomItems].filter((item) => {
    if (item.unlockKey) return !!unlockedPages[item.unlockKey];
    return true;
  });

  const btnBase = "relative flex items-center justify-center rounded-lg transition-colors duration-150";
  const btnActive = "bg-[rgba(244,213,140,0.16)] text-accent-gold border border-[rgba(244,213,140,0.22)]";
  const btnInactive = "text-[#8090a6] hover:text-white hover:bg-[rgba(255,255,255,0.08)] border border-transparent";

  function renderBadge(item: NavItem) {
    const meta = pageMeta[item.id];
    if (!meta?.badge) return null;
    return (
      <span
        className={`absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full text-[0.5rem] font-extrabold flex items-center justify-center ${
          meta.tone === "active"
            ? "text-[#0e1a1f] bg-accent-cyan"
            : meta.tone === "alert"
              ? "text-[#220f12] bg-[#ff8b8b]"
              : "text-bg-surface bg-accent-gold"
        }`}
      >
        {meta.badge.length <= 3 ? meta.badge : "•"}
      </span>
    );
  }

  // Mobile bottom bar
  if (layout === "bar") {
    return (
      <nav className="flex items-center justify-around h-12 border-t border-border-subtle bg-[rgba(7,10,14,0.92)]">
        {allVisibleItems.map((item) => {
          const isActive = item.id === activePage;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              className={`${btnBase} w-10 h-10 ${isActive ? btnActive : btnInactive}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.icon}
              {renderBadge(item)}
            </button>
          );
        })}
      </nav>
    );
  }

  // Desktop left rail
  return (
    <nav className="flex flex-col items-center w-12 shrink-0 py-3 gap-1 border-r border-border-subtle bg-[rgba(7,10,14,0.82)]">
      <div className="flex flex-col items-center gap-1">
        {topItems.map((item) => {
          const locked = item.unlockKey ? !unlockedPages[item.unlockKey] : false;
          if (locked) return null;

          const isActive = item.id === activePage;
          const isNew = newlyUnlocked.has(item.id);

          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              className={`${btnBase} w-9 h-9 ${isNew ? "animate-[pop-in_300ms_ease-out] " : ""}${isActive ? btnActive : btnInactive}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.icon}
              {renderBadge(item)}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-1">
        {bottomItems.map((item) => {
          const isActive = item.id === activePage;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              className={`${btnBase} w-9 h-9 ${isActive ? btnActive : btnInactive}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.icon}
            </button>
          );
        })}
      </div>
    </nav>
  );
});
