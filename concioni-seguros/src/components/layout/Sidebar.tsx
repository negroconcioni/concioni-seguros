import type { ActiveView } from "../../types/views";

type SidebarProps = {
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  onOpenConfig: () => void;
  activeAlerts: number;
  /** Solo viewport menor a 768px: drawer abierto o cerrado */
  mobileOpen: boolean;
};

const links: { view: ActiveView; label: string; icon: "grid" | "list" | "bell" | "doc" }[] = [
  { view: "dashboard", label: "Dashboard", icon: "grid" },
  { view: "siniestros", label: "Siniestros", icon: "list" },
  { view: "alertas", label: "Alertas", icon: "bell" },
  { view: "reclamos", label: "Reclamos", icon: "doc" },
];

function Icon({ kind }: { kind: "grid" | "list" | "bell" | "doc" | "gear" }) {
  if (kind === "grid") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (kind === "list") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth="1.8">
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="17" x2="20" y2="17" />
      </svg>
    );
  }

  if (kind === "bell") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth="1.8">
        <path d="M7 10a5 5 0 1 1 10 0v4l2 2H5l2-2z" />
        <path d="M10 18a2 2 0 0 0 4 0" />
      </svg>
    );
  }

  if (kind === "doc") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth="1.8">
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v6h5" />
        <path d="M9 13h6M9 16h6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1 1a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1 1 0 0 1-1 1h-1.4a1 1 0 0 1-1-1v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0l-1-1a1 1 0 0 1 0-1.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1 1 0 0 1-1-1v-1.4a1 1 0 0 1 1-1h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4l1-1a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2H8a1 1 0 0 0 .6-.9V4a1 1 0 0 1 1-1h1.4a1 1 0 0 1 1 1v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1V8a1 1 0 0 0 .9.6H20a1 1 0 0 1 1 1V11a1 1 0 0 1-1 1h-.2a1 1 0 0 0-.9.6Z" />
    </svg>
  );
}

function Sidebar({ activeView, onChangeView, onOpenConfig, activeAlerts, mobileOpen }: SidebarProps) {
  return (
    <aside
      className={[
        "flex min-h-screen w-[232px] flex-col border-r border-[#e2e0db] bg-white transition-transform duration-200 ease-out",
        "fixed inset-y-0 left-0 z-50 shadow-xl md:relative md:inset-auto md:z-0 md:w-16 md:shadow-none lg:w-[232px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
      ].join(" ")}
    >
      <div className="border-b border-[#e2e0db] px-6 pb-5 pt-7 md:px-2 md:pb-4 md:pt-6 lg:px-6 lg:pb-5 lg:pt-7">
        <h1 className="text-center text-[18px] font-bold text-[#1a1916] lg:text-left">
          <span className="hidden max-md:block lg:block">Concioni Seguros</span>
          <span className="hidden md:block lg:hidden" aria-hidden>
            CS
          </span>
        </h1>
        <p className="mt-1 hidden max-md:block text-[11.5px] text-[#a8a59f] md:hidden lg:block">
          Gestion de Siniestros
        </p>
      </div>

      <nav className="space-y-1 px-3 md:px-2 lg:px-3">
        {links.map((link) => {
          const isActive = activeView === link.view;
          return (
            <button
              key={link.view}
              type="button"
              title={link.label}
              onClick={() => onChangeView(link.view)}
              className={[
                "relative flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
                "md:justify-center md:px-2 lg:justify-between lg:px-3",
                isActive
                  ? "bg-[#1d4ed8] text-white"
                  : "text-[#6b6860] hover:bg-[#f5f4f1] hover:text-[#1a1916]",
              ].join(" ")}
            >
              <span className="flex items-center gap-2.5 md:gap-0 lg:gap-2.5">
                <Icon kind={link.icon} />
                <span className="md:hidden lg:inline">{link.label}</span>
              </span>
              {link.view === "alertas" && activeAlerts > 0 ? (
                <span
                  className={[
                    "inline-flex min-w-5 items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-semibold",
                    "md:absolute md:right-1 md:top-1 md:min-w-[1.125rem] md:px-1 md:py-0 md:text-[10px]",
                    "lg:static lg:min-w-5 lg:px-1.5 lg:py-0.5 lg:text-[11px]",
                    isActive ? "bg-white text-[#1d4ed8]" : "bg-[#c0392b] text-white",
                  ].join(" ")}
                >
                  {activeAlerts}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-4 md:px-2 lg:px-3">
        <button
          type="button"
          title="Configuracion"
          onClick={onOpenConfig}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[#6b6860] transition hover:bg-[#f5f4f1] hover:text-[#1a1916] md:justify-center md:px-2 lg:justify-start lg:px-3"
        >
          <Icon kind="gear" />
          <span className="md:hidden lg:inline">Configuracion</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
