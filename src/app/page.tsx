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
  BarChart3
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header / Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-sky-600 p-2 rounded-xl text-white shadow-lg shadow-sky-600/30">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
                FerreOn ERP
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                alquileres_app
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="h-11 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium transition-all shadow-lg shadow-sky-600/30 flex items-center space-x-2 text-sm active:scale-95">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Alquiler</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner de Bienvenida y Estado del Sistema */}
        <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Instancia Producción Limpia & Ready</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Gestión Inteligente de Alquileres de Maquinaria
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Módulo desacoplado bajo Arquitectura Hexagonal. Moneda oficial COP, 
              control estricto de peso en gramos enteros e inventario en bodega en tiempo real.
            </p>
          </div>
        </section>

        {/* Métricas KPI (Grid Responsivo Adaptativo) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Contratos Activos</span>
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-white">0</span>
              <span className="text-xs text-slate-500 ml-2">alquileres en obra</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Equipos en Bodega</span>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-white">106</span>
              <span className="text-xs text-slate-500 ml-2">disponibles</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Devoluciones Hoy</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <RotateCcw className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-white">0</span>
              <span className="text-xs text-slate-500 ml-2">corte 5:00 PM</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Estado Seguridad</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-lg font-bold text-emerald-400">RLS Activo</span>
              <span className="block text-xs text-slate-500">Supabase Auth JWT</span>
            </div>
          </div>
        </section>

        {/* Sección de Accesos Rápidos y Estado de Bodega */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel Principal: Lista de Contratos */}
          <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileText className="h-5 w-5 text-sky-400" />
                <span>Contratos Recientes (`alquileres_app`)</span>
              </h2>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-between mx-auto text-slate-400">
                <Clock className="h-6 w-6 mx-auto" />
              </div>
              <p className="text-slate-400 text-sm font-medium">
                No hay contratos registrados. El sistema se encuentra en modo limpio listo para operar.
              </p>
              <button className="h-11 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-all shadow-lg shadow-sky-600/30">
                Crear Primer Alquiler
              </button>
            </div>
          </div>

          {/* Panel Lateral: Estándares del Sistema */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              <span>Estándares Activos</span>
            </h2>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Control de Peso:</span>
                <span className="font-semibold text-sky-400">`peso_gramos BIGINT` (0.000 Kg)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Moneda Financiera:</span>
                <span className="font-semibold text-emerald-400">COP `NUMERIC(12, 2)`</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Hora de Corte:</span>
                <span className="font-semibold text-amber-400">5:00 PM (`America/Bogota`)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Generación PDF:</span>
                <span className="font-semibold text-indigo-400">Serverless 100% Renglones</span>
              </div>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}
