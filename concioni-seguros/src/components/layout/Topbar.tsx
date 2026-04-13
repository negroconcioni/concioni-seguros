import Button from "../ui/Button";

type TopbarProps = {
  title: string;
  onExportExcel: () => void;
  onNewSiniestro: () => void;
  isOnline: boolean;
};

function Topbar({ title, onExportExcel, onNewSiniestro, isOnline }: TopbarProps) {
  return (
    <header className="border-b border-[#e2e0db] bg-white">
      {!isOnline ? (
        <div className="border-b border-red-200 bg-red-50 px-6 py-2 text-sm font-medium text-red-700">
          Sin conexión — los cambios no se están guardando
        </div>
      ) : null}
      <div className="flex h-14 items-center justify-between px-6">
        <p className="text-[15px] font-semibold text-[#1a1916]">{title}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" type="button" onClick={onExportExcel}>
            Exportar Excel
          </Button>
          <Button variant="primary" type="button" onClick={onNewSiniestro}>
            + Nuevo Siniestro
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
