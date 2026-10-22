import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

type ShowToast = (options: ToastOptions) => void;

const ToastContext = createContext<ShowToast>(() => {});

interface ToastState extends ToastOptions {
  id: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback<ShowToast>(
    (options) => {
      clearTimer();
      const id = Date.now();
      setToast({ ...options, id });
      timerRef.current = setTimeout(() => setToast(null), 4400);
    },
    [clearTimer]
  );

  useEffect(() => clearTimer, [clearTimer]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          className="toast is-on"
          role="status"
          aria-live="polite"
          key={toast.id}
        >
          <span>{toast.message}</span>
          {toast.actionLabel && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                clearTimer();
                setToast(null);
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
