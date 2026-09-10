import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // en milisegundos, por defecto 4000
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'> & { id?: string }) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  showSuccessToast: (message: string, title?: string) => string;
  showErrorToast: (message: string, title?: string) => string;
  showInfoToast: (message: string, title?: string) => string;
  showWarningToast: (message: string, title?: string) => string;
}

const MAX_SIMULTANEOUS_TOASTS = 3;
const DEFAULT_DURATION_MS = 4000;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = toast.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = {
      ...toast,
      id,
      duration: toast.duration ?? DEFAULT_DURATION_MS,
    };

    set((state) => {
      // Mantener como máximo MAX_SIMULTANEOUS_TOASTS eliminando los más antiguos de forma inmutable
      const current = state.toasts.length >= MAX_SIMULTANEOUS_TOASTS 
        ? state.toasts.slice(state.toasts.length - MAX_SIMULTANEOUS_TOASTS + 1)
        : state.toasts;

      return {
        toasts: [...current, newToast],
      };
    });

    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  showSuccessToast: (message: string, title = 'Operación Exitosa') =>
    get().addToast({ type: 'success', title, message }),

  showErrorToast: (message: string, title = 'Error') =>
    get().addToast({ type: 'error', title, message }),

  showInfoToast: (message: string, title = 'Información') =>
    get().addToast({ type: 'info', title, message }),

  showWarningToast: (message: string, title = 'Advertencia') =>
    get().addToast({ type: 'warning', title, message }),
}));
