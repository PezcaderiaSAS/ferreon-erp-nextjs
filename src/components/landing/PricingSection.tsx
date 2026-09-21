"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landing';

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');

  const { pricing } = LANDING_CONFIG;

  const formatPrice = (priceObj: { monthly: number; annual: number }) => {
    const rawPrice = billingCycle === 'annual' ? priceObj.annual : priceObj.monthly;
    if (rawPrice === 0) return '$0';

    if (currency === 'COP') {
      // Regla de Negocio: Enteros en COP con separador de miles y sin decimales
      const formatted = new Intl.NumberFormat('es-CO', {
        maximumFractionDigits: 0,
      }).format(rawPrice);
      return `$${formatted}`;
    }

    return `$${rawPrice}`;
  };

  return (
    <section id="pricing" className="py-20 md:py-28 relative overflow-hidden bg-slate-950">
      {/* Background Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-4">
            {pricing.badge}
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            {pricing.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
            {pricing.subtitle}
          </p>
        </div>

        {/* Dual Switchers (Billing Cycle & Currency) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          {/* Monthly / Annual Toggle */}
          <div className="flex items-center bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Facturación Mensual
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Anual</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                -20%
              </span>
            </button>
          </div>

          {/* Currency Switcher (COP / USD) */}
          <div className="flex items-center bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setCurrency('COP')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currency === 'COP'
                  ? 'bg-slate-800 text-blue-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              COP ($)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currency === 'USD'
                  ? 'bg-slate-800 text-blue-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {pricing.tiers.map((tier) => {
            const priceText = formatPrice(currency === 'COP' ? tier.priceCOP : tier.priceUSD);
            const cycleSuffix = currency === 'COP' ? '/mes' : '/month';

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 transform-gpu ${
                  tier.isPopular
                    ? 'bg-slate-900/90 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 lg:-translate-y-2'
                    : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Popular Pill Badge */}
                {tier.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/30 uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5" />
                    {tier.badge}
                  </div>
                )}

                <div>
                  {/* Plan Name & Description */}
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                    {tier.description}
                  </p>

                  {/* Price Display */}
                  <div className="flex items-baseline gap-1 mb-8 pb-6 border-b border-slate-800">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight tabular-nums">
                      {priceText}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-400 font-medium">
                      {cycleSuffix}
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3.5 mb-8" aria-label={`Características del plan ${tier.name}`}>
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card CTA Button */}
                <Link
                  href={tier.ctaHref}
                  className={`w-full inline-flex items-center justify-center gap-2 text-sm font-semibold py-3.5 px-4 rounded-xl transition-all duration-150 ${
                    tier.isPopular
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 focus-visible:ring-2 focus-visible:ring-blue-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 focus-visible:ring-2 focus-visible:ring-slate-400'
                  }`}
                >
                  {tier.ctaLabel}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
