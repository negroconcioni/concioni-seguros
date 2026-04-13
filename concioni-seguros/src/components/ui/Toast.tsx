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

type ToastType = "ok" | "warn";

type ToastState = {
  message: string;
  type: ToastType;
} | null;

type ToastContextValue = {
  showToast: (msg: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

type ToastRendererProps = {
  state: ToastState;
};

function ToastRenderer({ state }: ToastRendererProps) {
  if (!state) {
    return null;
  }

  const bgClass = state.type === "warn" ? "bg-[#991b1b]" : "bg-[#1a1916]";

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      <div className={`rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${bgClass}`}>
        {state.message}
      </div>
    </div>
  );
}

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [state, setState] = useState<ToastState>(null);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string, type: ToastType = "ok") => {
    setState({ message: msg, type });
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string; type?: ToastType }>;
      const message = customEvent.detail?.message;
      const type = customEvent.detail?.type ?? "ok";
      if (message) {
        showToast(message, type);
      }
    };

    window.addEventListener("app:toast", handler as EventListener);
    return () => {
      window.removeEventListener("app:toast", handler as EventListener);
    };
  }, [showToast]);

  useEffect(() => {
    if (!state) {
      return;
    }

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setState(null);
    }, 3000);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [state]);

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRenderer state={state} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
}
