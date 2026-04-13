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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeAlerts = deliveryAlertCount(siniestros);

  const emailCheckDone = useRef(false);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const closeIfDesktop = () => {
      if (mq.matches) {
        setMobileNavOpen(false);
      }
    };
    mq.addEventListener("change", closeIfDesktop);
    closeIfDesktop();
    return () => mq.removeEventListener("change", closeIfDesktop);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (emailCheckDone.current) {
      return;
    }
    if (siniestros.length === 0) {
      return;
    }
    emailCheckDone.current = true;
    void checkAndSendEmails(siniestros, config, updateSiniestro);

    const interval = window.setInterval(() => {
      emailCheckDone.current = false;
      void checkAndSendEmails(siniestros, config, updateSiniestro);
    }, 3600000);

    return () => window.clearInterval(interval);
  }, [siniestros, config]);

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
        {mobileNavOpen ? (
          <div
            role="presentation"
            className="fixed inset-0 z-40 cursor-pointer bg-black/40 md:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}
        <div className="flex">
          <Sidebar
            activeView={activeView}
            onChangeView={(view) => {
              setActiveView(view);
              setMobileNavOpen(false);
            }}
            onOpenConfig={() => {
              setConfigOpen(true);
              setMobileNavOpen(false);
            }}
            activeAlerts={activeAlerts}
            mobileOpen={mobileNavOpen}
          />
          <div className="min-h-screen w-full min-w-0 flex-1">
            <Topbar
              title={viewTitles[activeView]}
              onExportExcel={handleExportExcel}
              onNewSiniestro={openNewSiniestro}
              isOnline={isOnline}
              mobileNavOpen={mobileNavOpen}
              onToggleMobileNav={() => setMobileNavOpen((o) => !o)}
            />
            <main className="w-full p-4 sm:p-6">
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
