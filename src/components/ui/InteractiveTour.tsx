"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTourStore } from '../../infrastructure/state/tourStore';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  route?: string;
  forcedClick?: boolean; // NUEVO: Si es true, oculta botón Siguiente y obliga a clicar el elemento
}

interface InteractiveTourProps {
  steps: TourStep[];
  tourId: string; // ID único del tour (ej. 'alquileres-core')
}

export function InteractiveTour({ steps, tourId }: InteractiveTourProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Zustand Store
  const { activeTour, currentStep, isForceMode, skipTour, completeTour, nextStep } = useTourStore();
  const isOpen = activeTour === tourId;

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Anti Soft-Lock
  const retryCount = useRef(0);

  // Función para encontrar un elemento de forma robusta y medir sus límites
  const calculateTargetPosition = useCallback(() => {
    if (!isOpen || steps.length === 0 || currentStep >= steps.length) return;
    
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    const stepInfo = steps[currentStep];
    if (!stepInfo) return;
    
    const targetId = stepInfo.targetId;
    
    const findAndSetElement = () => {
      const element = document.getElementById(targetId);
      
      if (element) {
        retryCount.current = 0; // Reset retries
        const rect = element.getBoundingClientRect();
        
        const isVisible = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        if (!isVisible) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          setTimeout(() => {
            const el = document.getElementById(targetId);
            if (el) setTargetRect(el.getBoundingClientRect());
          }, 400); 
        } else {
          setTargetRect(rect);
        }
      } else {
        retryCount.current += 1;
        if (retryCount.current > 15) { // 3 segundos (15 * 200ms)
          console.warn(`[Tour] Soft-Lock: No se encontró el elemento ${targetId}. Abortando tour.`);
          setTargetRect(null);
          skipTour();
        } else {
          setTimeout(findAndSetElement, 200);
        }
      }
    };

    findAndSetElement();
  }, [currentStep, isOpen, steps, skipTour]);

  useEffect(() => {
    if (isOpen) {
      calculateTargetPosition();
      const handleResizeOrScroll = () => requestAnimationFrame(calculateTargetPosition);
      window.addEventListener('resize', handleResizeOrScroll);
      window.addEventListener('scroll', handleResizeOrScroll, true);
      return () => {
        window.removeEventListener('resize', handleResizeOrScroll);
        window.removeEventListener('scroll', handleResizeOrScroll, true);
      };
    }
  }, [isOpen, currentStep, calculateTargetPosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') skipTour();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, skipTour]);

  if (!isOpen || steps.length === 0 || currentStep >= steps.length) return null;

  const stepData = steps[currentStep];
  const isForcedClick = isForceMode && stepData.forcedClick;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStepInfo = steps[currentStep + 1];
      if (nextStepInfo.route && nextStepInfo.route !== pathname) {
        router.push(nextStepInfo.route);
      }
      nextStep();
    } else {
      completeTour();
    }
  };

  // Click catcher para avance forzado
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (isForcedClick) {
      // Avanzamos el paso en el tour
      handleNext();
      // Simulamos el click en el elemento real que estaba debajo
      const el = document.getElementById(stepData.targetId);
      if (el) {
        el.click();
      }
    }
  };

  const isMobile = windowSize.width < 640;
  const isReady = windowSize.width > 0;
  
  let tooltipTop: number | undefined = undefined;
  let tooltipLeft: number | undefined = undefined;

  const padding = 16;
  const paddingSpotlight = 8;

  if (!isMobile) {
    const tooltipWidth = tooltipRef.current ? tooltipRef.current.offsetWidth : 350;
    const tooltipHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 220;

    if (targetRect && windowSize.width > 0) {
      const spaceBelow = windowSize.height - targetRect.bottom;
      const spaceAbove = targetRect.top;
      
      if (spaceBelow >= tooltipHeight + padding || spaceBelow > spaceAbove) {
        tooltipTop = targetRect.bottom + padding;
      } else {
        tooltipTop = Math.max(padding, targetRect.top - tooltipHeight - padding);
      }

      const elementCenter = targetRect.left + (targetRect.width / 2);
      tooltipLeft = elementCenter - (tooltipWidth / 2);

      if (tooltipLeft + tooltipWidth > windowSize.width - padding) tooltipLeft = windowSize.width - tooltipWidth - padding;
      if (tooltipLeft < padding) tooltipLeft = padding;
    } else if (windowSize.width > 0) {
      tooltipTop = (windowSize.height / 2) - (tooltipHeight / 2);
      tooltipLeft = (windowSize.width / 2) - (tooltipWidth / 2);
    }
  }

  return (
    <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'} pointer-events-none overflow-hidden`}>
      
      {/* Overlay global para capturar clicks fuera y BLOQUEAR INTERACCIÓN */}
      {targetRect ? (
        <div 
          onClick={handleOverlayClick}
          className={`absolute rounded-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border-2 border-[var(--brand-base)] shadow-[0_0_0_9999px_rgba(15,23,42,0.75)] ring-4 ring-[var(--brand-light)] ${isForcedClick ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none'}`}
          style={{
            top: targetRect.top - paddingSpotlight,
            left: targetRect.left - paddingSpotlight,
            width: targetRect.width + paddingSpotlight * 2,
            height: targetRect.height + paddingSpotlight * 2,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/75 pointer-events-auto" />
      )}

      <div className="absolute inset-0 pointer-events-auto" style={{ zIndex: -1 }} />

      <div 
        ref={tooltipRef}
        className={`absolute bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ring-1 ring-slate-900/5 flex flex-col ${isMobile ? 'bottom-0 left-0 right-0 w-full p-6 pb-8' : 'w-full max-w-[360px] p-6'}`}
        style={!isMobile && tooltipTop !== undefined && tooltipLeft !== undefined ? { top: tooltipTop, left: tooltipLeft } : {}}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--brand-base)] rounded-t-2xl" />

        <button 
          onClick={skipTour}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-base)]"
          title="Cerrar tour (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5 pr-8 mt-1">
          <div className="text-xs font-black text-[var(--brand-dark)] uppercase tracking-widest mb-2">
            Paso {currentStep + 1} de {steps.length}
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-snug">
            {stepData.title}
          </h3>
        </div>
        
        <p className="text-base text-slate-800 mb-8 leading-relaxed font-medium">
          {stepData.content}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-500 ${idx === currentStep ? 'w-6 bg-[var(--brand-base)] shadow-md' : idx < currentStep ? 'w-2 bg-[var(--brand-light)]' : 'w-2 bg-slate-200'}`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {!isForcedClick && (
              <button
                onClick={handleNext}
                className="px-6 py-2 min-h-[44px] bg-[var(--brand-base)] hover:opacity-90 active:scale-95 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-1 shadow-lg focus:outline-none focus:ring-4 focus:ring-[var(--brand-light)]"
              >
                {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                {currentStep !== steps.length - 1 && <ChevronRight className="w-5 h-5 ml-1" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
