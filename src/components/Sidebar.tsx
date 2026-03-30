import { memo } from "react";

export type PageId = "home" | "upgrades" | "mapDevice" | "progress";

export type PageMeta = {
  badge?: string;
  tone?: "active" | "ready" | "alert";
};

type NavGroup = "primary" | "longTerm";

type NavItem = {
  id: PageId;
  label: string;
  description: string;
  group: NavGroup;
  unlockKey?: PageId;
};

const navItems: NavItem[] = [
  { id: "home", label: "Currency", description: "Core loop and stash", group: "primary" },
  { id: "upgrades", label: "Upgrades", description: "Economy and system boosts", group: "primary", unlockKey: "upgrades" },
  { id: "mapDevice", label: "Maps", description: "Crafting, queue, and runs", group: "primary", unlockKey: "mapDevice" },
  { id: "progress", label: "Progress", description: "Prestige and talents", group: "longTerm", unlockKey: "progress" },
];

const navGroups: { id: NavGroup; label: string }[] = [
  { id: "primary", label: "Primary" },
  { id: "longTerm", label: "Long-term" },
];

type SidebarProps = {
  activePage: PageId;
  unlockedPages: Partial<Record<PageId, boolean>>;
  pageMeta?: Partial<Record<PageId, PageMeta>>;
  onNavigate: (page: PageId) => void;
};

export const Sidebar = memo(function Sidebar({ activePage, unlockedPages, pageMeta = {}, onNavigate }: SidebarProps) {
  return (
    <nav className="w-full h-full grid content-start gap-[18px] p-0 bg-transparent">
      {navGroups.map((group) => {
        const items = navItems.filter((item) => item.group === group.id);
        return (
          <div key={group.id} className="grid gap-2">
            <div className="px-2.5 text-[0.68rem] font-extrabold tracking-[0.1em] uppercase text-[#667389]">{group.label}</div>
            <div className="grid gap-2">
              {items.map((item) => {
                const locked = item.unlockKey ? !unlockedPages[item.unlockKey] : false;
                const meta = pageMeta[item.id];
                const isActive = item.id === activePage;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`relative w-full flex items-start justify-between gap-2.5 py-3.5 pr-11 pl-3.5 border border-border-subtle border-l-[3px] border-l-transparent rounded-2xl bg-[rgba(255,255,255,0.03)] text-[#dfe6f2] text-left cursor-pointer transition-colors duration-150 hover:not-disabled:bg-[rgba(255,255,255,0.06)] hover:not-disabled:border-[rgba(255,255,255,0.1)] hover:not-disabled:text-white${isActive ? " !border-l-[#f4d58c] !bg-gradient-to-b !from-[rgba(244,213,140,0.16)] !to-bg-overlay !border-[rgba(244,213,140,0.22)]" : ""}${locked ? " opacity-45" : ""}`}
                    disabled={locked}
                    onClick={() => !locked && onNavigate(item.id)}
                  >
                    <div className="min-w-0 grid gap-[3px]">
                      <span className="text-[0.92rem] font-bold text-inherit">{item.label}</span>
                      <span className="text-[0.72rem] leading-[1.35] text-[#93a0b4]">{locked ? "Unlock later" : item.description}</span>
                    </div>
                    {meta?.badge && (
                      <span className={`absolute top-3 right-3 min-w-[22px] px-[7px] py-0.5 rounded-full text-[0.62rem] font-extrabold text-center${meta.tone === "active" ? " text-[#0e1a1f] bg-accent-cyan" : meta.tone === "alert" ? " text-[#220f12] bg-[#ff8b8b]" : " text-bg-surface bg-accent-gold"}`}>
                        {meta.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
});
