'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MailCheck, CheckCircle2, ShieldCheck, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const initialStatus = searchParams.get('status') === 'success';

  const [email, setEmail] = useState(initialEmail);
  const [isSuccess, setIsSuccess] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialStatus) {
      setIsSuccess(true);
      setMessage(`El correo ${initialEmail || ''} ha sido removido con éxito de nuestras listas comerciales.`);
    }
  }, [initialStatus, initialEmail]);

  const handleManualOptOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setIsSuccess(true);
        setMessage('Tu solicitud ha sido procesada de inmediato. No recibirás más comunicaciones promocionales de Alquileres System.');
      } else {
        setMessage('Ocurrió un error al procesar tu solicitud. Intenta nuevamente.');
      }
    } catch {
      setMessage('Error de conexión. Por favor intenta más tarde o escribe a bajas@alquileres-system.com');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        
        {/* Icono Cabecera */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
          {isSuccess ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <MailCheck className="w-8 h-8" />}
        </div>

        {/* Título */}
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isSuccess ? 'Baja Confirmada' : 'Gestión de Comunicaciones'}
          </h1>
          <p className="text-xs text-slate-400">
            Cumplimiento del CAN-SPAM Act de 2003 y Protección de Datos Personales
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl text-xs sm:text-sm text-emerald-300 leading-relaxed text-left space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Garantía de Baja Inmediata</span>
              </div>
              <p>
                {message || 'Has sido dado de baja de todas las listas promocionales y boletines de Alquileres System.'}
              </p>
              <p className="text-[11px] text-emerald-400/80 pt-1">
                Nota: Los correos transaccionales esenciales (recibos de pago, restablecimiento de contraseña o contratos firmados de alquiler) continuarán operando para garantizar la ejecución de tu servicio.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Alquileres System</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleManualOptOut} className="space-y-4 text-left">
            <p className="text-xs text-slate-300 leading-relaxed text-center">
              Ingresa tu dirección de correo electrónico para dejar de recibir comunicaciones comerciales, anuncios de flota y novedades.
            </p>

            <div>
              <label htmlFor="unsub-email" className="block text-xs font-semibold text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="unsub-email"
                  type="email"
                  required
                  placeholder="tu-correo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {message && (
              <p className="text-xs text-rose-400 text-center">{message}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando Baja...</span>
                </>
              ) : (
                <span>Confirmar Baja de Suscripción (1 Clic)</span>
              )}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 leading-normal text-center">
          Alquileres System SAS • Calle 35 # 18-21, Oficina 402, Bucaramanga, Santander, Colombia • Código Postal 680006
        </div>

      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-slate-400 text-sm">Cargando gestión de desuscripción...</p>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
