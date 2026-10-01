import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type ToastTone = 'success' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

type ShowToast = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<ShowToast>(() => {});

export const useToast = () => useContext(ToastContext);

const TOAST_DURATION_MS = 3500;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback<ShowToast>((message, tone = 'success') => {
    const id = nextId.current++;
    // Keep at most two on screen so they never cover the content
    setToasts((current) => [...current.slice(-1), { id, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        className="no-print fixed top-[calc(env(safe-area-inset-top,0px)+4.5rem)] inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="max-w-sm px-4 py-2.5 rounded-2xl bg-[#0b1c30] text-white text-xs font-outfit shadow-lg flex items-center gap-2 animate-toast-in"
          >
            <span
              className={`material-symbols-outlined text-[1.25rem] shrink-0 ${
                t.tone === 'success' ? 'text-[#4edea3]' : 'text-[#b4c5ff]'
              }`}
            >
              {t.tone === 'success' ? 'check_circle' : 'info'}
            </span>
            <span className="leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
