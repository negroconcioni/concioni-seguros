import Button from "../ui/Button";

type TopbarProps = {
  title: string;
  onExportExcel: () => void;
  onNewSiniestro: () => void;
  isOnline: boolean;
  mobileNavOpen: boolean;
  onToggleMobileNav: () => void;
};

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function Topbar({ title, onExportExcel, onNewSiniestro, isOnline, mobileNavOpen, onToggleMobileNav }: TopbarProps) {
  return (
    <header className="border-b border-[#e2e0db] bg-white">
      {!isOnline ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 sm:px-6">
          Sin conexión — los cambios no se están guardando
        </div>
      ) : null}

      {/* Mobile: hamburguesa | título centrado | FAB + */}
      <div className="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-2 px-3 md:hidden">
        <button
          type="button"
          className="shrink-0 justify-self-start rounded-md p-2 text-[#1a1916] transition hover:bg-[#f5f4f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/20"
          onClick={onToggleMobileNav}
          aria-expanded={mobileNavOpen}
          aria-label={mobileNavOpen ? "Cerrar menu de navegacion" : "Abrir menu de navegacion"}
        >
          <MenuIcon />
        </button>
        <p className="min-w-0 truncate text-center text-[15px] font-semibold text-[#1a1916]">{title}</p>
        <button
          type="button"
          onClick={onNewSiniestro}
          aria-label="Nuevo siniestro"
          className="flex h-12 w-12 shrink-0 items-center justify-center justify-self-end rounded-full bg-[#1d4ed8] text-[28px] font-semibold leading-none text-white shadow-sm transition hover:bg-[#1a44c2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/30"
        >
          +
        </button>
      </div>

      {/* Tablet y desktop: fila compacta (md) o espaciada (lg) */}
      <div className="hidden h-14 items-center justify-between gap-3 px-4 md:flex lg:gap-4 lg:px-6">
        <p className="min-w-0 flex-1 truncate text-left text-[15px] font-semibold text-[#1a1916]">{title}</p>
        <div className="flex shrink-0 items-center gap-1.5 lg:gap-2">
          <Button
            variant="outline"
            type="button"
            size="sm"
            onClick={onExportExcel}
            className="px-2.5 text-xs lg:px-4 lg:text-sm"
          >
            Exportar Excel
          </Button>
          <Button
            variant="primary"
            type="button"
            size="sm"
            onClick={onNewSiniestro}
            className="px-2.5 text-xs lg:px-4 lg:text-sm"
          >
            + Nuevo Siniestro
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
