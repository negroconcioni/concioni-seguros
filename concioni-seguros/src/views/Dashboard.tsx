import { useMemo } from "react";
import Badge from "../components/ui/Badge";
import StatCard from "../components/ui/StatCard";
import { useSiniestros } from "../store/useSiniestros";
import type { Siniestro } from "../types";
import { formatDate, getDiffDays } from "../utils/date";

type DashboardProps = {
  onOpenSiniestroDetail: (id: string) => void;
};

function hasFentrega(s: Siniestro): boolean {
  return Boolean(s.fentrega?.trim());
}

function deliveryDiff(s: Siniestro): number | null {
  if (!hasFentrega(s)) return null;
  return getDiffDays(s.fentrega);
}

function entregaStatus(diff: number | null): "ok" | "soon" | "overdue" | "none" {
  if (diff === null) return "none";
  if (diff < 0) return "overdue";
  if (diff <= 3) return "soon";
  return "ok";
}

function dotClass(status: "ok" | "soon" | "overdue" | "none"): string {
  if (status === "overdue") return "bg-[#c0392b]";
  if (status === "soon") return "bg-[#1d4ed8]";
  if (status === "none") return "bg-[#d0cdc7]";
  return "bg-[#2e7d52]";
}

function alertDotClass(diff: number): string {
  if (diff < 0) return "bg-[#c0392b]";
  return "bg-[#1d4ed8]";
}

function entregaMessage(diff: number): string {
  if (diff < 0) {
    const n = -diff;
    return n === 1 ? "Entrega vencida hace 1 dia" : `Entrega vencida hace ${n} dias`;
  }
  if (diff === 0) return "Entrega vence hoy";
  return diff === 1 ? "Entrega en 1 dia" : `Entrega en ${diff} dias`;
}

function isAlertCandidate(s: Siniestro): boolean {
  const d = deliveryDiff(s);
  if (d === null) return false;
  return d < 0 || (d >= 0 && d <= 3);
}

const ultimoCardClass =
  "w-full rounded-[12px] border border-[#e2e0db] bg-white p-4 text-left shadow-sm transition hover:border-[#d0cdc7]";

type UltimoCardProps = {
  s: Siniestro;
  onOpen: (id: string) => void;
};

