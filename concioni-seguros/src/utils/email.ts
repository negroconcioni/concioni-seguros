import emailjs from "@emailjs/browser";
import type { Config, Siniestro } from "../types";

function notifyWarn(message: string) {
  window.dispatchEvent(
    new CustomEvent("app:toast", {
      detail: { message, type: "warn" as const },
    }),
  );
}

function isDueDate(dateStr: string): boolean {
  if (!dateStr) {
    return false;
  }

  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) {
    return false;
  }

  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return target.getTime() <= today.getTime();
}

export async function checkAndSendEmails(
  siniestros: Siniestro[],
  config: Config,
  updateSiniestro: Function,
): Promise<void> {
  if (!config.pk) {
    return;
  }
  if (!config.sid || !config.tid || !config.email) {
    return;
  }

  emailjs.init(config.pk);

  for (const s of siniestros) {
    if (!s.fentrega || s.emailSent || !isDueDate(s.fentrega)) {
      continue;
    }

    try {
      await emailjs.send(config.sid, config.tid, {
        to_email: config.email,
        inspector: s.inspector,
        asegurado: `${s.nombre} ${s.apellido}`.trim(),
        nro_siniestro: s.nro,
        taller: s.taller || "No especificado",
        proveedor: s.proveedor || "No especificado",
        mensaje: "Verificar entrega de repuestos.",
      });

      updateSiniestro(s.id, { emailSent: true });
    } catch {
      notifyWarn(`No se pudo enviar el email para ${s.nombre} ${s.apellido}`);
    }
  }
}
