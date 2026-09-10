import React from 'react';
import { cn } from '@/lib/utils';
import { PresetCardProps } from './types';

/**
 * Tarjeta contenedora modular adaptativa que refleja la elevación,
 * bordes y personalidad visual del preset de diseño activo.
 */
export const PresetCard: React.FC<PresetCardProps> = ({
  title,
  subtitle,
  badge,
  interactive = false,
  headerAction,
  children,
  className,
  ...props
}) => {
  const hasHeader = title || subtitle || badge || headerAction;

  return (
    <div
      className={cn(
        'relative overflow-hidden font-sans rounded-preset bg-preset-card text-preset-cardFg p-6',
        'border border-preset-border shadow-preset transition-all duration-300 ease-out transform-gpu',
        interactive && [
          'cursor-pointer hover:-translate-y-1 hover:shadow-preset-hover',
          '[[data-theme-preset="neumorphic"]_&]:hover:shadow-neu-extruded-hover',
          '[[data-theme-preset="corporate"]_&]:hover:shadow-corporate-colored-hover',
          '[[data-theme-preset="flat"]_&]:hover:scale-[1.02] [[data-theme-preset="flat"]_&]:shadow-none [[data-theme-preset="flat"]_&]:border-2',
          '[[data-theme-preset="material-you"]_&]:hover:shadow-md [[data-theme-preset="material-you"]_&]:rounded-3xl',
          '[[data-theme-preset="ferreon-glass"]_&]:hover:border-cyan-400/30'
        ],
        // Estilos específicos de superficie en reposo
        '[[data-theme-preset="neumorphic"]_&]:shadow-neu-extruded [[data-theme-preset="neumorphic"]_&]:border-transparent',
        '[[data-theme-preset="flat"]_&]:shadow-none [[data-theme-preset="flat"]_&]:border-2 [[data-theme-preset="flat"]_&]:border-slate-200',
        '[[data-theme-preset="ferreon-glass"]_&]:glass-panel-preset [[data-theme-preset="ferreon-glass"]_&]:border-white/10',
        '[[data-theme-preset="material-you"]_&]:rounded-3xl [[data-theme-preset="material-you"]_&]:shadow-sm',
        className
      )}
      {...props}
    >
      {/* Cabecera estructurada de la tarjeta */}
      {hasHeader && (
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-preset-border/40 pb-3">
          <div className="space-y-0.5">
            {badge && (
              <span className="inline-block mb-1 text-[11px] font-bold uppercase tracking-wider text-preset-primary bg-preset-primary/10 px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
            {title && (
              <h3 className="font-display text-lg font-bold tracking-tight text-preset-cardFg">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-preset-mutedFg font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {headerAction && (
            <div className="shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}

      {/* Cuerpo principal del contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
