import type { ActiveView } from "../../types/views";

type SidebarProps = {
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  onOpenConfig: () => void;
  activeAlerts: number;
};

const links: { view: ActiveView; label: string; icon: "grid" | "list" | "bell" }[] = [
  { view: "dashboard", label: "Dashboard", icon: "grid" },
  { view: "siniestros", label: "Siniestros", icon: "list" },
  { view: "alertas", label: "Alertas", icon: "bell" },
];

function Icon({ kind }: { kind: "grid" | "list" | "bell" | "gear" }) {
  if (kind === "grid") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (kind === "list") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="17" x2="20" y2="17" />
      </svg>
    );
  }

  if (kind === "bell") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
        <path d="M7 10a5 5 0 1 1 10 0v4l2 2H5l2-2z" />
        <path d="M10 18a2 2 0 0 0 4 0" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1 1a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1 1 0 0 1-1 1h-1.4a1 1 0 0 1-1-1v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0l-1-1a1 1 0 0 1 0-1.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1 1 0 0 1-1-1v-1.4a1 1 0 0 1 1-1h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4l1-1a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2H8a1 1 0 0 0 .6-.9V4a1 1 0 0 1 1-1h1.4a1 1 0 0 1 1 1v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1V8a1 1 0 0 0 .9.6H20a1 1 0 0 1 1 1V11a1 1 0 0 1-1 1h-.2a1 1 0 0 0-.9.6Z" />
    </svg>
  );
}

function Sidebar({ activeView, onChangeView, onOpenConfig, activeAlerts }: SidebarProps) {
  return (
    <aside className="flex min-h-screen w-[232px] flex-col border-r border-[#e2e0db] bg-white">
      <div className="px-6 pb-5 pt-7">
        <h1 className="text-[18px] font-bold text-[#1a1916]">Concioni Seguros</h1>
        <p className="mt-1 text-[11.5px] text-[#a8a59f]">Gestion de Siniestros</p>
      </div>

      <nav className="space-y-1 px-3">
        {links.map((link) => {
          const isActive = activeView === link.view;
          return (
            <button
              key={link.view}
              type="button"
              onClick={() => onChangeView(link.view)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                isActive
                  ? "bg-[#1d4ed8] text-white"
                  : "text-[#6b6860] hover:bg-[#f5f4f1] hover:text-[#1a1916]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon kind={link.icon} />
                {link.label}
              </span>
              {link.view === "alertas" && activeAlerts > 0 ? (
                <span
                  className={`inline-flex min-w-5 items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                    isActive ? "bg-white text-[#1d4ed8]" : "bg-[#c0392b] text-white"
                  }`}
                >
                  {activeAlerts}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-4">
        <button
          type="button"
          onClick={onOpenConfig}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[#6b6860] transition hover:bg-[#f5f4f1] hover:text-[#1a1916]"
        >
          <Icon kind="gear" />
          Configuracion
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
