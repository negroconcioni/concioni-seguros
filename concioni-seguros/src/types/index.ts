export type Siniestro = {
  id: string;
  inspector: string;
  nombre: string;
  apellido: string;
  nro: string;
  nro_poliza: string;
  patente: string;
  danio: string;
  taller: string;
  fpedido: string;
  fentrega: string;
  proveedor: string;
  reclamo: boolean;
  rfecha: string;
  cia: string;
  cleas: boolean;
  franquicia: boolean;
  monto_franquicia: number | null;
  created: string;
  emailSent: boolean;
};

export type Config = {
  email: string;
  sid: string;
  tid: string;
  pk: string;
};

export type TipoReclamo = "daño vehicular" | "daños materiales" | "lesiones";

export type ReclamoTercero = {
  id: string;
  siniestro_id: string;
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
  created_at: string;
};

export type Archivo = {
  id: string;
  siniestro_id: string;
  reclamo_id: string | null;
  nombre: string;
  url: string;
  tipo: "image" | "pdf";
  created_at: string;
};

export type OrdenTrabajo = {
  id: string;
  siniestro_id: string;
  estado: "pendiente" | "cargada";
  archivo_url: string | null;
  archivo_nombre: string | null;
  created_at: string;
};

export type ArchivoCleas = {
  id: string;
  siniestro_id: string;
  estado: "pendiente" | "cargado";
  archivo_url: string | null;
  archivo_nombre: string | null;
  created_at: string;
};
