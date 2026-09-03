import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  route?: string;
}

interface InteractiveTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
}

import { useRouter, usePathname } from 'next/navigation';

export function InteractiveTour({ steps, isOpen, onClose }: InteractiveTourProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Función para encontrar un elemento de forma robusta y medir sus límites
  const calculateTargetPosition = useCallback(() => {
    if (!isOpen || steps.length === 0) return;
    
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    const targetId = steps[currentStepIndex].targetId;
    
    const findAndSetElement = (retries = 5) => {
      const element = document.getElementById(targetId);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        
        // Comprobar si está parcial o totalmente fuera del viewport
        const isVisible = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        // Si no es visible, hacemos scroll y recalculamos
        if (!isVisible) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          // Set timeout para permitir que termine el scroll suave
          setTimeout(() => {
            const el = document.getElementById(targetId);
            if (el) setTargetRect(el.getBoundingClientRect());
          }, 400); 
        } else {
          setTargetRect(rect);
        }
      } else if (retries > 0) {
        // Reintentar en caso de que estemos en medio de una transición de Next.js
        setTimeout(() => findAndSetElement(retries - 1), 200);
      } else {
        setTargetRect(null);
      }
    };

    findAndSetElement();
  }, [currentStepIndex, isOpen, steps]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      calculateTargetPosition();
      
      const handleResizeOrScroll = () => {
        requestAnimationFrame(calculateTargetPosition);
      };

      window.addEventListener('resize', handleResizeOrScroll);
      // El true es para la fase de captura, para interceptar scroll en divs internos
      window.addEventListener('scroll', handleResizeOrScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResizeOrScroll);
        window.removeEventListener('scroll', handleResizeOrScroll, true);
      };
    }
  }, [isOpen, currentStepIndex, calculateTargetPosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen || steps.length === 0) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1];
      if (nextStep.route && nextStep.route !== pathname) {
        router.push(nextStep.route);
      }
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose(); // Cerrar si es el final
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      if (prevStep.route && prevStep.route !== pathname) {
        router.push(prevStep.route);
      }
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const currentStep = steps[currentStepIndex];

  // =====================
  // POSICIONAMIENTO DE LA TARJETA TOOLTIP (RESPONSIVE HÍBRIDO)
  // =====================
  
  const isMobile = windowSize.width < 640; // Tailwind sm breakpoint
  const isReady = windowSize.width > 0;
  
  let tooltipTop: number | undefined = undefined;
  let tooltipLeft: number | undefined = undefined;

  const padding = 16;
  const paddingSpotlight = 8; // Padding extra del cuadro iluminado

  if (!isMobile) {
    // LÓGICA DESKTOP (FLOTANTE)
    // Leemos la altura/anchura real del tooltip usando el useRef si ya está renderizado
    // Si aún no se renderiza, estimamos
    const tooltipWidth = tooltipRef.current ? tooltipRef.current.offsetWidth : 350;
    const tooltipHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 220;

    if (targetRect && windowSize.width > 0) {
      const spaceBelow = windowSize.height - targetRect.bottom;
      const spaceAbove = targetRect.top;
      
      // Elegir verticalmente (abajo por defecto, arriba si falta espacio)
      if (spaceBelow >= tooltipHeight + padding || spaceBelow > spaceAbove) {
        tooltipTop = targetRect.bottom + padding;
      } else {
        tooltipTop = Math.max(padding, targetRect.top - tooltipHeight - padding);
      }

      // Elegir horizontalmente (centrado al elemento por defecto)
      const elementCenter = targetRect.left + (targetRect.width / 2);
      tooltipLeft = elementCenter - (tooltipWidth / 2);

      // Ajustes para no salir de los bordes laterales
      if (tooltipLeft + tooltipWidth > windowSize.width - padding) {
        tooltipLeft = windowSize.width - tooltipWidth - padding;
      }
      if (tooltipLeft < padding) {
        tooltipLeft = padding;
      }
    } else if (windowSize.width > 0) {
      // Centro del layout
      tooltipTop = (windowSize.height / 2) - (tooltipHeight / 2);
      tooltipLeft = (windowSize.width / 2) - (tooltipWidth / 2);
    }
  }
  // En mobile, ignoramos tooltipTop y tooltipLeft (serán undefined) y usamos clases de CSS

  return (
    <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'} pointer-events-none overflow-hidden`}>
      
      {/* Overlay global para capturar clicks fuera y BLOQUEAR INTERACCIÓN */}
      {targetRect ? (
        <div 
          className="absolute pointer-events-none rounded-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border-2 border-[var(--brand-base)] shadow-[0_0_0_9999px_rgba(15,23,42,0.75)] ring-4 ring-[var(--brand-light)]"
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

      {/* Bloqueador invisible del fondo para forzar lectura (Bloqueo absoluto de clics en la app) */}
      <div className="absolute inset-0 pointer-events-auto" style={{ zIndex: -1 }} />

      {/* Tarjeta Explicativa (Tooltip) - 100% Opaca, Alto Contraste, Docked on Mobile */}
      <div 
        ref={tooltipRef}
        className={`
          absolute bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 
          pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
          ring-1 ring-slate-900/5 flex flex-col
          ${isMobile ? 'bottom-0 left-0 right-0 w-full p-6 pb-8' : 'w-full max-w-[360px] p-6'}
        `}
        style={!isMobile && tooltipTop !== undefined && tooltipLeft !== undefined ? {
          top: tooltipTop,
          left: tooltipLeft,
        } : {}}
      >
        {/* Resalte superior dinámico según el tema */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--brand-base)] rounded-t-2xl" />

        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-base)]"
          title="Cerrar tour (Esc)"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5 pr-8 mt-1">
          <div className="text-xs font-black text-[var(--brand-dark)] uppercase tracking-widest mb-2">
            Paso {currentStepIndex + 1} de {steps.length}
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-snug">
            {currentStep.title}
          </h3>
        </div>
        
        <p className="text-base text-slate-800 mb-8 leading-relaxed font-medium">
          {currentStep.content}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          {/* Indicadores de Progreso Lineales (Dinámicos) */}
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-500 ${
                  idx === currentStepIndex 
                  ? 'w-6 bg-[var(--brand-base)] shadow-md' 
                  : idx < currentStepIndex
                    ? 'w-2 bg-[var(--brand-light)]'
                    : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
              title="Anterior (Flecha Izquierda)"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 min-h-[44px] bg-[var(--brand-base)] hover:opacity-90 active:scale-95 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-1 shadow-lg focus:outline-none focus:ring-4 focus:ring-[var(--brand-light)]"
              title="Siguiente (Flecha Derecha)"
              aria-label="Siguiente"
            >
              {currentStepIndex === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
              {currentStepIndex !== steps.length - 1 && <ChevronRight className="w-5 h-5 ml-1" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
