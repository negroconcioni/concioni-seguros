import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ArchivosSection from "./ArchivosSection";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import Toggle from "./ui/Toggle";
import { uploadArchivo } from "../store/useArchivos";
import { useToast } from "./ui/Toast";
import { useSiniestros } from "../store/useSiniestros";
import type { Siniestro } from "../types";
import { isCleas } from "../utils/cleas";

const INSPECTORS = [
  "Rojas",
  "Ferrazzani",
  "Salas",
  "Rizza",
  "Pozzo",
  "Pertile",
  "Perez",
  "ZURICH",
] as const;

const FORM_ID = "siniestro-modal-form";

/** Solo `YYYY-MM-DD` válido para <input type="date">; si no, vacío (evita valores raros del browser). */
function toDateInputValue(raw: string | undefined): string {
  const s = (raw ?? "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return "";
  }
  return s;
}

type SiniestroModalProps = {
  open: boolean;
  onClose: () => void;
  editingId?: string | null;
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#a8a59f] max-md:mb-1.5 max-md:text-[13px] max-md:font-semibold max-md:normal-case max-md:tracking-normal max-md:text-[#454440]">
      {children}
    </h4>
  );
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#c0392b]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v6h5" />
      <path d="M9 15h6M9 18h6" />
    </svg>
  );
}

function emptyFormState() {
  return {
    inspector: "",
    nombre: "",
    apellido: "",
    nro: "",
    danio: "",
    taller: "",
    fpedido: "",
    fentrega: "",
    proveedor: "",
    reclamo: false,
    rfecha: "",
    cia: "",
    franquicia: false,
    monto_franquicia: "",
  };
}

function loadFromSiniestro(s: Siniestro) {
  return {
    inspector: s.inspector,
    nombre: s.nombre,
    apellido: s.apellido,
    nro: s.nro,
    danio: s.danio,
    taller: s.taller,
    fpedido: toDateInputValue(s.fpedido),
    fentrega: toDateInputValue(s.fentrega),
    proveedor: s.proveedor,
    reclamo: s.reclamo,
    rfecha: s.rfecha ? toDateInputValue(s.rfecha) : "",
    cia: s.cia,
    franquicia: s.franquicia,
    monto_franquicia: s.monto_franquicia != null ? String(s.monto_franquicia) : "",
  };
}

