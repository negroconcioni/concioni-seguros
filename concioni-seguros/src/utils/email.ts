import emailjs from "@emailjs/browser";
import type { Config, Siniestro } from "../types";

export async function checkAndSendEmails(
  siniestros: Siniestro[],
  config: Config,
  updateSiniestro: (id: string, data: Partial<Siniestro>) => void,
): Promise<void> {
  if (!config.pk || !config.sid || !config.tid || !config.email) {
    return;
  }

  emailjs.init(config.pk);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendientes = siniestros.filter((s) => {
    if (!s.fentrega || s.emailSent) {
      return false;
    }
    const fecha = new Date(s.fentrega);
    fecha.setHours(0, 0, 0, 0);
    return fecha <= today;
  });

  for (const s of pendientes) {
    try {
      await emailjs.send(config.sid, config.tid, {
        to_email: config.email,
        inspector: s.inspector,
        asegurado: `${s.nombre} ${s.apellido}`,
        nro_siniestro: s.nro,
        taller: s.taller || "No especificado",
        proveedor: s.proveedor || "No especificado",
        mensaje: "Verificar entrega de repuestos.",
      });
      updateSiniestro(s.id, { emailSent: true });
    } catch (e) {
      console.error("Error email:", e);
    }
  }
}
