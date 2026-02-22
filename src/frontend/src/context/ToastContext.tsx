import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

export type ToastOptions = { undo?: () => void };

type ToastMessage = { id: number; text: string; undo?: () => void };

type ShowToast = (text: string, options?: ToastOptions) => void;

const ToastContext = createContext<ShowToast | null>(null);

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used within ToastProvider');
  return show;
}

const TOAST_DURATION_MS = 3500;
const TOAST_WITH_UNDO_DURATION_MS = 8000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextIdRef = useRef(0);
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const showToast = useCallback<ShowToast>((text, options) => {
    const id = nextIdRef.current++;
    const undo = options?.undo;
    setToasts((prev) => [...prev, { id, text, undo }]);
    const duration = undo ? TOAST_WITH_UNDO_DURATION_MS : TOAST_DURATION_MS;
    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timeoutsRef.current.delete(id);
    }, duration);
    timeoutsRef.current.set(id, t);
  }, []);

  const dismiss = useCallback((id: number) => {
    const t = timeoutsRef.current.get(id);
    if (t) clearTimeout(t);
    timeoutsRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleUndo = useCallback(
    (toast: ToastMessage) => {
      toast.undo?.();
      dismiss(toast.id);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto rounded-lg border border-palette-mist bg-white px-4 py-3 shadow-lg text-sm font-medium text-palette-taupe flex items-center gap-3 flex-wrap"
          >
            <span className="flex-1 min-w-0">{t.text}</span>
            {t.undo && (
              <button
                type="button"
                onClick={() => handleUndo(t)}
                className="shrink-0 font-semibold text-palette-terracotta hover:underline focus:outline-none focus:ring-2 focus:ring-palette-terracotta rounded"
              >
                Undo
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
