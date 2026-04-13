import type { ReactNode } from "react";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import { useSiniestros } from "../store/useSiniestros";
import { formatDate } from "../utils/date";

type SiniestroDetailProps = {
  open: boolean;
  onClose: () => void;
  siniestroId: string | null;
  onEdit: (id: string) => void;
};

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">{label}</dt>
      <dd className="mt-1 text-sm text-[#1a1916]">{children}</dd>
    </div>
  );
}

function SiniestroDetail({ open, onClose, siniestroId, onEdit }: SiniestroDetailProps) {
  const { siniestros } = useSiniestros();
  const s = siniestroId ? siniestros.find((x) => x.id === siniestroId) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={s ? `Siniestro ${s.nro}` : "Detalle"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            type="button"
            disabled={!s}
            onClick={() => {
              if (s) onEdit(s.id);
            }}
          >
            Editar
          </Button>
        </div>
      }
    >
      {!s ? (
        <p className="text-sm text-[#6b6860]">No se encontro el siniestro.</p>
      ) : (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <DetailField label="Inspector">{s.inspector || "—"}</DetailField>
          <DetailField label="Nro. Siniestro">{s.nro || "—"}</DetailField>

          <div className="sm:col-span-2">
            <DetailField label="Asegurado">{`${s.nombre} ${s.apellido}`.trim() || "—"}</DetailField>
          </div>

          <div className="sm:col-span-2">
            <DetailField label="Descripcion del daño">{s.danio || "—"}</DetailField>
          </div>

          <DetailField label="Taller">{s.taller || "—"}</DetailField>
          <DetailField label="Casa proveedora">{s.proveedor || "—"}</DetailField>

          <DetailField label="Fecha pedido">{formatDate(s.fpedido)}</DetailField>
          <DetailField label="Fecha entrega estimada">{formatDate(s.fentrega)}</DetailField>

          <DetailField label="Reclamo">
            {s.reclamo ? (
              <span>
                Si
                {s.rfecha ? (
                  <>
                    {" "}
                    <span className="text-[#6b6860]">({formatDate(s.rfecha)})</span>
                  </>
                ) : null}
              </span>
            ) : (
              "No"
            )}
          </DetailField>
          <DetailField label="Compania terceros">{s.cia || "—"}</DetailField>

          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">CLEAS</dt>
            <dd className="mt-1">
              <Badge variant={s.cleas ? "blue" : "neutral"}>{s.cleas ? "Si" : "No"}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">Franquicia</dt>
            <dd className="mt-1">
              <Badge variant={s.franquicia ? "green" : "neutral"}>{s.franquicia ? "Si" : "No"}</Badge>
            </dd>
          </div>
        </dl>
      )}
    </Modal>
  );
}

export default SiniestroDetail;
