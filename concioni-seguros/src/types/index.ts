export type Siniestro = {
  id: string;
  inspector: string;
  nombre: string;
  apellido: string;
  nro: string;
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
