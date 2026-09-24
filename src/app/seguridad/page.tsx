'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Layers, Lock, Database, Server, Cpu, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function SeguridadPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* Encabezado */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Alquileres System</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Blindaje de Infraestructura y Soberanía de Datos</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Seguridad, Cifrado y Certificación de Determinismo
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Conoce la arquitectura técnica diseñada para proteger tus contratos, equipos, clientes y flujo de caja con cero fuga de información.
        </p>
      </div>

      {/* Tarjetas Principales de Seguridad */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
        
        {/* Pilar Clave: Cero IA Externa */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Certificación de Cero Fuga a Inteligencias Artificiales</h2>
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Zero Data Leakage Guarantee</span>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            A diferencia de otras plataformas que inyectan datos comerciales en APIs públicas de Inteligencia Artificial para procesamiento o predicción, <strong>Alquileres System opera bajo lógica de código determinística estricta</strong>. Tus números de facturación, depósitos en garantía, inventarios de maquinaria y listas de clientes jamás son compartidos ni transmitidos a modelos generativos de terceros (como OpenAI, Google, Anthropic o Meta).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sin re-entrenamiento de modelos con datos de clientes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cómputo transaccional 100% auditable y reproducible</span>
            </div>
          </div>
        </div>

        {/* Grid de 3 Pilares Técnicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="p-2.5 bg-orange-500/10 rounded-xl w-fit text-orange-400 border border-orange-500/20">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Aislamiento por RLS</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              PostgreSQL Row Level Security aísla cada consulta en el núcleo del motor. Ningún tenant puede consultar registros de otra ferretería, incluso ante errores de código en frontend.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl w-fit text-cyan-400 border border-cyan-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Cifrado de Alto Grado</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tráfico seguro protegido con TLS 1.3 y cabeceras CSP con nonces criptográficos por petición. Bases de datos y respaldos en la nube cifrados en reposo mediante AES-256 bits.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl w-fit text-amber-400 border border-amber-500/20">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Auditoría Inmutable</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Registro continuo en tabla append-only de auditoría para cada cobro, apertura de caja, modificación de contrato y cambio de estado, cumpliendo la trazabilidad legal exigida por la SIC.
            </p>
          </div>

        </div>

      </main>
    </div>
  );
}
