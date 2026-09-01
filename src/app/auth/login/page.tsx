"use client";

import React, { useState } from 'react';
import { supabaseClient } from '../../../infrastructure/persistence/supabase/client';
import { Sparkles, ShieldCheck, Mail, Lock, Building, ArrowRight, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        // Registro de usuario nuevo
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
          setSuccessMsg('¡Cuenta creada con éxito! Revisa tu correo para confirmar tu cuenta e iniciar sesión.');
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
      setErrorMsg(err.message || 'Error al procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4 relative overflow-hidden">
      {/* Glow ambient background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden z-10">
        
        {/* Left Side: Value Proposition & Brand */}
        <div className="p-8 md:p-10 bg-gradient-to-br from-orange-600/90 via-orange-700 to-amber-700 flex flex-col justify-between text-white relative">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">FerreOn ERP</h2>
                <span className="text-xs uppercase tracking-widest text-orange-200 font-semibold">SaaS Enterprise</span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                Gestión Inteligente de Alquileres y Maquinaria
              </h3>
              <p className="text-orange-100/90 text-sm leading-relaxed">
                Control de bodega en tiempo real, contratos con bloqueo pesimista de stock, emisión de PDFs empresariales y liquidación de cartera.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-orange-50 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>14 días de prueba gratuita sin tarjeta</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-orange-50 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Aislamiento estricto de datos con PostgreSQL RLS</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-orange-50 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Disponibilidad inmediata con Google OAuth 2.0</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/20 mt-6 flex items-center justify-between text-xs text-orange-200">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4" /> Three-Tier Security
            </span>
            <span>Versión 2.0 Cloud</span>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-8 md:p-10 flex flex-col justify-between bg-slate-900/60">
          <div>
            {/* Mode Switcher */}
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 mb-6">
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isRegisterMode ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setIsRegisterMode(true); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isRegisterMode ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Crear Cuenta (14d Gratis)
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">
                {isRegisterMode ? 'Empieza tus 14 días de prueba' : 'Bienvenido de nuevo'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isRegisterMode ? 'Crea tu empresa y comienza a registrar maquinaria al instante.' : 'Ingresa tus credenciales o accede con tu cuenta corporativa.'}
              </p>
            </div>

            {/* Error / Success Messages */}
            {errorMsg && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl">
                {successMsg}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-white text-sm font-semibold transition-all hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>{isLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
            </button>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/60"></div>
              </div>
              <span className="relative bg-slate-900 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                O con correo electrónico
              </span>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Empresa</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: Andamios & Equipos SAS"
                      value={empresaNombre}
                      onChange={(e) => setEmpresaNombre(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="gerencia@tuempresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{isRegisterMode ? 'Crear Cuenta y Comenzar' : 'Acceder al Sistema'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              Al ingresar aceptas nuestros términos y políticas de privacidad B2B SaaS.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
