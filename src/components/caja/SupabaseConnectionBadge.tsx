"use client";

import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { verificarConexionSupabaseAction } from '../../app/actions/caja';
import { SupabaseHealthResult } from '../../infrastructure/persistence/supabase/server';

export function SupabaseConnectionBadge() {
  const [health, setHealth] = useState<SupabaseHealthResult | null>(null);
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const res = await verificarConexionSupabaseAction();
      setHealth(res);
    } catch (err: any) {
      setHealth({
        ok: false,
        latenciaMs: 0,
        url: '',
        timestamp: new Date().toISOString(),
        error: err.message || 'Error de comunicación con servidor.'
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    // Verificación periódica cada 60 segundos
    const interval = setInterval(checkConnection, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!health && checking) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 animate-pulse">
        <Database className="w-3.5 h-3.5" />
        <span>Verificando base de datos...</span>
      </div>
    );
  }

  const isOk = health?.ok ?? false;

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        isOk 
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
          : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
      }`}
      title={isOk ? `Base de datos Supabase activa y persistiendo (Latencia: ${health?.latenciaMs}ms)` : `Error en base de datos: ${health?.error}`}
    >
      <div className="relative flex items-center justify-center">
        <span className={`w-2 h-2 rounded-full ${isOk ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
        {isOk && (
          <span className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
        )}
      </div>

      <span className="font-mono">
        {isOk ? `Supabase Online • ${health?.latenciaMs}ms` : 'Supabase Desconectado'}
      </span>

      <button
        type="button"
        onClick={checkConnection}
        disabled={checking}
        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
        title="Probar conectividad en vivo con Supabase"
      >
        <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
