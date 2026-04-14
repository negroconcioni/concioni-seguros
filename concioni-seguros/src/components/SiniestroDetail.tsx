import { useEffect, useMemo, useState, type ReactNode } from "react";
import ArchivosSection from "./ArchivosSection";
import ReclamoTerceroModal from "./ReclamoTerceroModal";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import { fetchArchivos } from "../store/useArchivos";
import { deleteReclamo, fetchReclamos } from "../store/useReclamos";
import { useSiniestros } from "../store/useSiniestros";
import type { ReclamoTercero } from "../types";
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

function ReclamoField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">{label}</p>
      <p className="mt-1 text-sm text-[#1a1916]">{value}</p>
    </div>
  );
}

function SiniestroDetail({ open, onClose, siniestroId, onEdit }: SiniestroDetailProps) {
  const { siniestros } = useSiniestros();
  const s = siniestroId ? siniestros.find((x) => x.id === siniestroId) : null;
  const [reclamos, setReclamos] = useState<ReclamoTercero[]>([]);
  const [isLoadingExtra, setIsLoadingExtra] = useState(false);
  const [archivosCount, setArchivosCount] = useState<number>(0);
  const [reclamoModalOpen, setReclamoModalOpen] = useState(false);
  const [editingReclamoId, setEditingReclamoId] = useState<string | null>(null);

  const reclamo = useMemo(() => {
    if (reclamos.length === 0) return null;
    return [...reclamos].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  }, [reclamos]);

  async function loadExtraData(targetSiniestroId: string) {
    setIsLoadingExtra(true);
    try {
      const [reclamosRows, archivosRows] = await Promise.all([
        fetchReclamos(targetSiniestroId),
        fetchArchivos(targetSiniestroId),
      ]);
      setReclamos(reclamosRows);
      setArchivosCount(archivosRows.filter((a) => a.reclamo_id === null).length);
    } catch (error) {
      console.error("Error cargando datos de reclamos/archivos:", error);
      setReclamos([]);
      setArchivosCount(0);
    } finally {
      setIsLoadingExtra(false);
    }
  }

  useEffect(() => {
    if (!open || !siniestroId) {
      return;
    }
    void loadExtraData(siniestroId);
  }, [open, siniestroId]);

  async function handleDeleteReclamo(id: string) {
    const ok = window.confirm("Eliminar reclamo contra terceros?");
    if (!ok) return;
    try {
      await deleteReclamo(id);
      if (siniestroId) {
        await loadExtraData(siniestroId);
      }
    } catch (error) {
      console.error("Error eliminando reclamo:", error);
    }
  }

  function handleNewReclamo() {
    setEditingReclamoId(null);
    setReclamoModalOpen(true);
  }

  function handleEditReclamo(id: string) {
    setEditingReclamoId(id);
    setReclamoModalOpen(true);
  }

  async function handleReclamoSaved() {
    if (!siniestroId) return;
    await loadExtraData(siniestroId);
  }

  return (
    <>
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
          <div className="space-y-6">
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
              {s.monto_franquicia != null ? (
                <DetailField label="Monto de franquicia">
                  ${" "}
                  {s.monto_franquicia.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </DetailField>
              ) : null}
            </dl>

            <section className="space-y-3 rounded-xl border border-[#e2e0db] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[12px] font-semibold uppercase tracking-wide text-[#6b6860]">
                  Reclamo contra terceros
                </h4>
                {reclamo ? (
                  <Badge variant={reclamo.estado === "hecho" ? "green" : "red"}>
                    {reclamo.estado === "hecho" ? "Hecho" : "Pendiente"}
                  </Badge>
                ) : null}
              </div>

              {isLoadingExtra ? <p className="text-sm text-[#6b6860]">Cargando...</p> : null}

              {!isLoadingExtra && !reclamo ? (
                <Button type="button" variant="outline" onClick={handleNewReclamo}>
                  Agregar reclamo contra terceros
                </Button>
              ) : null}

              {!isLoadingExtra && reclamo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ReclamoField label="Lugar" value={reclamo.lugar || "—"} />
                    <ReclamoField label="Fecha siniestro" value={formatDate(reclamo.fecha_siniestro)} />
                    <ReclamoField label="Hora siniestro" value={reclamo.hora_siniestro || "—"} />
                    <ReclamoField label="Direccion" value={reclamo.direccion || "—"} />
                    <ReclamoField label="Dominio asegurado" value={reclamo.dominio_asegurado || "—"} />
                    <ReclamoField label="Dominio tercero" value={reclamo.dominio_tercero || "—"} />
                    <ReclamoField label="Doc. asegurado" value={reclamo.documento_asegurado || "—"} />
                    <ReclamoField label="Doc. tercero" value={reclamo.documento_tercero || "—"} />
                    <ReclamoField label="Responsable" value={reclamo.responsable_contacto || "—"} />
                    <ReclamoField label="Telefono" value={reclamo.telefono_contacto || "—"} />
                    <ReclamoField label="Email" value={reclamo.email_contacto || "—"} />
                    <ReclamoField label="Nro. siniestro" value={s.nro || "—"} />
                    <div className="sm:col-span-2">
                      <ReclamoField label="Descripcion" value={reclamo.descripcion || "—"} />
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a8a59f]">
                      Tipos de reclamo
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {reclamo.tipo_reclamo.length > 0 ? (
                        reclamo.tipo_reclamo.map((tipo) => (
                          <Badge key={tipo} variant="blue">
                            {tipo}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="neutral">Sin tipo definido</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => handleEditReclamo(reclamo.id)}>
                      Editar reclamo
                    </Button>
                    <Button type="button" variant="danger-ghost" onClick={() => handleDeleteReclamo(reclamo.id)}>
                      Eliminar reclamo
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="space-y-3 rounded-xl border border-[#e2e0db] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[12px] font-semibold uppercase tracking-wide text-[#6b6860]">
                  Archivos adjuntos
                </h4>
                <span className="text-xs text-[#6b6860]">{archivosCount} archivo(s)</span>
              </div>
              <ArchivosSection siniestroId={s.id} reclamoId={null} />
            </section>
          </div>
        )}
      </Modal>

      {s ? (
        <ReclamoTerceroModal
          open={reclamoModalOpen}
          onClose={() => setReclamoModalOpen(false)}
          siniestroId={s.id}
          reclamoId={editingReclamoId}
          nroSiniestro={s.nro}
          onSaved={() => {
            void handleReclamoSaved();
          }}
        />
      ) : null}
    </>
  );
}

export default SiniestroDetail;
