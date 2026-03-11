export type PageId = "currency" | "upgrades" | "maps" | "prestige" | "talents";

type NavItem = {
  id: PageId;
  label: string;
  icon: string;
  unlockKey?: string;
};

const navItems: NavItem[] = [
  { id: "currency", label: "Currency", icon: "\u2692" },
  { id: "upgrades", label: "Upgrades", icon: "\u25B2", unlockKey: "upgrades" },
  { id: "maps", label: "Maps", icon: "\uD83D\uDDFA\uFE0F", unlockKey: "maps" },
  { id: "prestige", label: "Prestige", icon: "\uD83D\uDD2E", unlockKey: "prestige" },
  { id: "talents", label: "Talents", icon: "\u2B50", unlockKey: "talents" },
];

type SidebarProps = {
  activePage: PageId;
  unlockedPages: Record<string, boolean>;
  onNavigate: (page: PageId) => void;
};

function Sidebar({ activePage, unlockedPages, onNavigate }: SidebarProps) {
  return (
    <nav className="sidebar">
      {navItems.map((item) => {
        const locked = item.unlockKey ? !unlockedPages[item.unlockKey] : false;
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
          </button>
        );
      })}
    </nav>
  );
}

export default Sidebar;
