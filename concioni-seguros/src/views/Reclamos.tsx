import { useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import type { TipoReclamo } from "../types";
import { formatDate } from "../utils/date";

type ReclamosProps = {
  onOpenSiniestroDetail: (id: string) => void;
};

type SiniestroJoin = {
  nombre: string;
  apellido: string;
  nro: string;
  inspector: string;
};

type ReclamoRow = {
  id: string;
  siniestro_id: string;
  estado: "pendiente" | "hecho";
  tipo_reclamo: TipoReclamo[];
  fecha_siniestro: string;
  siniestros: SiniestroJoin | SiniestroJoin[] | null;
};

function readSiniestroJoin(value: ReclamoRow["siniestros"]): SiniestroJoin | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function rowToReclamo(row: Record<string, unknown>): ReclamoRow {
  return {
    id: String(row.id ?? ""),
    siniestro_id: String(row.siniestro_id ?? ""),
    estado: row.estado === "hecho" ? "hecho" : "pendiente",
    tipo_reclamo: Array.isArray(row.tipo_reclamo) ? (row.tipo_reclamo as TipoReclamo[]) : [],
    fecha_siniestro: String(row.fecha_siniestro ?? ""),
    siniestros: (row.siniestros ?? null) as ReclamoRow["siniestros"],
  };
}

function Reclamos({ onOpenSiniestroDetail }: ReclamosProps) {
  const [reclamos, setReclamos] = useState<ReclamoRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("reclamos_terceros")
          .select("*, siniestros(nombre, apellido, nro, inspector)");

        if (error) {
          throw error;
        }
        if (!cancelled) {
          setReclamos((data ?? []).map((row) => rowToReclamo(row as Record<string, unknown>)));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando reclamos:", error);
          setReclamos([]);
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

  const sorted = useMemo(
    () =>
      [...reclamos].sort(
        (a, b) => new Date(b.fecha_siniestro || "1970-01-01").getTime() - new Date(a.fecha_siniestro || "1970-01-01").getTime(),
      ),
    [reclamos],
  );

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[#e2e0db] bg-white p-4">
        <h3 className="text-base font-semibold text-[#1a1916]">Reclamos contra terceros</h3>
        <p className="mt-1 text-sm text-[#6b6860]">Listado completo de reclamos registrados.</p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-[#e2e0db] bg-white px-6 py-10 text-center text-sm text-[#6b6860]">
          Cargando reclamos...
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-[#e2e0db] bg-white px-6 py-10 text-center text-sm text-[#6b6860]">
          No hay reclamos cargados.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-[10px] md:hidden">
            {sorted.map((r) => {
              const siniestro = readSiniestroJoin(r.siniestros);
              const asegurado = siniestro ? `${siniestro.nombre} ${siniestro.apellido}`.trim() : "—";
              return (
                <article
                  key={r.id}
                  className="rounded-[12px] border border-[#e2e0db] bg-white p-4 shadow-sm"
                >
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
                  <p className="mt-2 text-sm text-[#1a1916]">{formatDate(r.fecha_siniestro)}</p>
                  <div className="mt-2">
                    <Badge variant={r.estado === "pendiente" ? "red" : "green"}>
                      {r.estado === "pendiente" ? "Pendiente" : "Hecho"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.tipo_reclamo.length > 0 ? (
                      r.tipo_reclamo.map((tipo) => (
                        <Badge key={tipo} variant="blue">
                          {tipo}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="neutral">Sin tipo</Badge>
                    )}
                  </div>
                  <div className="mt-4 border-t border-[#eeecea] pt-4">
                    <Button type="button" variant="outline" className="w-full" onClick={() => onOpenSiniestroDetail(r.siniestro_id)}>
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
                  <th className="px-4 py-3">Tipos de reclamo</th>
                  <th className="px-4 py-3">Fecha del siniestro</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const siniestro = readSiniestroJoin(r.siniestros);
                  const asegurado = siniestro ? `${siniestro.nombre} ${siniestro.apellido}`.trim() : "—";
                  return (
                    <tr key={r.id} className="border-b border-[#eeecea] last:border-0">
                      <td className="px-4 py-3 text-[#1a1916]">{asegurado}</td>
                      <td className="px-4 py-3 font-medium text-[#1a1916]">{siniestro?.nro || "—"}</td>
                      <td className="px-4 py-3 text-[#6b6860]">{siniestro?.inspector || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={r.estado === "pendiente" ? "red" : "green"}>
                          {r.estado === "pendiente" ? "Pendiente" : "Hecho"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {r.tipo_reclamo.length > 0 ? (
                            r.tipo_reclamo.map((tipo) => (
                              <Badge key={tipo} variant="blue">
                                {tipo}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="neutral">Sin tipo</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#6b6860]">{formatDate(r.fecha_siniestro)}</td>
                      <td className="px-4 py-3">
                        <Button type="button" variant="outline" size="sm" onClick={() => onOpenSiniestroDetail(r.siniestro_id)}>
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

export default Reclamos;
