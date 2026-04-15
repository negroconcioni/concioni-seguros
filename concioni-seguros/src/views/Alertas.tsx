import { useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import { supabase } from "../lib/supabase";
import { fetchReclamosPendientes } from "../store/useReclamos";
import { useSiniestros } from "../store/useSiniestros";
import type { ReclamoTercero, Siniestro } from "../types";
import { formatDate, getDiffDays } from "../utils/date";

type AlertasProps = {
  onOpenSiniestroDetail: (id: string) => void;
};

type SiniestroSummary = {
  id: string;
  nombre: string;
  apellido: string;
  nro: string;
  inspector: string;
};

type JoinedRow = {
  siniestro_id: string;
  siniestros:
    | {
        id?: string;
        nombre?: string;
        apellido?: string;
        nro?: string;
        inspector?: string;
      }
    | Array<{
        id?: string;
        nombre?: string;
        apellido?: string;
        nro?: string;
        inspector?: string;
      }>
    | null;
};

function rowToSummary(row: JoinedRow): SiniestroSummary | null {
  const joined = Array.isArray(row.siniestros) ? row.siniestros[0] : row.siniestros;
  if (!joined) return null;
  const id = String(joined.id ?? row.siniestro_id ?? "");
  if (!id) return null;
  return {
    id,
    nombre: String(joined.nombre ?? ""),
    apellido: String(joined.apellido ?? ""),
    nro: String(joined.nro ?? ""),
    inspector: String(joined.inspector ?? ""),
  };
}

function hasFentrega(s: Siniestro): boolean {
  return Boolean(s.fentrega?.trim());
}

function deliveryDiff(s: Siniestro): number | null {
  if (!hasFentrega(s)) return null;
  return getDiffDays(s.fentrega);
}

function isAlertaEntrega(s: Siniestro): boolean {
  const d = deliveryDiff(s);
  if (d === null) return false;
  return d < 0 || (d >= 0 && d <= 3);
}

function rowDotClass(diff: number): string {
  if (diff < 0) return "bg-[#c0392b]";
  return "bg-[#1d4ed8]";
}

function alertMessage(diff: number): string {
  if (diff < 0) {
    const n = -diff;
    return n === 1 ? "Entrega vencida hace 1 dia" : `Entrega vencida hace ${n} dias`;
  }
  if (diff === 0) return "Entrega hoy";
  return diff === 1 ? "Entrega en 1 dia" : `Entrega en ${diff} dias`;
}

function Alertas({ onOpenSiniestroDetail }: AlertasProps) {
  const { siniestros } = useSiniestros();
  const [reclamosPendientes, setReclamosPendientes] = useState<ReclamoTercero[]>([]);
  const [ordenesPendientes, setOrdenesPendientes] = useState<SiniestroSummary[]>([]);
  const [cleasPendientes, setCleasPendientes] = useState<SiniestroSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await fetchReclamosPendientes();
        if (!cancelled) {
          setReclamosPendientes(rows);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando reclamos pendientes:", error);
          setReclamosPendientes([]);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadPendings = async () => {
      try {
        const [ordenesRes, cleasRes] = await Promise.all([
          supabase
            .from("ordenes_trabajo")
            .select("siniestro_id, siniestros(id, nombre, apellido, nro, inspector)")
            .eq("estado", "pendiente"),
          supabase
            .from("archivos_cleas")
            .select("siniestro_id, siniestros(id, nombre, apellido, nro, inspector)")
            .eq("estado", "pendiente"),
        ]);

        if (cancelled) return;

        if (ordenesRes.error) {
          console.error("Error cargando ordenes pendientes:", ordenesRes.error);
          setOrdenesPendientes([]);
        } else {
          const mapped = (ordenesRes.data ?? [])
            .map((row) => rowToSummary(row as unknown as JoinedRow))
            .filter((row): row is SiniestroSummary => row !== null);
          setOrdenesPendientes(mapped);
        }

        if (cleasRes.error) {
          console.error("Error cargando CLEAS pendientes:", cleasRes.error);
          setCleasPendientes([]);
        } else {
          const mapped = (cleasRes.data ?? [])
            .map((row) => rowToSummary(row as unknown as JoinedRow))
            .filter((row): row is SiniestroSummary => row !== null);
          setCleasPendientes(mapped);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando pendientes de ordenes/CLEAS:", error);
          setOrdenesPendientes([]);
          setCleasPendientes([]);
        }
      }
    };
    void loadPendings();
    return () => {
      cancelled = true;
    };
  }, []);

  const lista = useMemo(() => {
    const items = siniestros.filter(isAlertaEntrega);
    items.sort((a, b) => {
      const da = deliveryDiff(a) ?? 0;
      const db = deliveryDiff(b) ?? 0;
      return da - db;
    });
    return items;
  }, [siniestros]);

  const listaReclamos = useMemo(() => {
    const seen = new Set<string>();
    const rows: Siniestro[] = [];
    for (const r of reclamosPendientes) {
      if (seen.has(r.siniestro_id)) continue;
      const found = siniestros.find((s) => s.id === r.siniestro_id);
      if (found) {
        seen.add(r.siniestro_id);
        rows.push(found);
      }
    }
    return rows;
  }, [reclamosPendientes, siniestros]);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[#f3d8d5] border-l-4 border-l-[#c0392b] bg-white p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-[#1a1916]">Entregas de repuestos</h3>
          <Badge variant="red">{lista.length}</Badge>
        </div>
        {lista.length === 0 ? (
          <p className="mt-3 text-sm text-[#6b6860]">Sin alertas en esta categoría.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {lista.map((s) => {
              const d = deliveryDiff(s) ?? 0;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onOpenSiniestroDetail(s.id)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[#e2e0db] bg-white px-4 py-3 text-left transition hover:bg-[#f5f4f1]"
                  >
                    <span
                      className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${rowDotClass(d)}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1a1916]">
                        {`${s.nombre} ${s.apellido}`.trim()} — {s.nro}
                      </p>
                      <p className="mt-0.5 text-sm text-[#1d4ed8]">{alertMessage(d)}</p>
                      <p className="mt-1 text-xs text-[#6b6860]">
                        {s.inspector} — {s.taller}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs font-medium text-[#6b6860]">
                      {formatDate(s.fentrega)}
                    </time>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-[#f5d8ad] border-l-4 border-l-[#b45309] bg-[#fffbf5] p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-[#b45309]">Reclamos contra terceros pendientes</h3>
          <Badge variant="orange">{listaReclamos.length}</Badge>
        </div>
        {listaReclamos.length === 0 ? (
          <p className="mt-3 text-sm text-[#6b6860]">Sin alertas en esta categoría.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {listaReclamos.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onOpenSiniestroDetail(s.id)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[#f5d8ad] bg-white px-4 py-3 text-left transition hover:bg-[#fff7f0]"
                >
                  <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#b45309]" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1a1916]">
                      {`${s.nombre} ${s.apellido}`.trim()} — {s.nro}
                    </p>
                    <p className="mt-1 text-xs text-[#6b6860]">{s.inspector}</p>
                  </div>
                  <Badge variant="orange">Pendiente</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-[#fce7cc] border-l-4 border-l-[#d97706] bg-[#fff7ed] p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-[#d97706]">Órdenes de trabajo pendientes</h3>
          <Badge variant="orange">{ordenesPendientes.length}</Badge>
        </div>
        {ordenesPendientes.length === 0 ? (
          <p className="mt-3 text-sm text-[#6b6860]">Sin alertas en esta categoría.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {ordenesPendientes.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onOpenSiniestroDetail(s.id)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[#f5d8ad] bg-white px-4 py-3 text-left transition hover:bg-[#fff7f0]"
                >
                  <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#d97706]" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1a1916]">
                      {`${s.nombre} ${s.apellido}`.trim()} — {s.nro}
                    </p>
                    <p className="mt-1 text-xs text-[#6b6860]">{s.inspector}</p>
                  </div>
                  <Badge variant="orange">Pendiente</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-[#c7d7fc] border-l-4 border-l-[#1d4ed8] bg-[#eff4ff] p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-[#1d4ed8]">Archivos CLEAS pendientes</h3>
          <Badge variant="blue">{cleasPendientes.length}</Badge>
        </div>
        {cleasPendientes.length === 0 ? (
          <p className="mt-3 text-sm text-[#6b6860]">Sin alertas en esta categoría.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {cleasPendientes.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onOpenSiniestroDetail(s.id)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[#c7d7fc] bg-white px-4 py-3 text-left transition hover:bg-[#f4f8ff]"
                >
                  <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1a1916]">
                      {`${s.nombre} ${s.apellido}`.trim()} — {s.nro}
                    </p>
                    <p className="mt-1 text-xs text-[#6b6860]">{s.inspector}</p>
                  </div>
                  <Badge variant="blue">Pendiente</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Alertas;
