import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useToast, ToastType } from '../context/ToastContext';

const stylesByType: Record<
  ToastType,
  { container: string; icon: React.ReactNode }
> = {
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
  },
  error: {
    container: 'bg-rose-50 border-rose-200 text-rose-900',
    icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
  },
  info: {
    container: 'bg-cyan-50 border-cyan-200 text-cyan-900',
    icon: <Info className="h-5 w-5 text-cyan-700 shrink-0" />,
  },
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)]"
    >
      {toasts.map((toast) => {
        const style = stylesByType[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm transition-all ${style.container}`}
          >
            {style.icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{toast.title}</p>
              {toast.message && (
                <p className="mt-0.5 text-xs opacity-90 leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-lg p-1 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
