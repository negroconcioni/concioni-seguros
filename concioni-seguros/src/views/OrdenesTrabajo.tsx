import { useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { supabase } from "../lib/supabase";

type OrdenesTrabajoProps = {
  onOpenSiniestroDetail: (id: string) => void;
};

type FilterKey = "todos" | "pendientes" | "cargadas";

type SiniestroJoin = {
  id: string;
  nombre: string;
  apellido: string;
  nro: string;
  inspector: string;
};

type OrdenRow = {
  id: string;
  siniestro_id: string;
  estado: "pendiente" | "cargada";
  archivo_url: string | null;
  archivo_nombre: string | null;
  siniestros: SiniestroJoin | SiniestroJoin[] | null;
};

function readSiniestroJoin(value: OrdenRow["siniestros"]): SiniestroJoin | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function rowToOrden(row: Record<string, unknown>): OrdenRow {
  return {
    id: String(row.id ?? ""),
    siniestro_id: String(row.siniestro_id ?? ""),
    estado: row.estado === "cargada" ? "cargada" : "pendiente",
    archivo_url: row.archivo_url == null ? null : String(row.archivo_url),
    archivo_nombre: row.archivo_nombre == null ? null : String(row.archivo_nombre),
    siniestros: (row.siniestros ?? null) as OrdenRow["siniestros"],
  };
}

function OrdenesTrabajo({ onOpenSiniestroDetail }: OrdenesTrabajoProps) {
  const [ordenes, setOrdenes] = useState<OrdenRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("todos");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("ordenes_trabajo")
          .select("*, siniestros(id, nombre, apellido, nro, inspector)");

        if (error) {
          throw error;
        }

        if (!cancelled) {
          setOrdenes((data ?? []).map((row) => rowToOrden(row as Record<string, unknown>)));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando ordenes de trabajo:", error);
          setOrdenes([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "pendientes") return ordenes.filter((o) => o.estado === "pendiente");
    if (filter === "cargadas") return ordenes.filter((o) => o.estado === "cargada");
    return ordenes;
  }, [ordenes, filter]);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[#e2e0db] bg-white p-4">
        <h3 className="text-base font-semibold text-[#1a1916]">Ordenes de trabajo</h3>
        <p className="mt-1 text-sm text-[#6b6860]">Siniestros con orden de trabajo registrada.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["todos", "Todos"],
          ["pendientes", "Pendientes"],
          ["cargadas", "Cargadas"],
        ] as Array<[FilterKey, string]>).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              filter === key
                ? "border-[#1d4ed8] bg-[#eff4ff] text-[#1d4ed8]"
                : "border-[#d0cdc7] bg-white text-[#6b6860] hover:bg-[#f5f4f1]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-[#e2e0db] bg-white px-6 py-10 text-center text-sm text-[#6b6860]">
          Cargando ordenes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#e2e0db] bg-white px-6 py-10 text-center text-sm text-[#6b6860]">
          No hay ordenes para este filtro.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-[10px] md:hidden">
            {filtered.map((o) => {
              const siniestro = readSiniestroJoin(o.siniestros);
              const asegurado = siniestro ? `${siniestro.nombre} ${siniestro.apellido}`.trim() : "—";
              return (
                <article key={o.id} className="rounded-[12px] border border-[#e2e0db] bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-[#1a1916]">{asegurado}</p>
                  <p className="mt-1 text-sm text-[#6b6860]">
                    {siniestro?.nro || "—"}
                    {siniestro?.inspector ? (
                      <>
                        <span className="mx-1.5 text-[#d0cdc7]" aria-hidden>
                          ·
                        </span>
                        {siniestro.inspector}
                      </>
                    ) : null}
                  </p>
                  <div className="mt-2">
                    <Badge variant={o.estado === "pendiente" ? "orange" : "green"}>
                      {o.estado === "pendiente" ? "Pendiente" : "Cargada"}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    {o.archivo_url ? (
                      <a
                        href={o.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#1d4ed8] underline-offset-2 hover:underline"
                      >
                        {o.archivo_nombre || "Ver archivo"}
                      </a>
                    ) : (
                      <p className="text-sm text-[#6b6860]">—</p>
                    )}
                  </div>
                  <div className="mt-4 border-t border-[#eeecea] pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => onOpenSiniestroDetail(o.siniestro_id)}
                    >
                      Ver detalle del siniestro
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-[#e2e0db] bg-white md:block">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e2e0db] bg-[#f5f4f1] text-xs font-semibold uppercase tracking-wide text-[#6b6860]">
                  <th className="px-4 py-3">Asegurado</th>
                  <th className="px-4 py-3">Nro. Siniestro</th>
                  <th className="px-4 py-3">Inspector</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Archivo</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const siniestro = readSiniestroJoin(o.siniestros);
                  const asegurado = siniestro ? `${siniestro.nombre} ${siniestro.apellido}`.trim() : "—";
                  return (
                    <tr key={o.id} className="border-b border-[#eeecea] last:border-0">
                      <td className="px-4 py-3 text-[#1a1916]">{asegurado}</td>
                      <td className="px-4 py-3 font-medium text-[#1a1916]">{siniestro?.nro || "—"}</td>
                      <td className="px-4 py-3 text-[#6b6860]">{siniestro?.inspector || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={o.estado === "pendiente" ? "orange" : "green"}>
                          {o.estado === "pendiente" ? "Pendiente" : "Cargada"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#6b6860]">
                        {o.archivo_url ? (
                          <a
                            href={o.archivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[#1d4ed8] underline-offset-2 hover:underline"
                          >
                            {o.archivo_nombre || "Ver archivo"}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenSiniestroDetail(o.siniestro_id)}
                        >
                          Ver detalle
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export default OrdenesTrabajo;
