import { useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { useSiniestros } from "../store/useSiniestros";
import type { Siniestro } from "../types";
import { formatDate, getDiffDays } from "../utils/date";

type FilterKey = "todos" | "cleas" | "reclamo" | "vencidos" | "franquicia";

type SiniestrosProps = {
  onOpenSiniestroDetail: (id: string) => void;
  onOpenSiniestroEdit: (id: string) => void;
};

const filters: { key: FilterKey; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "cleas", label: "CLEAS" },
  { key: "reclamo", label: "Con reclamo" },
  { key: "vencidos", label: "Vencidos" },
  { key: "franquicia", label: "Franquicia" },
];

function IconView() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.9">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.9">
      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path d="m12.5 7.5 4 4" />
    </svg>
  );
}

function IconDelete() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.9">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
    </svg>
  );
}

function entregaDotClass(s: Siniestro): string {
  if (!s.fentrega) return "bg-[#d0cdc7]";
  const diff = getDiffDays(s.fentrega);
  if (diff < 0) return "bg-[#c0392b]";
  if (diff <= 3) return "bg-[#1d4ed8]";
  return "bg-[#2e7d52]";
}

function matchesFilter(s: Siniestro, filter: FilterKey): boolean {
  if (filter === "todos") return true;
  if (filter === "cleas") return s.cleas;
  if (filter === "reclamo") return s.reclamo;
  if (filter === "franquicia") return s.franquicia;
  if (filter === "vencidos") return Boolean(s.fentrega) && getDiffDays(s.fentrega) <= 0;
  return true;
}

function matchesSearch(s: Siniestro, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const searchText = [s.nombre, s.apellido, s.nro, s.inspector, s.taller].join(" ").toLowerCase();
  return searchText.includes(q);
}

function Siniestros({ onOpenSiniestroDetail, onOpenSiniestroEdit }: SiniestrosProps) {
  const { siniestros, deleteSiniestro } = useSiniestros();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos");

  const filtered = useMemo(
    () =>
      siniestros
        .filter((s) => matchesFilter(s, activeFilter))
        .filter((s) => matchesSearch(s, query))
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()),
    [siniestros, activeFilter, query],
  );

  function handleDelete(s: Siniestro) {
    const ok = window.confirm(`Eliminar siniestro ${s.nro}? Esta accion no se puede deshacer.`);
    if (!ok) return;
    deleteSiniestro(s.id);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-[#e2e0db] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, apellido, nro, inspector o taller"
          className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition sm:max-w-xl"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const active = item.key === activeFilter;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveFilter(item.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-[#1d4ed8] text-white"
                  : "border border-[#d0cdc7] bg-white text-[#6b6860] hover:bg-[#f5f4f1]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#e2e0db] bg-white">
        <table className="w-full min-w-[1300px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#e2e0db] bg-[#f5f4f1] text-xs font-semibold uppercase tracking-wide text-[#6b6860]">
              <th className="px-3 py-3">Inspector</th>
              <th className="px-3 py-3">Asegurado</th>
              <th className="px-3 py-3">Nro.</th>
              <th className="px-3 py-3">Daño</th>
              <th className="px-3 py-3">Taller</th>
              <th className="px-3 py-3">Pedido</th>
              <th className="px-3 py-3">Entrega est.</th>
              <th className="px-3 py-3">Proveedor</th>
              <th className="px-3 py-3">Reclamo</th>
              <th className="px-3 py-3">Cia. Terceros</th>
              <th className="px-3 py-3">CLEAS</th>
              <th className="px-3 py-3">Franquicia</th>
              <th className="px-3 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-[#6b6860]">
                  No hay resultados para el filtro actual.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-b border-[#eeecea] last:border-0 hover:bg-[#faf9f8]">
                  <td className="px-3 py-3">{s.inspector}</td>
                  <td className="px-3 py-3">{`${s.nombre} ${s.apellido}`.trim()}</td>
                  <td className="px-3 py-3 font-medium">{s.nro}</td>
                  <td className="px-3 py-3">{s.danio}</td>
                  <td className="px-3 py-3">{s.taller}</td>
                  <td className="px-3 py-3">{formatDate(s.fpedido)}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${entregaDotClass(s)}`} aria-hidden />
                      {formatDate(s.fentrega)}
                    </span>
                  </td>
                  <td className="px-3 py-3">{s.proveedor}</td>
                  <td className="px-3 py-3">
                    <Badge variant={s.reclamo ? "red" : "neutral"}>
                      {s.reclamo ? "SI" : "NO"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">{s.cia}</td>
                  <td className="px-3 py-3">
                    <Badge variant={s.cleas ? "blue" : "neutral"}>{s.cleas ? "SI" : "NO"}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={s.franquicia ? "red" : "neutral"}>
                      {s.franquicia ? "SI" : "NO"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onOpenSiniestroDetail(s.id)}
                        aria-label="Ver detalle"
                        title="Ver detalle"
                      >
                        <IconView />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onOpenSiniestroEdit(s.id)}
                        aria-label="Editar"
                        title="Editar"
                      >
                        <IconEdit />
                      </Button>
                      <Button
                        variant="danger-ghost"
                        size="icon"
                        onClick={() => handleDelete(s)}
                        aria-label="Eliminar"
                        title="Eliminar"
                      >
                        <IconDelete />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Siniestros;
