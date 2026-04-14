import { supabase } from "../lib/supabase";
import type { Archivo } from "../types";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function rowToArchivo(row: Record<string, unknown>): Archivo {
  return {
    id: String(row.id ?? ""),
    siniestro_id: String(row.siniestro_id ?? ""),
    reclamo_id: row.reclamo_id == null ? null : String(row.reclamo_id),
    nombre: String(row.nombre ?? ""),
    url: String(row.url ?? ""),
    tipo: row.tipo === "pdf" ? "pdf" : "image",
    created_at: String(row.created_at ?? ""),
  };
}

export async function uploadArchivo(
  file: File,
  siniestro_id: string,
  reclamo_id: string | null,
): Promise<Archivo> {
  const tipo: Archivo["tipo"] = file.type.startsWith("image/") ? "image" : "pdf";
  const nombreUnico = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const path = `${siniestro_id}/${nombreUnico}`;

  const { error } = await supabase.storage
    .from("siniestros-archivos")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error(error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from("siniestros-archivos")
    .getPublicUrl(path);
  const url = urlData.publicUrl;

  const payload = {
    id: makeId(),
    siniestro_id,
    reclamo_id,
    nombre: file.name,
    url,
    tipo,
    created_at: new Date().toISOString(),
  };

  const { data: inserted, error: insertError } = await supabase
    .from("archivos")
    .insert([payload])
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  return rowToArchivo(inserted as Record<string, unknown>);
}

export async function fetchArchivos(siniestro_id: string): Promise<Archivo[]> {
  const { data, error } = await supabase.from("archivos").select("*").eq("siniestro_id", siniestro_id);
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => rowToArchivo(row as Record<string, unknown>));
}

export async function deleteArchivo(id: string, path: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from("siniestros-archivos").remove([path]);
  if (storageError) {
    throw storageError;
  }

  const { error: dbError } = await supabase.from("archivos").delete().eq("id", id);
  if (dbError) {
    throw dbError;
  }
}
