'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Users, 
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { completeTenantOnboardingAction, type OnboardingFormData } from '@/app/actions/onboarding';
import { supabaseClient } from '@/infrastructure/persistence/supabase/client';
import { ConsentCheckbox } from '@/components/legal/ConsentCheckbox';

export default function OnboardingPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);

  // Form State
  const [formData, setFormData] = useState<OnboardingFormData>({
    nombreEmpresa: '',
    nit: '',
    telefono: '',
    ciudad: 'Bucaramanga',
    tamanoEmpresa: '1-10',
    aceptaTerminos: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.user) {
          router.replace('/auth/login?redirectTo=/onboarding');
          return;
        }

        const user = session.user;
        setUserEmail(user.email || '');
        const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
        setUserName(name);

        // Si ya tiene nombre en metadata o sugerido, prellenar
        if (name && !formData.nombreEmpresa) {
          setFormData((prev) => ({
            ...prev,
            nombreEmpresa: `Ferretería ${name.split(' ')[0]}`,
          }));
        }
      } catch (err) {
        console.error('Error verificando sesión:', err);
      } finally {
        setIsVerifyingSession(false);
      }
    }

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await completeTenantOnboardingAction(formData);
      if (res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        setErrorMsg(res.error || 'No se pudo completar el registro de la empresa.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión al procesar el registro.');
      setIsLoading(false);
    }
  };

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-slate-400 text-sm">Verificando tu cuenta en Alquileres System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Minimalista */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-cyan-400 flex items-center justify-center shadow-md shadow-orange-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Alquileres System</span>
        </div>
        <div className="text-xs text-slate-400">
          Sesión: <span className="text-slate-200 font-medium">{userEmail}</span>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-2xl w-full mx-auto px-4 py-10 z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8">
          
          {/* Encabezado del Formulario */}
          <div className="space-y-3 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Configuración Inicial de tu Empresa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              ¡Bienvenido{userName ? `, ${userName}` : ''}! Configura tu negocio
            </h1>
            <p className="text-slate-400 text-sm">
              Ingresa los datos oficiales de tu ferretería o empresa de maquinaria para activar tu prueba gratuita de 14 días y comenzar de inmediato.
            </p>
          </div>

          {/* Alerta de Error */}
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              
              {/* Nombre de la Empresa */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nombre Comercial de la Empresa *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.nombreEmpresa}
                    onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
                    placeholder="Ej. Ferretería Josase S.A.S."
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* NIT y Teléfono en dos columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    NIT o Documento *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.nit}
                      onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                      placeholder="Ej. 900.123.456-7"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Teléfono / WhatsApp *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="Ej. 310 123 4567"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Ciudad y Tamaño */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Ciudad de Operación *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      placeholder="Ej. Bucaramanga, Bogotá..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Tamaño del Equipo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <select
                      value={formData.tamanoEmpresa}
                      onChange={(e) => setFormData({ ...formData, tamanoEmpresa: e.target.value as any })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    >
                      <option value="1-10">1 a 10 empleados</option>
                      <option value="11-50">11 a 50 empleados</option>
                      <option value="50+">Más de 50 empleados</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* Ventajas Incluidas */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tu cuenta incluirá:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>14 días de acceso completo sin costo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Datos demo precargados (equipos y contratos)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Rol ADMIN con control total de tu empresa</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sin tarjeta de crédito requerida</span>
                </div>
              </div>
            </div>

            {/* Checkbox Obligatorio de Consentimiento Legal */}
            <ConsentCheckbox
              id="aceptaTerminos"
              checked={formData.aceptaTerminos}
              onChange={(checked) => setFormData({ ...formData, aceptaTerminos: checked })}
              disabled={isLoading}
            />

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-white font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creando empresa y aprovisionando tu ERP...</span>
                </>
              ) : (
                <>
                  <span>Crear Empresa y Entrar al ERP</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="w-full text-center py-6 text-xs text-slate-500 border-t border-slate-900 z-10">
        Alquileres System © 2026. Todos los derechos reservados.
      </footer>
    </div>
  );
}
