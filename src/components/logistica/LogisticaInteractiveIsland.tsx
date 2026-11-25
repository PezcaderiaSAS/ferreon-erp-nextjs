'use client';

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  DollarSign,
  AlertCircle,
  Camera,
  Compass,
  ArrowRight,
  TrendingUp,
  PackageCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  obtenerRutasDespachoAction,
  cambiarEstadoRutaAction,
} from '@/app/actions/logistica';
import { useToastStore } from '@/infrastructure/state/toastStore';
import { TipoVehiculoTransporte } from '@/core/services/logistica-rutas.service';

const ModalSkeleton = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xl animate-pulse space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
      <div className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/4 ml-auto" />
    </div>
  </div>
);

const CrearRutaModal = dynamic(
  () => import('@/components/logistica/CrearRutaModal').then((mod) => mod.CrearRutaModal),
  { ssr: false, loading: () => <ModalSkeleton /> }
);

const RegistrarEvidenciaModal = dynamic(
  () => import('@/components/logistica/RegistrarEvidenciaModal').then((mod) => mod.RegistrarEvidenciaModal),
  { ssr: false, loading: () => <ModalSkeleton /> }
);

interface LogisticaInteractiveIslandProps {
  initialRutas: any[];
  initialZonas: any[];
}

export function LogisticaInteractiveIsland({
  initialRutas,
  initialZonas,
}: LogisticaInteractiveIslandProps) {
  const showSuccessToast = useToastStore((state) => state.showSuccessToast);
  const showErrorToast = useToastStore((state) => state.showErrorToast);

  const hoyISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [rutas, setRutas] = useState<any[]>(initialRutas);
  const [zonas] = useState<any[]>(initialZonas);
  const [fechaFiltro, setFechaFiltro] = useState<string>(hoyISO);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [rutasExpandidas, setRutasExpandidas] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modales
  const [isCrearModalOpen, setIsCrearModalOpen] = useState<boolean>(false);
  const [paradaParaEvidencia, setParadaParaEvidencia] = useState<any | null>(null);

  // Recarga reactiva de rutas para la fecha seleccionada
  const refrescarRutas = useCallback(async (fecha?: string) => {
    setIsRefreshing(true);
    try {
      const res = await obtenerRutasDespachoAction(fecha || fechaFiltro);
      if (res.success && res.data) {
        setRutas(res.data);
      }
    } catch (err: any) {
      console.error('Error al refrescar rutas:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fechaFiltro]);

  const handleCambiarFecha = (nuevaFecha: string) => {
    setFechaFiltro(nuevaFecha);
    refrescarRutas(nuevaFecha);
  };

  const toggleExpandirRuta = (rutaId: string) => {
    setRutasExpandidas((prev) => ({
      ...prev,
      [rutaId]: !prev[rutaId],
    }));
  };

  // Transición de estado de ruta
  const handleAvanzarEstadoRuta = async (ruta: any) => {
    let siguienteEstado: string | null = null;
    if (ruta.estado === 'PROGRAMADA') siguienteEstado = 'EN_CARGUE';
    else if (ruta.estado === 'EN_CARGUE') siguienteEstado = 'EN_RUTA';
    else if (ruta.estado === 'EN_RUTA') siguienteEstado = 'FINALIZADA';

    if (!siguienteEstado) return;

    try {
      const res = await cambiarEstadoRutaAction(ruta.id, siguienteEstado);
      if (!res.success) throw new Error(res.error || 'No fue posible cambiar el estado');

      showSuccessToast(`Ruta ${ruta.codigo_ruta} ahora está en ${siguienteEstado}`);

      setRutas((prev) =>
        prev.map((r) => (r.id === ruta.id ? { ...r, estado: siguienteEstado } : r))
      );
    } catch (err: any) {
      showErrorToast(err.message || 'Error al cambiar estado de la ruta');
    }
  };

  // Filtrado de rutas en cliente
  const rutasFiltradas = useMemo(() => {
    return rutas.filter((r) => {
      // Filtro por estado
      if (filtroEstado !== 'TODAS' && r.estado !== filtroEstado) {
        return false;
      }

      // Filtro por búsqueda
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const coincidePlaca = r.vehiculo_placa?.toLowerCase().includes(q);
        const coincideConductor = r.conductor_nombre?.toLowerCase().includes(q);
        const coincideCodigo = r.codigo_ruta?.toLowerCase().includes(q);
        const coincideParada = r.ruta_paradas?.some((p: any) =>
          p.direccion_obra?.toLowerCase().includes(q)
        );

        if (!coincidePlaca && !coincideConductor && !coincideCodigo && !coincideParada) {
          return false;
        }
      }

      return true;
    });
  }, [rutas, filtroEstado, busqueda]);

  // KPIs agregados
  const kpis = useMemo(() => {
    let totalParadas = 0;
    let paradasCompletadas = 0;
    let totalFletes = 0;
    let rutasActivas = 0;

    rutas.forEach((r) => {
      if (r.estado === 'EN_RUTA' || r.estado === 'EN_CARGUE') rutasActivas++;
      totalFletes += Number(r.total_fletes) || 0;

      const paradas = r.ruta_paradas || [];
      totalParadas += paradas.length;
      paradasCompletadas += paradas.filter((p: any) => p.estado_parada === 'COMPLETADA').length;
    });

    const porcentajeEficiencia = totalParadas > 0 ? Math.round((paradasCompletadas / totalParadas) * 100) : 0;

    return {
      rutasTotales: rutas.length,
      rutasActivas,
      totalParadas,
      paradasCompletadas,
      totalFletes: Math.trunc(totalFletes),
      porcentajeEficiencia,
    };
  }, [rutas]);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header & Acciones Principales */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/40">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Logística, Rutas & Flota WMS
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Bucaramanga
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Planificación de rutas de despacho, matriz de fletes metropolitana y georreferenciación de entregas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refrescarRutas()}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            title="Refrescar rutas"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCrearModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-teal-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Hoja de Ruta</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (High-Density) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rutas del Día */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Hojas de Ruta</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {kpis.rutasTotales}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>{kpis.rutasActivas} rutas en operación hoy</span>
          </div>
        </div>

        {/* Paradas Completadas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Paradas en Obra</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {kpis.paradasCompletadas} <span className="text-sm font-semibold text-slate-400">/ {kpis.totalParadas}</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{kpis.porcentajeEficiencia}% de entregas realizadas</span>
          </div>
        </div>

        {/* Fletes Totales COP */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Fletes Programados</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-300 font-mono tabular-nums">
            ${kpis.totalFletes.toLocaleString('es-CO')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            COP enteros (Matriz tarifaria)
          </div>
        </div>

        {/* Eficiencia de Entrega */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Eficiencia de Flota</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {kpis.porcentajeEficiencia}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${kpis.porcentajeEficiencia}%` }}
            />
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Selector de Fecha y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa, conductor, código de ruta o dirección de obra..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none transition-all"
          />
        </div>

        {/* Filtros de Estado y Selector de Fecha */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Fecha */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => handleCambiarFecha(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer"
            />
          </div>

          {/* Atajos de Fecha */}
          <button
            type="button"
            onClick={() => handleCambiarFecha(hoyISO)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              fechaFiltro === hoyISO
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Hoy
          </button>

          {/* Selector de Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="TODAS">Todos los Estados</option>
            <option value="PROGRAMADA">Programadas</option>
            <option value="EN_CARGUE">En Cargue</option>
            <option value="EN_RUTA">En Ruta</option>
            <option value="FINALIZADA">Finalizadas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Lista de Rutas y Paradas */}
      {rutasFiltradas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center shadow-2xs space-y-4">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
            <Truck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No hay rutas programadas para esta fecha
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              No se encontraron hojas de ruta para el {fechaFiltro} con los filtros aplicados. Puede programar una nueva ruta para el equipo de transporte.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCrearModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Programar Hoja de Ruta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rutasFiltradas.map((ruta) => {
            const paradas = ruta.ruta_paradas || [];
            const paradasCompletadasCount = paradas.filter((p: any) => p.estado_parada === 'COMPLETADA').length;
            const porcentajeRuta = paradas.length > 0 ? Math.round((paradasCompletadasCount / paradas.length) * 100) : 0;
            const isExpandida = rutasExpandidas[ruta.id] ?? true;

            // Badges por estado de ruta
            const estadoBadge = {
              PROGRAMADA: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
              EN_CARGUE: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
              EN_RUTA: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
              FINALIZADA: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
              CANCELADA: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
            }[ruta.estado as string] || 'bg-slate-100 text-slate-700';

            return (
              <div
                key={ruta.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-4 transition-all"
              >
                {/* Cabecera de la Tarjeta de Ruta */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      <Truck className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                          {ruta.codigo_ruta}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono text-xs font-black">
                          {ruta.vehiculo_placa}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {ruta.vehiculo_tipo}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${estadoBadge}`}>
                          {ruta.estado}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-teal-600" />
                          <strong className="text-slate-700 dark:text-slate-300">{ruta.conductor_nombre}</strong>
                        </span>
                        {ruta.conductor_telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {ruta.conductor_telefono}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {ruta.fecha_programada}
                        </span>
                        {Number(ruta.total_fletes) > 0 && (
                          <span className="text-teal-600 dark:text-teal-400 font-bold font-mono">
                            Fletes: ${Number(ruta.total_fletes).toLocaleString('es-CO')} COP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones y Transiciones de Estado */}
                  <div className="flex flex-wrap items-center gap-2">
                    {ruta.estado === 'PROGRAMADA' && (
                      <button
                        type="button"
                        onClick={() => handleAvanzarEstadoRuta(ruta)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Comenzar Cargue
                      </button>
                    )}
                    {ruta.estado === 'EN_CARGUE' && (
                      <button
                        type="button"
                        onClick={() => handleAvanzarEstadoRuta(ruta)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Despachar a Ruta
                      </button>
                    )}
                    {ruta.estado === 'EN_RUTA' && (
                      <button
                        type="button"
                        onClick={() => handleAvanzarEstadoRuta(ruta)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Finalizar Ruta
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleExpandirRuta(ruta.id)}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      title={isExpandida ? 'Colapsar paradas' : 'Ver paradas'}
                    >
                      {isExpandida ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Barra de Progreso de la Ruta */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">
                      Progreso de entregas: {paradasCompletadasCount} de {paradas.length} paradas
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {porcentajeRuta}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${porcentajeRuta}%` }}
                    />
                  </div>
                </div>

                {/* Timeline de Paradas Desplegable */}
                {isExpandida && (
                  <div className="pt-2 space-y-2.5">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      Paradas Programadas ({paradas.length})
                    </div>

                    <div className="space-y-2">
                      {paradas.map((parada: any, pIdx: number) => {
                        const isCompletada = parada.estado_parada === 'COMPLETADA';
                        const isEnSitio = parada.estado_parada === 'EN_SITIO';
                        const isFallida = parada.estado_parada === 'FALLIDA';

                        return (
                          <div
                            key={parada.id}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isCompletada
                                ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                                : isEnSitio
                                ? 'bg-blue-500/5 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                                : isFallida
                                ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                                  isCompletada
                                    ? 'bg-emerald-500 text-white'
                                    : isEnSitio
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {parada.orden_secuencia || pIdx + 1}
                              </span>

                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    {parada.direccion_obra}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    {parada.tipo_parada === 'ENTREGA_DESPACHO' ? 'Entrega' : 'Recogida'}
                                  </span>
                                  {parada.zonas_flete_bucaramanga && (
                                    <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                                      ({parada.zonas_flete_bucaramanga.municipio} - {parada.zonas_flete_bucaramanga.nombre})
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                                  {parada.receptor_nombre && (
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {parada.receptor_nombre}
                                    </span>
                                  )}
                                  {parada.latitud && parada.longitud && (
                                    <span className="flex items-center gap-1 text-emerald-600 font-mono text-[10px]">
                                      <Compass className="w-3 h-3" />
                                      GPS: {parada.latitud}, {parada.longitud}
                                    </span>
                                  )}
                                  {parada.evidencia_fotos && parada.evidencia_fotos.length > 0 && (
                                    <span className="flex items-center gap-1 text-teal-600 font-semibold text-[10px]">
                                      <Camera className="w-3 h-3" />
                                      {parada.evidencia_fotos.length} fotos
                                    </span>
                                  )}
                                  {parada.observaciones && (
                                    <span className="italic">
                                      "{parada.observaciones}"
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Botón para registrar evidencia */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  isCompletada
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                    : isEnSitio
                                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                    : isFallida
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {parada.estado_parada}
                              </span>

                              <button
                                type="button"
                                onClick={() => setParadaParaEvidencia(parada)}
                                className="px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-xs font-bold flex items-center gap-1 transition-colors"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                Evidencia
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modales Dinámicos */}
      {isCrearModalOpen && (
        <CrearRutaModal
          isOpen={isCrearModalOpen}
          onClose={() => setIsCrearModalOpen(false)}
          zonas={zonas}
          onRutaCreada={(nuevaRuta) => {
            setRutas((prev) => [nuevaRuta, ...prev]);
            refrescarRutas();
          }}
        />
      )}

      {paradaParaEvidencia && (
        <RegistrarEvidenciaModal
          isOpen={!!paradaParaEvidencia}
          onClose={() => setParadaParaEvidencia(null)}
          parada={paradaParaEvidencia}
          onParadaActualizada={() => {
            setParadaParaEvidencia(null);
            refrescarRutas();
          }}
        />
      )}
    </div>
  );
}
