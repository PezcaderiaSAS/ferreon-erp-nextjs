'use client';

import React, { useEffect, useState } from 'react';
import { useTenantStore } from '@/infrastructure/state/tenantStore';
import { 
  createCheckoutSessionAction, 
  createCustomerPortalSessionAction 
} from '@/app/actions/billing';
import { STRIPE_PLANS } from '@/lib/stripe';
import { 
  CheckCircle2, 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Building2, 
  Clock, 
  ExternalLink,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export default function SuscripcionPage() {
  const { tenant, isLoading, error, fetchTenantSubscription } = useTenantStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchTenantSubscription();
  }, [fetchTenantSubscription]);

  const handleCheckout = async () => {
    setIsProcessing(true);
    setActionError(null);
    try {
      const res = await createCheckoutSessionAction();
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        setActionError(res.error || 'No se pudo iniciar la sesión de pago.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setActionError(err.message || 'Error de conexión con Stripe.');
      setIsProcessing(false);
    }
  };

  const handlePortal = async () => {
    setIsProcessing(true);
    setActionError(null);
    try {
      const res = await createCustomerPortalSessionAction();
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        setActionError(res.error || 'No se pudo abrir el portal de facturación.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setActionError(err.message || 'Error de conexión.');
      setIsProcessing(false);
    }
  };

  const plan = STRIPE_PLANS.MONTHLY_FLAT;

  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Encabezado Principal */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>FerreOn ERP SaaS B2B</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Planes y Facturación
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Gestiona la suscripción mensual de tu empresa, métodos de pago y facturación recurrente con la seguridad de Stripe.
          </p>
        </div>

        {/* Tarjeta de Estado del Tenant Activo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-salmon" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Empresa Actual</span>
              </div>
              <h2 className="text-xl font-black text-slate-800">
                {tenant?.nombreEmpresa || 'Cargando información...'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Identificador: {tenant?.slug || 'tenant-principal'}
              </p>
            </div>

            {/* Badge de Estado de Suscripción */}
            <div className="flex flex-col items-start sm:items-end gap-2">
              <span className="text-xs font-semibold text-slate-400">Estado de la Cuenta:</span>
              {tenant?.subscriptionStatus === 'active' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Suscripción Activa (Plan Pro)
                </span>
              )}
              {tenant?.subscriptionStatus === 'trialing' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 font-bold text-xs rounded-full border border-sky-200">
                  <Clock className="w-4 h-4 text-sky-600" />
                  Periodo de Prueba ({tenant.daysLeftInTrial} días restantes)
                </span>
              )}
              {tenant?.subscriptionStatus === 'past_due' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 font-bold text-xs rounded-full border border-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Cobro Pendiente / En Mora
                </span>
              )}
              {tenant?.subscriptionStatus === 'canceled' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full border border-slate-300">
                  Suscripción Cancelada
                </span>
              )}
            </div>
          </div>

          {/* Banner de Aviso de Modo Solo Lectura si está vencido */}
          {tenant?.isReadOnly && (
            <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Modo Solo Lectura Activado:</strong> Tu periodo de prueba ha finalizado o tu suscripción requiere actualización de pago. Puedes seguir consultando e imprimiendo contratos, pero la creación de nuevos alquileres está pausada.
              </div>
            </div>
          )}
        </div>

        {/* Mensaje de Error si ocurre */}
        {(actionError || error) && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between">
            <span>{actionError || error}</span>
            <button 
              onClick={() => { setActionError(null); fetchTenantSubscription(); }}
              className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reintentar
            </button>
          </div>
        )}

        {/* Tarjeta del Plan Mensual Pro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-3xl border-2 border-brand-salmon/30 p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-brand-salmon text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-bl-xl shadow-xs">
              Plan Completo
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Todo el poder del ERP para tu empresa de alquileres de maquinaria y herramientas.
                </p>
              </div>

              <div className="flex items-baseline gap-2 pb-4 border-b border-slate-100">
                <span className="text-4xl font-black text-slate-900">{formatearCOP(plan.priceMonthlyCOP)}</span>
                <span className="text-sm text-slate-500 font-semibold">/ mes (COP)</span>
                <span className="text-xs text-slate-400 font-normal ml-2">~${plan.priceMonthlyUSD} USD</span>
              </div>

              {/* Lista de Características */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incluye sin restricciones:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Botón de Acción */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              {tenant?.subscriptionStatus !== 'active' ? (
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="flex-1 bg-brand-salmon hover:bg-brand-salmonDark text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-brand-salmon/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isProcessing ? 'Conectando con Stripe...' : 'Suscribirme Ahora'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handlePortal}
                  disabled={isProcessing}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{isProcessing ? 'Cargando Portal...' : 'Administrar Suscripción en Stripe'}</span>
                </button>
              )}

              {tenant?.hasStripeCustomer && tenant?.subscriptionStatus !== 'active' && (
                <button
                  onClick={handlePortal}
                  disabled={isProcessing}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Portal de Facturación</span>
                </button>
              )}
            </div>
          </div>

          {/* Tarjeta Lateral de Seguridad y Garantías */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-salmon">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Seguridad y Pagos Protegidos</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tus datos están aislados por empresa con Row Level Security (RLS). Los pagos y tarjetas son procesados directamente por Stripe con certificación PCI-DSS Nivel 1.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-slate-400">
              <p>✓ Cancela en cualquier momento sin penalizaciones.</p>
              <p>✓ Facturas automáticas enviadas a tu correo.</p>
              <p>✓ Cero comisiones ocultas.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
