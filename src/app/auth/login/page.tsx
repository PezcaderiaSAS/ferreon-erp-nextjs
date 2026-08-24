"use client";

import React, { useState } from 'react';
import { supabaseClient } from '../../../infrastructure/persistence/supabase/client';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      console.error('Error logging in:', error);
      setErrorMsg(error.message || 'Ocurrió un error inesperado al conectar con Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card border border-slate-200 p-8 flex flex-col items-center gap-6">
        
        {/* Logo or Brand */}
        <div className="w-16 h-16 bg-brand-salmon rounded-xl flex items-center justify-center shadow-md shadow-brand-salmon/20 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Alquileres ERP</h1>
          <p className="text-slate-500 text-sm mt-2">Inicia sesión para acceder al panel de administración y control de inventario.</p>
        </div>

        {errorMsg && (
          <div className="w-full bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
            {errorMsg}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full mt-4 flex items-center justify-center gap-3 px-6 py-3 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-brand-salmon border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              <path fill="none" d="M1 1h22v22H1z" />
            </svg>
          )}
          <span>{isLoading ? 'Conectando...' : 'Ingresar con Google'}</span>
        </button>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400">
            Sistema de control de inventario de Alquileres. <br/> Protegido por Supabase.
          </p>
        </div>
      </div>
    </div>
  );
}
