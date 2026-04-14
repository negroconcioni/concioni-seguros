import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { deleteArchivo, fetchArchivos, uploadArchivo } from "../store/useArchivos";
import type { Archivo } from "../types";
import Button from "./ui/Button";
import { useToast } from "./ui/Toast";

type ArchivosSectionProps = {
  siniestroId: string;
  reclamoId: string | null;
};

function extractStoragePath(url: string): string {
  const marker = "/storage/v1/object/public/siniestros-archivos/";
  const idx = url.indexOf(marker);
  if (idx >= 0) {
    return decodeURIComponent(url.slice(idx + marker.length));
  }
  const trimmed = url.replace(/^\/+/, "");
  return decodeURIComponent(trimmed);
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-12 w-12 text-[#c0392b]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v6h5" />
      <path d="M9 15h6M9 18h6" />
    </svg>
  );
}

function ArchivosSection({ siniestroId, reclamoId }: ArchivosSectionProps) {
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const rows = await fetchArchivos(siniestroId);
        if (!cancelled) {
          setArchivos(rows);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando archivos:", error);
          showToast("No se pudieron cargar los archivos.", "warn");
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
  }, [siniestroId, showToast]);

  const visibleArchivos = useMemo(
    () =>
      archivos.filter((a) =>
        reclamoId === null ? a.reclamo_id === null : a.reclamo_id === reclamoId,
      ),
    [archivos, reclamoId],
  );

  async function handleChooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    try {
      const created = await uploadArchivo(file, siniestroId, reclamoId);
      setArchivos((prev) => [created, ...prev]);
      showToast("Archivo subido correctamente.");
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      showToast("No se pudo subir el archivo.", "warn");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleDelete(archivo: Archivo) {
    const ok = window.confirm(`Eliminar archivo "${archivo.nombre}"?`);
    if (!ok) {
      return;
    }

    try {
      await deleteArchivo(archivo.id, extractStoragePath(archivo.url));
      setArchivos((prev) => prev.filter((a) => a.id !== archivo.id));
      showToast("Archivo eliminado.");
    } catch (error) {
      console.error("Error eliminando archivo:", error);
      showToast("No se pudo eliminar el archivo.", "warn");
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">Archivos</h4>
        <div className="flex items-center gap-2">
          {isUploading ? <span className="text-xs text-[#6b6860]">Subiendo...</span> : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            Subir archivo
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleChooseFile}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-[#6b6860]">Cargando archivos...</p>
      ) : visibleArchivos.length === 0 ? (
        <p className="text-sm text-[#6b6860]">Sin archivos adjuntos</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visibleArchivos.map((archivo) => (
            <article
              key={archivo.id}
              className="relative overflow-hidden rounded-lg border border-[#e2e0db] bg-white"
            >
              <button
                type="button"
                className="absolute right-2 top-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm text-white transition hover:bg-black/80"
                title="Eliminar"
                aria-label="Eliminar archivo"
                onClick={() => handleDelete(archivo)}
              >
                ×
              </button>

              {archivo.tipo === "image" ? (
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => window.open(archivo.url, "_blank", "noopener,noreferrer")}
                  title={archivo.nombre}
                >
                  <img
                    src={archivo.url}
                    alt={archivo.nombre}
                    className="h-[120px] w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ) : (
                <button
                  type="button"
                  className="flex h-[120px] w-full flex-col items-center justify-center gap-2 bg-[#f5f4f1] px-3"
                  onClick={() => window.open(archivo.url, "_blank", "noopener,noreferrer")}
                  title={archivo.nombre}
                >
                  <PdfIcon />
                  <p className="line-clamp-2 text-center text-xs font-medium text-[#1a1916]">{archivo.nombre}</p>
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ArchivosSection;
