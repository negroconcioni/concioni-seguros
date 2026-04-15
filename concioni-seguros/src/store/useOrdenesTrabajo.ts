import { supabase } from "../lib/supabase";
import type { OrdenTrabajo } from "../types";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function rowToOrdenTrabajo(row: Record<string, unknown>): OrdenTrabajo {
  return {
    id: String(row.id ?? ""),
    siniestro_id: String(row.siniestro_id ?? ""),
    estado: row.estado === "cargada" ? "cargada" : "pendiente",
    archivo_url: row.archivo_url == null ? null : String(row.archivo_url),
    archivo_nombre: row.archivo_nombre == null ? null : String(row.archivo_nombre),
    created_at: String(row.created_at ?? ""),
  };
}

export async function fetchOrdenesTrabajo(): Promise<OrdenTrabajo[]> {
  const { data, error } = await supabase.from("ordenes_trabajo").select("*");
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => rowToOrdenTrabajo(row as Record<string, unknown>));
}

export async function fetchOrdenTrabajo(siniestro_id: string): Promise<OrdenTrabajo | null> {
  const { data, error } = await supabase
    .from("ordenes_trabajo")
    .select("*")
    .eq("siniestro_id", siniestro_id)
    .limit(1);

  if (error) {
    throw error;
  }

  const row = data?.[0];
  return row ? rowToOrdenTrabajo(row as Record<string, unknown>) : null;
}

export async function addOrdenTrabajo(siniestro_id: string): Promise<OrdenTrabajo> {
  const payload = {
    id: makeId(),
    siniestro_id,
    estado: "pendiente" as const,
    archivo_url: null,
    archivo_nombre: null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("ordenes_trabajo").insert([payload]).select().single();
  if (error) {
    throw error;
  }

  return rowToOrdenTrabajo(data as Record<string, unknown>);
}

export async function uploadOrdenTrabajo(id: string, siniestro_id: string, file: File): Promise<void> {
  const path = `ordenes/${siniestro_id}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("siniestros-archivos")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/pdf",
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: urlData } = supabase.storage.from("siniestros-archivos").getPublicUrl(path);
  const url = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from("ordenes_trabajo")
    .update({
      estado: "cargada",
      archivo_url: url,
      archivo_nombre: file.name,
    })
    .eq("id", id);

  if (updateError) {
    throw updateError;
  }
}

export async function deleteOrdenTrabajo(id: string): Promise<void> {
  const { error } = await supabase.from("ordenes_trabajo").delete().eq("id", id);
  if (error) {
    throw error;
  }
}
