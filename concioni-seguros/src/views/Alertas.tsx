import { useMemo } from "react";
import { useSiniestros } from "../store/useSiniestros";
import type { Siniestro } from "../types";
import { formatDate, getDiffDays } from "../utils/date";

type AlertasProps = {
  onOpenSiniestroDetail: (id: string) => void;
};

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

  const lista = useMemo(() => {
    const items = siniestros.filter(isAlertaEntrega);
    items.sort((a, b) => {
      const da = deliveryDiff(a) ?? 0;
      const db = deliveryDiff(b) ?? 0;
      return da - db;
    });
    return items;
  }, [siniestros]);

  return (
    <section className="space-y-4">
      {lista.length === 0 ? (
        <div className="rounded-xl border border-[#e2e0db] bg-white px-6 py-12 text-center text-sm text-[#6b6860]">
          Sin alertas pendientes — Todo esta al dia
        </div>
      ) : (
        <ul className="space-y-2">
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
    </section>
  );
}

export default Alertas;
