import { useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import { useSiniestros } from "../store/useSiniestros";
import type { Siniestro } from "../types";
import { formatDate, getDiffDays } from "../utils/date";

type FilterKey =
  | "todos"
  | "cleas"
  | "reclamo"
  | "vencidos"
  | "franquicia"
  | "con_archivos"
  | "sin_archivos";

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
  { key: "con_archivos", label: "Con archivos" },
  { key: "sin_archivos", label: "Sin archivos" },
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

function requiresRepuestos(s: Siniestro): boolean {
  const raw = (s as Siniestro & { requiere_repuestos?: boolean }).requiere_repuestos;
  return raw !== false;
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

const cardClass =
  "rounded-[12px] border border-[#e2e0db] bg-white p-4 shadow-sm";

type SiniestroCardProps = {
  s: Siniestro;
  onOpenSiniestroDetail: (id: string) => void;
  onOpenSiniestroEdit: (id: string) => void;
  onDelete: (s: Siniestro) => void;
};

function SiniestroCard({ s, onOpenSiniestroDetail, onOpenSiniestroEdit, onDelete }: SiniestroCardProps) {
  return (
    <article className={cardClass}>
      <p className="text-sm font-semibold text-[#1a1916]">{`${s.nombre} ${s.apellido}`.trim() || "—"}</p>
      <p className="mt-1 text-sm text-[#6b6860]">
        <span>{s.nro || "—"}</span>
        {s.inspector ? (
          <>
            <span className="mx-1.5 text-[#d0cdc7]" aria-hidden>
              ·
            </span>
            <span>{s.inspector}</span>
          </>
        ) : null}
      </p>
      <p className="mt-2 text-sm text-[#1a1916]">{s.taller || "—"}</p>
      <p className="mt-2 flex items-center gap-2 text-sm text-[#1a1916]">
        <span className={`h-2 w-2 shrink-0 rounded-full ${entregaDotClass(s)}`} aria-hidden />
        <span>{formatDate(s.fentrega)}</span>
      </p>
      {(s.cleas || s.franquicia) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {s.cleas ? <Badge variant="blue">CLEAS</Badge> : null}
          {s.franquicia ? <Badge variant="red">Franquicia</Badge> : null}
        </div>
      ) : null}
      <div className="mt-4 flex gap-2 border-t border-[#eeecea] pt-4">
        <Button
          variant="outline"
          type="button"
          className="flex-1"
          onClick={() => onOpenSiniestroDetail(s.id)}
          aria-label="Ver detalle"
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <IconView />
            Ver
          </span>
        </Button>
        <Button
          variant="outline"
          type="button"
          className="flex-1"
          onClick={() => onOpenSiniestroEdit(s.id)}
          aria-label="Editar"
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <IconEdit />
            Editar
          </span>
        </Button>
        <Button
          variant="danger-ghost"
          type="button"
          className="flex-1"
          onClick={() => onDelete(s)}
          aria-label="Eliminar"
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <IconDelete />
            Eliminar
          </span>
        </Button>
      </div>
    </article>
  );
}

function Siniestros({ onOpenSiniestroDetail, onOpenSiniestroEdit }: SiniestrosProps) {
  const { siniestros, deleteSiniestro } = useSiniestros();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos");
  const [siniestrosConArchivos, setSiniestrosConArchivos] = useState<Set<string>>(new Set());
  const [reclamoTerceroBySiniestro, setReclamoTerceroBySiniestro] = useState<
    Map<string, "pendiente" | "hecho">
  >(new Map());

  useEffect(() => {
    let cancelled = false;
    const loadArchivosBySiniestro = async () => {
      try {
        const { data, error } = await supabase.from("archivos").select("siniestro_id");
        if (error) {
          throw error;
        }
        if (cancelled) return;
        const next = new Set<string>();
        for (const row of data ?? []) {
          const id = String((row as { siniestro_id?: unknown }).siniestro_id ?? "");
          if (id) next.add(id);
        }
        setSiniestrosConArchivos(next);
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando archivos por siniestro:", error);
          setSiniestrosConArchivos(new Set());
        }
      }
    };
    void loadArchivosBySiniestro();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadReclamosTerceros = async () => {
      try {
        const { data, error } = await supabase.from("reclamos_terceros").select("siniestro_id, estado");
        if (error) {
          throw error;
        }
        if (cancelled) return;
        const next = new Map<string, "pendiente" | "hecho">();
        for (const row of data ?? []) {
          const id = String((row as { siniestro_id?: unknown }).siniestro_id ?? "");
          const estadoRaw = String((row as { estado?: unknown }).estado ?? "");
          if (!id) continue;
          const estado: "pendiente" | "hecho" = estadoRaw === "hecho" ? "hecho" : "pendiente";
          const prev = next.get(id);
          if (!prev || prev === "hecho") {
            next.set(id, estado);
          }
          if (prev === "pendiente") {
            next.set(id, "pendiente");
          }
        }
        setReclamoTerceroBySiniestro(next);
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando reclamos de terceros:", error);
          setReclamoTerceroBySiniestro(new Map());
        }
      }
    };
    void loadReclamosTerceros();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      siniestros
        .filter((s) => {
          if (activeFilter === "con_archivos") return siniestrosConArchivos.has(s.id);
          if (activeFilter === "sin_archivos") return !siniestrosConArchivos.has(s.id);
          return matchesFilter(s, activeFilter);
        })
        .filter((s) => matchesSearch(s, query))
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()),
    [siniestros, activeFilter, query, siniestrosConArchivos],
  );

  function handleDelete(s: Siniestro) {
    const ok = window.confirm(`Eliminar siniestro ${s.nro}? Esta accion no se puede deshacer.`);
    if (!ok) return;
    deleteSiniestro(s.id);
  }

  const emptyMessage = <p className="py-8 text-center text-sm text-[#6b6860]">No hay resultados para el filtro actual.</p>;

  const thDesktopOnly = "hidden px-3 py-3 lg:table-cell";
  const tdDesktopOnly = "hidden px-3 py-3 lg:table-cell";

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

      {/* Mobile: cards */}
      <div className="flex flex-col gap-[10px] md:hidden">
        {filtered.length === 0 ? (
          <div className={`${cardClass} py-6`}>{emptyMessage}</div>
        ) : (
          filtered.map((s) => (
            <SiniestroCard
              key={s.id}
              s={s}
              onOpenSiniestroDetail={onOpenSiniestroDetail}
              onOpenSiniestroEdit={onOpenSiniestroEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Tablet + desktop: tabla */}
      <div className="hidden overflow-x-auto rounded-xl border border-[#e2e0db] bg-white md:block">
        <table className="w-full min-w-0 text-left text-sm lg:min-w-[1100px]">
          <thead>
            <tr className="border-b border-[#e2e0db] bg-[#f5f4f1] text-xs font-semibold uppercase tracking-wide text-[#6b6860]">
              <th className="px-3 py-3">Inspector</th>
              <th className="px-3 py-3">Asegurado</th>
              <th className="px-3 py-3">Patente</th>
              <th className="px-3 py-3">Nro.</th>
              <th className={thDesktopOnly}>Daño</th>
              <th className="px-3 py-3">Taller</th>
              <th className={thDesktopOnly}>Pedido</th>
              <th className="px-3 py-3">Entrega rep.</th>
              <th className={thDesktopOnly}>Proveedor</th>
              <th className="px-3 py-3">Reclamo rep.</th>
              <th className="px-3 py-3">Reclamo terc.</th>
              <th className={thDesktopOnly}>Cia. Terceros</th>
              <th className="px-3 py-3">CLEAS</th>
              <th className="px-3 py-3">Franquicia</th>
              <th className="px-3 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-4 py-8 text-center text-[#6b6860]">
                  No hay resultados para el filtro actual.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-b border-[#eeecea] last:border-0 hover:bg-[#faf9f8]">
                  <td className="px-3 py-3">{s.inspector}</td>
                  <td className="px-3 py-3">{`${s.nombre} ${s.apellido}`.trim()}</td>
                  <td className="px-3 py-3">{s.patente || "—"}</td>
                  <td className="px-3 py-3 font-medium">{s.nro}</td>
                  <td className={tdDesktopOnly}>{s.danio}</td>
                  <td className="px-3 py-3">{s.taller}</td>
                  <td className={tdDesktopOnly}>{formatDate(s.fpedido)}</td>
                  <td className="px-3 py-3">
                    {requiresRepuestos(s) ? (
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${entregaDotClass(s)}`} aria-hidden />
                        {formatDate(s.fentrega)}
                      </span>
                    ) : (
                      <span className="text-[#6b6860]">No requiere</span>
                    )}
                  </td>
                  <td className={tdDesktopOnly}>{s.proveedor}</td>
                  <td className="px-3 py-3">
                    {requiresRepuestos(s) ? (
                      <Badge variant={s.reclamo ? "green" : "neutral"}>{s.reclamo ? "SI" : "NO"}</Badge>
                    ) : (
                      <span className="text-[#6b6860]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {reclamoTerceroBySiniestro.get(s.id) === "pendiente" ? (
                      <Badge variant="red">Pendiente</Badge>
                    ) : reclamoTerceroBySiniestro.get(s.id) === "hecho" ? (
                      <Badge variant="green">Hecho</Badge>
                    ) : (
                      <span className="text-[#6b6860]">—</span>
                    )}
                  </td>
                  <td className={tdDesktopOnly}>{s.cia}</td>
                  <td className="px-3 py-3">
                    <Badge variant={s.cleas ? "blue" : "neutral"}>{s.cleas ? "SI" : "NO"}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={s.franquicia ? "red" : "neutral"}>{s.franquicia ? "SI" : "NO"}</Badge>
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
