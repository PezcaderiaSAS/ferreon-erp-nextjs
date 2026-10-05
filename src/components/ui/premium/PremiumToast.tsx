'use client';

import React, { useState } from 'react';
import { Check, Info, AlertTriangle, X, Sparkles } from 'lucide-react';

export type PremiumToastType = 'success' | 'info' | 'warning' | 'error';

export interface PremiumToastItem {
  id: string;
  type: PremiumToastType;
  title: string;
  message: string;
}

export function PremiumToast({
  toast,
  onClose,
}: {
  toast: PremiumToastItem;
  onClose: (id: string) => void;
}) {
  const getGradient = (type: PremiumToastType) => {
    switch (type) {
      case 'success':
        return 'from-[#15b977] to-[#0d8051] text-white';
      case 'info':
        return 'from-[#2476d8] to-[#1957a6] text-white';
      case 'warning':
        return 'from-[#e38318] to-[#ad5f09] text-white';
      case 'error':
        return 'from-[#e53748] to-[#a8202d] text-white';
    }
  };

  const getIcon = (type: PremiumToastType) => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-white" />;
      case 'info':
        return <Info className="w-5 h-5 text-white" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-white" />;
      case 'error':
        return <X className="w-5 h-5 text-white" />;
    }
  };

  return (
    <div
      className={`relative overflow-hidden p-[17px] px-[22px] rounded-[14px] bg-gradient-to-br ${getGradient(
        toast.type
      )} shadow-2xl flex items-center gap-3.5 transition-all duration-300 animate-in fade-in slide-in-from-top-4`}
      style={{
        animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      role="alert"
    >
      {/* Decorative Background Shapes */}
      <span className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 pointer-events-none blur-xs" />
      <span className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none blur-xs" />

      {/* Status Icon Badge */}
      <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
        {getIcon(toast.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 z-10">
        <strong className="block text-sm font-bold tracking-tight text-white leading-tight">
          {toast.title}
        </strong>
        <p className="text-xs text-white/90 mt-0.5 leading-normal">
          {toast.message}
        </p>
      </div>

      {/* Close Action Button */}
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white/80 hover:text-white transition-colors shrink-0 z-10"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Showcase Interactivo de Toasts Premium
 */
export function PremiumToastShowcase() {
  const [activeToasts, setActiveToasts] = useState<PremiumToastItem[]>([
    {
      id: 'demo-1',
      type: 'success',
      title: 'Success',
      message: 'Everything went smoothly in your operations!',
    },
  ]);

  const triggerToast = (type: PremiumToastType) => {
    const titles = {
      success: 'Operation Successful',
      info: 'Information Notice',
      warning: 'Attention Required',
      error: 'Transaction Failed',
    };
    const messages = {
      success: 'Everything went smoothly in your operations!',
      info: 'Your rental agreement has been synchronized with the WMS.',
      warning: 'Inventory is reaching minimum safety stock threshold.',
      error: 'Payment authorization could not be verified.',
    };

    const newToast: PremiumToastItem = {
      id: `toast-${Date.now()}`,
      type,
      title: titles[type],
      message: messages[type],
    };

    setActiveToasts((prev) => [newToast, ...prev].slice(0, 3));
  };

  const handleDismiss = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => triggerToast('success')}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#15b977] to-[#0d8051] shadow-xs hover:opacity-90 transition-opacity"
        >
          + Trigger Success
        </button>
        <button
          type="button"
          onClick={() => triggerToast('info')}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#2476d8] to-[#1957a6] shadow-xs hover:opacity-90 transition-opacity"
        >
          + Trigger Info
        </button>
        <button
          type="button"
          onClick={() => triggerToast('warning')}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#e38318] to-[#ad5f09] shadow-xs hover:opacity-90 transition-opacity"
        >
          + Trigger Warning
        </button>
        <button
          type="button"
          onClick={() => triggerToast('error')}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#e53748] to-[#a8202d] shadow-xs hover:opacity-90 transition-opacity"
        >
          + Trigger Error
        </button>
      </div>

      <div className="flex flex-col gap-3 max-w-md w-full">
        {activeToasts.map((toast) => (
          <PremiumToast key={toast.id} toast={toast} onClose={handleDismiss} />
        ))}
      </div>
    </div>
  );
}
