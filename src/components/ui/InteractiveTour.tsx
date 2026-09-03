import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
}

interface InteractiveTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
}

export function InteractiveTour({ steps, isOpen, onClose }: InteractiveTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Función para encontrar un elemento de forma robusta y medir sus límites
  const calculateTargetPosition = useCallback(() => {
    if (!isOpen || steps.length === 0) return;
    
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    const targetId = steps[currentStepIndex].targetId;
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
          if (element) {
            setTargetRect(element.getBoundingClientRect());
          }
        }, 400); 
      } else {
        setTargetRect(rect);
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStepIndex, isOpen, steps]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      calculateTargetPosition();
    }
  }, [isOpen, calculateTargetPosition]);

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
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose(); // Cerrar si es el final
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const currentStep = steps[currentStepIndex];

  // =====================
  // POSICIONAMIENTO DE LA TARJETA TOOLTIP (RESPONSIVE)
  // =====================
  let tooltipTop = 0;
  let tooltipLeft = 0;
  
  // Constantes de dimensiones estimadas (la tarjeta es w-80 o máximo ~320px)
  const tooltipWidth = 320; 
  const tooltipHeight = 220; 
  const padding = 16;
  const paddingSpotlight = 8; // Padding extra del cuadro iluminado

  if (targetRect && windowSize.width > 0) {
    const spaceBelow = windowSize.height - targetRect.bottom;
    const spaceAbove = targetRect.top;
    
    // Elegir verticalmente (abajo por defecto, arriba si falta espacio)
    if (spaceBelow >= tooltipHeight + padding || spaceBelow > spaceAbove) {
      tooltipTop = targetRect.bottom + padding;
    } else {
      tooltipTop = targetRect.top - tooltipHeight - padding;
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
    // Si no encuentra el elemento, ubicar en el centro del layout
    tooltipTop = (windowSize.height / 2) - (tooltipHeight / 2);
    tooltipLeft = (windowSize.width / 2) - (tooltipWidth / 2);
  }

  const isReady = windowSize.width > 0;

  return (
    <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'} pointer-events-none overflow-hidden`}>
      
      {/* Overlay global para capturar clicks fuera y no interactuar por accidente */}
      {/* Usamos un SVG overlay para el spotlight que permite interactuar O el truco del box-shadow masivo. */}
      {targetRect ? (
        <div 
          className="absolute pointer-events-none rounded-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border-2 border-indigo-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.75)] ring-4 ring-indigo-500/30"
          style={{
            top: targetRect.top - paddingSpotlight,
            left: targetRect.left - paddingSpotlight,
            width: targetRect.width + paddingSpotlight * 2,
            height: targetRect.height + paddingSpotlight * 2,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/75 pointer-events-none" />
      )}

      {/* Tarjeta Explicativa (Tooltip) con Diseño Premium y Glassmorphism */}
      <div 
        className="absolute w-[calc(100vw-32px)] max-w-xs sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-5 pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ring-1 ring-slate-900/5"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
        }}
      >
        {/* Resalte superior */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-t-2xl opacity-80" />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors bg-slate-100/50 hover:bg-slate-100 rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          title="Cerrar tour (Esc)"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4 pr-6">
          <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">
            Paso {currentStepIndex + 1} de {steps.length}
          </div>
          <h3 className="text-lg font-bold text-slate-800 leading-snug">
            {currentStep.title}
          </h3>
        </div>
        
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {currentStep.content}
        </p>
        
        <div className="flex items-center justify-between pt-3 border-t border-slate-100/80">
          {/* Indicadores de Progreso Lineales */}
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === currentStepIndex 
                  ? 'w-5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' 
                  : idx < currentStepIndex
                    ? 'w-1.5 bg-indigo-200'
                    : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              title="Anterior (Flecha Izquierda)"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-1 shadow-sm shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
              title="Siguiente (Flecha Derecha)"
              aria-label="Siguiente"
            >
              {currentStepIndex === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
              {currentStepIndex !== steps.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
