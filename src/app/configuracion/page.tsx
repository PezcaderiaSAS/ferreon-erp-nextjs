"use client";

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useEmpresaStore, applyThemeToDOM } from '../../infrastructure/state/empresaStore';
import { useLayoutStore } from '../../infrastructure/state/layoutStore';
import { MonedaConfig, TemaColorCorporativo, PAISES_LATAM_PRESETS } from '../../core/domain/entities/empresa-config';
import { UsuariosTab } from './UsuariosTab';
import { HelpCircle, Palette, Sparkles, Check, FileText, Eye, Loader2, Trash2, Upload, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { THEME_PRESETS, ThemePresetId, resolveCompanyTheme, isValidHex } from '../../core/domain/theme/theme-tokens';
import { obtenerConfiguracionEmpresaAction, guardarConfiguracionEmpresaAction } from '../actions/empresa';
import { supabaseClient } from '../../infrastructure/persistence/supabase/client';

const AuditoriaTab = dynamic(
  () => import('./AuditoriaTab').then((mod) => mod.AuditoriaTab),
  { 
    ssr: false, 
    loading: () => (
      <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-salmon" />
        <p className="text-sm">Cargando consola de auditoría...</p>
      </div>
    ) 
  }
);

interface TriadaColorOption {
  id: TemaColorCorporativo;
  name: string;
  tag: string;
  badgeClass: string;
  description: string;
  base: string;
  dark: string;
  light: string;
  ringClass: string;
  borderClass: string;
}

const TRIADA_INSTITUCIONAL: TriadaColorOption[] = [
  {
    id: 'salmon-pastel',
    name: 'Rosa Salmonado Pastel',
    tag: 'Principal / Predeterminada',
    badgeClass: 'bg-[#FFF3F0] text-[#D94C24] border-[#FFE4DC]',
    description: 'Estética cálida y de alta legibilidad, diseñada para reducir la fatiga visual en facturación.',
    base: '#FF8A65',
    dark: '#F4683E',
    light: '#FFF3F0',
    ringClass: 'ring-[#FF8A65]/40',
    borderClass: 'border-[#FF8A65]',
  },
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan & Steel Blue',
    tag: 'Industrial / Fríos Pezca',
    badgeClass: 'bg-[#F0F9FF] text-[#0369A1] border-[#E0F2FE]',
    description: 'Identidad corporativa técnica para logística marina, muelle y bodegas de frío.',
    base: '#0EA5E9',
    dark: '#0284C7',
    light: '#F0F9FF',
    ringClass: 'ring-[#0EA5E9]/40',
    borderClass: 'border-[#0EA5E9]',
  },
  {
    id: 'monochrome',
    name: 'Neutral Monochrome',
    tag: 'Minimalismo B2B',
    badgeClass: 'bg-[#F4F4F5] text-slate-800 border-[#E4E4E7]',
    description: 'Máxima sobriedad corporativa ejecutiva estilo Linear/Vercel sobre lienzo neutro.',
    base: '#18181B',
    dark: '#27272A',
    light: '#F4F4F5',
    ringClass: 'ring-slate-900/40',
    borderClass: 'border-slate-900',
  },
];

const OPCIONES_MONEDA: MonedaConfig[] = [
  { codigo: 'COP', locale: 'es-CO', simbolo: '$' },
  { codigo: 'USD', locale: 'en-US', simbolo: '$' },
  { codigo: 'EUR', locale: 'es-ES', simbolo: '€' },
  { codigo: 'MXN', locale: 'es-MX', simbolo: '$' },
];

/**
 * Redimensiona una imagen a un tamaño máximo manteniendo el aspect ratio
 * y la convierte en un Data URI PNG optimizado (<150KB) para evitar exceder
 * los límites de cuota de localStorage o sobrecargar el renderizado de PDFs.
 */
