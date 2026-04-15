import { supabase } from "../lib/supabase";
import type { ArchivoCleas } from "../types";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function rowToArchivoCleas(row: Record<string, unknown>): ArchivoCleas {
  return {
    id: String(row.id ?? ""),
    siniestro_id: String(row.siniestro_id ?? ""),
    estado: row.estado === "cargado" ? "cargado" : "pendiente",
    archivo_url: row.archivo_url == null ? null : String(row.archivo_url),
    archivo_nombre: row.archivo_nombre == null ? null : String(row.archivo_nombre),
    created_at: String(row.created_at ?? ""),
  };
}

export async function fetchArchivoCleas(siniestro_id: string): Promise<ArchivoCleas | null> {
  const { data, error } = await supabase
    .from("archivos_cleas")
    .select("*")
    .eq("siniestro_id", siniestro_id)
    .limit(1);

  if (error) {
    throw error;
  }

  const row = data?.[0];
  return row ? rowToArchivoCleas(row as Record<string, unknown>) : null;
}

export async function addArchivoCleas(siniestro_id: string): Promise<ArchivoCleas> {
  const payload = {
    id: makeId(),
    siniestro_id,
    estado: "pendiente" as const,
    archivo_url: null,
    archivo_nombre: null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("archivos_cleas").insert([payload]).select().single();
  if (error) {
    throw error;
  }

  return rowToArchivoCleas(data as Record<string, unknown>);
}

export async function uploadArchivoCleas(id: string, siniestro_id: string, file: File): Promise<void> {
  const path = `cleas/${siniestro_id}/${Date.now()}-${file.name}`;

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
    .from("archivos_cleas")
    .update({
      estado: "cargado",
      archivo_url: url,
      archivo_nombre: file.name,
    })
    .eq("id", id);

  if (updateError) {
    throw updateError;
  }
}

export async function deleteArchivoCleas(id: string): Promise<void> {
  const { error } = await supabase.from("archivos_cleas").delete().eq("id", id);
  if (error) {
    throw error;
  }
}
