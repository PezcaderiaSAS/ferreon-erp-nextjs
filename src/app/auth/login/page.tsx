"use client";

import React, { useState } from 'react';
import { supabaseClient } from '../../../infrastructure/persistence/supabase/client';
import { 
  Sparkles, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Building, 
  ArrowRight, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Boxes, 
  ReceiptText, 
  Zap,
  Layers,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { FuturisticBackground } from '@/components/ui/FuturisticBackground';

export default function LoginPage() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error logging in with Google:', error);
      setErrorMsg(error.message || 'Ocurrió un error inesperado al conectar con Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isRegisterMode) {
        // Registro de usuario nuevo con auto-onboarding
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              empresa_nombre: empresaNombre || undefined,
            },
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });

        if (error) throw error;

        if (data.session) {
          window.location.href = '/';
        } else {
          setSuccessMsg('¡Cuenta creada con éxito! Revisa tu bandeja de correo para confirmar e ingresar al ERP.');
        }
      } else {
        // Inicio de sesión existente
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          window.location.href = '/';
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Error al autenticar. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-12 bg-slate-50 font-sans antialiased selection:bg-orange-500 selection:text-white relative">
      
      {/* ========================================================================= */}
      {/* LEFT COLUMN: Clean, High-Conversion Authentication Form (White / Slate-50) */}
      {/* ========================================================================= */}
      <div className="w-full lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white border-r border-slate-200/80 shadow-xl z-20 min-h-screen relative overflow-hidden">
        
        {/* Subtle Ambient Glow for Left Panel */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Branding Header */}
        <div className="flex items-center justify-between relative z-10">
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-10 h-10 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight font-display">
                FerreOn<span className="text-orange-600">.</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                ERP Alquileres SaaS
              </span>
            </div>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/60 shadow-sm">
            <Activity className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            <span>Cloud 2.0</span>
          </span>
        </div>

        {/* Center: Auth Form Card */}
        <div className="my-auto py-8 max-w-md w-full mx-auto relative z-10">
          
          {/* Mode Switcher Tabs */}
          <div className="inline-flex w-full p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 mb-8 shadow-inner">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                !isRegisterMode 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                isRegisterMode 
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200/60' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Crear Cuenta (14d Gratis)
            </button>
          </div>

          {/* Title & Subtitle */}
          <div className="mb-6 space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
              {isRegisterMode ? 'Empieza gratis en 1 minuto' : 'Bienvenido de nuevo'}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              {isRegisterMode 
                ? 'Gestiona contratos, maquinaria y clientes con 14 días de prueba sin tarjeta.' 
                : 'Ingresa tus credenciales o accede con tu cuenta corporativa de Google.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-start gap-2.5 animate-fadeIn">
              <span className="text-red-500 font-bold shrink-0">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-700 flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Social Auth (Google OAuth 2.0 con PKCE) */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-300/80 rounded-xl text-slate-700 text-sm font-semibold transition-all hover:border-slate-400 shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>{isLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              O con correo electrónico
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nombre de tu Empresa o Negocio
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Ej: Andamios & Encofrados SAS"
                    value={empresaNombre}
                    onChange={(e) => setEmpresaNombre(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="gerencia@tuempresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Contraseña
                </label>
                {!isRegisterMode && (
                  <button 
                    type="button" 
                    onClick={() => alert('Para restablecer tu contraseña, ingresa tu correo y contacta a soporte o usa el acceso con Google.')}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isRegisterMode ? 'Crear Cuenta y Comenzar' : 'Ingresar al ERP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Proof / Security Badge */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Cifrado Three-Tier
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-slate-600">
              <Zap className="w-4 h-4 text-amber-500" /> PostgreSQL RLS
            </span>
          </div>

        </div>

        {/* Footer Legal */}
        <div className="text-center text-xs text-slate-400 pt-4 relative z-10">
          © 2026 FerreOn ERP SaaS. Todos los derechos reservados.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: Futuristic Brand Showcase with Animated Cyber Matrix & Orbs  */}
      {/* ========================================================================= */}
      <div className="hidden lg:col-span-7 xl:col-span-7 lg:flex flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 text-white relative overflow-hidden">
        
        {/* Futuristic Background Animation Layer (Cyber Grid + Neon Blobs + Laser Beams) */}
        <FuturisticBackground interactive={true} />

        {/* Top Feature Pill */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-orange-200 shadow-glow-orange hover:border-orange-400/40 transition-all">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin [animation-duration:8s]" />
            <span>La plataforma líder en alquiler de maquinaria y andamios</span>
          </div>
        </div>

        {/* Center: Main Headline & Floating Glassmorphic Cards */}
        <div className="relative z-10 my-auto max-w-xl space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight font-display bg-gradient-to-r from-white via-orange-100 to-amber-200 bg-clip-text text-transparent">
              Control Total de tu Flota y Facturación en Tiempo Real.
            </h2>
            <p className="text-slate-300 text-base xl:text-lg leading-relaxed font-normal">
              Digitaliza contratos de alquiler con bloqueo pesimista de stock, emisión de comprobantes en PDF y seguimiento de cartera en un solo lugar.
            </p>
          </div>

          {/* Floating Glassmorphic Cards with Independent Levitating Animations */}
          <div className="space-y-4 pt-2">
            
            {/* Card 1: Stock en Tiempo Real (Float Slow) */}
            <div className="p-4 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] backdrop-blur-2xl border border-white/15 shadow-2xl transition-all flex items-start gap-4 animate-float-slow will-change-transform group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600/60 to-amber-500/60 border border-white/30 flex items-center justify-center shrink-0 text-white shadow-inner group-hover:scale-110 transition-transform">
                <Boxes className="w-5 h-5 text-amber-200" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
                    Bodega & SKU Inteligente
                  </h4>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    En Línea
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-normal">
                  Controla stock disponible vs en obra con prevención pesimista de sobre-alquiler.
                </p>
              </div>
            </div>

            {/* Card 2: Liquidación & PDFs (Float Delayed) */}
            <div className="p-4 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] backdrop-blur-2xl border border-white/15 shadow-2xl transition-all flex items-start gap-4 animate-float-delayed will-change-transform group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600/60 to-teal-500/60 border border-white/30 flex items-center justify-center shrink-0 text-white shadow-inner group-hover:scale-110 transition-transform">
                <ReceiptText className="w-5 h-5 text-cyan-200" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
                    Contratos & Liquidación en 1 Clic
                  </h4>
                  <span className="text-[11px] font-semibold text-cyan-200 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/40">
                    PDF Carta / A5 / POS
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-normal">
                  Cálculo automático de días de cobro, fletes, garantías y números a letras.
                </p>
              </div>
            </div>

            {/* Card 3: Multi-Tenant RLS (Float Reverse) */}
            <div className="p-4 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] backdrop-blur-2xl border border-white/15 shadow-2xl transition-all flex items-start gap-4 animate-float-reverse will-change-transform group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600/60 to-indigo-500/60 border border-white/30 flex items-center justify-center shrink-0 text-white shadow-inner group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5 text-purple-200" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">
                    Aislamiento Multi-Tenant
                  </h4>
                  <span className="text-[11px] font-semibold text-purple-200 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/40">
                    PostgreSQL RLS
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-normal">
                  Privacidad y segmentación absoluta de datos por empresa en la nube.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Trust Indicators */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>14 Días de Prueba Gratis</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Sin Tarjeta de Crédito Requerida</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Soporte B2B 24/7</span>
          </div>
        </div>

      </div>

    </div>
  );
}
