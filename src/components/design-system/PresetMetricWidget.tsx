import React from 'react';
import { Scale, Receipt, Boxes, ArrowUpRight, ArrowDownRight, HardHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PresetMetricWidgetProps } from './types';

/**
 * Widget métrico de dominio empresarial para FerreOn ERP.
 * Implementa las reglas críticas de negocio:
 * 1. Control de días de alquiler y equipos activos en obra.
 * 2. Formateo de moneda colombiana (COP) sin decimales artificiales.
 * 3. Alineación numérica estricta a la derecha con fuentes monoespaciadas legibles.
 * 4. Adaptación física al arquetipo visual activo (pozo neumórfico tallado, tarjeta glass, etc.).
 */
export const PresetMetricWidget: React.FC<PresetMetricWidgetProps> = ({
  title,
  value,
  unit,
  secondaryInfo,
  trend,
  moduleContext,
  className,
}) => {
  // Lógica de formateo rigurosa según el contexto de dominio
  let formattedMainValue = '';
  let derivedUnit = unit || '';
  let derivedSubtitle = secondaryInfo;

  if (moduleContext === 'rentals') {
    const num = typeof value === 'number' ? value : parseFloat(value as string) || 0;
    formattedMainValue = num.toLocaleString('es-CO');
    derivedUnit = derivedUnit || 'Días';
    if (!derivedSubtitle) {
      derivedSubtitle = 'Duración estimada de contrato';
    }
  } else if (moduleContext === 'weighing') {
    const numGrams = typeof value === 'number' ? value : parseFloat(value as string) || 0;
    const kg = numGrams / 1000;
    formattedMainValue = kg.toLocaleString('es-CO', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
    derivedUnit = derivedUnit || 'KG';
    if (!derivedSubtitle) {
      derivedSubtitle = `${numGrams.toLocaleString('es-CO')} g brutos`;
    }
  } else if (moduleContext === 'billing') {
    const numCurrency = typeof value === 'number' ? value : parseFloat(value as string) || 0;
    formattedMainValue = numCurrency.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  } else {
    // Inventario o conteo de unidades
    const numUnits = typeof value === 'number' ? value : parseFloat(value as string) || 0;
    formattedMainValue = numUnits.toLocaleString('es-CO');
    derivedUnit = derivedUnit || 'Unid.';
  }

  const iconMap = {
    rentals: <HardHat className="h-5 w-5 text-sky-500 shrink-0" />,
    weighing: <Scale className="h-5 w-5 text-preset-primary shrink-0" />,
    billing: <Receipt className="h-5 w-5 text-emerald-500 shrink-0" />,
    inventory: <Boxes className="h-5 w-5 text-amber-500 shrink-0" />,
  };


  return (
    <div
      className={cn(
        'relative overflow-hidden font-sans rounded-preset p-5 bg-preset-card text-preset-cardFg',
        'border border-preset-border shadow-preset transition-all duration-300',
        
        /* Neumorphism: Pozo exterior extruido */
        '[[data-theme-preset="neumorphic"]_&]:shadow-neu-extruded [[data-theme-preset="neumorphic"]_&]:border-transparent',
        
        /* Flat: Bloque sólido sin sombras */
        '[[data-theme-preset="flat"]_&]:border-2 [[data-theme-preset="flat"]_&]:border-slate-200 [[data-theme-preset="flat"]_&]:shadow-none',
        
        /* FerreOn Glass: Vidrio translúcido */
        '[[data-theme-preset="ferreon-glass"]_&]:glass-panel-preset [[data-theme-preset="ferreon-glass"]_&]:border-white/10',

        /* Material You: Redondeo amplio de 24px */
        '[[data-theme-preset="material-you"]_&]:rounded-3xl',
        className
      )}
    >
      {/* Cabecera del Indicador */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'p-2 rounded-xl bg-preset-primary/10 flex items-center justify-center',
            '[[data-theme-preset="neumorphic"]_&]:shadow-neu-inset [[data-theme-preset="neumorphic"]_&]:bg-preset-bg',
            '[[data-theme-preset="material-you"]_&]:rounded-full'
          )}>
            {iconMap[moduleContext]}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-preset-mutedFg">
            {title}
          </span>
        </div>

        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
              trend.isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
            )}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {trend.value}%
          </span>
        )}
      </div>

      {/* Contenedor de Valor Numérico (Alineación a la derecha & Pozo Inset en Neumorphism) */}
      <div
        className={cn(
          'p-3.5 rounded-xl flex items-baseline justify-end gap-1.5 transition-all',
          '[[data-theme-preset="neumorphic"]_&]:shadow-neu-inset-deep [[data-theme-preset="neumorphic"]_&]:bg-preset-bg',
          '[[data-theme-preset="flat"]_&]:bg-slate-100/70',
          '[[data-theme-preset="material-you"]_&]:bg-preset-muted/40 [[data-theme-preset="material-you"]_&]:rounded-2xl'
        )}
      >
        <span className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-preset-fg text-right">
          {formattedMainValue}
        </span>
        {derivedUnit && (
          <span className="text-xs font-bold uppercase tracking-wider text-preset-mutedFg shrink-0">
            {derivedUnit}
          </span>
        )}
      </div>

      {/* Subtítulo o Información Secundaria de Trazabilidad */}
      {derivedSubtitle && (
        <p className="mt-2.5 text-right text-[11px] font-medium text-preset-mutedFg/80">
          {derivedSubtitle}
        </p>
      )}
    </div>
  );
};
