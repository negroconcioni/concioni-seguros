import { useEffect, useState, type FormEvent } from "react";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import { useSiniestros } from "../store/useSiniestros";

const FORM_ID = "config-modal-form";

type ConfigModalProps = {
  open: boolean;
  onClose: () => void;
};

function ConfigModal({ open, onClose }: ConfigModalProps) {
  const { config, saveConfig } = useSiniestros();
  const [email, setEmail] = useState("");
  const [sid, setSid] = useState("");
  const [tid, setTid] = useState("");
  const [pk, setPk] = useState("");

  useEffect(() => {
    if (!open) return;
    setEmail(config.email);
    setSid(config.sid);
    setTid(config.tid);
    setPk(config.pk);
  }, [open, config]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveConfig({
      email: email.trim(),
      sid: sid.trim(),
      tid: tid.trim(),
      pk: pk.trim(),
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configuracion"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID}>
            Guardar
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6b6860]">Email para notificaciones</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
            placeholder="notificaciones@ejemplo.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6b6860]">EmailJS Service ID</label>
          <input
            value={sid}
            onChange={(e) => setSid(e.target.value)}
            className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
            placeholder="service_xxxx"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6b6860]">EmailJS Template ID</label>
          <input
            value={tid}
            onChange={(e) => setTid(e.target.value)}
            className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
            placeholder="template_xxxx"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6b6860]">EmailJS Public Key</label>
          <input
            value={pk}
            onChange={(e) => setPk(e.target.value)}
            className="w-full rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm outline-none transition"
            placeholder="Clave publica"
            autoComplete="off"
          />
        </div>

        <div className="rounded-lg bg-[#f5f4f1] p-4 text-sm text-[#6b6860]">
          <p className="font-medium text-[#1a1916]">EmailJS y plantilla de correo</p>
          <p className="mt-2 leading-relaxed">
            En EmailJS crea un servicio y una plantilla asociados a ese servicio. En la plantilla podes usar
            variables que la app envia al enviar recordatorios. Asegurate de que el cuerpo o asunto del template
            incluya las variables:
          </p>
          <ul className="mt-2 list-inside list-disc font-mono text-xs text-[#1a1916]">
            <li>{"{{inspector}}"}</li>
            <li>{"{{asegurado}}"}</li>
            <li>{"{{nro_siniestro}}"}</li>
            <li>{"{{taller}}"}</li>
          </ul>
          <p className="mt-2 leading-relaxed">
            El email de destino suele configurarse con una variable (por ejemplo{" "}
            <span className="font-mono text-xs">{"{{to_email}}"}</span>) enlazada al campo &quot;Email para
            notificaciones&quot; de arriba, segun como armes la plantilla en el panel de EmailJS.
          </p>
        </div>
      </form>
    </Modal>
  );
}

export default ConfigModal;
