import React from "react";
import { 
  Building2, 
  Package, 
  FileText, 
  RotateCcw, 
  Plus, 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  BarChart3,
  Sparkles,
  Layers
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      
      {/* Resplandores de Luz de Fondo Ambientales (Glow Orbs) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Header Glassmorphism / Navigation Bar */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-sky-600 to-cyan-400 p-2.5 rounded-2xl text-white shadow-lg shadow-sky-500/30 ring-1 ring-white/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              {/* Encabezado Renombrado Oficialmente a "Alquileres ERP" */}
              <span className="text-xl font-black bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent tracking-tight">
                Alquileres ERP
              </span>
              <span className="ml-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-400/30 backdrop-blur-md shadow-sm">
                alquileres_app
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="glass-button-primary h-11 px-5 rounded-2xl text-white font-semibold text-sm flex items-center space-x-2 active:scale-95">
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Nuevo Alquiler</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Hero Card con Efecto Cristal Glassmorphism */}
        <section className="glass-panel rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
              <CheckCircle2 className="h-4 w-4" />
              <span>Instancia Producción Limpia & Ready</span>
              <Sparkles className="h-3.5 w-3.5 ml-1 text-emerald-300" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Gestión Inteligente de Alquileres de Maquinaria
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
              Módulo desacoplado bajo Arquitectura Hexagonal. Moneda oficial COP, 
              control estricto de peso en gramos enteros (`peso_gramos BIGINT`) e inventario en bodega en tiempo real.
            </p>
          </div>
        </section>

        {/* Métricas KPI Glassmorphism (Grid Responsivo Adaptativo) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="glass-panel glass-panel-hover rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Contratos Activos</span>
              <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5">
              <span className="text-4xl font-extrabold text-white">0</span>
              <span className="text-xs text-slate-400 ml-2 font-medium">alquileres en obra</span>
            </div>
          </div>

          <div className="glass-panel glass-panel-hover rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Equipos en Bodega</span>
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5">
              <span className="text-4xl font-extrabold text-white">106</span>
              <span className="text-xs text-slate-400 ml-2 font-medium">disponibles</span>
            </div>
          </div>

          <div className="glass-panel glass-panel-hover rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Devoluciones Hoy</span>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <RotateCcw className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5">
              <span className="text-4xl font-extrabold text-white">0</span>
              <span className="text-xs text-amber-300 ml-2 font-medium">corte 5:00 PM</span>
            </div>
          </div>

          <div className="glass-panel glass-panel-hover rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Estado Seguridad</span>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5">
              <span className="text-xl font-bold text-emerald-400 block">RLS Activo</span>
              <span className="text-xs text-slate-400 font-medium">Supabase Auth JWT</span>
            </div>
          </div>

        </section>

        {/* Paneles de Contrato y Estándares con Cristal Translúcido */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel Principal: Lista de Contratos */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-white flex items-center space-x-2.5">
                <Layers className="h-5 w-5 text-sky-400" />
                <span>Contratos Recientes (`alquileres_app`)</span>
              </h2>
            </div>
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-10 text-center space-y-4 backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center mx-auto text-slate-300 shadow-inner">
                <Clock className="h-7 w-7" />
              </div>
              <p className="text-slate-300 text-sm font-medium max-w-md mx-auto">
                No hay contratos registrados. El sistema se encuentra en modo limpio listo para operar.
              </p>
              <button className="glass-button-primary h-11 px-6 rounded-2xl text-white font-semibold text-sm">
                Crear Primer Alquiler
              </button>
            </div>
          </div>

          {/* Panel Lateral: Estándares Activos Glassmorphism */}
          <div className="glass-panel rounded-3xl p-6 space-y-5">
            <h2 className="text-lg font-extrabold text-white flex items-center space-x-2.5">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              <span>Estándares Activos</span>
            </h2>
            <div className="space-y-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 flex justify-between items-center backdrop-blur-md">
                <span className="text-slate-400 font-medium">Control de Peso:</span>
                <span className="font-bold text-sky-300">`peso_gramos BIGINT`</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 flex justify-between items-center backdrop-blur-md">
                <span className="text-slate-400 font-medium">Moneda Financiera:</span>
                <span className="font-bold text-emerald-400">COP `NUMERIC(12, 2)`</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 flex justify-between items-center backdrop-blur-md">
                <span className="text-slate-400 font-medium">Hora de Corte:</span>
                <span className="font-bold text-amber-300">5:00 PM (`America/Bogota`)</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 flex justify-between items-center backdrop-blur-md">
                <span className="text-slate-400 font-medium">Generación PDF:</span>
                <span className="font-bold text-indigo-300">Serverless 100% Renglones</span>
              </div>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}
