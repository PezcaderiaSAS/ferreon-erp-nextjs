'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  HelpCircle,
  Sparkles,
  GitBranch,
  Layers,
  ArrowRight,
  ExternalLink,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Building2,
  Coins,
  Warehouse,
  FileText,
  Send,
  Plus,
  Eye,
  RefreshCw,
  Printer,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGamificationStore } from '@/infrastructure/state/gamificationStore';
import {
  MODULOS_SISTEMA_ACADEMIA,
  BOTONES_DIDACTICOS_CATALOGO,
  FLUJOS_DIDACTICOS_MAESTROS,
  BotonDidacticoItem,
  FlujoDidacticoItem,
  ModuloInfoDidactica,
} from '@/core/constants/academia-curriculum';

export function GuiaBotonesFlujosModal() {
  const router = useRouter();
  const {
    isGuiaBotonesOpen,
    setGuiaBotonesOpen,
    moduloFiltroGuia,
  } = useGamificationStore();

  const [activeTab, setActiveTab] = useState<'botones' | 'flujos' | 'modulos'>('botones');
  const [moduloSeleccionado, setModuloSeleccionado] = useState<string>(moduloFiltroGuia || 'Todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [flujoExpandidoId, setFlujoExpandidoId] = useState<string>(FLUJOS_DIDACTICOS_MAESTROS[0]?.id || '');

  // Sincronizar filtro cuando cambia externamente
  useEffect(() => {
    if (moduloFiltroGuia) {
      setModuloSeleccionado(moduloFiltroGuia);
    }
  }, [moduloFiltroGuia]);

  // Listener para atajos globales (F1 para abrir/cerrar, Esc para cerrar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setGuiaBotonesOpen(!isGuiaBotonesOpen);
      } else if (e.key === 'Escape' && isGuiaBotonesOpen) {
        setGuiaBotonesOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGuiaBotonesOpen, setGuiaBotonesOpen]);

  // Lista única de nombres de módulos para el selector
  const listaModulosNombres = useMemo(() => {
    const nombres = new Set<string>();
    BOTONES_DIDACTICOS_CATALOGO.forEach((b) => nombres.add(b.modulo));
    return ['Todos', ...Array.from(nombres)];
  }, []);

  // Filtrado de Botones en Tiempo Real
  const botonesFiltrados = useMemo(() => {
    return BOTONES_DIDACTICOS_CATALOGO.filter((btn) => {
      const coincideModulo =
        moduloSeleccionado === 'Todos' ||
        btn.modulo.toLowerCase() === moduloSeleccionado.toLowerCase();
      if (!coincideModulo) return false;

      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      return (
        btn.nombre.toLowerCase().includes(q) ||
        btn.modulo.toLowerCase().includes(q) ||
        btn.queHace.toLowerCase().includes(q) ||
        btn.cuandoSeUsa.toLowerCase().includes(q) ||
        btn.trasBambalinas.toLowerCase().includes(q) ||
        (btn.atajoTeclado && btn.atajoTeclado.toLowerCase().includes(q))
      );
    });
  }, [moduloSeleccionado, busqueda]);

  // Filtrado de Flujos en Tiempo Real
  const flujosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return FLUJOS_DIDACTICOS_MAESTROS;
    const q = busqueda.toLowerCase().trim();
    return FLUJOS_DIDACTICOS_MAESTROS.filter(
      (f) =>
        f.titulo.toLowerCase().includes(q) ||
        f.subtitulo.toLowerCase().includes(q) ||
        f.descripcionApta12.toLowerCase().includes(q) ||
        f.pasos.some(
          (p) =>
            p.titulo.toLowerCase().includes(q) ||
            p.modulo.toLowerCase().includes(q) ||
            p.explicacion.toLowerCase().includes(q)
        )
    );
  }, [busqueda]);

  if (!isGuiaBotonesOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guia-titulo"
    >
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[880px] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Cabecera Principal */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <BookOpen className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="guia-titulo" className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Guía 360° de Botones & Flujos
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Alquileres System
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aprende qué hace cada botón, cuándo usarlo y cómo afecta a bodega y caja.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto mt-2 sm:mt-0">
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
              <Keyboard className="w-3.5 h-3.5" />
              Atajo F1
            </span>
            <button
              onClick={() => setGuiaBotonesOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cerrar Guía (Esc)"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Control: Pestañas + Buscador */}
        <div className="p-4 sm:px-6 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Pestañas Principales */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl self-start">
            <button
              onClick={() => setActiveTab('botones')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'botones'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Diccionario de Botones ({BOTONES_DIDACTICOS_CATALOGO.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('flujos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'flujos'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
              <span>6 Flujos Maestros</span>
            </button>
            <button
              onClick={() => setActiveTab('modulos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'modulos'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>12 Territorios</span>
            </button>
          </div>

          {/* Campo de Búsqueda Instantánea */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={
                activeTab === 'botones'
                  ? 'Buscar por nombre, acción, bodega o atajo...'
                  : activeTab === 'flujos'
                  ? 'Buscar en los 6 flujos de maquinaria...'
                  : 'Buscar módulo o metáfora...'
              }
              className="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Contenido según Pestaña Activa */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-4">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 1: DICCIONARIO DE BOTONES Y ACCIONES                        */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'botones' && (
            <div className="space-y-4">
              {/* Filtro de Módulos (Chips Horizontales) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
                  <Filter className="w-3 h-3" /> Módulo:
                </span>
                {listaModulosNombres.map((mod) => (
                  <button
                    key={mod}
                    onClick={() => setModuloSeleccionado(mod)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      moduloSeleccionado.toLowerCase() === mod.toLowerCase()
                        ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>

              {/* Conteo de Resultados */}
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Mostrando <span className="text-amber-600 dark:text-amber-400 font-bold">{botonesFiltrados.length}</span> botones didácticos
              </div>

              {/* Rejilla de Tarjetas Didácticas */}
              {botonesFiltrados.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    No encontramos ningún botón que coincida con tu búsqueda.
                  </p>
                  <button
                    onClick={() => {
                      setBusqueda('');
                      setModuloSeleccionado('Todos');
                    }}
                    className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {botonesFiltrados.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-xs hover:shadow-md transition-shadow"
                    >
                      {/* Cabecera del Botón */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.nombre}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.modulo}
                          </span>
                        </div>
                        {item.atajoTeclado && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50">
                            <Keyboard className="w-3 h-3" />
                            {item.atajoTeclado}
                          </span>
                        )}
                      </div>

                      {/* Tríada Didáctica (3 Preguntas Clave) */}
                      <div className="space-y-2 text-xs">
                        {/* 1. ¿Qué hace? */}
                        <div className="flex gap-2 items-start bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                          <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-black">
                            1
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                              ¿Qué hace?
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              {item.queHace}
                            </span>
                          </div>
                        </div>

                        {/* 2. ¿Cuándo se usa? */}
                        <div className="flex gap-2 items-start bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100/80 dark:border-emerald-900/30">
                          <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-black">
                            2
                          </div>
                          <div>
                            <span className="font-bold text-emerald-900 dark:text-emerald-300 block text-[11px]">
                              ¿Cuándo y para qué usarlo?
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              {item.cuandoSeUsa}
                            </span>
                          </div>
                        </div>

                        {/* 3. ¿Qué pasa tras bambalinas? (Bodega / Caja) */}
                        <div className="flex gap-2 items-start bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/30">
                          <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-black">
                            3
                          </div>
                          <div>
                            <span className="font-bold text-amber-900 dark:text-amber-300 block text-[11px]">
                              ¿Qué pasa tras bambalinas? (Inventario / Caja)
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              {item.trasBambalinas}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 2: LOS 6 FLUJOS MAESTROS DEL NEGOCIO                        */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'flujos' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-4 rounded-2xl border border-emerald-500/20">
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                  El Viaje de la Maquinaria: Los 6 Flujos de Alquileres System
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  En una empresa de alquileres, las máquinas recorren un ciclo continuo: entran a cotización, se apartan en bodega, viajan a la obra, vuelven a inspección y se cobra su canon. Sigue cada flujo paso a paso:
                </p>
              </div>

              <div className="space-y-3">
                {flujosFiltrados.map((flujo) => {
                  const isExpandido = flujoExpandidoId === flujo.id;
                  return (
                    <div
                      key={flujo.id}
                      className={`bg-white dark:bg-slate-950/80 rounded-2xl border transition-all ${
                        isExpandido
                          ? 'border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Cabecera del Flujo */}
                      <button
                        type="button"
                        onClick={() => setFlujoExpandidoId(isExpandido ? '' : flujo.id)}
                        className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base shrink-0">
                            <GitBranch className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {flujo.titulo}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {flujo.subtitulo}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-400">
                            {flujo.pasos.length} pasos
                          </span>
                          <ChevronRight
                            className={`w-5 h-5 text-slate-400 transition-transform ${
                              isExpandido ? 'rotate-90 text-amber-500' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Cuerpo Expandido con Pasos Secuenciales */}
                      {isExpandido && (
                        <div className="px-4 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-4 animate-in fade-in duration-200">
                          {/* Explicación Apta 12+ */}
                          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            💡 <strong className="text-slate-900 dark:text-white">¿De qué trata este flujo?</strong> {flujo.descripcionApta12}
                          </p>

                          {/* Pasos en Línea de Tiempo */}
                          <div className="space-y-3 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                            {flujo.pasos.map((paso) => (
                              <div
                                key={paso.paso}
                                className="relative flex items-start gap-3 pl-2"
                              >
                                <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 z-10 shadow-xs">
                                  {paso.paso}
                                </div>
                                <div className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                      {paso.titulo}
                                    </h5>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGuiaBotonesOpen(false);
                                        router.push(paso.ruta);
                                      }}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                                    >
                                      <span>Ir a {paso.modulo}</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {paso.explicacion}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                                    <Warehouse className="w-3.5 h-3.5 shrink-0" />
                                    <span>Impacto: {paso.impactoBodegaOCaja}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 3: LOS 12 TERRITORIOS / MÓDULOS DEL SISTEMA                */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'modulos' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Los 12 módulos de Alquileres System explicados con metáforas de la vida real para entender qué función cumple cada uno dentro de la empresa.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MODULOS_SISTEMA_ACADEMIA.map((mod) => (
                  <div
                    key={mod.id}
                    className="bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5 flex flex-col justify-between hover:border-amber-400/60 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {mod.nombre}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {mod.ruta}
                        </span>
                      </div>

                      {/* Metáfora didáctica */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30 leading-relaxed">
                        {mod.metaforaApta12}
                      </p>

                      {/* Objetivo Principal */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        <strong className="text-slate-700 dark:text-slate-200">Objetivo:</strong> {mod.objetivoPrincipal}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setModuloSeleccionado(mod.nombre.split(' ')[0]);
                          setActiveTab('botones');
                        }}
                        className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                      >
                        Ver botones de este módulo
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setGuiaBotonesOpen(false);
                          router.push(mod.ruta);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        <span>Entrar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal con resumen */}
        <div className="p-3 sm:px-6 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Presiona</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
              Esc
            </kbd>
            <span>para cerrar en cualquier momento</span>
          </div>

          <button
            onClick={() => setGuiaBotonesOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
