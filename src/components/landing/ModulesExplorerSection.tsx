"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  CalendarDays, 
  ArrowLeftRight, 
  Package, 
  ShoppingBag, 
  Handshake, 
  FileText, 
  Wallet, 
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Plus,
  Minus,
  Sparkles,
  Calculator,
  Sliders,
  DollarSign
} from 'lucide-react';
import { LANDING_CONFIG, ERPModuleCategory, ERPModuleItem } from '../../config/landing';

const categoryIcons: Record<string, any> = {
  operacion: CalendarDays,
  bodega_compras: Package,
  logistica_facturacion: Handshake,
  tesoreria_admin: Wallet,
};

const moduleIcons: Record<string, any> = {
  alquileres: CalendarDays,
  devoluciones: ArrowLeftRight,
  bodega: Package,
  compras: ShoppingBag,
  subcontrataciones: Handshake,
  facturacion: FileText,
  caja: Wallet,
  ultraadmin: ShieldCheck,
};

export function ModulesExplorerSection() {
  const { erpModules } = LANDING_CONFIG;
  const [activeCategoryId, setActiveCategoryId] = useState<string>("operacion");
  
  const currentCategory = useMemo(() => {
    return erpModules.categories.find(c => c.id === activeCategoryId) || erpModules.categories[0];
  }, [activeCategoryId, erpModules.categories]);

  const [activeModuleId, setActiveModuleId] = useState<string>("alquileres");

  const currentModule = useMemo(() => {
    return currentCategory.modules.find(m => m.id === activeModuleId) || currentCategory.modules[0];
  }, [currentCategory, activeModuleId]);

  // Al cambiar de categoría, preseleccionar el primer módulo de esa categoría
  const handleSelectCategory = (catId: string) => {
    setActiveCategoryId(catId);
    const cat = erpModules.categories.find(c => c.id === catId);
    if (cat && cat.modules.length > 0) {
      setActiveModuleId(cat.modules[0].id);
    }
  };

  // =========================================================================
  // ESTADOS INTERACTIVOS PARA LOS MOCKUPS
  // =========================================================================
  // 1. Caja: Arqueo por billetes en COP
  const [billetes, setBilletes] = useState({
    b100k: 18, // $1.800.000
    b50k: 26,  // $1.300.000
    b20k: 45,  // $900.000
    b10k: 85,  // $850.000
  });

  const totalEfectivoCOP = useMemo(() => {
    return (billetes.b100k * 100000) + 
           (billetes.b50k * 50000) + 
           (billetes.b20k * 20000) + 
           (billetes.b10k * 10000);
  }, [billetes]);

  // 2. Devoluciones: Split-Line
  const [item1Averia, setItem1Averia] = useState(false);
  const [item2Averia, setItem2Averia] = useState(true);

  // 3. Subcontrataciones: Calculadora de margen
  const [tarifaCliente, setTarifaCliente] = useState(3800000);
  const costoProveedor = 2500000;
  const margenNetoCOP = tarifaCliente - costoProveedor;
  const porcentajeMargen = Math.round((margenNetoCOP / tarifaCliente) * 100);

  // 4. Bodega: Filtro
  const [filtroBodega, setFiltroBodega] = useState<'TODOS' | 'DISPONIBLE' | 'EN_OBRA'>('TODOS');

  // 5. Alquileres: Duración
  const [diasAlquiler, setDiasAlquiler] = useState<number>(7);

  // 6. UltraAdmin: Switch de módulo
  const [moduloFacturacionActivo, setModuloFacturacionActivo] = useState(true);
  const [moduloCajaActivo, setModuloCajaActivo] = useState(true);

  return (
    <section id="modules" className="py-20 md:py-28 relative overflow-hidden bg-slate-950 border-t border-slate-800/80">
      {/* Background Lighting & Warm Glow */}
      <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-orange-500/10 via-blue-500/10 to-cyan-500/10 blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold tracking-wider uppercase mb-4 shadow-sm shadow-orange-500/10">
            <Sparkles className="w-3.5 h-3.5" />
            {erpModules.badge}
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            {erpModules.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
            {erpModules.subtitle}
          </p>
        </div>

        {/* Categories Pills Navigation (4 Categories) */}
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3.5 mb-8">
          {erpModules.categories.map((cat) => {
            const Icon = categoryIcons[cat.id] || Package;
            const isActive = cat.id === activeCategoryId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400/60 shadow-lg shadow-orange-500/20 scale-[1.02]'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-orange-400'}`} />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isActive ? 'bg-black/20 text-orange-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  2 módulos
                </span>
              </button>
            );
          })}
        </div>

        {/* Sub-tabs: Module Selector within active Category */}
        <div className="flex justify-center items-center gap-2 mb-10">
          <div className="inline-flex p-1 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
            {currentCategory.modules.map((mod) => {
              const ModIcon = moduleIcons[mod.id] || Package;
              const isSelected = mod.id === activeModuleId;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModuleId(mod.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <ModIcon className="w-4 h-4" />
                  <span>{mod.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Display: Split Grid (Left: Info & Specs | Right: Interactive High-Fidelity Mockup) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* LEFT COLUMN: Module Info, Roles, Real KPIs and Highlights */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-xl shadow-slate-950/40">
            <div>
              {/* Badges Header */}
              <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentModule.roleColor}`}>
                  {currentModule.role}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {currentModule.badge}
                </span>
                <span className="text-xs font-mono text-cyan-400 ml-auto">
                  {currentModule.route}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                {currentModule.name}
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                {currentModule.description}
              </p>

              {/* 3 Canonical KPIs */}
              <div className="grid grid-cols-3 gap-3 mb-6 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                {currentModule.kpis.map((kpi, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-[11px] text-slate-400 truncate">{kpi.label}</span>
                    <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-white mt-0.5">
                      {kpi.value}
                    </span>
                    {kpi.hint && (
                      <span className="text-[10px] text-emerald-400 mt-0.5 truncate">
                        {kpi.hint}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Highlights Checklist */}
              <div className="space-y-2.5 mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Capacidades del Módulo
                </span>
                {currentModule.highlights.map((highlight, hIdx) => (
                  <div key={hIdx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-slate-300 font-medium">
                      {highlight}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA to live module */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Idempotente & RLS Aislado
              </span>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02]"
              >
                Probar en Vivo
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive High-Fidelity Mockup Container */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl shadow-blue-950/30 overflow-hidden flex flex-col">
            
            {/* Window Chrome / Titlebar */}
            <div className="h-10 px-4 bg-slate-950/80 border-b border-slate-800/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-mono text-slate-400">
                  ferreon-app.com{currentModule.route}
                </span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                Vista Interactiva
              </span>
            </div>

            {/* Dynamic Interactive Body based on mockupType */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between min-h-[360px]">
              
              {/* 1. MOCKUP: CAJA (Arqueo por Billetes en COP) */}
              {currentModule.mockupType === 'caja' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Arqueo Ciego de Cierre de Turno</h4>
                      <p className="text-xs text-slate-400">Conteo físico por denominaciones oficiales de Colombia</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-xs font-mono font-bold">
                      Cuadre Exacto: $0
                    </span>
                  </div>

                  {/* Denominaciones Interactivas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">$100.000 COP</span>
                        <span className="text-[11px] font-mono text-cyan-400">
                          Total: ${(billetes.b100k * 100000).toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBilletes(b => ({ ...b, b100k: Math.max(0, b.b100k - 1) }))}
                          className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-mono text-sm font-bold text-white">{billetes.b100k}</span>
                        <button
                          type="button"
                          onClick={() => setBilletes(b => ({ ...b, b100k: b.b100k + 1 }))}
                          className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">$50.000 COP</span>
                        <span className="text-[11px] font-mono text-cyan-400">
                          Total: ${(billetes.b50k * 50000).toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBilletes(b => ({ ...b, b50k: Math.max(0, b.b50k - 1) }))}
                          className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-mono text-sm font-bold text-white">{billetes.b50k}</span>
                        <button
                          type="button"
                          onClick={() => setBilletes(b => ({ ...b, b50k: b.b50k + 1 }))}
                          className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">$20.000 COP</span>
                        <span className="text-[11px] font-mono text-cyan-400">
                          Total: ${(billetes.b20k * 20000).toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBilletes(b => ({ ...b, b20k: Math.max(0, b.b20k - 1) }))}
                          className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-mono text-sm font-bold text-white">{billetes.b20k}</span>
                        <button
                          type="button"
                          onClick={() => setBilletes(b => ({ ...b, b20k: b.b20k + 1 }))}
                          className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">$10.000 COP</span>
                        <span className="text-[11px] font-mono text-cyan-400">
                          Total: ${(billetes.b10k * 10000).toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBilletes(b => ({ ...b, b10k: Math.max(0, b.b10k - 1) }))}
                          className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-mono text-sm font-bold text-white">{billetes.b10k}</span>
                        <button
                          type="button"
                          onClick={() => setBilletes(b => ({ ...b, b10k: b.b10k + 1 }))}
                          className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Total Resumen Caja */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-orange-300 block">Total Efectivo Auditado en Billetes:</span>
                      <span className="text-2xl font-extrabold font-mono text-white tabular-nums">
                        ${totalEfectivoCOP.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBilletes({ b100k: 20, b50k: 30, b20k: 50, b10k: 100 })}
                      className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
                    >
                      Cerrar Turno Inmutable
                    </button>
                  </div>
                </div>
              )}

              {/* 2. MOCKUP: DEVOLUCIONES (Split-Line & Inspección de Avería) */}
              {currentModule.mockupType === 'devoluciones' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Inspección Split-Line: Contrato #ALQ-089</h4>
                      <p className="text-xs text-slate-400">Cliente: Constructora Omega • Depósito: $1.200.000 COP</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-950 text-blue-300 border border-blue-800">
                      2 Equipos en Recepción
                    </span>
                  </div>

                  {/* Ítem 1: Retroexcavadora */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item1Averia ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      <div>
                        <span className="text-xs font-bold text-white block">Retroexcavadora CAT 416F2 (SN: CAT-416-09)</span>
                        <span className="text-[11px] text-slate-400">Horómetro: 1.420 hrs • Limpieza: Aprobada</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setItem1Averia(!item1Averia)}
                      className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
                        item1Averia
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {item1Averia ? 'Avería (-$350.000)' : 'Sin Avería ($0)'}
                    </button>
                  </div>

                  {/* Ítem 2: Rana Compactadora */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item2Averia ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      <div>
                        <span className="text-xs font-bold text-white block">Compactador tipo Rana 5.5HP (SN: RAN-55-12)</span>
                        <span className="text-[11px] text-slate-400">Filtro de aire obstruido • Zapato fisurado</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setItem2Averia(!item2Averia)}
                      className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
                        item2Averia
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {item2Averia ? 'Avería (-$180.000)' : 'Sin Avería ($0)'}
                    </button>
                  </div>

                  {/* Liquidación Contra Depósito */}
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-400 block">Depósito Inicial: $1.200.000 COP</span>
                      <span className="text-xs text-rose-400 block">
                        Deducción por Averías: -${((item1Averia ? 350000 : 0) + (item2Averia ? 180000 : 0)).toLocaleString('es-CO')} COP
                      </span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        Saldo a Devolver al Cliente: ${(1200000 - ((item1Averia ? 350000 : 0) + (item2Averia ? 180000 : 0))).toLocaleString('es-CO')} COP
                      </span>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold">
                      Generar Acta PDF
                    </span>
                  </div>
                </div>
              )}

              {/* 3. MOCKUP: BODEGA (Kardex & Seriales) */}
              {currentModule.mockupType === 'bodega' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h4 className="text-sm font-bold text-white">Inventario de Maquinaria y Seriales</h4>
                      <p className="text-xs text-slate-400">Total: 348 equipos • Búsqueda normalizada sin tildes</p>
                    </div>
                    <div className="flex gap-1.5">
                      {(['TODOS', 'DISPONIBLE', 'EN_OBRA'] as const).map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setFiltroBodega(tab)}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            filtroBodega === tab
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tabla de Equipos */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                          <th className="p-2.5">Equipo</th>
                          <th className="p-2.5">Serial</th>
                          <th className="p-2.5">Tarifa / Día</th>
                          <th className="p-2.5">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
                        {(filtroBodega === 'TODOS' || filtroBodega === 'EN_OBRA') && (
                          <tr className="hover:bg-slate-900/40">
                            <td className="p-2.5 font-sans font-medium text-white">Retroexcavadora CAT 416F2</td>
                            <td className="p-2.5 text-cyan-400">SN-CAT-416-09</td>
                            <td className="p-2.5">$380.000 COP</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                En Obra (Omega)
                              </span>
                            </td>
                          </tr>
                        )}
                        {(filtroBodega === 'TODOS' || filtroBodega === 'DISPONIBLE') && (
                          <tr className="hover:bg-slate-900/40">
                            <td className="p-2.5 font-sans font-medium text-white">Planta Eléctrica 10kVA Diésel</td>
                            <td className="p-2.5 text-cyan-400">SN-GEN-10K-02</td>
                            <td className="p-2.5">$180.000 COP</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Disponible (Bodega A)
                              </span>
                            </td>
                          </tr>
                        )}
                        {(filtroBodega === 'TODOS' || filtroBodega === 'DISPONIBLE') && (
                          <tr className="hover:bg-slate-900/40">
                            <td className="p-2.5 font-sans font-medium text-white">Andamio Tubular Certificado</td>
                            <td className="p-2.5 text-cyan-400">SN-AND-TUB-44</td>
                            <td className="p-2.5">$35.000 COP</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Disponible (Bodega B)
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Mostrando 3 de 348 seriales activos</span>
                    <span className="text-orange-400 cursor-pointer hover:underline">Ver Kardex de movimientos →</span>
                  </div>
                </div>
              )}

              {/* 4. MOCKUP: SUBCONTRATACIONES (Calculadora de Margen Neto) */}
              {currentModule.mockupType === 'subcontrataciones' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Calculadora de Margen Comercial</h4>
                      <p className="text-xs text-slate-400">Subalquiler a aliados sin stock propio • Alquiler garantizado</p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-violet-950 text-violet-300 border border-violet-800 text-xs font-mono font-bold">
                      Margen: {porcentajeMargen}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Costo Proveedor Aliado:</span>
                      <span className="text-base font-bold font-mono text-slate-200">
                        ${costoProveedor.toLocaleString('es-CO')} COP
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">Maquinarias del Valle S.A.S</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Tarifa Facturada al Cliente:</span>
                      <span className="text-base font-bold font-mono text-orange-400">
                        ${tarifaCliente.toLocaleString('es-CO')} COP
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">Constructora Bolívar</span>
                    </div>
                  </div>

                  {/* Slider Interactivo de Tarifa */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Simular ajuste de tarifa cliente:</span>
                      <span className="font-mono text-cyan-400 font-bold">${tarifaCliente.toLocaleString('es-CO')} COP</span>
                    </div>
                    <input
                      type="range"
                      min={2800000}
                      max={5000000}
                      step={100000}
                      value={tarifaCliente}
                      onChange={(e) => setTarifaCliente(Number(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Resultado de Margen */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-orange-500/10 border border-violet-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-violet-300 block">Utilidad Comercial Neta:</span>
                      <span className="text-xl font-extrabold font-mono text-emerald-400 tabular-nums">
                        +${margenNetoCOP.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white font-semibold">
                      Emitir Orden Subcontrato
                    </span>
                  </div>
                </div>
              )}

              {/* 5. MOCKUP: ALQUILERES & COTIZACIONES */}
              {currentModule.mockupType === 'alquileres' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Nuevo Contrato de Alquiler</h4>
                      <p className="text-xs text-slate-400">Selecciona periodo y calcula depósito con glosa oficial</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-orange-950 text-orange-300 border border-orange-800">
                      Modo Contrato Activo
                    </span>
                  </div>

                  {/* Selector de periodo */}
                  <div className="flex gap-2">
                    {[1, 7, 15, 30].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDiasAlquiler(d)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          diasAlquiler === d
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {d === 1 ? '1 Día' : `${d} Días`}
                      </button>
                    ))}
                  </div>

                  {/* Liquidación de Alquiler */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Tarifa Planta 10kVA x {diasAlquiler} días:</span>
                      <span className="text-white font-bold">${(diasAlquiler * 180000).toLocaleString('es-CO')} COP</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Flete de Entrega & Retorno:</span>
                      <span className="text-white font-bold">$120.000 COP</span>
                    </div>
                    <div className="flex justify-between text-cyan-400">
                      <span>Depósito en Garantía Reembolsable:</span>
                      <span className="font-bold">$600.000 COP</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-emerald-400">
                      <span>Total Liquidado:</span>
                      <span>${((diasAlquiler * 180000) + 120000).toLocaleString('es-CO')} COP</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400">
                    <span className="text-slate-300 font-semibold block mb-0.5">Glosa Jurídica:</span>
                    &quot;SON: DOCIENTOS MIL PESOS M/CTE CON RETENCIÓN EN CUSTODIA&quot;
                  </div>
                </div>
              )}

              {/* 6. MOCKUP: COMPRAS & CXP */}
              {currentModule.mockupType === 'compras' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Entrada de Almacén & Abonos a Proveedores</h4>
                      <p className="text-xs text-slate-400">Factura #FC-4492 • Ferretería Industrial de Colombia</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-amber-950 text-amber-300 border border-amber-800">
                      CxP Pendiente
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Total Factura Compra:</span>
                      <span className="font-mono text-white font-bold">$6.800.000 COP</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Abonos Realizados:</span>
                      <span className="font-mono text-emerald-400 font-bold">$4.000.000 COP (2 abonos)</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-amber-400">
                      <span>Saldo Pendiente (CxP):</span>
                      <span className="font-mono">$2.800.000 COP</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
                    >
                      Registrar Abono $500.000
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      Ver Comprobante PDF
                    </button>
                  </div>
                </div>
              )}

              {/* 7. MOCKUP: FACTURACION & CARTERA */}
              {currentModule.mockupType === 'facturacion' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Recibo de Caja: Pago Mixto</h4>
                      <p className="text-xs text-slate-400">Contrato #ALQ-087 • Mantenimientos S.A.S</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Factura Pagada
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Total Factura:</span>
                      <span className="font-mono text-white font-bold">$1.850.000 COP</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-cyan-300">
                        <span>• Efectivo Caja Mostrador:</span>
                        <span className="font-mono font-bold">$850.000 COP</span>
                      </div>
                      <div className="flex justify-between text-blue-300">
                        <span>• Transferencia Bancolombia:</span>
                        <span className="font-mono font-bold">$1.000.000 COP</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-emerald-400">
                      <span>Saldo Pendiente:</span>
                      <span className="font-mono">$0 COP (Paz y Salvo)</span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <span className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold cursor-pointer hover:bg-blue-500 transition-colors">
                      Descargar Recibo Oficial
                    </span>
                  </div>
                </div>
              )}

              {/* 8. MOCKUP: ULTRAADMIN MULTITENANT */}
              {currentModule.mockupType === 'ultraadmin' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Control de Licencias por Empresa</h4>
                      <p className="text-xs text-slate-400">Tenant: Constructora Bolívar S.A.S (Plan Business)</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-rose-950 text-rose-300 border border-rose-800">
                      RLS Activo
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Módulo Alquileres</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Módulo Devoluciones</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Módulo Bodega & Seriales</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Módulo Subcontrataciones</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    </div>
                  </div>

                  {/* Toggles interactivos */}
                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Módulo Facturación Electrónica:</span>
                      <button
                        type="button"
                        onClick={() => setModuloFacturacionActivo(!moduloFacturacionActivo)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          moduloFacturacionActivo ? 'bg-orange-500' : 'bg-slate-700'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          moduloFacturacionActivo ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Módulo Caja & Arqueo COP:</span>
                      <button
                        type="button"
                        onClick={() => setModuloCajaActivo(!moduloCajaActivo)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          moduloCajaActivo ? 'bg-orange-500' : 'bg-slate-700'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          moduloCajaActivo ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>14 empresas sincronizadas en tiempo real</span>
                    <span className="text-rose-400 font-semibold">Aislamiento por esquema ✓</span>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
