"use client";

import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-[95vw]',
};

export function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  const titleId = useId();

  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClass = maxWidthMap[maxWidth] || 'max-w-md';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full ${widthClass} relative z-10 flex flex-col max-h-[92vh] border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300 outline-none`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-salmon animate-pulse" />
            <h2 id={titleId} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 p-2 rounded-xl transition-all"
            aria-label="Cerrar modal"
          >
            <X className="text-[20px] block w-5 h-5" />
          </button>
        </div>
        
        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar text-slate-700 dark:text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
}