function SiniestroModal({ open, onClose, editingId = null }: SiniestroModalProps) {
  const { siniestros, addSiniestro, updateSiniestro } = useSiniestros();
  const { showToast } = useToast();
  const siniestrosRef = useRef(siniestros);
  siniestrosRef.current = siniestros;

  const [form, setForm] = useState(emptyFormState);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Solo al abrir / cambiar modo de edición: si incluimos `siniestros` aquí, cada evento en tiempo real
  // resetea el formulario y oculta campos condicionales (ej. monto de franquicia).
  useEffect(() => {
    if (!open) {
      setForm(emptyFormState());
      setPendingFiles([]);
      setIsSaving(false);
      return;
    }
    if (!editingId) {
      setForm(emptyFormState());
      setPendingFiles([]);
      return;
    }
    const found = siniestrosRef.current.find((x) => x.id === editingId);
    if (found) {
      setForm(loadFromSiniestro(found));
    } else {
      setForm(emptyFormState());
    }
  }, [open, editingId]);

  const inspectorOptions = useMemo(() => {
    if (form.inspector && !INSPECTORS.includes(form.inspector as (typeof INSPECTORS)[number])) {
      return [form.inspector, ...INSPECTORS];
    }
    return [...INSPECTORS];
  }, [form.inspector]);

  const ciaTrimmed = form.cia.trim();
  const cleasPreview = ciaTrimmed ? isCleas(form.cia) : null;

  function handleCancel() {
    if (isSaving) {
      return;
    }
    onClose();
  }

  function filePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  function handlePickFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const accepted = files.filter(
      (f) =>
        f.type === "image/jpeg" ||
        f.type === "image/png" ||
        f.type === "image/webp" ||
        f.type === "application/pdf",
    );
    const rejected = files.length - accepted.length;
    if (rejected > 0) {
      showToast("Algunos archivos no son validos. Solo JPG, PNG, WEBP o PDF.", "warn");
    }
    if (accepted.length > 0) {
      setPendingFiles((prev) => [...prev, ...accepted]);
    }
    event.target.value = "";
  }

  function handleRemovePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) {
      return;
    }
    const inspectorOk = form.inspector.trim();
    const nombreOk = form.nombre.trim();
    const apellidoOk = form.apellido.trim();
    const nroOk = form.nro.trim();
    if (!inspectorOk || !nombreOk || !apellidoOk || !nroOk) {
      showToast("Completa inspector, nombre, apellido y numero de siniestro.", "warn");
      return;
    }
    if (form.reclamo && !form.rfecha.trim()) {
      showToast("Indica la fecha del reclamo o desactiva el reclamo de repuestos.", "warn");
      return;
    }

    const cleas = isCleas(form.cia);
    const montoFranquiciaParsed = (() => {
      if (!form.franquicia) {
        return null;
      }
      const t = form.monto_franquicia.trim();
      if (!t) {
        return null;
      }
      const n = Number(t);
      return Number.isFinite(n) && n >= 0 ? n : null;
    })();
    const payload: Omit<Siniestro, "id" | "created" | "emailSent"> = {
      inspector: inspectorOk,
      nombre: nombreOk,
      apellido: apellidoOk,
      nro: nroOk,
      danio: form.danio.trim(),
      taller: form.taller.trim(),
      fpedido: form.fpedido,
      fentrega: form.fentrega,
      proveedor: form.proveedor.trim(),
      reclamo: form.reclamo,
      rfecha: form.reclamo ? form.rfecha : "",
      cia: form.cia.trim(),
      cleas,
      franquicia: form.franquicia,
      monto_franquicia: montoFranquiciaParsed,
    };

    setIsSaving(true);
    if (editingId) {
      updateSiniestro(editingId, payload);
      setIsSaving(false);
      onClose();
    } else {
      const created = await addSiniestro(payload);
      if (!created?.id) {
        setIsSaving(false);
        showToast("No se pudo crear el siniestro.", "warn");
        return;
      }
      if (pendingFiles.length > 0) {
        try {
          for (const file of pendingFiles) {
            await uploadArchivo(file, created.id, null);
          }
        } catch (error) {
          console.error("Error subiendo archivos del siniestro nuevo:", error);
          showToast("El siniestro se guardo, pero algunos archivos no se pudieron subir.", "warn");
        }
      }
      setIsSaving(false);
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? "Editar siniestro" : "Nuevo siniestro"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" type="button" onClick={handleCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar siniestro"}
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div>
          <SectionLabel>Inspector</SectionLabel>
          <select
            required
            value={form.inspector}
            onChange={(e) => setForm((f) => ({ ...f, inspector: e.target.value }))}
            className="w-full rounded-lg border border-[#d0cdc7] bg-white px-3 py-2.5 text-sm text-[#1a1916] outline-none transition"
          >
            <option value="" disabled>
              Seleccionar inspector
            </option>
            {inspectorOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <SectionLabel>Datos del asegurado</SectionLabel>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre"
              className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
            />
            <input
              required
              value={form.apellido}
              onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
              placeholder="Apellido"
              className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
            />
            <input
              required
              value={form.nro}
              onChange={(e) => setForm((f) => ({ ...f, nro: e.target.value }))}
              placeholder="Nro. Siniestro"
              className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
            />
          </div>
        </div>

        <div>
          <SectionLabel>Daño y taller</SectionLabel>
          <textarea
            value={form.danio}
            onChange={(e) => setForm((f) => ({ ...f, danio: e.target.value }))}
            placeholder="Descripcion del daño"
            rows={4}
            className="mb-3 w-full resize-y rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
          />
          <input
            value={form.taller}
            onChange={(e) => setForm((f) => ({ ...f, taller: e.target.value }))}
            placeholder="Nombre del taller"
            className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
          />
        </div>

        <div>
          <SectionLabel>Repuestos</SectionLabel>
          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <label className="mb-1 block text-xs font-medium text-[#6b6860] max-md:mb-1.5 max-md:text-[13px] max-md:text-[#454440]">
                Fecha pedido
              </label>
              <input
                type="date"
                autoComplete="off"
                value={form.fpedido || ""}
                onChange={(e) => setForm((f) => ({ ...f, fpedido: e.target.value }))}
                className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-xs font-medium text-[#6b6860] max-md:mb-1.5 max-md:text-[13px] max-md:text-[#454440]">
                Fecha entrega estimada
              </label>
              <input
                type="date"
                autoComplete="off"
                value={form.fentrega || ""}
                onChange={(e) => setForm((f) => ({ ...f, fentrega: e.target.value }))}
                className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
              />
            </div>
          </div>
          <input
            value={form.proveedor}
            onChange={(e) => setForm((f) => ({ ...f, proveedor: e.target.value }))}
            placeholder="Casa proveedora"
            className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
          />
        </div>

        <div>
          <SectionLabel>Reclamo de repuestos</SectionLabel>
          <Toggle
            checked={form.reclamo}
            onChange={(next) => setForm((f) => ({ ...f, reclamo: next, rfecha: next ? f.rfecha : "" }))}
            label="Se realizo reclamo de repuestos?"
          />
          {form.reclamo ? (
            <div className="mt-3 min-w-0">
              <label className="mb-1 block text-xs font-medium text-[#6b6860] max-md:mb-1.5 max-md:text-[13px] max-md:text-[#454440]">
                Fecha del reclamo
              </label>
              <input
                type="date"
                autoComplete="off"
                value={form.rfecha || ""}
                onChange={(e) => setForm((f) => ({ ...f, rfecha: e.target.value }))}
                className="w-full max-w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition md:max-w-xs"
              />
            </div>
          ) : null}
        </div>

        <div>
          <SectionLabel>Compania de terceros</SectionLabel>
          <input
            value={form.cia}
            onChange={(e) => setForm((f) => ({ ...f, cia: e.target.value }))}
            placeholder="Compania"
            className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
          />
          {ciaTrimmed ? (
            <div
              className={`mt-2 rounded-lg px-3 py-2 text-sm font-medium ${
                cleasPreview
                  ? "bg-[#eff4ff] text-[#1d4ed8]"
                  : "bg-[#eeecea] text-[#6b6860]"
              }`}
            >
              {cleasPreview ? "Aplica para CLEAS" : "No aplica para CLEAS"}
            </div>
          ) : null}
        </div>

        <div>
          <SectionLabel>Carta de franquicia</SectionLabel>
          <Toggle
            checked={form.franquicia}
            onChange={(next) =>
              setForm((f) => ({
                ...f,
                franquicia: next,
                monto_franquicia: next ? f.monto_franquicia : "",
              }))
            }
            label="Aplica carta de franquicia?"
          />
          {form.franquicia ? (
            <div className="mt-3 min-w-0">
              <label className="mb-1 block text-xs font-medium text-[#6b6860] max-md:mb-1.5 max-md:text-[13px] max-md:text-[#454440]">
                Monto de franquicia
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={form.monto_franquicia}
                onChange={(e) => setForm((f) => ({ ...f, monto_franquicia: e.target.value }))}
                className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
              />
            </div>
          ) : null}
        </div>

        <div>
          <SectionLabel>ARCHIVOS ADJUNTOS</SectionLabel>
          {!editingId ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-[#6b6860]">Se subiran al guardar el siniestro.</p>
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#d0cdc7] bg-white px-3 py-1.5 text-sm font-medium text-[#6b6860] transition hover:bg-[#f5f4f1] hover:text-[#1a1916]">
                  Subir archivo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    multiple
                    className="hidden"
                    onChange={handlePickFiles}
                    disabled={isSaving}
                  />
                </label>
              </div>

              {isSaving && pendingFiles.length > 0 ? (
                <p className="text-xs text-[#6b6860]">Subiendo archivos...</p>
              ) : null}

              {pendingFiles.length === 0 ? (
                <p className="text-sm text-[#6b6860]">Sin archivos seleccionados</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {pendingFiles.map((file, index) => {
                    const isPdf = file.type === "application/pdf";
                    const previewUrl = !isPdf ? filePreviewUrl(file) : "";
                    return (
                      <article
                        key={`${file.name}-${file.size}-${index}`}
                        className="relative overflow-hidden rounded-lg border border-[#e2e0db] bg-white"
                      >
                        <button
                          type="button"
                          className="absolute right-2 top-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm text-white transition hover:bg-black/80"
                          aria-label="Quitar archivo"
                          onClick={() => handleRemovePendingFile(index)}
                          disabled={isSaving}
                        >
                          ×
                        </button>
                        {isPdf ? (
                          <div className="flex h-[120px] w-full flex-col items-center justify-center gap-2 bg-[#f5f4f1] px-3">
                            <PdfIcon />
                            <p className="line-clamp-2 text-center text-xs font-medium text-[#1a1916]">
                              {file.name}
                            </p>
                          </div>
                        ) : (
                          <img
                            src={previewUrl}
                            alt={file.name}
                            className="h-[120px] w-full object-cover"
                            onLoad={() => URL.revokeObjectURL(previewUrl)}
                          />
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <ArchivosSection siniestroId={editingId} reclamoId={null} />
          )}
        </div>
      </form>
    </Modal>
  );
}

export default SiniestroModal;
