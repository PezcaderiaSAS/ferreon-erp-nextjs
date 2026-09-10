import React from 'react';
import { cn } from '@/lib/utils';
import { PresetContainerProps } from './types';

/**
 * Contenedor maestro que inyecta el arquetipo de diseño mediante el atributo [data-theme-preset].
 * Establece el contexto de variables CSS HSL, la tipografía y los efectos de superficie
 * para todos los componentes hijos, garantizando aislamiento estricto de estilos.
 */
export const PresetContainer: React.FC<PresetContainerProps> = ({
  preset,
  children,
  isIsolated = true,
  className,
  ...props
}) => {
  return (
    <div
      data-theme-preset={preset}
      className={cn(
        'relative w-full transition-all duration-300 font-sans text-preset-fg bg-preset-bg',
        isIsolated && 'rounded-preset border border-preset-border shadow-preset p-6',
        preset === 'neumorphic' && 'shadow-neu-extruded border-transparent',
        preset === 'flat' && 'border-2 border-slate-200 shadow-none',
        preset === 'ferreon-glass' && 'glass-panel-preset border-white/10',
        className
      )}
      {...props}
    >
      {/* Elementos ambientales atmosféricos condicionales por arquetipo */}
      {preset === 'ferreon-glass' && (
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" 
        />
      )}
      {preset === 'corporate' && (
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" 
        />
      )}
      {preset === 'material-you' && (
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" 
        />
      )}

      {/* Contenido envuelto en el contexto del preset */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};
