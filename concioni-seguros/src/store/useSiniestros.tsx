import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/ui/Toast";
import type { Config, Siniestro } from "../types";

const CONFIG_KEY = "concioni_cfg";

const defaultConfig: Config = {
  email: "",
  sid: "",
  tid: "",
  pk: "",
};

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function readConfig(): Config {
  if (typeof window === "undefined") {
    return defaultConfig;
  }

  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) {
      return defaultConfig;
    }
    return { ...defaultConfig, ...(JSON.parse(raw) as Partial<Config>) };
  } catch {
    return defaultConfig;
  }
}

function rowToSiniestro(row: Record<string, unknown>): Siniestro {
  return {
    id: String(row.id ?? ""),
    inspector: String(row.inspector ?? ""),
    nombre: String(row.nombre ?? ""),
    apellido: String(row.apellido ?? ""),
    nro: String(row.nro ?? ""),
    danio: String(row.danio ?? ""),
    taller: String(row.taller ?? ""),
    fpedido: String(row.fpedido ?? ""),
    fentrega: String(row.fentrega ?? ""),
    proveedor: String(row.proveedor ?? ""),
    reclamo: Boolean(row.reclamo),
    rfecha: String(row.rfecha ?? ""),
    cia: String(row.cia ?? ""),
    cleas: Boolean(row.cleas),
    franquicia: Boolean(row.franquicia),
    monto_franquicia: (() => {
      const v = row.monto_franquicia;
      if (v == null || v === "") {
        return null;
      }
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    })(),
    created: String(row.created_at ?? row.created ?? ""),
    emailSent: Boolean(row.email_sent ?? row.emailSent),
  };
}

function siniestroToDbInsert(s: Siniestro): Record<string, unknown> {
  const { emailSent, created, ...rest } = s;
  return {
    ...rest,
    created_at: created,
    email_sent: emailSent,
  };
}

function partialSiniestroToDbUpdate(patch: Partial<Siniestro>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (key === "emailSent") {
      out.email_sent = value;
    } else if (key === "created") {
      out.created_at = value;
    } else {
      out[key] = value;
    }
  }
  return out;
}

type SiniestrosContextValue = {
  siniestros: Siniestro[];
  isLoading: boolean;
  isOnline: boolean;
  addSiniestro: (data: Omit<Siniestro, "id" | "created" | "emailSent">) => Promise<Siniestro | null>;
  updateSiniestro: (id: string, data: Partial<Siniestro>) => void;
  deleteSiniestro: (id: string) => void;
  config: Config;
  saveConfig: (config: Config) => void;
};

const SiniestrosContext = createContext<SiniestrosContextValue | null>(null);

export function SiniestrosProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [config, setConfig] = useState<Config>(readConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? window.navigator.onLine : true,
  );
  const loadingOps = useRef(0);

  function beginOp() {
    loadingOps.current += 1;
    setIsLoading(true);
  }

  function endOp() {
    loadingOps.current = Math.max(0, loadingOps.current - 1);
    if (loadingOps.current === 0) {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const channel = supabase
      .channel("siniestros-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "siniestros" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const inserted = rowToSiniestro(payload.new as Record<string, unknown>);
            setSiniestros((prev) => {
              if (prev.some((item) => item.id === inserted.id)) {
                return prev;
              }
              return [inserted, ...prev];
            });
          }

          if (payload.eventType === "UPDATE") {
            const updated = rowToSiniestro(payload.new as Record<string, unknown>);
            setSiniestros((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item)),
            );
          }

          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as Record<string, unknown>;
            const oldId = String(oldRow.id ?? "");
            if (!oldId) {
              return;
            }
            setSiniestros((prev) => prev.filter((item) => item.id !== oldId));
          }
        },
      )
      .subscribe();

    void (async () => {
      beginOp();
      const { data, error } = await supabase
        .from("siniestros")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) {
        endOp();
        return;
      }

      if (error) {
        console.error(error);
        showToast("Error al guardar los datos. Verificar conexión.", "warn");
        setSiniestros([]);
      } else {
        setSiniestros((data ?? []).map((row) => rowToSiniestro(row as Record<string, unknown>)));
      }
      endOp();
    })();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [showToast]);

  useEffect(() => {
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  const addSiniestro = useCallback(
    async (data: Omit<Siniestro, "id" | "created" | "emailSent">): Promise<Siniestro | null> => {
      beginOp();
      try {
        const nuevo: Siniestro = {
          ...data,
          id: makeId(),
          created: new Date().toISOString(),
          emailSent: false,
        };
        const payload = siniestroToDbInsert(nuevo);
        const { data: inserted, error } = await supabase.from("siniestros").insert([payload]).select();

        if (error) {
          console.error(error);
          showToast("Error al guardar los datos. Verificar conexión.", "warn");
          return null;
        }

        const row = inserted?.[0];
        if (!row) {
          return null;
        }
        const created = rowToSiniestro(row as Record<string, unknown>);
        setSiniestros((prev) => [created, ...prev]);
        return created;
      } finally {
        endOp();
      }
    },
    [showToast],
  );

  const updateSiniestro = useCallback((id: string, data: Partial<Siniestro>) => {
    void (async () => {
      beginOp();
      const patch = partialSiniestroToDbUpdate(data);
      if (Object.keys(patch).length === 0) {
        endOp();
        return;
      }

      const { data: updated, error } = await supabase
        .from("siniestros")
        .update(patch)
        .eq("id", id)
        .select();

      if (error) {
        console.error(error);
        showToast("Error al guardar los datos. Verificar conexión.", "warn");
        endOp();
        return;
      }

      const row = updated?.[0];
      if (row) {
        const next = rowToSiniestro(row as Record<string, unknown>);
        setSiniestros((prev) => prev.map((item) => (item.id === id ? next : item)));
      } else {
        setSiniestros((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
      }
      endOp();
    })();
  }, [showToast]);

  const deleteSiniestro = useCallback((id: string) => {
    void (async () => {
      beginOp();
      const { error } = await supabase.from("siniestros").delete().eq("id", id);

      if (error) {
        console.error(error);
        showToast("Error al guardar los datos. Verificar conexión.", "warn");
        endOp();
        return;
      }

      setSiniestros((prev) => prev.filter((item) => item.id !== id));
      endOp();
    })();
  }, [showToast]);

  const saveConfig = useCallback((nextConfig: Config) => {
    setConfig(nextConfig);
  }, []);

  const value = useMemo(
    () => ({
      siniestros,
      isLoading,
      isOnline,
      addSiniestro,
      updateSiniestro,
      deleteSiniestro,
      config,
      saveConfig,
    }),
    [
      siniestros,
      isLoading,
      isOnline,
      addSiniestro,
      updateSiniestro,
      deleteSiniestro,
      config,
      saveConfig,
    ],
  );

  return <SiniestrosContext.Provider value={value}>{children}</SiniestrosContext.Provider>;
}

export function useSiniestros() {
  const ctx = useContext(SiniestrosContext);
  if (!ctx) {
    throw new Error("useSiniestros debe usarse dentro de SiniestrosProvider");
  }
  return ctx;
}
