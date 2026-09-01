'use client';

import React, { useEffect, useState } from 'react';
import { useTenantStore } from '@/infrastructure/state/tenantStore';
import { 
  createCheckoutSessionAction,
  createLifetimeCheckoutSessionAction,
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
  RefreshCw,
  Infinity,
  Zap
} from 'lucide-react';

export default function SuscripcionPage() {
  const { tenant, isLoading, error, fetchTenantSubscription } = useTenantStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePlanAction, setActivePlanAction] = useState<'monthly' | 'lifetime' | 'portal' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchTenantSubscription();
  }, [fetchTenantSubscription]);

  const handleMonthlyCheckout = async () => {
    setIsProcessing(true);
    setActivePlanAction('monthly');
    setActionError(null);
    try {
      const res = await createCheckoutSessionAction();
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        setActionError(res.error || 'No se pudo iniciar la sesión de pago mensual.');
        setIsProcessing(false);
        setActivePlanAction(null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Error de conexión con Stripe.');
      setIsProcessing(false);
      setActivePlanAction(null);
    }
  };

  const handleLifetimeCheckout = async () => {
    setIsProcessing(true);
    setActivePlanAction('lifetime');
    setActionError(null);
    try {
      const res = await createLifetimeCheckoutSessionAction();
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        setActionError(res.error || 'No se pudo iniciar la sesión de pago del Plan Vitalicio.');
        setIsProcessing(false);
        setActivePlanAction(null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Error de conexión con Stripe.');
      setIsProcessing(false);
      setActivePlanAction(null);
    }
  };

  const handlePortal = async () => {
    setIsProcessing(true);
    setActivePlanAction('portal');
    setActionError(null);
    try {
      const res = await createCustomerPortalSessionAction();
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        setActionError(res.error || 'No se pudo abrir el portal de facturación.');
        setIsProcessing(false);
        setActivePlanAction(null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Error de conexión.');
      setIsProcessing(false);
      setActivePlanAction(null);
    }
  };

  const monthlyPlan = STRIPE_PLANS.MONTHLY_FLAT;
  const lifetimePlan = STRIPE_PLANS.LIFETIME_DEAL;

  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const isLifetimeActive = tenant?.planId === 'plan_lifetime' && tenant?.subscriptionStatus === 'active';

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
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
            Elige el plan que mejor se adapte a tu operación: suscripción mensual flexible o acceso vitalicio de por vida con pago único.
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
              <h2 className="text-xl font-bold text-slate-800">{tenant?.nombreEmpresa || 'Cargando...'}</h2>
              <p className="text-xs text-slate-500">Identificador de Tenant: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{tenant?.slug || '...'}</code></p>
            </div>

            {/* Badges de Estado */}
            <div className="flex flex-wrap items-center gap-2">
              {isLifetimeActive && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 font-bold text-xs rounded-full border border-purple-200">
                  <Infinity className="w-4 h-4 text-purple-600" />
                  Plan Vitalicio (Acceso de por Vida)
                </span>
              )}
              {!isLifetimeActive && tenant?.subscriptionStatus === 'active' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Suscripción Mensual Activa
                </span>
              )}
              {tenant?.subscriptionStatus === 'trialing' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 font-bold text-xs rounded-full border border-sky-200">
                  <Clock className="w-4 h-4 text-sky-600" />
                  Periodo de Prueba ({tenant.daysLeftInTrial} días restantes)
                </span>
              )}
              {tenant?.subscriptionStatus === 'past_due' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 font-bold text-xs rounded-full border border-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Cobro Pendiente / En Mora
                </span>
              )}
              {tenant?.subscriptionStatus === 'canceled' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-full border border-slate-300">
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

        {/* Grid de Planes: Mensual Pro vs Plan Vitalicio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* 1. Plan Mensual Pro */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-brand-salmon/40 p-6 sm:p-8 shadow-sm relative flex flex-col justify-between transition-all">
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-brand-salmon text-[11px] font-black uppercase tracking-wider rounded-full mb-3">
                  Suscripción Mensual
                </div>
                <h3 className="text-2xl font-black text-slate-900">{monthlyPlan.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Ideal para empresas que prefieren flexibilidad mes a mes sin compromisos a largo plazo.
                </p>
              </div>

              <div className="flex items-baseline gap-2 pb-4 border-b border-slate-100">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">{formatearCOP(monthlyPlan.priceMonthlyCOP)}</span>
                <span className="text-sm text-slate-500 font-semibold">/ mes (COP)</span>
                <span className="text-xs text-slate-400 font-normal ml-2">~${monthlyPlan.priceMonthlyUSD} USD</span>
              </div>

              {/* Lista de Características */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incluye:</h4>
                <ul className="space-y-2.5">
                  {monthlyPlan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Botón de Acción Mensual */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              {tenant?.subscriptionStatus !== 'active' ? (
                <button
                  onClick={handleMonthlyCheckout}
                  disabled={isProcessing}
                  className="w-full bg-white hover:bg-slate-50 border-2 border-brand-salmon text-brand-salmon hover:text-brand-salmonDark font-bold text-sm px-6 py-3 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isProcessing && activePlanAction === 'monthly' ? 'Conectando...' : 'Elegir Plan Mensual'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handlePortal}
                  disabled={isProcessing}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{isProcessing && activePlanAction === 'portal' ? 'Cargando...' : 'Administrar Suscripción'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Plan Vitalicio (Lifetime Deal - LTD) */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white rounded-3xl border-2 border-amber-500/40 p-6 sm:p-8 shadow-xl relative flex flex-col justify-between overflow-hidden">
            {/* Ribbon de Oferta Especial */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[11px] font-black uppercase tracking-wider px-5 py-1.5 rounded-bl-2xl shadow-md flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Oferta Vitalicia Limitada</span>
            </div>

            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 text-[11px] font-black uppercase tracking-wider rounded-full mb-3 border border-amber-500/30">
                  <Infinity className="w-3.5 h-3.5" />
                  Pago Único Perpetuo
                </div>
                <h3 className="text-2xl font-black text-white">{lifetimePlan.name}</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Paga una sola vez y utiliza FerreOn ERP de por vida sin mensualidades ni renovaciones.
                </p>
              </div>

              <div className="flex items-baseline gap-2 pb-4 border-b border-white/10">
                <span className="text-3xl sm:text-4xl font-black text-amber-400">{formatearCOP(lifetimePlan.priceCOP)}</span>
                <span className="text-sm text-amber-200/70 font-semibold">pago único</span>
                <span className="text-xs text-slate-400 font-normal ml-2">~${lifetimePlan.priceUSD} USD</span>
              </div>

              {/* Lista de Características */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Beneficios Vitalicios:</h4>
                <ul className="space-y-2.5">
                  {lifetimePlan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Botón de Acción Vitalicio */}
            <div className="mt-8 pt-6 border-t border-white/10">
              {isLifetimeActive ? (
                <div className="w-full py-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tienes Acceso Vitalicio Activo</span>
                </div>
              ) : (
                <button
                  onClick={handleLifetimeCheckout}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>{isProcessing && activePlanAction === 'lifetime' ? 'Conectando con Stripe...' : 'Comprar Plan Vitalicio ($1.200.000)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Footer de Confianza y Seguridad */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Transacciones 100% Cifradas y Seguras</p>
              <p>Procesadas directamente por Stripe con cumplimiento PCI-DSS Nivel 1.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Aislamiento PostgreSQL RLS</span>
            <span>•</span>
            <span>Factura Electrónica en PDF</span>
          </div>
        </div>

      </div>
    </div>
  );
}
