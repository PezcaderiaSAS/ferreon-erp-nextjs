import React from 'react';
import { cn } from '@/lib/utils';
import { PresetInputProps } from './types';

/**
 * Campo de entrada atómico adaptativo que emula las físicas de captura del arquetipo activo:
 * - Neumorphism: Pozo táctil tallado con sombra inset profunda.
 * - Material You: Estilo filled con fondo tonal y acento en borde inferior.
 * - Flat Design: Bloque plano de alto contraste con borde sólido 2px.
 * - FerreOn Glass: Superficie translúcida con desenfoque de cristal y borde sutil.
 * - Corporate: Campo limpio en blanco con foco coloreado.
 */
export const PresetInput = React.forwardRef<HTMLInputElement, PresetInputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightElement,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5 font-sans">
        {/* Etiqueta accesible */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-wide text-preset-fg"
          >
            {label}
          </label>
        )}

        {/* Contenedor relativo para posicionar iconos */}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-preset-mutedFg">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'h-11 w-full px-3.5 text-sm font-sans rounded-preset transition-all duration-200 outline-none',
              'text-preset-fg bg-preset-card border border-preset-border placeholder:text-preset-mutedFg/60',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-preset-bg',
              'disabled:opacity-50 disabled:cursor-not-allowed',

              /* Neumorphism: Pozo tallado (Inset) */
              '[[data-theme-preset="neumorphic"]_&]:bg-preset-bg [[data-theme-preset="neumorphic"]_&]:border-transparent',
              '[[data-theme-preset="neumorphic"]_&]:shadow-neu-inset [[data-theme-preset="neumorphic"]_&]:focus-visible:shadow-neu-inset-deep',

              /* Material You: Filled con borde inferior */
              '[[data-theme-preset="material-you"]_&]:bg-preset-muted/70 [[data-theme-preset="material-you"]_&]:border-0',
              '[[data-theme-preset="material-you"]_&]:border-b-2 [[data-theme-preset="material-you"]_&]:border-preset-border',
              '[[data-theme-preset="material-you"]_&]:rounded-t-lg [[data-theme-preset="material-you"]_&]:rounded-b-none',
              '[[data-theme-preset="material-you"]_&]:focus-visible:border-preset-primary',

              /* Flat Design: Sólido sin sombras */
              '[[data-theme-preset="flat"]_&]:bg-slate-100 [[data-theme-preset="flat"]_&]:border-2 [[data-theme-preset="flat"]_&]:border-slate-300',
              '[[data-theme-preset="flat"]_&]:focus-visible:border-preset-primary [[data-theme-preset="flat"]_&]:focus-visible:bg-white',
              '[[data-theme-preset="flat"]_&]:shadow-none',

              /* FerreOn Glass: Vidrio translúcido */
              '[[data-theme-preset="ferreon-glass"]_&]:bg-slate-900/60 [[data-theme-preset="ferreon-glass"]_&]:backdrop-blur-md',
              '[[data-theme-preset="ferreon-glass"]_&]:border-white/10 [[data-theme-preset="ferreon-glass"]_&]:focus-visible:border-cyan-400',

              leftIcon && 'pl-10',
              rightElement && 'pr-10',
              error && 'border-red-500 focus-visible:ring-red-500 text-red-600',
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {/* Mensaje de error o ayuda */}
        {error ? (
          <p className="text-xs font-semibold text-red-500 tracking-tight animate-fadeIn">
            {error}
          </p>
        ) : hint ? (
          <p className="text-[11px] text-preset-mutedFg font-medium">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

PresetInput.displayName = 'PresetInput';
