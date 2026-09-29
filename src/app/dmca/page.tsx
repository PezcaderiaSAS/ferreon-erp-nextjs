'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Scale, 
  FileWarning, 
  Send, 
  CheckCircle2, 
  ArrowLeft, 
  Building, 
  Mail, 
  FileText,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export default function DmcaPolicyPage() {
  const [formData, setFormData] = useState({
    nombreDeclarante: '',
    emailDeclarante: '',
    empresaTitular: '',
    descripcionObraOriginal: '',
    urlContenidoInfractor: '',
    declaracionBuenaFe: false,
    declaracionPerjurio: false,
    firmaDigital: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.declaracionBuenaFe || !formData.declaracionPerjurio) {
      setErrorMessage('Debes marcar las declaraciones obligatorias bajo pena de perjurio.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/legal/dmca-takedown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage(data.message || 'Notificación DMCA radicada con éxito.');
      } else {
        setErrorMessage(data.error || 'Ocurrió un error al procesar tu notificación.');
      }
    } catch {
      setErrorMessage('Error de red. Intenta nuevamente o contacta a copyright@alquileres-system.com.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header de Navegación */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs sm:text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Alquileres System</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              DMCA Safe Harbor (17 U.S.C. § 512)
            </span>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10 flex-1">
        
        {/* Banner de Título */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
            <ShieldCheck className="w-4 h-4" />
            Marco de Protección de Derechos de Autor
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Política de Derechos de Autor y Retiro DMCA (Notice & Takedown)
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
            <strong>Alquileres System</strong> respeta los derechos de propiedad intelectual de terceros y exige que sus usuarios hagan lo mismo. Conforme al Título II de la Digital Millennium Copyright Act (17 U.S.C. § 512), esta página detalla nuestro protocolo de retiro expedito de contenidos infractores y la información de nuestro Agente Designado de Derechos de Autor.
          </p>
        </div>

        {/* Sección 1: Agente Designado */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
            <Building className="w-5 h-5 text-orange-400" />
            <span>1. Agente Designado de Derechos de Autor (Designated Copyright Agent)</span>
          </h2>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
            <p>
              Toda notificación formal de infracción de derechos de autor respecto a contenido alojado en <strong>Alquileres System</strong> (logos empresariales, imágenes de equipos, comprobantes u hojas técnicas) debe remitirse a nuestro Agente Designado:
            </p>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-1.5 text-slate-300">
              <div><strong>Nombre del Proveedor de Servicios:</strong> Alquileres System SAS</div>
              <div><strong>Atención:</strong> Departamento Legal / Designated Copyright Agent</div>
              <div><strong>Dirección Física:</strong> Calle 35 # 18-21, Oficina 402, Bucaramanga, Santander, Colombia (CP 680006)</div>
              <div><strong>Correo Electrónico Oficial:</strong> <span className="text-orange-400">copyright@alquileres-system.com</span></div>
              <div><strong>Teléfono:</strong> +57 (607) 630-1000</div>
              <div><strong>Registro ante la US Copyright Office:</strong> Procedimiento de registro de directorio OSP conforme a 37 CFR § 201.38</div>
            </div>
          </div>
        </section>

        {/* Sección 2: Requisitos de Notificación */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-orange-400" />
            <span>2. Requisitos Estatutarios de una Notificación DMCA (17 U.S.C. § 512(c)(3))</span>
          </h2>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
            <p>Para ser jurídicamente válida y activar la obligación de retiro expedito, la notificación debe contener por escrito:</p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-400">
              <li>Una firma física o electrónica de la persona autorizada para actuar en nombre del titular del derecho de autor exclusivo.</li>
              <li>Identificación de la obra protegida por derechos de autor que se alega ha sido infringida.</li>
              <li>Identificación del material infractor y la información razonablemente suficiente para que podamos localizarlo en la plataforma (URL exacta o identificador de empresa).</li>
              <li>Información de contacto del reclamante (dirección física, número de teléfono y correo electrónico).</li>
              <li>Una declaración de que el reclamante cree de buena fe que el uso del material no está autorizado por el titular, su agente o la ley.</li>
              <li>Una declaración de que la información provista es exacta y, bajo pena de perjurio, que el reclamante es el titular o está autorizado para actuar.</li>
            </ol>
          </div>
        </section>

        {/* Sección 3: Formulario en Línea de Retiro Expedito */}
        <section className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-amber-400" />
              <span>Formulario Digital de Notificación de Infracción (Notice & Takedown)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Diligencia este formulario para radicar de forma instantánea tu reclamo legal ante nuestro Agente de Copyright.
            </p>
          </div>

          {successMessage ? (
            <div className="p-6 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl space-y-3 text-emerald-300">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Notificación Radicada Exitosamente</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">{successMessage}</p>
              <button
                type="button"
                onClick={() => {
                  setSuccessMessage(null);
                  setFormData({
                    nombreDeclarante: '',
                    emailDeclarante: '',
                    empresaTitular: '',
                    descripcionObraOriginal: '',
                    urlContenidoInfractor: '',
                    declaracionBuenaFe: false,
                    declaracionPerjurio: false,
                    firmaDigital: '',
                  });
                }}
                className="text-xs text-emerald-400 underline font-semibold mt-2 block"
              >
                Radicar otra notificación
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {errorMessage && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Completo del Reclamante *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombreDeclarante}
                    onChange={(e) => setFormData({ ...formData, nombreDeclarante: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Correo Electrónico de Contacto *</label>
                  <input
                    type="email"
                    required
                    value={formData.emailDeclarante}
                    onChange={(e) => setFormData({ ...formData, emailDeclarante: e.target.value })}
                    placeholder="legal@tuempresa.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Empresa o Titular Exclusivo de los Derechos *</label>
                <input
                  type="text"
                  required
                  value={formData.empresaTitular}
                  onChange={(e) => setFormData({ ...formData, empresaTitular: e.target.value })}
                  placeholder="Ej. Maquinaria Global Inc."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descripción de la Obra Original Protegida *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.descripcionObraOriginal}
                  onChange={(e) => setFormData({ ...formData, descripcionObraOriginal: e.target.value })}
                  placeholder="Detalla la obra protegida (ej: Fotografía de catálogo de torre grúa X-400 registrada bajo certificado...)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">URL o Ubicación del Contenido Infractor en Alquileres System *</label>
                <input
                  type="text"
                  required
                  value={formData.urlContenidoInfractor}
                  onChange={(e) => setFormData({ ...formData, urlContenidoInfractor: e.target.value })}
                  placeholder="https://alquileres-system.com/... o identificador de empresa"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Declaraciones Juramentadas */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2.5 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <input
                    type="checkbox"
                    id="declaraBuenaFe"
                    required
                    checked={formData.declaracionBuenaFe}
                    onChange={(e) => setFormData({ ...formData, declaracionBuenaFe: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-slate-700 text-orange-600 focus:ring-orange-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="declaraBuenaFe" className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none">
                    Declaro de buena fe que el uso del material protegido descrito no está autorizado por el titular de los derechos, su representante o la legislación aplicable (17 U.S.C. § 512(c)(3)(A)(v)).
                  </label>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <input
                    type="checkbox"
                    id="declaraPerjurio"
                    required
                    checked={formData.declaracionPerjurio}
                    onChange={(e) => setFormData({ ...formData, declaracionPerjurio: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-slate-700 text-orange-600 focus:ring-orange-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="declaraPerjurio" className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none">
                    Certifico bajo gravedad de juramento y bajo pena de perjurio que la información provista en esta notificación es verídica y que soy el titular de los derechos o estoy legalmente autorizado para actuar en su representación.
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Firma Digital (Nombre y Apellidos como firma legal) *</label>
                <input
                  type="text"
                  required
                  value={formData.firmaDigital}
                  onChange={(e) => setFormData({ ...formData, firmaDigital: e.target.value })}
                  placeholder="/s/ Juan Pérez"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Radicando notificación formal...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Notificación Formal de Retiro DMCA</span>
                  </>
                )}
              </button>
            </form>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} Alquileres System SAS • Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 text-slate-400 text-[11px]">
            <Link href="/terminos" className="hover:text-white transition-colors">Términos de Servicio</Link>
            <span>•</span>
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            <span>•</span>
            <Link href="/dmca" className="hover:text-white transition-colors text-orange-400 font-bold">DMCA Safe Harbor</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
