import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  addArchivoCleas,
  deleteArchivoCleas,
  fetchArchivoCleas,
  uploadArchivoCleas,
} from "../store/useArchivosCleas";
import { useSiniestros } from "../store/useSiniestros";
import type { ArchivoCleas } from "../types";
import Badge from "./ui/Badge";
import { useToast } from "./ui/Toast";

type ArchivoCleasSectionProps = {
  siniestroId: string;
};

function ArchivoCleasSection({ siniestroId }: ArchivoCleasSectionProps) {
  const { siniestros } = useSiniestros();
  const siniestro = useMemo(
    () => siniestros.find((item) => item.id === siniestroId) ?? null,
    [siniestros, siniestroId],
  );
  const isCleas = siniestro?.cleas === true;

  const [archivo, setArchivo] = useState<ArchivoCleas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isCleas) {
      setArchivo(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const row = await fetchArchivoCleas(siniestroId);
        if (!cancelled) {
          setArchivo(row);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando archivo CLEAS:", error);
          showToast("No se pudo cargar el archivo CLEAS.", "warn");
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
  }, [isCleas, siniestroId, showToast]);

  async function handleCreatePending() {
    setIsSaving(true);
    try {
      const created = await addArchivoCleas(siniestroId);
      setArchivo(created);
      showToast("Archivo CLEAS marcado como pendiente.");
    } catch (error) {
      console.error("Error creando archivo CLEAS:", error);
      showToast("No se pudo crear el archivo CLEAS.", "warn");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpload(file: File) {
    if (!archivo) {
      return;
    }
    const isValid =
      file.type === "application/pdf" ||
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp";
    if (!isValid) {
      showToast("Solo se permite subir PDF, JPG, PNG o WEBP.", "warn");
      return;
    }

    setIsSaving(true);
    try {
      await uploadArchivoCleas(archivo.id, siniestroId, file);
      const refreshed = await fetchArchivoCleas(siniestroId);
      setArchivo(refreshed);
      showToast("Archivo CLEAS subido.");
    } catch (error) {
      console.error("Error subiendo archivo CLEAS:", error);
      showToast("No se pudo subir el archivo CLEAS.", "warn");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      await handleUpload(file);
    }
    event.target.value = "";
  }

  async function handleDelete() {
    if (!archivo) {
      return;
    }
    const ok = window.confirm("Eliminar archivo CLEAS?");
    if (!ok) {
      return;
    }
    setIsSaving(true);
    try {
      await deleteArchivoCleas(archivo.id);
      setArchivo(null);
      showToast("Archivo CLEAS eliminado.");
    } catch (error) {
      console.error("Error eliminando archivo CLEAS:", error);
      showToast("No se pudo eliminar el archivo CLEAS.", "warn");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isCleas) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">
          Archivo CLEAS
        </h4>
        {isSaving ? <span className="text-xs text-[#6b6860]">Procesando...</span> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleChooseFile}
      />

      {isLoading ? (
        <p className="text-sm text-[#6b6860]">Cargando archivo CLEAS...</p>
      ) : !archivo ? (
        <button
          type="button"
          onClick={() => void handleCreatePending()}
          disabled={isSaving}
          className="inline-flex rounded-lg border border-[#d0cdc7] bg-white px-3 py-2 text-sm font-semibold text-[#1a1916] transition hover:bg-[#f8f7f4] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Marcar como pendiente
        </button>
      ) : archivo.estado === "pendiente" ? (
        <div className="space-y-3">
          <span className="inline-flex rounded px-2 py-0.5 text-xs font-semibold bg-[#fff4e8] text-[#d97706]">
            Pendiente
          </span>
          <div
            className={`cursor-pointer rounded-[12px] border-2 border-dashed p-8 text-center transition ${
              dragging
                ? "border-[#1d4ed8] bg-[#eff4ff]"
                : "border-[#d0cdc7] bg-[#f5f4f1]"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) {
                void handleUpload(file);
              }
            }}
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-sm font-medium text-[#1a1916]">
              {dragging ? "Soltá para subir" : "Arrastrá archivos acá o hacé click para seleccionar"}
            </p>
            <p className="mt-1 text-xs text-[#6b6860]">JPG, PNG, WEBP, PDF</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="green">Cargado</Badge>
          </div>
          {archivo.archivo_url ? (
            <a
              href={archivo.archivo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm font-medium text-[#1d4ed8] underline-offset-2 hover:underline"
            >
              {archivo.archivo_nombre || "Ver archivo"}
            </a>
          ) : (
            <p className="text-sm text-[#6b6860]">Archivo no disponible.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isSaving}
              className="inline-flex rounded-lg border border-[#d0cdc7] bg-white px-3 py-2 text-sm font-semibold text-[#1a1916] transition hover:bg-[#f8f7f4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reemplazar
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isSaving}
              className="inline-flex rounded-lg border border-[#f3d4cf] bg-[#fdf0ef] px-3 py-2 text-sm font-semibold text-[#c0392b] transition hover:bg-[#fbe6e3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default ArchivoCleasSection;
