'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, CornerDownLeft, RefreshCw } from 'lucide-react';
import {
  type DashboardPayload,
  type TareaOperativa
} from '@/core/types/dashboard';
import { DashboardKpiGrid } from './DashboardKpiGrid';
import { CalendarioOperativoIsland } from './CalendarioOperativoIsland';
import { ResumenTareasCard } from './ResumenTareasCard';
import { RecordatorioEventosFeed } from './RecordatorioEventosFeed';
import { ActividadDrawer } from './ActividadDrawer';
import { crearTareaManualAction } from '@/app/actions/dashboard';
import { obtenerFechaHoyLocal } from '@/core/services/dashboard-transaccional.service';

interface DashboardInteractiveIslandProps {
  initialData: DashboardPayload;
}

export function DashboardInteractiveIsland({
  initialData
}: DashboardInteractiveIslandProps) {
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

  // Toggle de tareas (actualización optimista)
  const handleToggleTarea = (tareaId: string) => {
    setData((prev) => ({
      ...prev,
      tareas: prev.tareas.map((t) =>
        t.id === tareaId ? { ...t, completada: !t.completada } : t
      )
    }));
  };

  // Creación de tarea manual rápida
  const handleCrearTareaManual = async (titulo: string) => {
    // Agregar inmediatamente en el cliente (optimista)
    const tempId = `task-manual-${Date.now()}`;
    const nuevaTarea: TareaOperativa = {
      id: tempId,
      titulo,
      tipo: 'MANUAL',
      completada: false,
      urgencia: 'NORMAL',
      subtexto: 'Tarea rápida personalizada'
    };

    setData((prev) => ({
      ...prev,
      tareas: [nuevaTarea, ...prev.tareas]
    }));

    // Sincronizar en servidor
    try {
      const res = await crearTareaManualAction(titulo);
      if (res.success && res.data) {
        setData((prev) => ({
          ...prev,
          tareas: prev.tareas.map((t) => (t.id === tempId ? res.data! : t))
        }));
      }
    } catch (err) {
      console.error('Error al sincronizar tarea:', err);
    }
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
        <div className="flex items-center gap-3">
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
          {/* Widget de Resumen de Tareas */}
          <ResumenTareasCard
            tareas={data.tareas}
            onToggleTarea={handleToggleTarea}
            onCrearTareaManual={handleCrearTareaManual}
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
