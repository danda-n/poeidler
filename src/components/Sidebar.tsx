type NavItem = {
  id: string;
  label: string;
  icon: string;
  locked: boolean;
};

const navItems: NavItem[] = [
  { id: "currency", label: "Currency", icon: "\u2692", locked: false },
  { id: "prestige", label: "Prestige", icon: "?", locked: true },
  { id: "achievements", label: "Achieve.", icon: "?", locked: true },
  { id: "statistics", label: "Stats", icon: "?", locked: true },
];

type SidebarProps = {
  activePage: string;
};

function Sidebar({ activePage }: SidebarProps) {
  return (
    <nav className="sidebar">
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`sidebar-item${item.id === activePage ? " sidebar-item-active" : ""}${item.locked ? " sidebar-item-locked" : ""}`}
          disabled={item.locked}
        >
          <span className="sidebar-item-icon">{item.icon}</span>
          <span className="sidebar-item-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default Sidebar;
