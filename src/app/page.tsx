"use client";

import React, { useState } from "react";
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
  Layers,
  LayoutDashboard,
  Users,
  Receipt,
  ArrowLeft,
  Search,
  Check,
  AlertCircle
} from "lucide-react";

type TabType = "dashboard" | "alquileres" | "bodega" | "devoluciones" | "facturacion" | "clientes";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [previousTab, setPreviousTab] = useState<TabType | null>(null);

  // Función de navegación bidireccional entre pestañas
  const navigateToTab = (targetTab: TabType) => {
    setPreviousTab(activeTab);
    setActiveTab(targetTab);
  };

  const goBack = () => {
    if (previousTab) {
      const temp = activeTab;
      setActiveTab(previousTab);
      setPreviousTab(temp);
    } else {
      setActiveTab("dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      
      {/* Resplandores de Luz Ambientales (Glow Orbs) */}
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
              <span className="text-xl font-black bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent tracking-tight">
                Alquileres ERP
              </span>
              <span className="ml-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-400/30 backdrop-blur-md shadow-sm">
                alquileres_app
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {previousTab && (
              <button 
                onClick={goBack}
                className="h-10 px-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver</span>
              </button>
            )}
            <button 
              onClick={() => navigateToTab("alquileres")}
              className="glass-button-primary h-11 px-5 rounded-2xl text-white font-semibold text-sm flex items-center space-x-2 active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Nuevo Alquiler</span>
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS DINÁMICAS (TABBED SPA) */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 overflow-x-auto py-2 border-t border-white/5 scrollbar-none">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "alquileres", label: "Alquileres", icon: FileText },
            { id: "bodega", label: "Bodega e Inventario", icon: Package },
            { id: "devoluciones", label: "Devoluciones", icon: RotateCcw },
            { id: "facturacion", label: "Facturación & PDF", icon: Receipt },
            { id: "clientes", label: "Clientes & Terceros", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigateToTab(tab.id as TabType)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-md shadow-sky-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* CONTENIDO DINÁMICO SEGÚN PESTAÑA ACTIVA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* PESTAÑA 1: DASHBOARD / INICIO */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Hero Card */}
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

            {/* Métricas KPI */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div 
                onClick={() => navigateToTab("alquileres")}
                className="glass-panel glass-panel-hover rounded-2xl p-6 cursor-pointer"
              >
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

              <div 
                onClick={() => navigateToTab("bodega")}
                className="glass-panel glass-panel-hover rounded-2xl p-6 cursor-pointer"
              >
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

              <div 
                onClick={() => navigateToTab("devoluciones")}
                className="glass-panel glass-panel-hover rounded-2xl p-6 cursor-pointer"
              >
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

            {/* Accesos Rápidos Bidireccionales */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <button 
                    onClick={() => navigateToTab("alquileres")}
                    className="glass-button-primary h-11 px-6 rounded-2xl text-white font-semibold text-sm"
                  >
                    Crear Primer Alquiler
                  </button>
                </div>
              </div>

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
                </div>
              </div>
            </section>
          </div>
        )}

        {/* PESTAÑA 2: CONTRATOS DE ALQUILER */}
        {activeTab === "alquileres" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Gestión de Alquileres & Contratos</h1>
                <p className="text-xs text-slate-400">Cotización, Despacho y Seguimiento de Equipos en Obra</p>
              </div>
              <button 
                onClick={() => navigateToTab("dashboard")} 
                className="text-xs text-sky-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver al Dashboard</span>
              </button>
            </div>

            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar contrato por consecutivo, cliente o equipo..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <button className="glass-button-primary px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Contrato de Alquiler</span>
                </button>
              </div>

              <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900/30 rounded-2xl border border-white/5">
                <FileText className="h-10 w-10 mx-auto text-sky-400/60" />
                <p className="text-sm font-medium">Instancia limpia lista. Ningún contrato de alquiler registrado.</p>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: BODEGA E INVENTARIO */}
        {activeTab === "bodega" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Catálogo de Bodega e Inventario</h1>
                <p className="text-xs text-slate-400">Control de Stock, Tarifas Diarias y Peso en Gramos (`peso_gramos BIGINT`)</p>
              </div>
              <button 
                onClick={() => navigateToTab("alquileres")} 
                className="text-xs text-sky-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <span>Ir a Alquileres</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { nombre: "Mezcladora de Concreto 2 Bultos", tarifa: "$ 45.000 / día", peso: "250.000 Kg", stock: "10 disp" },
                { nombre: "Vibrador de Concreto Eléctrico 2HP", tarifa: "$ 25.000 / día", peso: "15.000 Kg", stock: "15 disp" },
                { nombre: "Demoledor Eléctrico 30Kg (HEX 28mm)", tarifa: "$ 65.000 / día", peso: "30.000 Kg", stock: "8 disp" },
                { nombre: "Andamio Multidireccional (Módulo 1.5m)", tarifa: "$ 12.000 / día", peso: "45.000 Kg", stock: "50 disp" },
                { nombre: "Cortadora de Pavimento 13HP", tarifa: "$ 85.000 / día", peso: "120.000 Kg", stock: "5 disp" },
                { nombre: "Planta Eléctrica 6.5 kW (Diésel)", tarifa: "$ 75.000 / día", peso: "95.000 Kg", stock: "6 disp" },
              ].map((item, idx) => (
                <div key={idx} className="glass-panel glass-panel-hover rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-sm">{item.nombre}</h3>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {item.stock}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-300">
                    <p><span className="text-slate-500">Tarifa:</span> <strong className="text-sky-300">{item.tarifa}</strong></p>
                    <p><span className="text-slate-500">Peso Estándar:</span> <strong>{item.peso}</strong></p>
                  </div>
                  <button 
                    onClick={() => navigateToTab("alquileres")}
                    className="w-full mt-2 py-2 rounded-xl bg-slate-800 hover:bg-sky-600 text-white text-xs font-bold transition-all"
                  >
                    Alquilar Este Equipo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: DEVOLUCIONES */}
        {activeTab === "devoluciones" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Recepción de Devoluciones & Registro de Daños</h1>
                <p className="text-xs text-slate-400">Reingreso a Bodega e Inspección Física de Equipos (Corte 5:00 PM)</p>
              </div>
              <button 
                onClick={() => navigateToTab("bodega")} 
                className="text-xs text-sky-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <span>Ver Stock en Bodega</span>
              </button>
            </div>

            <div className="glass-panel rounded-3xl p-8 space-y-4 text-center">
              <RotateCcw className="h-10 w-10 mx-auto text-amber-400/70" />
              <p className="text-slate-300 text-sm font-medium">No hay devoluciones pendientes programadas para hoy.</p>
            </div>
          </div>
        )}

        {/* PESTAÑA 5: FACTURACIÓN & PDF */}
        {activeTab === "facturacion" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Facturación, Cuentas de Cobro & PDFs</h1>
                <p className="text-xs text-slate-400">Liquidación en COP `NUMERIC(12, 2)` con 100% de ítems contratados</p>
              </div>
              <button 
                onClick={() => navigateToTab("alquileres")} 
                className="text-xs text-sky-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <span>Ir a Alquileres</span>
              </button>
            </div>

            <div className="glass-panel rounded-3xl p-8 space-y-4 text-center">
              <Receipt className="h-10 w-10 mx-auto text-indigo-400/70" />
              <p className="text-slate-300 text-sm font-medium">Instancia limpia sin facturas o cuentas de cobro emitidas.</p>
            </div>
          </div>
        )}

        {/* PESTAÑA 6: CLIENTES & TERCEROS */}
        {activeTab === "clientes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Directorio de Clientes & Terceros</h1>
                <p className="text-xs text-slate-400">Identificación en Mayúsculas (`UPPERCASE.trim()`) y NITs Sanitizados</p>
              </div>
              <button 
                onClick={() => navigateToTab("alquileres")} 
                className="text-xs text-sky-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <span>Crear Alquiler para Cliente</span>
              </button>
            </div>

            <div className="glass-panel rounded-3xl p-8 space-y-4 text-center">
              <Users className="h-10 w-10 mx-auto text-emerald-400/70" />
              <p className="text-slate-300 text-sm font-medium">Directorio de clientes listo en blanco para registrar terceros.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
