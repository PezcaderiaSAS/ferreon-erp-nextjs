'use client';

import React from 'react';
import { Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  MantenimientoPreventivoService,
  MantenimientoConfig,
  EstadoSemaforoMantenimiento,
} from '@/core/services/mantenimiento-preventivo.service';

export interface BarraVidaUtilEquipoProps {
  equipo: {
    id: string | number;
    nombre?: string;
    stock_mantenimiento?: number;
    stockMantenimiento?: number;
    horas_uso_acumuladas?: number;
    horas_limite_mantenimiento?: number;
    dias_uso_acumulados?: number;
    dias_limite_mantenimiento?: number;
    ultimo_mantenimiento_at?: string | null;
  };
  compacto?: boolean;
}

export function BarraVidaUtilEquipo({ equipo, compacto = false }: BarraVidaUtilEquipoProps) {
  const stockMaint = Number(equipo.stock_mantenimiento ?? equipo.stockMantenimiento ?? 0);
  const horasActual = Number(equipo.horas_uso_acumuladas || 0);
  const horasLimite = Number(equipo.horas_limite_mantenimiento || 0);
  const diasActual = Number(equipo.dias_uso_acumulados || 0);
  const diasLimite = Number(equipo.dias_limite_mantenimiento || 0);

  const config: MantenimientoConfig = {
    tieneHorometro: horasLimite > 0,
    horasUsoAcumuladas: horasActual,
    horasLimiteMantenimiento: horasLimite,
    diasUsoAcumulados: diasActual,
    diasLimiteMantenimiento: diasLimite,
    stockMantenimiento: stockMaint,
    ultimoMantenimientoAt: equipo.ultimo_mantenimiento_at || null,
    ultimoMantenimientoObs: null,
  };

  const semaforo: EstadoSemaforoMantenimiento = MantenimientoPreventivoService.evaluarSemaforoMantenimiento(config);
  const porcentaje = MantenimientoPreventivoService.obtenerPorcentajeDesgasteMaximo(config);

  // Variante cromática
  const configColor = {
    OK: {
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Operativo',
      icon: CheckCircle2,
    },
    PROXIMO: {
      bar: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
      label: 'Próximo a Service',
      icon: AlertTriangle,
    },
    VENCIDO: {
      bar: 'bg-rose-500',
      badge: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
      label: stockMaint > 0 ? `En Taller (${stockMaint})` : 'Service Requerido',
      icon: Wrench,
    },
  }[semaforo];

  const Icon = configColor.icon;

  if (compacto) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${configColor.badge}`}
        title={`Vida útil ciclo: ${porcentaje}%`}
      >
        <Icon className="w-3 h-3 shrink-0" />
        <span>{configColor.label}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1 min-w-[130px] max-w-[180px]">
      <div className="flex items-center justify-between text-[11px]">
        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
          <Icon className="w-3 h-3 text-slate-500" />
          <span>{configColor.label}</span>
        </span>
        <span className="font-mono text-[10px] text-slate-500">{porcentaje}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
        <div
          className={`h-full transition-all duration-300 ${configColor.bar}`}
          style={{ width: `${Math.min(100, Math.max(5, porcentaje))}%` }}
        />
      </div>
    </div>
  );
}
