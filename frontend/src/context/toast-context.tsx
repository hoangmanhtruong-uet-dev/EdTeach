"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Sparkles, X } from "lucide-react";

export type ToastType = "info" | "success" | "warning" | "error";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container (WCAG aria-live polite) */}
      <div
        role="region"
        aria-label="Thông báo hệ thống"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";

          return (
            <div
              key={toast.id}
              role="status"
              aria-live="polite"
              className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs sm:text-sm shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
              style={{
                backgroundColor: isSuccess
                  ? "#f0fdf4"
                  : isError
                  ? "#fef2f2"
                  : isWarning
                  ? "#fffbeb"
                  : "#ffffff",
                borderColor: isSuccess
                  ? "#bbf7d0"
                  : isError
                  ? "#fecaca"
                  : isWarning
                  ? "#fde68a"
                  : "#e2e8f0",
                color: isSuccess
                  ? "#15803d"
                  : isError
                  ? "#b91c1c"
                  : isWarning
                  ? "#b45309"
                  : "#1e293b",
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isSuccess && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />}
                {isError && <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />}
                {isWarning && <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />}
                {!isSuccess && !isError && !isWarning && (
                  <Sparkles className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                )}
                <span className="font-medium break-words">{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="ml-2 rounded-md p-1 hover:bg-black/5 transition cursor-pointer text-current/70 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Đóng thông báo"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if called outside provider
    return {
      showToast: (message: string) => {
        console.warn("useToast called outside ToastProvider:", message);
      },
    };
  }
  return context;
}
