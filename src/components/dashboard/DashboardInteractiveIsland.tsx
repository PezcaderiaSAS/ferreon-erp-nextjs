'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, CornerDownLeft, RefreshCw } from 'lucide-react';
import {
  type DashboardPayload,
  type TareaOperativa,
  type UrgenciaTarea
} from '@/core/types/dashboard';
import { DashboardKpiGrid } from './DashboardKpiGrid';
import { CalendarioOperativoIsland } from './CalendarioOperativoIsland';
import { ResumenTareasCard } from './ResumenTareasCard';
import { RecordatorioEventosFeed } from './RecordatorioEventosFeed';
import { ActividadDrawer } from './ActividadDrawer';
import {
  crearTareaManualAction,
  toggleTareaCompletadaAction,
  eliminarTareaManualAction
} from '@/app/actions/dashboard';
import { obtenerFechaHoyLocal } from '@/core/services/dashboard-transaccional.service';

interface DashboardInteractiveIslandProps {
  initialData: DashboardPayload;
}

export function DashboardInteractiveIsland({
  initialData
}: DashboardInteractiveIslandProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<DashboardPayload>(initialData);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(
    () => obtenerFechaHoyLocal()
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Manejo de selección de día en el calendario
  const handleSelectDay = (fecha: string) => {
    setFechaSeleccionada(fecha);
    setDrawerOpen(true);
  };

  // Toggle de tareas (actualización optimista con persistencia en Supabase)
  const handleToggleTarea = async (tareaId: string) => {
    const tarea = data.tareas.find((t) => t.id === tareaId);
    if (!tarea) return;

    const nuevoEstado = !tarea.completada;

    // Actualización optimista inmediata en UI
    setData((prev) => ({
      ...prev,
      tareas: prev.tareas.map((t) =>
        t.id === tareaId ? { ...t, completada: nuevoEstado } : t
      )
    }));

    // Sincronizar en base de datos si no es sintética del sistema
    try {
      await toggleTareaCompletadaAction(tareaId, nuevoEstado);
    } catch (err) {
      console.error('Error al sincronizar estado de tarea:', err);
    }
  };

  // Creación de tarea manual con persistencia real en Supabase
  const handleCrearTareaManual = async (
    titulo: string,
    urgencia: UrgenciaTarea = 'NORMAL',
    fechaLimite?: string
  ) => {
    const tempId = `task-manual-${Date.now()}`;
    const nuevaTareaTemp: TareaOperativa = {
      id: tempId,
      titulo,
      tipo: 'MANUAL',
      completada: false,
      urgencia,
      fechaLimite,
      subtexto: 'Tarea manual personalizada'
    };

    // Agregar de inmediato en el cliente (optimista)
    setData((prev) => ({
      ...prev,
      tareas: [nuevaTareaTemp, ...prev.tareas]
    }));

    // Sincronizar en servidor con Supabase
    try {
      const res = await crearTareaManualAction(titulo, fechaLimite, urgencia);
      if (res.success && res.data) {
        // Reemplazar la tarea temporal por la persistida con su UUID canónico
        setData((prev) => ({
          ...prev,
          tareas: prev.tareas.map((t) => (t.id === tempId ? res.data! : t))
        }));
      }
    } catch (err) {
      console.error('Error al sincronizar tarea en base de datos:', err);
    }
  };

  // Eliminación de tarea manual (soft-delete en Supabase)
  const handleEliminarTarea = async (tareaId: string) => {
    // Optimista
    setData((prev) => ({
      ...prev,
      tareas: prev.tareas.filter((t) => t.id !== tareaId)
    }));

    // Persistir eliminación en Supabase
    try {
      await eliminarTareaManualAction(tareaId);
    } catch (err) {
      console.error('Error al eliminar tarea manual en base de datos:', err);
    }
  };

  // Refrescar datos del dashboard
  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* 1. Cabecera del Dashboard y Accesos Rápidos */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Centro de Mando Operativo y Calendario Multi-Flujo de <span className="font-semibold text-slate-700">Alquileres System</span>.
          </p>
        </div>

        {/* Botones de Acción Rápida Superiores */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Botón de Refrescar Datos */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 transition-colors shadow-xs"
            title="Refrescar datos del dashboard"
            aria-label="Refrescar dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin text-brand-salmon' : ''}`} />
          </button>

          <Link
            href="/devoluciones"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <CornerDownLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Devoluciones</span>
          </Link>

          <Link
            href="/alquileres?crear=true"
            className="px-4 py-2 rounded-xl bg-brand-salmon hover:bg-brand-salmonDark text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nuevo Alquiler</span>
          </Link>
        </div>
      </div>

      {/* 2. Grid de 4 KPIs en Vivo */}
      <DashboardKpiGrid kpis={data.kpis} />

      {/* 3. Centro de Mando en 2 Columnas Asimétricas (65% Calendario / 35% Tareas y Alertas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Principal: Calendario Operativo (65% = 8 cols) */}
        <div className="lg:col-span-8 w-full">
          <CalendarioOperativoIsland
            eventos={data.eventos}
            mesInicial={data.mesActivo}
            onSelectDay={handleSelectDay}
          />
        </div>

        {/* Columna Lateral: Tareas y Recordatorios (35% = 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          {/* Widget de Resumen de Tareas con Persistencia Supabase */}
          <ResumenTareasCard
            tareas={data.tareas}
            onToggleTarea={handleToggleTarea}
            onCrearTareaManual={handleCrearTareaManual}
            onEliminarTarea={handleEliminarTarea}
          />

          {/* Widget de Recordatorios y Feed de Alertas */}
          <RecordatorioEventosFeed alertas={data.alertas} />
        </div>
      </div>

      {/* 4. Drawer Lateral Deslizante (Slide-over) para el Día Seleccionado */}
      <ActividadDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fechaSeleccionada={fechaSeleccionada}
        eventos={data.eventos}
      />
    </div>
  );
}