function UltimoSiniestroCard({ s, onOpen }: UltimoCardProps) {
  const diff = deliveryDiff(s);
  const status = entregaStatus(diff);
  return (
    <button type="button" onClick={() => onOpen(s.id)} className={ultimoCardClass}>
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
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass(status)}`} aria-hidden />
        <span>{formatDate(s.fentrega)}</span>
      </p>
      {(s.cleas || s.franquicia) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {s.cleas ? <Badge variant="blue">CLEAS</Badge> : null}
          {s.franquicia ? <Badge variant="red">Franquicia</Badge> : null}
        </div>
      ) : null}
    </button>
  );
}

function Dashboard({ onOpenSiniestroDetail }: DashboardProps) {
  const { siniestros } = useSiniestros();

  const total = siniestros.length;
  const vencidas = useMemo(
    () =>
      siniestros.filter((s) => {
        const d = deliveryDiff(s);
        return d !== null && d <= 0;
      }).length,
    [siniestros],
  );
  const cleasCount = useMemo(() => siniestros.filter((s) => s.cleas).length, [siniestros]);
  const reclamoCount = useMemo(() => siniestros.filter((s) => s.reclamo).length, [siniestros]);

  const alertas = useMemo(() => {
    const list = siniestros.filter(isAlertCandidate);
    list.sort((a, b) => {
      const da = deliveryDiff(a) ?? 0;
      const db = deliveryDiff(b) ?? 0;
      return da - db;
    });
    return list.slice(0, 5);
  }, [siniestros]);

  const ultimos = useMemo(() => {
    return [...siniestros]
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      .slice(0, 8);
  }, [siniestros]);

  return (
    <div className="space-y-5 md:space-y-8">
      <section>
        <h2 className="sr-only">Resumen</h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          <StatCard label="Total Siniestros" value={String(total)} inverted />
          <StatCard label="Entregas Vencidas" value={String(vencidas)} />
          <StatCard label="Aplican CLEAS" value={String(cleasCount)} />
          <StatCard label="Con Reclamo" value={String(reclamoCount)} />
        </div>
      </section>

      {alertas.length > 0 ? (
        <section className="w-full min-w-0 rounded-xl border border-[#c7d7fc] bg-[#eff4ff] p-4 md:p-5">
          <h3 className="text-base font-semibold text-[#1d4ed8]">Alertas de entrega pendientes</h3>
          <ul className="mt-3 space-y-2 md:mt-4 md:space-y-3">
            {alertas.map((s) => {
              const d = deliveryDiff(s) ?? 0;
              return (
                <li key={s.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenSiniestroDetail(s.id)}
                    className="flex w-full min-w-0 cursor-pointer flex-col gap-2 rounded-lg border border-transparent bg-white/60 p-3 text-left transition hover:border-[#e2e0db] hover:bg-white sm:flex-row sm:items-start sm:gap-3"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${alertDotClass(d)}`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#1a1916]">
                          {`${s.nombre} ${s.apellido}`.trim()} — {s.nro}
                        </p>
                        <p className="mt-0.5 text-sm text-[#1d4ed8]">{entregaMessage(d)}</p>
                        <p className="mt-1 text-xs text-[#6b6860]">
                          {s.inspector} — {s.taller}
                        </p>
                      </div>
                    </div>
                    <time className="shrink-0 text-xs font-medium text-[#6b6860] sm:pt-1.5">
                      {formatDate(s.fentrega)}
                    </time>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="min-w-0">
        <h3 className="mb-2 text-base font-semibold text-[#1a1916] md:mb-3 md:text-lg">Ultimos siniestros</h3>

        <div className="flex flex-col gap-[10px] md:hidden">
          {ultimos.length === 0 ? (
            <div className="rounded-[12px] border border-[#e2e0db] bg-white p-6 text-center text-sm text-[#6b6860] shadow-sm">
              No hay siniestros registrados.
            </div>
          ) : (
            ultimos.map((s) => <UltimoSiniestroCard key={s.id} s={s} onOpen={onOpenSiniestroDetail} />)
          )}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border border-[#e2e0db] bg-white md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e2e0db] bg-[#f5f4f1] text-xs font-semibold uppercase tracking-wide text-[#6b6860]">
                <th className="px-4 py-3">Inspector</th>
                <th className="px-4 py-3">Asegurado</th>
                <th className="px-4 py-3">Nro. Siniestro</th>
                <th className="px-4 py-3">Taller</th>
                <th className="px-4 py-3">Entrega est.</th>
                <th className="px-4 py-3">CLEAS</th>
                <th className="px-4 py-3">Franquicia</th>
              </tr>
            </thead>
            <tbody>
              {ultimos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#6b6860]">
                    No hay siniestros registrados.
                  </td>
                </tr>
              ) : (
                ultimos.map((s) => {
                  const diff = deliveryDiff(s);
                  const status = entregaStatus(diff);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => onOpenSiniestroDetail(s.id)}
                      className="cursor-pointer border-b border-[#eeecea] last:border-0 hover:bg-[#f5f4f1]"
                    >
                      <td className="px-4 py-3 text-[#1a1916]">{s.inspector}</td>
                      <td className="px-4 py-3 text-[#1a1916]">{`${s.nombre} ${s.apellido}`.trim()}</td>
                      <td className="px-4 py-3 font-medium text-[#1a1916]">{s.nro}</td>
                      <td className="px-4 py-3 text-[#6b6860]">{s.taller}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${dotClass(status)}`}
                            aria-hidden
                          />
                          <span className="text-[#1a1916]">{formatDate(s.fentrega)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#6b6860]">{s.cleas ? "Si" : "No"}</td>
                      <td className="px-4 py-3 text-[#6b6860]">{s.franquicia ? "Si" : "No"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
