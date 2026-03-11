export type PageId = "currency" | "upgrades" | "maps" | "prestige" | "talents";
export type PageMeta = {
  badge?: string;
  tone?: "active" | "ready" | "alert";
};

type NavGroup = "core" | "longterm";

type NavItem = {
  id: PageId;
  label: string;
  icon: string;
  group: NavGroup;
  unlockKey?: string;
};

const navItems: NavItem[] = [
  { id: "currency", label: "Play", icon: "\u2692", group: "core" },
  { id: "upgrades", label: "Upgrades", icon: "\u25B2", group: "core", unlockKey: "upgrades" },
  { id: "maps", label: "Maps", icon: "\uD83D\uDDFA\uFE0F", group: "core", unlockKey: "maps" },
  { id: "prestige", label: "Prestige", icon: "\uD83D\uDD2E", group: "longterm", unlockKey: "prestige" },
  { id: "talents", label: "Talents", icon: "\u2B50", group: "longterm", unlockKey: "talents" },
];

const navGroups: { id: NavGroup; label: string }[] = [
  { id: "core", label: "Now" },
  { id: "longterm", label: "Long-term" },
];

type SidebarProps = {
  activePage: PageId;
  unlockedPages: Record<string, boolean>;
  pageMeta?: Partial<Record<PageId, PageMeta>>;
  onNavigate: (page: PageId) => void;
};

function Sidebar({ activePage, unlockedPages, pageMeta = {}, onNavigate }: SidebarProps) {
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
                    <span className="sidebar-item-icon">{item.icon}</span>
                    <span className="sidebar-item-label">{item.label}</span>
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

export default Sidebar;
