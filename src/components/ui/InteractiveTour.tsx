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

  const calculateTargetPosition = useCallback(() => {
    if (!isOpen || steps.length === 0) return;
    
    const targetId = steps[currentStepIndex].targetId;
    const element = document.getElementById(targetId);
    
    if (element) {
      // Hacemos scroll hacia el elemento suavemente si no está visible
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      
      // Damos un pequeño margen de tiempo para que el scroll termine antes de medir
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      }, 300);
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
      
      window.addEventListener('resize', calculateTargetPosition);
      window.addEventListener('scroll', calculateTargetPosition, true);
      
      return () => {
        window.removeEventListener('resize', calculateTargetPosition);
        window.removeEventListener('scroll', calculateTargetPosition, true);
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
      onClose(); // Si es el último, cerramos
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const currentStep = steps[currentStepIndex];

  // Cálculo de la posición de la tarjeta (tooltip)
  // Por defecto, lo colocamos abajo del elemento. Si choca con el borde inferior, lo ponemos arriba.
  let tooltipTop = 0;
  let tooltipLeft = 0;

  if (targetRect) {
    const windowHeight = window.innerHeight;
    const tooltipHeight = 200; // Altura estimada
    
    tooltipTop = targetRect.bottom + 16;
    if (tooltipTop + tooltipHeight > windowHeight) {
      tooltipTop = targetRect.top - tooltipHeight - 16;
    }
    
    tooltipLeft = targetRect.left;
    // Prevenir desbordamiento horizontal
    const windowWidth = window.innerWidth;
    const tooltipWidth = 320; // Ancho de w-80
    if (tooltipLeft + tooltipWidth > windowWidth) {
      tooltipLeft = windowWidth - tooltipWidth - 16;
    }
  } else {
    // Si no se encuentra el elemento, centramos la tarjeta
    tooltipTop = window.innerHeight / 2 - 100;
    tooltipLeft = window.innerWidth / 2 - 160;
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none transition-opacity duration-300">
      
      {/* Spotlight Animado usando box-shadow */}
      {targetRect && (
        <div 
          className="absolute rounded-xl pointer-events-none transition-all duration-500 ease-in-out border-2 border-indigo-500/50 shadow-[0_0_0_9999px_rgba(15,23,42,0.7)]"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Fallback si no encuentra el objetivo (Fondo oscuro global) */}
      {!targetRect && (
        <div className="absolute inset-0 bg-slate-900/70 pointer-events-none transition-opacity duration-500" />
      )}

      {/* Tarjeta Explicativa (Tooltip) */}
      <div 
        className="absolute w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 pointer-events-auto transition-all duration-500 ease-in-out transform"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
        }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full p-1"
          title="Cerrar tour (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">
            Paso {currentStepIndex + 1} de {steps.length}
          </div>
          <h3 className="text-lg font-bold text-slate-800 pr-6 leading-tight">
            {currentStep.title}
          </h3>
        </div>
        
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {currentStep.content}
        </p>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStepIndex ? 'w-4 bg-indigo-500' : 'w-1.5 bg-slate-200'}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Anterior (Flecha Izquierda)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 shadow-sm"
              title="Siguiente (Flecha Derecha)"
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
