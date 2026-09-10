"use client";

import React, { useEffect } from "react";
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react";
import { useToastStore, ToastItem } from "../../infrastructure/state/toastStore";

interface SingleToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function SingleToast({ toast, onDismiss }: SingleToastProps) {
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;

    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const config = {
    info: {
      icon: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
      badge: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
      accent: "border-l-4 border-l-sky-500",
    },
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
      accent: "border-l-4 border-l-emerald-500",
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
      badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
      accent: "border-l-4 border-l-amber-500",
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
      badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
      accent: "border-l-4 border-l-rose-500",
    },
  }[toast.type];

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 shadow-lg hover:shadow-xl transition-all duration-200 ${config.accent} animate-fadeIn`}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-normal line-clamp-2">
            {toast.message}
          </p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={toast.action.onClick}
            className="mt-1.5 text-xs font-medium text-brand-salmonDark hover:text-brand-salmon underline transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastNotification() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-5 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <SingleToast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}
