'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Laptop,
  Server,
  ArrowDown,
  ShieldCheck,
  Zap,
  CheckCircle2,
  RefreshCw,
  AlertOctagon,
} from 'lucide-react';

export function PremiumStateGuardIdempotencySystem() {
  const [inFlight, setInFlight] = useState(false);
  const [chargesCaptured, setChargesCaptured] = useState(0);
  const [duplicateAttemptsBlocked, setDuplicateAttemptsBlocked] = useState(0);
  const [activeKey, setActiveKey] = useState('a3f81c79-9e81-4b72');
  const [logs, setLogs] = useState<string[]>([
    'Sistema en espera de transacciones de pago/alquiler.',
  ]);

  // Simulación de ataque por click repetido o latencia de red
  const handleSimulateBurstClicks = async () => {
    const key = `key-${Math.random().toString(36).substring(2, 9)}`;
    setActiveKey(key);

    let attempts = 0;
    let blockedLocally = 0;

    setLogs([`Iniciando ráfaga de 5 llamadas concurrentes con Idempotency-Key: ${key}`]);

    for (let i = 1; i <= 5; i++) {
      attempts++;
      if (inFlight) {
        blockedLocally++;
        setDuplicateAttemptsBlocked((b) => b + 1);
        setLogs((prev) => [
          `Intento #${i}: Bloqueado en Cliente por (inFlight === true). Handler protegido.`,
          ...prev,
        ]);
        continue;
      }

      setInFlight(true);
      setChargesCaptured((c) => c + 1);
      setLogs((prev) => [
        `Intento #${i}: Primera petición enviada al servidor con clave ${key}. Cobro capturado.`,
        ...prev,
      ]);

      // Simular latencia de red de 1.2 segundos
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setInFlight(false);
    }
  };

  const handleReset = () => {
    setChargesCaptured(0);
    setDuplicateAttemptsBlocked(0);
    setInFlight(false);
    setLogs(['Contadores reiniciados. Handler listo para nuevas pruebas.']);
  };

  return (
    <div className="w-full bg-[#06090b] text-[#f8fafc] rounded-2xl p-4 sm:p-8 border border-[#1c252b] shadow-2xl flex flex-col items-center justify-center font-sans">
      {/* Insignia Superior de Sistema */}
      <div className="mb-3 px-3 py-1 rounded-full bg-[#00e699]/15 border border-[#00e699]/30 text-[#00e699] text-xs font-mono font-semibold tracking-wider flex items-center gap-1.5 shadow-sm">
        <Sparkles className="w-3.5 h-3.5" />
        <span>STATE · GUARD</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1 text-center">
        UI off isn&apos;t enough. <span className="text-[#00e699]">Guard it.</span>
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 mb-6 text-center max-w-md">
        Deshabilitar el botón en la interfaz no evita ataques de red ni reintentos concurrentes.
      </p>

      {/* Contenedor de Arquitectura Cliente ⇄ Servidor */}
      <div className="bg-[#0f1417] border border-[#1c252b] rounded-2xl p-5 sm:p-6 w-full max-w-[460px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
        {/* Bloque del Cliente */}
        <div className="bg-[#090d0f] border border-[#1a2329] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 mb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
              <Laptop className="w-3.5 h-3.5" />
              <span>CLIENT</span>
            </span>
            <span className="text-slate-500">pay.ts</span>
          </div>

          <pre className="font-mono text-xs leading-relaxed overflow-x-auto text-slate-300">
            <code>
              <span className="text-sky-400">async function</span>{' '}
              <span className="text-emerald-400">pay</span>() &#123;{'\n'}
              {'  '}<span className="text-sky-400">if</span> (inFlight){' '}
              <span className="text-sky-400">return</span>;{' '}
              <span className="text-[#00e699] font-bold">{'// \u2190 GUARD'}</span>
              {'\n'}
              {'  '}inFlight = <span className="text-amber-400">true</span>;{'\n'}
              {'\n'}
              {'  '}<span className="text-sky-400">await</span>{' '}
              <span className="text-emerald-400">fetch</span>(
              <span className="text-rose-400">&apos;/pay&apos;</span>, &#123;{'\n'}
              {'    '}headers: &#123;{' '}
              <span className="text-rose-400">&apos;Idempotency-Key&apos;</span>: key &#125;{' '}
              <span className="text-[#00e699] font-bold">{'// \u2190 KEY'}</span>
              {'\n'}
              {'  '}&#125;);{'\n'}
              &#125;
            </code>
          </pre>
        </div>

        {/* Flecha de Conexión de Flujo */}
        <div className="py-2.5 flex items-center justify-center text-slate-600">
          <ArrowDown className="w-4 h-4 animate-bounce text-[#00e699]" />
        </div>

        {/* Bloque del Servidor */}
        <div className="bg-[#090d0f] border border-[#1a2329] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 mb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <Server className="w-3.5 h-3.5" />
              <span>SERVER</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[#00e699] text-[10px]">
              POST /pay
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <p className="text-slate-400">
              Idempotency-Key:{' '}
              <code className="text-cyan-300 bg-black/40 px-1.5 py-0.5 rounded">
                {activeKey}
              </code>
            </p>
            <p className="text-[#00e699] text-[11px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>key vista previamente? &rarr; retorna el mismo cobro sin re-ejecutar</span>
            </p>
          </div>
        </div>

        {/* Métrica de Cobros Capturados vs Intentos Bloqueados */}
        <div className="mt-4 p-3 rounded-xl bg-[#00e699]/10 border border-[#00e699]/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#00e699]/20 text-[#00e699] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="font-semibold text-slate-200">Charges captured:</span>
              <p className="text-[10px] text-slate-400">
                Duplicados bloqueados: {duplicateAttemptsBlocked}
              </p>
            </div>
          </div>
          <span className="font-mono text-2xl font-bold text-[#00e699]">
            {chargesCaptured}
          </span>
        </div>

        {/* Acciones de Simulación */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={inFlight}
            onClick={handleSimulateBurstClicks}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-[#00e699] hover:opacity-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{inFlight ? 'Procesando...' : 'Ráfaga 5 Clicks'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="py-2.5 px-3 rounded-xl bg-[#182025] hover:bg-[#222c33] text-slate-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Log de Auditoría Rápido */}
        <div className="mt-3 p-2 rounded-lg bg-black/50 border border-slate-800 text-[10px] font-mono text-slate-400 max-h-20 overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={idx} className="truncate">
              • {log}
            </div>
          ))}
        </div>
      </div>

      {/* Regla de Producción Inferior */}
      <div className="mt-6 px-4 py-1.5 rounded-full bg-[#00e699]/15 border border-[#00e699]/30 text-[#00e699] text-xs font-mono font-medium flex items-center gap-2 shadow-xs">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Guard the handler + idempotency key.</span>
      </div>
    </div>
  );
}