function resizeImageToBase64(file: File, maxWidth = 400, maxHeight = 120): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (readerEvent) => {
      const img = new window.Image();
      img.src = readerEvent.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/png', 0.92);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export default function ConfiguracionPage() {
  const { config, actualizarConfig } = useEmpresaStore();
  const { setTourOpen } = useLayoutStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'empresa' | 'usuarios' | 'auditoria'>('empresa');
  const [formData, setFormData] = useState(config);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [mostrarMasPaletas, setMostrarMasPaletas] = useState(false);

  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const rol = (data.user.user_metadata?.rol || data.user.user_metadata?.role || '').toUpperCase();
        setCurrentUserRole(rol);
      }
    });
  }, []);

  const esSuperAdmin = [
    'SUPERADMIN', 
    'ADMIN_ENTERPRISE', 
    'OWNER', 
    'DEVELOPER', 
    'ULTRAADMIN',
    'ADMIN'
  ].includes(currentUserRole) || !currentUserRole; // Si es local dev sin rol explícito, permitir acceso administrativo

  // Carga e hidratación inicial desde Supabase Backend
  useEffect(() => {
    let isMounted = true;
    async function cargarConfiguracionRemota() {
      try {
        setIsLoading(true);
        const res = await obtenerConfiguracionEmpresaAction();
        const cfg = res.config || res.data;
        if (res.success && cfg && isMounted) {
          actualizarConfig(cfg);
          setFormData(cfg);
        }
      } catch (err: any) {
        console.warn("No se pudo cargar la configuración de Supabase, usando local:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    cargarConfiguracionRemota();
    return () => { isMounted = false; };
  }, [actualizarConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setIsSaved(false);
    setErrorMessage(null);
  };

  const handleMonedaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = OPCIONES_MONEDA.find(m => m.codigo === e.target.value);
    if (selected) {
      setFormData(prev => ({ ...prev, moneda: selected }));
      setIsSaved(false);
      setErrorMessage(null);
    }
  };

  const handlePaisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const codPais = e.target.value;
    const preset = PAISES_LATAM_PRESETS.find(p => p.codigoPais === codPais);
    if (preset) {
      const monSugerida = OPCIONES_MONEDA.find(m => m.codigo === preset.monedaCodigo) || formData.moneda;
      setFormData(prev => ({
        ...prev,
        pais: preset.nombrePais,
        nombreImpuesto: preset.nombreImpuesto,
        tasaImpuestoDefecto: preset.tasaImpuesto,
        moneda: monSugerida,
      }));
      setIsSaved(false);
      setErrorMessage(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Por favor seleccione un archivo de imagen válido (PNG, JPG, WEBP).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("El logo es demasiado pesado. El límite máximo es 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const compressedBase64 = await resizeImageToBase64(file, 400, 120);
      setFormData(prev => ({ ...prev, logoBase64: compressedBase64 }));
      setIsSaved(false);
      setErrorMessage(null);
    } catch (err) {
      console.error("Error al procesar el logo con canvas:", err);
      alert("Ocurrió un error al procesar la imagen del logo.");
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoBase64: '' }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsSaved(false);
    setErrorMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    try {
      // 1. Guardar en Zustand (actualiza inmediatamente la UI y localStorage)
      actualizarConfig(formData);

      // 2. Persistir en la base de datos Supabase
      const res = await guardarConfiguracionEmpresaAction(formData);
      if (!res.success) {
        throw new Error(res.error || "No se pudo sincronizar la configuración con la base de datos.");
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err: any) {
      console.error("Error al guardar configuración empresarial:", err);
      setErrorMessage(err.message || "Error al sincronizar con el servidor. Se mantuvo la versión local.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-1">Configuración</h1>
        <p className="text-base text-slate-600">Gestione la configuración global de Alquileres ERP y sus usuarios.</p>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          type="button"
          onClick={() => setActiveTab('empresa')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'empresa' ? 'border-brand-salmon text-brand-salmon' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Datos de la Empresa
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('usuarios')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'usuarios' ? 'border-brand-salmon text-brand-salmon' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Usuarios y Accesos
        </button>
        {esSuperAdmin && (
          <button 
            type="button"
            onClick={() => setActiveTab('auditoria')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'auditoria' 
                ? 'border-brand-salmon text-brand-salmon' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Auditoría y Seguridad
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
              RBAC
            </span>
          </button>
        )}
      </div>

      {activeTab === 'empresa' ? (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-card border border-slate-200 p-6 flex flex-col gap-6">
          {/* Logo Section */}
          <div className="flex flex-col md:flex-row gap-6 items-start border-b border-slate-100 pb-6">
            <div className="flex flex-col gap-2 w-full md:w-1/3">
              <label className="text-sm font-semibold text-slate-800">Logo Corporativo</label>
              <p className="text-xs text-slate-500">Se usará en la generación de contratos y facturas en PDF. (Recomendado: PNG fondo transparente)</p>
            </div>
            <div className="flex-1 flex flex-col items-start gap-4">
              <div className="w-48 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                {formData.logoBase64 ? (
                  <img src={formData.logoBase64} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-slate-400 text-sm font-medium">Sin Logo</span>
                )}
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
              />
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  {formData.logoBase64 ? 'Cambiar Logo' : 'Subir Logo'}
                </button>

                {formData.logoBase64 && (
                  <button 
                    type="button" 
                    onClick={handleRemoveLogo}
                    className="px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                    title="Quitar logo"
                  >
                    <Trash2 className="w-4 h-4" />
                    Quitar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
            <h3 className="text-lg font-semibold text-slate-800">Información General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Razón Social</label>
                <input type="text" name="razonSocial" value={formData.razonSocial} onChange={handleChange} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">NIT o Documento</label>
                <input type="text" name="nit" value={formData.nit} onChange={handleChange} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Teléfono</label>
                <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Ciudad / Ubicación</label>
                <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50" />
              </div>
            </div>
          </div>

          {/* User Preferences / Tour */}
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
            <h3 className="text-lg font-semibold text-slate-800">Preferencias y Ayuda</h3>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <div className="flex flex-col">
                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Tour Interactivo
                </h4>
                <p className="text-xs text-indigo-700 mt-1">
                  Vuelve a reproducir la guía paso a paso para familiarizarte con el sistema.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setTourOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors whitespace-nowrap"
              >
                Reiniciar Tour
              </button>
            </div>
          </div>

          {/* Identidad de Marca y Gobernanza Cromática Unificada */}
          <div className="flex flex-col gap-6 border-b border-slate-100 pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-brand-salmon" />
                  Identidad Visual y Paleta de Colores (Web UI & PDFs)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Una sola configuración corporativa gobierna en tiempo real los botones, tablas, paneles de cristal y todos los documentos PDF generados.
                </p>
              </div>
            </div>

            {/* 1. Tríada Institucional de Marca (Corporate Clean Standard) */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-salmon" />
                  1. Tríada de Identidad Institucional (Recomendada)
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Gobernanza corporativa centralizada para Web UI & PDFs
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {TRIADA_INSTITUCIONAL.map((item) => {
                  const isSelected = (formData.temaColor || 'salmon-pastel') === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...formData,
                          temaColor: item.id,
                          themeId: item.id as ThemePresetId,
                          paletaPDF: (item.id === 'cyber-cyan' ? 'AZUL' : 'SALMON') as any,
                        };
                        setFormData(updated);
                        actualizarConfig(updated);
                        applyThemeToDOM(updated);
                        setIsSaved(false);
                      }}
                      className={`relative flex flex-col p-4 rounded-xl border text-left transition-all duration-150 ${
                        isSelected 
                          ? `${item.borderClass} bg-white shadow-md ring-2 ${item.ringClass} scale-[1.01]` 
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Badge y Checkmark */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeClass}`}>
                          {item.tag}
                        </span>
                        {isSelected ? (
                          <div 
                            className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[11px] shadow-sm"
                            style={{ backgroundColor: item.base }}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-200" />
                        )}
                      </div>

                      {/* Título y Muestras de color */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-900">{item.name}</span>
                        <div className="flex items-center -space-x-1.5">
                          <span 
                            className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                            style={{ backgroundColor: item.base }} 
                          />
                          <span 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                            style={{ backgroundColor: item.dark }} 
                          />
                          <span 
                            className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm" 
                            style={{ backgroundColor: item.light }} 
                          />
                        </div>
                      </div>

                      {/* Descripción */}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {item.description}
                      </p>

                      {/* Código HEX */}
                      <span className="text-[11px] text-slate-400 font-mono font-semibold tabular-nums mt-auto">
                        Base: {item.base}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de Paletas Secundarias / Personalización HEX Libre (Colapsable) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMostrarMasPaletas(!mostrarMasPaletas)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  {mostrarMasPaletas ? 'Ocultar opciones avanzadas' : 'Ver paletas complementarias y color HEX personalizado...'}
                  {mostrarMasPaletas ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              </div>

              {mostrarMasPaletas && (
                <div className="flex flex-col gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Paletas Maestras Adicionales
                  </label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {Object.values(THEME_PRESETS)
                      .filter((p) => !['salmon-pastel', 'cyber-cyan', 'monochrome'].includes(p.id))
                      .map((preset) => {
                        const isSelected = formData.themeId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              const updated = { 
                                ...formData, 
                                themeId: preset.id as ThemePresetId,
                                paletaPDF: (preset.id === 'teal' ? 'TEAL' : preset.id === 'ocean' ? 'AZUL' : 'SALMON') as any 
                              };
                              setFormData(updated);
                              actualizarConfig(updated);
                              applyThemeToDOM(updated);
                              setIsSaved(false);
                            }}
                            className={`relative flex flex-col p-2.5 rounded-lg border text-left transition-all ${
                              isSelected 
                                ? 'border-brand-salmon bg-white shadow-sm ring-2 ring-brand-salmon/30' 
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.base }} />
                              {isSelected && (
                                <div className="w-3.5 h-3.5 rounded-full bg-brand-salmon text-white flex items-center justify-center text-[9px]">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-slate-800 truncate">{preset.name.split(' (')[0]}</span>
                            <span className="text-[9px] text-slate-400 font-mono mt-0.5">{preset.base}</span>
                          </button>
                        );
                      })}
                  </div>

                  {/* Selector de Color HEX Libre */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="theme-custom-radio"
                        name="themeIdChoice"
                        checked={formData.themeId === 'custom'}
                        onChange={() => {
                          const updated = { ...formData, themeId: 'custom' as const };
                          setFormData(updated);
                          actualizarConfig(updated);
                          applyThemeToDOM(updated);
                          setIsSaved(false);
                        }}
                        className="w-4 h-4 text-brand-salmon focus:ring-brand-salmon"
                      />
                      <label htmlFor="theme-custom-radio" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Color Corporativo a la Medida (HEX Libre)
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={isValidHex(formData.customBrandHex) ? formData.customBrandHex : '#FF8A65'}
                        disabled={formData.themeId !== 'custom'}
                        onChange={(e) => {
                          const hex = e.target.value.toUpperCase();
                          const updated = { ...formData, themeId: 'custom' as const, customBrandHex: hex };
                          setFormData(updated);
                          actualizarConfig(updated);
                          applyThemeToDOM(updated);
                          setIsSaved(false);
                        }}
                        className="w-8 h-8 p-0.5 rounded-lg border border-slate-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                      />
                      <input
                        type="text"
                        placeholder="#FF8A65"
                        value={formData.customBrandHex || ''}
                        disabled={formData.themeId !== 'custom'}
                        onChange={(e) => {
                          let hex = e.target.value.trim().toUpperCase();
                          if (hex && !hex.startsWith('#')) hex = `#${hex}`;
                          const updated = { ...formData, themeId: 'custom' as const, customBrandHex: hex };
                          setFormData(updated);
                          actualizarConfig(updated);
                          applyThemeToDOM(updated);
                          setIsSaved(false);
                        }}
                        className="w-24 px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Interactive Preview Box (Vista Previa en Vivo) */}
            {(() => {
              const previewTokens = resolveCompanyTheme(formData);
              return (
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-slate-200 bg-slate-900/5 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Vista Previa en Vivo de la Marca ({previewTokens.name})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                      {previewTokens.base}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Botón de Interfaz */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Botón Web UI</span>
                      <button
                        type="button"
                        style={{ backgroundColor: previewTokens.base, color: previewTokens.textOnBase }}
                        className="w-full py-2 px-3 rounded-lg text-xs font-semibold shadow-sm transition-all text-center"
                      >
                        Crear Alquiler
                      </button>
                    </div>

                    {/* Badge de Estado */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Insignia / Badge</span>
                      <div 
                        style={{ backgroundColor: previewTokens.badgeBg, color: previewTokens.badgeText, borderColor: previewTokens.base }}
                        className="w-full py-2 px-3 rounded-lg text-xs font-bold border text-center flex items-center justify-center gap-1"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: previewTokens.base }} />
                        Activo en Obra
                      </div>
                    </div>

                    {/* Mini Header Documento PDF */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        Encabezado PDF (Contrato)
                      </span>
                      <div 
                        style={{ borderBottomColor: previewTokens.dark }}
                        className="w-full py-1.5 px-2 border-b-2 bg-slate-50 rounded flex items-center justify-between"
                      >
                        <span className="text-[10px] font-bold" style={{ color: previewTokens.dark }}>
                          {formData.razonSocial || 'ALQUILERES ERP'}
                        </span>
                        <span 
                          style={{ backgroundColor: previewTokens.light, color: previewTokens.dark }}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        >
                          COT #00120
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Parámetros de Facturación, Impuestos & Moneda Multipaís LATAM */}
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Parámetros Tributarios y Moneda (LATAM)</h3>
              <p className="text-xs text-slate-500">Configure la jurisdicción fiscal y la tasa de impuesto que se aplicará por defecto en los alquileres y cotizaciones.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* País / Jurisdicción Fiscal */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">País / Jurisdicción</label>
                <select 
                  value={PAISES_LATAM_PRESETS.find(p => p.nombrePais === (formData.pais || 'Colombia'))?.codigoPais || 'CO'} 
                  onChange={handlePaisChange} 
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50 bg-white"
                >
                  {PAISES_LATAM_PRESETS.map(p => (
                    <option key={p.codigoPais} value={p.codigoPais}>
                      {p.nombrePais} ({p.nombreImpuesto} {p.tasaImpuesto}%)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Ajusta sugerencias fiscales automáticamente.</p>
              </div>

              {/* Moneda del Sistema */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Moneda del Sistema</label>
                <select 
                  value={formData.moneda?.codigo || 'COP'} 
                  onChange={handleMonedaChange} 
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50 bg-white"
                >
                  {OPCIONES_MONEDA.map(m => (
                    <option key={m.codigo} value={m.codigo}>{m.codigo} - {m.simbolo}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Formato monetario general.</p>
              </div>

              {/* Nombre del Impuesto */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Nombre del Impuesto</label>
                <input
                  type="text"
                  name="nombreImpuesto"
                  placeholder="IVA / IGV"
                  value={formData.nombreImpuesto || 'IVA'}
                  onChange={handleChange}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50"
                />
                <p className="text-[11px] text-slate-400">Denominación fiscal en el PDF.</p>
              </div>

              {/* Tasa de Impuesto Predeterminada (%) */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Tasa de Impuesto (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    name="tasaImpuestoDefecto"
                    min={0}
                    max={100}
                    step={0.5}
                    value={formData.tasaImpuestoDefecto ?? 19}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, tasaImpuestoDefecto: Number(e.target.value) || 0 }));
                      setIsSaved(false);
                    }}
                    className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50 text-right"
                  />
                  <span className="absolute right-3 top-2 text-sm text-slate-400 font-bold">%</span>
                </div>
                <p className="text-[11px] text-slate-400">Tasa predeterminada para el switch.</p>
              </div>
            </div>

            {/* Fila secundaria: Días mínimos y Switch de Preactivación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Días Mínimos de Alquiler</label>
                <input
                  type="number"
                  name="diasMinimosAlquiler"
                  min={1}
                  value={formData.diasMinimosAlquiler || 1}
                  onChange={handleChange}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50"
                />
                <p className="text-[11px] text-slate-400">Período mínimo de facturación en contratos.</p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1">
                <input
                  type="checkbox"
                  id="aplicaImpuestoDefecto"
                  checked={Boolean(formData.aplicaImpuestoDefecto)}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, aplicaImpuestoDefecto: e.target.checked }));
                    setIsSaved(false);
                  }}
                  className="w-4 h-4 text-brand-salmon rounded border-slate-300 focus:ring-brand-salmon cursor-pointer"
                />
                <label htmlFor="aplicaImpuestoDefecto" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Activar cobro de impuesto por defecto en nuevos alquileres
                  <span className="block text-[11px] text-slate-500 font-normal">
                    Si se desmarca, el switch de impuestos iniciará apagado y el operador podrá encenderlo con 1 clic cuando lo requiera.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <label className="text-sm font-medium text-slate-700">Términos y Condiciones / Notas (Contratos)</label>
              <textarea name="notasFacturaPDF" value={formData.notasFacturaPDF} onChange={handleChange} rows={3} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50"></textarea>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Información Bancaria para Pagos</label>
              <textarea name="cuentaBancariaInfo" value={formData.cuentaBancariaInfo} onChange={handleChange} rows={3} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50"></textarea>
            </div>
          </div>


          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-4 mt-2">
            {errorMessage && (
              <span className="text-rose-600 font-medium text-sm bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                {errorMessage}
              </span>
            )}
            {isSaved && (
              <span className="text-emerald-600 font-medium text-sm bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                ¡Configuración guardada y sincronizada con éxito!
              </span>
            )}
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2 bg-brand-salmon text-white rounded-lg font-medium shadow-md shadow-brand-salmon/20 hover:bg-brand-salmonDark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>

        </form>
      ) : activeTab === 'usuarios' ? (
        <UsuariosTab />
      ) : (
        <AuditoriaTab />
      )}
    </div>
  );
}
