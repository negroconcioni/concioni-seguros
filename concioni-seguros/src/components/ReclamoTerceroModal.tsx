import { useEffect, useMemo, useState } from "react";
import { addReclamo, fetchReclamos, updateReclamo } from "../store/useReclamos";
import type { ReclamoTercero, TipoReclamo } from "../types";
import Button from "./ui/Button";
import { useToast } from "./ui/Toast";

type ReclamoTerceroModalProps = {
  open: boolean;
  onClose: () => void;
  siniestroId: string;
  reclamoId: string | null;
  nroSiniestro: string;
  onSaved: () => void;
};

type ReclamoForm = Omit<ReclamoTercero, "id" | "created_at">;

const TIPO_RECLAMO_OPTIONS: { value: TipoReclamo; label: string }[] = [
  { value: "daño vehicular", label: "Daño vehicular" },
  { value: "daños materiales", label: "Daños a cosas materiales" },
  { value: "lesiones", label: "Lesiones" },
];
const FORM_ID = "reclamo-tercero-form";

function emptyForm(siniestroId: string): ReclamoForm {
  return {
    siniestro_id: siniestroId,
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

function ReclamoTerceroModal({
  open,
  onClose,
  siniestroId,
  reclamoId,
  nroSiniestro,
  onSaved,
}: ReclamoTerceroModalProps) {
  const [form, setForm] = useState<ReclamoForm>(emptyForm(siniestroId));
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const isEdit = Boolean(reclamoId);
  const title = isEdit ? "Editar Reclamo" : "Reclamo contra Terceros";

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        if (!reclamoId) {
          if (!cancelled) {
            setForm(emptyForm(siniestroId));
          }
          return;
        }

        const reclamos = await fetchReclamos(siniestroId);
        const found = reclamos.find((r) => r.id === reclamoId);
        if (!cancelled) {
          if (found) {
            const { id: _id, created_at: _createdAt, ...rest } = found;
            setForm(rest);
          } else {
            setForm(emptyForm(siniestroId));
            showToast("No se encontro el reclamo a editar.", "warn");
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando reclamo:", error);
          showToast("No se pudo cargar el reclamo.", "warn");
          setForm(emptyForm(siniestroId));
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
  }, [open, reclamoId, siniestroId, showToast]);

  const canSave = useMemo(
    () => Boolean(!isSaving && !isLoading && form.lugar.trim() && form.fecha_siniestro && form.hora_siniestro),
    [isSaving, isLoading, form.lugar, form.fecha_siniestro, form.hora_siniestro],
  );

  function toggleTipoReclamo(value: TipoReclamo) {
    setForm((prev) => {
      const exists = prev.tipo_reclamo.includes(value);
      return {
        ...prev,
        tipo_reclamo: exists
          ? prev.tipo_reclamo.filter((x) => x !== value)
          : [...prev.tipo_reclamo, value],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || !reclamoId && !siniestroId) {
      return;
    }

    setIsSaving(true);
    try {
      if (reclamoId) {
        await updateReclamo(reclamoId, form);
      } else {
        await addReclamo({
          ...form,
          siniestro_id: siniestroId,
        });
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error guardando reclamo:", error);
      showToast("No se pudo guardar el reclamo.", "warn");
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-[640px] max-h-[80vh] min-h-0 flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        style={{ maxWidth: "90vw" }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 border-b border-[#e2e0db] px-5 py-4">
          <h3 className="text-[17px] font-semibold text-[#1a1916]">{title}</h3>
        </header>

        <form id={FORM_ID} onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">Estado</h4>
            <div className="inline-flex rounded-lg border border-[#d0cdc7] p-1">
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  form.estado === "pendiente"
                    ? "bg-[#c0392b] text-white"
                    : "text-[#6b6860] hover:bg-[#f5f4f1]"
                }`}
                onClick={() => setForm((prev) => ({ ...prev, estado: "pendiente" }))}
              >
                Pendiente
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  form.estado === "hecho"
                    ? "bg-[#2e7d52] text-white"
                    : "text-[#6b6860] hover:bg-[#f5f4f1]"
                }`}
                onClick={() => setForm((prev) => ({ ...prev, estado: "hecho" }))}
              >
                Hecho
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">
              Datos del siniestro
            </h4>
            <input
              value={form.lugar}
              onChange={(e) => setForm((prev) => ({ ...prev, lugar: e.target.value }))}
              placeholder="Lugar del siniestro"
              className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="date"
                value={form.fecha_siniestro}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha_siniestro: e.target.value }))}
                className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
              />
              <input
                type="time"
                value={form.hora_siniestro}
                onChange={(e) => setForm((prev) => ({ ...prev, hora_siniestro: e.target.value }))}
                className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
              />
            </div>
            <input
              value={form.direccion}
              onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
              placeholder="Direccion del siniestro"
              className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
            />
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Descripcion del siniestro"
              className="w-full resize-y rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
            />
          </section>

          <section className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">Tipo de reclamo</h4>
            {TIPO_RECLAMO_OPTIONS.map((item) => (
              <label key={item.value} className="flex items-center gap-2 text-sm text-[#1a1916]">
                <input
                  type="checkbox"
                  checked={form.tipo_reclamo.includes(item.value)}
                  onChange={() => toggleTipoReclamo(item.value)}
                />
                {item.label}
              </label>
            ))}
          </section>

          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">Vehiculos</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={form.dominio_asegurado}
                onChange={(e) => setForm((prev) => ({ ...prev, dominio_asegurado: e.target.value }))}
                placeholder="Dominio vehiculo asegurado"
                className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
              />
              <input
                value={form.dominio_tercero}
                onChange={(e) => setForm((prev) => ({ ...prev, dominio_tercero: e.target.value }))}
                placeholder="Dominio vehiculo tercero"
                className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">Documentos</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={form.documento_asegurado}
                onChange={(e) => setForm((prev) => ({ ...prev, documento_asegurado: e.target.value }))}
                placeholder="Nro. documento asegurado"
                className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
              />
              <input
                value={form.documento_tercero}
                onChange={(e) => setForm((prev) => ({ ...prev, documento_tercero: e.target.value }))}
                placeholder="Nro. documento tercero"
                className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#6b6860]">Nro. siniestro</label>
              <input
                value={nroSiniestro}
                readOnly
                className="w-full rounded-lg border border-[#d0cdc7] bg-[#f5f4f1] px-3 py-2 text-sm text-[#6b6860] outline-none"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">Contacto</h4>
            <input
              value={form.responsable_contacto}
              onChange={(e) => setForm((prev) => ({ ...prev, responsable_contacto: e.target.value }))}
              placeholder="Responsable de contacto"
              className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={form.telefono_contacto}
                onChange={(e) => setForm((prev) => ({ ...prev, telefono_contacto: e.target.value }))}
                placeholder="Telefono"
                className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
              />
              <input
                type="email"
                value={form.email_contacto}
                onChange={(e) => setForm((prev) => ({ ...prev, email_contacto: e.target.value }))}
                placeholder="Email"
                className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
              />
            </div>
          </section>
        </form>

        <footer className="shrink-0 border-t border-[#e2e0db] bg-[#f5f4f1] px-5 py-3">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form={FORM_ID} disabled={!canSave}>
              {isSaving ? "Guardando..." : "Guardar reclamo"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default ReclamoTerceroModal;
