import { supabase } from "../lib/supabase";
import type { ReclamoTercero } from "../types";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function rowToReclamo(row: Record<string, unknown>): ReclamoTercero {
  return {
    id: String(row.id ?? ""),
    siniestro_id: String(row.siniestro_id ?? ""),
    estado: row.estado === "hecho" ? "hecho" : "pendiente",
    lugar: String(row.lugar ?? ""),
    fecha_siniestro: String(row.fecha_siniestro ?? ""),
    hora_siniestro: String(row.hora_siniestro ?? ""),
    direccion: String(row.direccion ?? ""),
    descripcion: String(row.descripcion ?? ""),
    tipo_reclamo: Array.isArray(row.tipo_reclamo)
      ? (row.tipo_reclamo as ReclamoTercero["tipo_reclamo"])
      : [],
    dominio_asegurado: String(row.dominio_asegurado ?? ""),
    dominio_tercero: String(row.dominio_tercero ?? ""),
    documento_asegurado: String(row.documento_asegurado ?? ""),
    documento_tercero: String(row.documento_tercero ?? ""),
    responsable_contacto: String(row.responsable_contacto ?? ""),
    telefono_contacto: String(row.telefono_contacto ?? ""),
    email_contacto: String(row.email_contacto ?? ""),
    created_at: String(row.created_at ?? ""),
  };
}

export async function fetchReclamos(siniestro_id: string): Promise<ReclamoTercero[]> {
  const { data, error } = await supabase
    .from("reclamos_terceros")
    .select("*")
    .eq("siniestro_id", siniestro_id);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => rowToReclamo(row as Record<string, unknown>));
}

export async function fetchReclamosPendientes(): Promise<ReclamoTercero[]> {
  const { data, error } = await supabase
    .from("reclamos_terceros")
    .select("*")
    .eq("estado", "pendiente");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => rowToReclamo(row as Record<string, unknown>));
}

export async function addReclamo(
  data: Omit<ReclamoTercero, "id" | "created_at">,
): Promise<ReclamoTercero> {
  const payload = {
    ...data,
    id: makeId(),
    created_at: new Date().toISOString(),
  };

  const { data: inserted, error } = await supabase
    .from("reclamos_terceros")
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return rowToReclamo(inserted as Record<string, unknown>);
}

export async function updateReclamo(id: string, data: Partial<ReclamoTercero>): Promise<void> {
  const { error } = await supabase.from("reclamos_terceros").update(data).eq("id", id);
  if (error) {
    throw error;
  }
}

export async function deleteReclamo(id: string): Promise<void> {
  const { error } = await supabase.from("reclamos_terceros").delete().eq("id", id);
  if (error) {
    throw error;
  }
}
