import * as XLSX from "xlsx";
import type { Siniestro } from "../types";
import { formatDate } from "./date";

function boolToText(value: boolean) {
  return value ? "SI" : "NO";
}

function formatIsoDate(value: string) {
  if (!value) {
    return "—";
  }
  return formatDate(value.slice(0, 10));
}

function todayYmd() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function exportToExcel(siniestros: Siniestro[]): void {
  const rows = siniestros.map((s) => ({
    id: s.id,
    inspector: s.inspector,
    nombre: s.nombre,
    apellido: s.apellido,
    nro: s.nro,
    patente: s.patente,
    danio: s.danio,
    taller: s.taller,
    fpedido: formatDate(s.fpedido),
    fentrega: formatDate(s.fentrega),
    proveedor: s.proveedor,
    reclamo: boolToText(s.reclamo),
    rfecha: formatDate(s.rfecha),
    cia: s.cia,
    cleas: boolToText(s.cleas),
    franquicia: boolToText(s.franquicia),
    "Monto Franquicia":
      s.monto_franquicia != null
        ? s.monto_franquicia.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "—",
    created: formatIsoDate(s.created),
    emailSent: boolToText(s.emailSent),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Siniestros");
  XLSX.writeFile(workbook, `siniestros_${todayYmd()}.xlsx`);
}
