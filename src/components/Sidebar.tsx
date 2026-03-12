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
  { id: "home", label: "Home", description: "Core loop and stash", group: "primary" },
  { id: "upgrades", label: "Upgrades", description: "Economy and system boosts", group: "primary", unlockKey: "upgrades" },
  { id: "mapDevice", label: "Map Device", description: "Crafting, queue, and runs", group: "primary", unlockKey: "mapDevice" },
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

export function Sidebar({ activePage, unlockedPages, pageMeta = {}, onNavigate }: SidebarProps) {
  return (
    <nav className="sidebar">
      {navGroups.map((group) => {
        const items = navItems.filter((item) => item.group === group.id);
        return (
          <div key={group.id} className="sidebar-group">
            <div className="sidebar-group-label">{group.label}</div>
            <div className="sidebar-group-items">
              {items.map((item) => {
                const locked = item.unlockKey ? !unlockedPages[item.unlockKey] : false;
                const meta = pageMeta[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar-item${item.id === activePage ? " sidebar-item-active" : ""}${locked ? " sidebar-item-locked" : ""}`}
                    disabled={locked}
                    onClick={() => !locked && onNavigate(item.id)}
                  >
                    <div className="sidebar-item-copy">
                      <span className="sidebar-item-label">{item.label}</span>
                      <span className="sidebar-item-description">{locked ? "Unlock later" : item.description}</span>
                    </div>
                    {meta?.badge && (
                      <span className={`sidebar-item-badge sidebar-item-badge-${meta.tone ?? "ready"}`}>
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
}
