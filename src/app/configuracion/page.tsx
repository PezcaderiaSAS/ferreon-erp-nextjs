"use client";

import React, { useRef, useState } from 'react';
import { useEmpresaStore } from '../../infrastructure/state/empresaStore';
import { useLayoutStore } from '../../infrastructure/state/layoutStore';
import { MonedaConfig } from '../../core/domain/entities/empresa-config';
import { UsuariosTab } from './UsuariosTab';
import { HelpCircle, Palette, Sparkles, Check, FileText, Eye } from 'lucide-react';
import { THEME_PRESETS, ThemePresetId, resolveCompanyTheme, isValidHex } from '../../core/domain/theme/theme-tokens';


const OPCIONES_MONEDA: MonedaConfig[] = [
  { codigo: 'COP', locale: 'es-CO', simbolo: '$' },
  { codigo: 'USD', locale: 'en-US', simbolo: '$' },
  { codigo: 'EUR', locale: 'es-ES', simbolo: '€' },
  { codigo: 'MXN', locale: 'es-MX', simbolo: '$' },
];

export default function ConfiguracionPage() {
  const { config, actualizarConfig } = useEmpresaStore();
  const { setTourOpen } = useLayoutStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'empresa' | 'usuarios'>('empresa');
  const [formData, setFormData] = useState(config);
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setIsSaved(false);
  };

  const handleMonedaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = OPCIONES_MONEDA.find(m => m.codigo === e.target.value);
    if (selected) {
      setFormData({ ...formData, moneda: selected });
      setIsSaved(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("El logo es demasiado pesado. El límite máximo es 2MB para no afectar el rendimiento.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoBase64: reader.result as string });
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    actualizarConfig(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
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
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Cambiar Logo
              </button>
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

            {/* Grid de 6 Paletas Maestras */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                1. Seleccione una Paleta Maestra Curada
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.values(THEME_PRESETS).map((preset) => {
                  const isSelected = (formData.themeId || 'salmon') === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, themeId: preset.id as ThemePresetId, paletaPDF: (preset.id === 'teal' ? 'TEAL' : preset.id === 'ocean' ? 'AZUL' : 'SALMON') as any };
                        setFormData(updated);
                        setIsSaved(false);
                      }}
                      className={`relative flex flex-col p-3 rounded-xl border text-left transition-all group ${
                        isSelected 
                          ? 'border-brand-salmon bg-slate-50/80 shadow-md ring-2 ring-brand-salmon/30 scale-[1.02]' 
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Swatch visual con gradiente base/dark */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center -space-x-1.5">
                          <span 
                            className="w-5 h-5 rounded-full border border-white shadow-sm" 
                            style={{ backgroundColor: preset.base }} 
                          />
                          <span 
                            className="w-4 h-4 rounded-full border border-white shadow-sm" 
                            style={{ backgroundColor: preset.dark }} 
                          />
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-white shadow-sm" 
                            style={{ backgroundColor: preset.light }} 
                          />
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-brand-salmon text-white flex items-center justify-center text-[10px]">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">{preset.name.split(' (')[0]}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">{preset.base}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de Color HEX Libre */}
            <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="theme-custom-radio"
                    name="themeIdChoice"
                    checked={formData.themeId === 'custom'}
                    onChange={() => {
                      setFormData({ ...formData, themeId: 'custom' });
                      setIsSaved(false);
                    }}
                    className="w-4 h-4 text-brand-salmon focus:ring-brand-salmon"
                  />
                  <label htmlFor="theme-custom-radio" className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Color Corporativo a la Medida (HEX Libre)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  {/* Native Color Picker */}
                  <input
                    type="color"
                    value={isValidHex(formData.customBrandHex) ? formData.customBrandHex : '#FF8A65'}
                    disabled={formData.themeId !== 'custom'}
                    onChange={(e) => {
                      const hex = e.target.value.toUpperCase();
                      setFormData({ ...formData, themeId: 'custom', customBrandHex: hex });
                      setIsSaved(false);
                    }}
                    className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                  />
                  
                  {/* Hex Text Input */}
                  <input
                    type="text"
                    placeholder="#FF8A65"
                    value={formData.customBrandHex || ''}
                    disabled={formData.themeId !== 'custom'}
                    onChange={(e) => {
                      let hex = e.target.value.trim().toUpperCase();
                      if (hex && !hex.startsWith('#')) hex = `#${hex}`;
                      setFormData({ ...formData, themeId: 'custom', customBrandHex: hex });
                      setIsSaved(false);
                    }}
                    className="w-28 px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                El sistema derivará automáticamente los tonos suaves, acentos oscuros, resplandores neon y sombras neumórficas garantizando contraste de texto WCAG 2.1 AA.
              </p>
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

          {/* Facturation & Banks */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-slate-800">Parámetros Adicionales de Documentos</h3>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-1 md:w-1/2">
                <label className="text-sm font-medium text-slate-700">Moneda del Sistema</label>
                <select 
                  value={formData.moneda?.codigo || 'COP'} 
                  onChange={handleMonedaChange} 
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50"
                >
                  {OPCIONES_MONEDA.map(m => (
                    <option key={m.codigo} value={m.codigo}>{m.codigo} - {m.simbolo}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Todos los montos se formatearán en base a la moneda seleccionada.</p>
              </div>

              <div className="flex flex-col gap-1 md:w-1/2">
                <label className="text-sm font-medium text-slate-700">Días Mínimos de Alquiler</label>
                <input
                  type="number"
                  name="diasMinimosAlquiler"
                  min={1}
                  value={formData.diasMinimosAlquiler || 1}
                  onChange={handleChange}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/50"
                />
                <p className="text-xs text-slate-500 mt-1">Período mínimo de facturación predeterminado para nuevos contratos.</p>
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
          <div className="flex justify-end gap-4 mt-2">
            {isSaved && <span className="text-emerald-600 font-medium text-sm self-center">¡Configuración guardada correctamente!</span>}
            <button type="submit" className="px-6 py-2 bg-brand-salmon text-white rounded-lg font-medium shadow-md shadow-brand-salmon/20 hover:bg-brand-salmonDark transition-colors">
              Guardar Cambios
            </button>
          </div>

        </form>
      ) : (
        <UsuariosTab />
      )}
    </div>
  );
}
