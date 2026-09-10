import React from 'react';
import { cn } from '@/lib/utils';
import { PresetBadgeProps } from './types';

/**
 * Insignia / Badge atómico adaptativo para metadatos, estados de inventario
 * e indicadores de báscula en FerreOn & AppFrios Pezca.
 */
export const PresetBadge: React.FC<PresetBadgeProps> = ({
  children,
  variant = 'default',
  pulsing = false,
  className,
  ...props
}) => {
  const variantClasses = {
    default: 'bg-preset-primary/10 text-preset-primary border-preset-primary/20',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    accent: 'bg-preset-secondary/15 text-preset-secondary border-preset-secondary/30',
    neutral: 'bg-preset-muted text-preset-mutedFg border-preset-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold select-none border transition-all duration-200',
        'rounded-preset',
        variantClasses[variant],

        /* Neumorphism: Insignia en bajo relieve */
        '[[data-theme-preset="neumorphic"]_&]:shadow-neu-inset [[data-theme-preset="neumorphic"]_&]:border-transparent [[data-theme-preset="neumorphic"]_&]:bg-preset-bg',

        /* Flat Design: Bordes nítidos sólidos sin sombras */
        '[[data-theme-preset="flat"]_&]:border-2 [[data-theme-preset="flat"]_&]:shadow-none [[data-theme-preset="flat"]_&]:rounded-md',

        /* Material You: Píldora redondeada tonal */
        '[[data-theme-preset="material-you"]_&]:rounded-full [[data-theme-preset="material-you"]_&]:border-transparent',

        /* Minimalist Modern: Monospace elegante en mayúsculas */
        '[[data-theme-preset="minimalist"]_&]:font-mono [[data-theme-preset="minimalist"]_&]:uppercase [[data-theme-preset="minimalist"]_&]:tracking-wider [[data-theme-preset="minimalist"]_&]:text-[11px] [[data-theme-preset="minimalist"]_&]:rounded-full',

        /* FerreOn Glass: Cristal translúcido */
        '[[data-theme-preset="ferreon-glass"]_&]:backdrop-blur-md [[data-theme-preset="ferreon-glass"]_&]:border-white/15',

        className
      )}
      {...props}
    >
      {pulsing && (
        <span 
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-current animate-pulse shrink-0" 
        />
      )}
      <span>{children}</span>
    </span>
  );
};
