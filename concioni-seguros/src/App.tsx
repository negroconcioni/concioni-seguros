import { useEffect, useRef, useState } from "react";
import ConfigModal from "./components/ConfigModal";
import SiniestroDetail from "./components/SiniestroDetail";
import SiniestroModal from "./components/SiniestroModal";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import { useSiniestros } from "./store/useSiniestros";
import type { ActiveView } from "./types/views";
import { getDiffDays } from "./utils/date";
import { checkAndSendEmails } from "./utils/email";
import { exportToExcel } from "./utils/excel";
import Alertas from "./views/Alertas";
import Dashboard from "./views/Dashboard";
import Siniestros from "./views/Siniestros";

const viewTitles: Record<ActiveView, string> = {
  dashboard: "Dashboard",
  siniestros: "Siniestros",
  alertas: "Alertas",
};

function deliveryAlertCount(siniestros: { fentrega: string }[]) {
  return siniestros.filter((s) => {
    if (!s.fentrega?.trim()) return false;
    const d = getDiffDays(s.fentrega);
    return d < 0 || (d >= 0 && d <= 3);
  }).length;
}

function App() {
  const { siniestros, config, updateSiniestro, isOnline } = useSiniestros();

  const [activeView, setActiveView] = useState<ActiveView>("dashboard");

  const [siniestroModalOpen, setSiniestroModalOpen] = useState(false);
  const [siniestroEditingId, setSiniestroEditingId] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [configOpen, setConfigOpen] = useState(false);

  const activeAlerts = deliveryAlertCount(siniestros);

  const emailCheckDone = useRef(false);

  const siniestrosRef = useRef(siniestros);
  const configRef = useRef(config);
  const updateRef = useRef(updateSiniestro);
  siniestrosRef.current = siniestros;
  configRef.current = config;
  updateRef.current = updateSiniestro;

  useEffect(() => {
    if (emailCheckDone.current) {
      return;
    }
    emailCheckDone.current = true;

    const run = () => {
      void checkAndSendEmails(siniestrosRef.current, configRef.current, updateRef.current).catch((err) => {
        console.error("checkAndSendEmails", err);
      });
    };

    run();
    const interval = window.setInterval(run, 3600000);
    return () => window.clearInterval(interval);
  }, []);

  function openSiniestroDetail(siniestroId: string) {
    setDetailId(siniestroId);
    setDetailOpen(true);
  }

  function closeSiniestroDetail() {
    setDetailOpen(false);
    setDetailId(null);
  }

  function openNewSiniestro() {
    setSiniestroEditingId(null);
    setSiniestroModalOpen(true);
  }

  function openEditSiniestro(id: string) {
    setSiniestroEditingId(id);
    setSiniestroModalOpen(true);
  }

  function closeSiniestroModal() {
    setSiniestroModalOpen(false);
    setSiniestroEditingId(null);
  }

  function handleDetailEdit(id: string) {
    closeSiniestroDetail();
    openEditSiniestro(id);
  }

  function handleExportExcel() {
    exportToExcel(siniestros);
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-bg font-sans text-brand-text">
        <div className="flex">
          <Sidebar
            activeView={activeView}
            onChangeView={setActiveView}
            onOpenConfig={() => setConfigOpen(true)}
            activeAlerts={activeAlerts}
          />
          <div className="min-h-screen flex-1">
            <Topbar
              title={viewTitles[activeView]}
              onExportExcel={handleExportExcel}
              onNewSiniestro={openNewSiniestro}
              isOnline={isOnline}
            />
            <main className="p-6">
              {activeView === "dashboard" ? (
                <Dashboard onOpenSiniestroDetail={openSiniestroDetail} />
              ) : null}
              {activeView === "siniestros" ? (
                <Siniestros
                  onOpenSiniestroDetail={openSiniestroDetail}
                  onOpenSiniestroEdit={openEditSiniestro}
                />
              ) : null}
              {activeView === "alertas" ? (
                <Alertas onOpenSiniestroDetail={openSiniestroDetail} />
              ) : null}
            </main>
          </div>
        </div>
      </div>

      <SiniestroModal
        open={siniestroModalOpen}
        onClose={closeSiniestroModal}
        editingId={siniestroEditingId}
      />
      <SiniestroDetail
        open={detailOpen}
        onClose={closeSiniestroDetail}
        siniestroId={detailId}
        onEdit={handleDetailEdit}
      />
      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  );
}

export default App;
