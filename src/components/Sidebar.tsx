import { NAV_ITEMS, type View } from "../lib/navigation";

type SidebarProps = {
  activeView: View;
  onChange: (view: View) => void;
};

export function Sidebar({ activeView, onChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">V</div>
        <div>
          <strong>Veil</strong>
          <span>Private vault</span>
        </div>
      </div>

      <nav>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={activeView === item.id ? "nav-item active" : "nav-item"}
            onClick={() => onChange(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
