import React from 'react';
import { cn } from '@/lib/utils';
import { PresetButtonProps } from './types';

/**
 * Botón atómico adaptativo que adopta automáticamente la geometría,
 * física de interacción y elevación del preset activo.
 * 
 * Cumple con los estándares de la industria:
 * - Área táctil mínima de 44x44px (h-11).
 * - Prevención física de doble click (pointer-events-none en isLoading).
 * - Foco visible de alta accesibilidad (WCAG AA).
 * - Micro-animaciones aceleradas por hardware (GPU).
 */
export const PresetButton: React.FC<PresetButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-9 px-3.5 text-xs gap-1.5',
    md: 'h-11 px-5 text-sm gap-2 min-w-[44px]',
    lg: 'h-14 px-7 text-base gap-2.5 min-w-[48px]',
  };

  const variantClasses = {
    primary: cn(
      'bg-preset-primary text-preset-primaryFg font-semibold shadow-preset',
      'hover:brightness-105 hover:shadow-preset-hover hover:-translate-y-0.5',
      'active:scale-95 active:translate-y-0 active:brightness-95',
      '[[data-theme-preset="minimalist"]_&]:bg-electric-gradient [[data-theme-preset="minimalist"]_&]:text-white',
      '[[data-theme-preset="flat"]_&]:hover:scale-105 [[data-theme-preset="flat"]_&]:shadow-none [[data-theme-preset="flat"]_&]:border-2 [[data-theme-preset="flat"]_&]:border-preset-primary',
      '[[data-theme-preset="neumorphic"]_&]:shadow-neu-extruded [[data-theme-preset="neumorphic"]_&]:hover:shadow-neu-extruded-hover [[data-theme-preset="neumorphic"]_&]:active:shadow-neu-inset [[data-theme-preset="neumorphic"]_&]:border-transparent',
      '[[data-theme-preset="material-you"]_&]:rounded-full [[data-theme-preset="material-you"]_&]:shadow-sm [[data-theme-preset="material-you"]_&]:hover:shadow-md'
    ),
    secondary: cn(
      'bg-preset-secondary text-preset-secondaryFg font-semibold',
      'hover:brightness-105 hover:-translate-y-0.5',
      'active:scale-95 active:translate-y-0',
      '[[data-theme-preset="neumorphic"]_&]:bg-preset-bg [[data-theme-preset="neumorphic"]_&]:text-preset-fg [[data-theme-preset="neumorphic"]_&]:shadow-neu-extruded [[data-theme-preset="neumorphic"]_&]:active:shadow-neu-inset',
      '[[data-theme-preset="flat"]_&]:border-2 [[data-theme-preset="flat"]_&]:border-slate-300 [[data-theme-preset="flat"]_&]:shadow-none',
      '[[data-theme-preset="material-you"]_&]:rounded-full'
    ),
    outline: cn(
      'bg-transparent border border-preset-border text-preset-fg font-medium',
      'hover:bg-preset-muted hover:text-preset-fg',
      'active:scale-95',
      '[[data-theme-preset="flat"]_&]:border-2 [[data-theme-preset="flat"]_&]:border-slate-800 [[data-theme-preset="flat"]_&]:hover:bg-slate-900 [[data-theme-preset="flat"]_&]:hover:text-white',
      '[[data-theme-preset="material-you"]_&]:rounded-full'
    ),
    ghost: cn(
      'bg-transparent text-preset-mutedFg font-medium',
      'hover:bg-preset-muted/60 hover:text-preset-fg',
      'active:scale-95',
      '[[data-theme-preset="material-you"]_&]:rounded-full'
    ),
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'relative inline-flex items-center justify-center select-none font-sans rounded-preset',
        'transition-all duration-200 ease-out transform-gpu',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-preset-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        sizeClasses[size],
        variantClasses[variant],
        isLoading && 'pointer-events-none',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-xs font-semibold tracking-wide">Cargando...</span>
        </span>
      ) : (
        <>
          {leftIcon && <span className="shrink-0 transition-transform">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0 transition-transform">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
