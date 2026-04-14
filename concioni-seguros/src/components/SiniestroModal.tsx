import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ArchivosSection from "./ArchivosSection";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import Toggle from "./ui/Toggle";
import { uploadArchivo } from "../store/useArchivos";
import { addReclamo } from "../store/useReclamos";
import { useToast } from "./ui/Toast";
import { useSiniestros } from "../store/useSiniestros";
import type { Siniestro, TipoReclamo } from "../types";
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

type NewReclamoForm = {
  estado: "pendiente" | "hecho";
  lugar: string;
  fecha_siniestro: string;
  hora_siniestro: string;
  direccion: string;
  descripcion: string;
  tipo_reclamo: TipoReclamo[];
  dominio_asegurado: string;
  dominio_tercero: string;
  documento_asegurado: string;
  documento_tercero: string;
  responsable_contacto: string;
  telefono_contacto: string;
  email_contacto: string;
};

const TIPO_RECLAMO_OPTIONS: { value: TipoReclamo; label: string }[] = [
  { value: "daño vehicular", label: "Daño vehicular" },
  { value: "daños materiales", label: "Daños a cosas materiales" },
  { value: "lesiones", label: "Lesiones" },
];

function emptyReclamoForm(): NewReclamoForm {
  return {
    estado: "pendiente",
    lugar: "",
    fecha_siniestro: "",
    hora_siniestro: "",
    direccion: "",
    descripcion: "",
    tipo_reclamo: [],
    dominio_asegurado: "",
    dominio_tercero: "",
    documento_asegurado: "",
    documento_tercero: "",
    responsable_contacto: "",
    telefono_contacto: "",
    email_contacto: "",
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
  const [addReclamoInline, setAddReclamoInline] = useState(false);
  const [reclamoForm, setReclamoForm] = useState<NewReclamoForm>(emptyReclamoForm);

  // Solo al abrir / cambiar modo de edición: si incluimos `siniestros` aquí, cada evento en tiempo real
  // resetea el formulario y oculta campos condicionales (ej. monto de franquicia).
  useEffect(() => {
    if (!open) {
      setForm(emptyFormState());
      setPendingFiles([]);
      setIsSaving(false);
      setAddReclamoInline(false);
      setReclamoForm(emptyReclamoForm());
      return;
    }
    if (!editingId) {
      setForm(emptyFormState());
      setPendingFiles([]);
      setAddReclamoInline(false);
      setReclamoForm(emptyReclamoForm());
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

  function toggleTipoReclamo(value: TipoReclamo) {
    setReclamoForm((prev) => {
      const exists = prev.tipo_reclamo.includes(value);
      return {
        ...prev,
        tipo_reclamo: exists ? prev.tipo_reclamo.filter((x) => x !== value) : [...prev.tipo_reclamo, value],
      };
    });
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
      if (addReclamoInline) {
        try {
          await addReclamo({
            siniestro_id: created.id,
            estado: reclamoForm.estado,
            lugar: reclamoForm.lugar.trim(),
            fecha_siniestro: reclamoForm.fecha_siniestro,
            hora_siniestro: reclamoForm.hora_siniestro,
            direccion: reclamoForm.direccion.trim(),
            descripcion: reclamoForm.descripcion.trim(),
            tipo_reclamo: reclamoForm.tipo_reclamo,
            dominio_asegurado: reclamoForm.dominio_asegurado.trim(),
            dominio_tercero: reclamoForm.dominio_tercero.trim(),
            documento_asegurado: reclamoForm.documento_asegurado.trim(),
            documento_tercero: reclamoForm.documento_tercero.trim(),
            responsable_contacto: reclamoForm.responsable_contacto.trim(),
            telefono_contacto: reclamoForm.telefono_contacto.trim(),
            email_contacto: reclamoForm.email_contacto.trim(),
          });
        } catch (error) {
          console.error("Error creando reclamo contra terceros:", error);
          showToast("El siniestro se guardo, pero el reclamo no se pudo crear.", "warn");
        }
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

        {!editingId ? (
          <div className="space-y-3">
            <SectionLabel>RECLAMO CONTRA TERCEROS</SectionLabel>
            <Toggle
              checked={addReclamoInline}
              onChange={(next) => {
                setAddReclamoInline(next);
                if (!next) {
                  setReclamoForm(emptyReclamoForm());
                }
              }}
              label="¿Agregar reclamo contra terceros?"
            />

            {addReclamoInline ? (
              <div className="space-y-5 rounded-xl border border-[#e2e0db] bg-[#faf9f8] p-4">
                <section>
                  <h5 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">Estado</h5>
                  <div className="inline-flex rounded-lg border border-[#d0cdc7] p-1">
                    <button
                      type="button"
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        reclamoForm.estado === "pendiente"
                          ? "bg-[#c0392b] text-white"
                          : "text-[#6b6860] hover:bg-[#f5f4f1]"
                      }`}
                      onClick={() => setReclamoForm((prev) => ({ ...prev, estado: "pendiente" }))}
                    >
                      Pendiente
                    </button>
                    <button
                      type="button"
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        reclamoForm.estado === "hecho"
                          ? "bg-[#2e7d52] text-white"
                          : "text-[#6b6860] hover:bg-[#f5f4f1]"
                      }`}
                      onClick={() => setReclamoForm((prev) => ({ ...prev, estado: "hecho" }))}
                    >
                      Hecho
                    </button>
                  </div>
                </section>

                <section className="space-y-3">
                  <h5 className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">Datos del siniestro</h5>
                  <input
                    value={reclamoForm.lugar}
                    onChange={(e) => setReclamoForm((prev) => ({ ...prev, lugar: e.target.value }))}
                    placeholder="Lugar del siniestro"
                    className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
                  />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      type="date"
                      value={reclamoForm.fecha_siniestro}
                      onChange={(e) => setReclamoForm((prev) => ({ ...prev, fecha_siniestro: e.target.value }))}
                      className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
                    />
                    <input
                      type="time"
                      value={reclamoForm.hora_siniestro}
                      onChange={(e) => setReclamoForm((prev) => ({ ...prev, hora_siniestro: e.target.value }))}
                      className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
                    />
                  </div>
                  <input
                    value={reclamoForm.direccion}
                    onChange={(e) => setReclamoForm((prev) => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Direccion del siniestro"
                    className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
                  />
                  <textarea
                    rows={3}
                    value={reclamoForm.descripcion}
                    onChange={(e) => setReclamoForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripcion del siniestro"
                    className="w-full resize-y rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
                  />
                </section>

                <section className="space-y-2">
                  <h5 className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">Tipo de reclamo</h5>
                  {TIPO_RECLAMO_OPTIONS.map((item) => (
                    <label key={item.value} className="flex items-center gap-2 text-sm text-[#1a1916]">
                      <input
                        type="checkbox"
                        checked={reclamoForm.tipo_reclamo.includes(item.value)}
                        onChange={() => toggleTipoReclamo(item.value)}
                      />
                      {item.label}
                    </label>
                  ))}
                </section>

                <section className="space-y-3">
                  <h5 className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">Vehiculos</h5>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      value={reclamoForm.dominio_asegurado}
                      onChange={(e) => setReclamoForm((prev) => ({ ...prev, dominio_asegurado: e.target.value }))}
                      placeholder="Dominio vehiculo asegurado"
                      className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
                    />
                    <input
                      value={reclamoForm.dominio_tercero}
                      onChange={(e) => setReclamoForm((prev) => ({ ...prev, dominio_tercero: e.target.value }))}
                      placeholder="Dominio vehiculo tercero"
                      className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
                    />
                  </div>
                </section>

                <section className="space-y-3">
                  <h5 className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">Documentos</h5>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      value={reclamoForm.documento_asegurado}
                      onChange={(e) => setReclamoForm((prev) => ({ ...prev, documento_asegurado: e.target.value }))}
                      placeholder="Nro. documento asegurado"
                      className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
                    />
                    <input
                      value={reclamoForm.documento_tercero}
                      onChange={(e) => setReclamoForm((prev) => ({ ...prev, documento_tercero: e.target.value }))}
                      placeholder="Nro. documento tercero"
                      className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#6b6860]">Nro. siniestro</label>
                    <input
                      value={form.nro}
                      readOnly
                      className="w-full rounded-lg border border-[#d0cdc7] bg-[#f5f4f1] px-3 py-2 text-sm text-[#6b6860] outline-none"
                    />
                  </div>
                </section>

                <section className="space-y-3">
                  <h5 className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">Contacto</h5>
                  <input
                    value={reclamoForm.responsable_contacto}
                    onChange={(e) => setReclamoForm((prev) => ({ ...prev, responsable_contacto: e.target.value }))}
                    placeholder="Responsable de contacto"
                    className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
                  />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      value={reclamoForm.telefono_contacto}
                      onChange={(e) => setReclamoForm((prev) => ({ ...prev, telefono_contacto: e.target.value }))}
                      placeholder="Telefono"
                      className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
                    />
                    <input
                      type="email"
                      value={reclamoForm.email_contacto}
                      onChange={(e) => setReclamoForm((prev) => ({ ...prev, email_contacto: e.target.value }))}
                      placeholder="Email"
                      className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
                    />
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        ) : null}

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
