import { useEffect, useMemo, useState, type ReactNode } from "react";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import Toggle from "./ui/Toggle";
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

type SiniestroModalProps = {
  open: boolean;
  onClose: () => void;
  editingId?: string | null;
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#a8a59f]">
      {children}
    </h4>
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
    fpedido: (s.fpedido || "").slice(0, 10),
    fentrega: (s.fentrega || "").slice(0, 10),
    proveedor: s.proveedor,
    reclamo: s.reclamo,
    rfecha: s.rfecha ? (s.rfecha || "").slice(0, 10) : "",
    cia: s.cia,
    franquicia: s.franquicia,
    monto_franquicia: s.monto_franquicia != null ? String(s.monto_franquicia) : "",
  };
}

function SiniestroModal({ open, onClose, editingId = null }: SiniestroModalProps) {
  const { siniestros, addSiniestro, updateSiniestro } = useSiniestros();
  const { showToast } = useToast();

  const [form, setForm] = useState(emptyFormState);

  useEffect(() => {
    if (!open) {
      setForm(emptyFormState());
      return;
    }
    if (editingId) {
      const found = siniestros.find((x) => x.id === editingId);
      if (found) {
        setForm(loadFromSiniestro(found));
      } else {
        setForm(emptyFormState());
      }
    } else {
      setForm(emptyFormState());
    }
  }, [open, editingId, siniestros]);

  const inspectorOptions = useMemo(() => {
    if (form.inspector && !INSPECTORS.includes(form.inspector as (typeof INSPECTORS)[number])) {
      return [form.inspector, ...INSPECTORS];
    }
    return [...INSPECTORS];
  }, [form.inspector]);

  const ciaTrimmed = form.cia.trim();
  const cleasPreview = ciaTrimmed ? isCleas(form.cia) : null;

  function handleCancel() {
    onClose();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

    if (editingId) {
      updateSiniestro(editingId, payload);
    } else {
      addSiniestro(payload);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? "Editar siniestro" : "Nuevo siniestro"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" type="button" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID}>
            Guardar siniestro
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre"
              className="rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
            />
            <input
              required
              value={form.apellido}
              onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
              placeholder="Apellido"
              className="rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
            />
            <input
              required
              value={form.nro}
              onChange={(e) => setForm((f) => ({ ...f, nro: e.target.value }))}
              placeholder="Nro. Siniestro"
              className="rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
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
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[#6b6860]">Fecha pedido</label>
              <input
                type="date"
                value={form.fpedido}
                onChange={(e) => setForm((f) => ({ ...f, fpedido: e.target.value }))}
                className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#6b6860]">Fecha entrega estimada</label>
              <input
                type="date"
                value={form.fentrega}
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
            <div className="mt-3">
              <label className="mb-1 block text-xs text-[#6b6860]">Fecha del reclamo</label>
              <input
                type="date"
                value={form.rfecha}
                onChange={(e) => setForm((f) => ({ ...f, rfecha: e.target.value }))}
                className="w-full max-w-xs rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
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
            <div className="mt-3">
              <label className="mb-1 block text-xs text-[#6b6860]">Monto de franquicia</label>
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
      </form>
    </Modal>
  );
}

export default SiniestroModal;
