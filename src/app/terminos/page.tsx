'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Layers, CheckCircle2, AlertTriangle, ShieldCheck, Scale } from 'lucide-react';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* Encabezado */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Alquileres System</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-semibold">
          <Scale className="w-3.5 h-3.5" />
          <span>Contrato de Licencia de Software SaaS B2B</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Términos y Condiciones de Servicio
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Condiciones contractuales que rigen el acceso y uso de la plataforma Alquileres System para la gestión de maquinaria y ferreterías.
        </p>
        <div className="text-xs text-slate-500">Última actualización: 24 de Septiembre de 2026 | Versión 1.0.0</div>
      </div>

      {/* Contenido Legal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-8 text-sm text-slate-300">
        
        {/* Cláusula 1 */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-400" />
            <span>1. Objeto y Concesión de Licencia de Uso SaaS</span>
          </h2>
          <p className="leading-relaxed">
            Al registrarse o hacer uso de <strong>Alquileres System</strong>, el cliente adquiere una licencia de uso de software en la modalidad Software as a Service (SaaS), no exclusiva, revocable e intransferible, para la administración operativa de alquileres de maquinaria, cotizaciones, gestión de inventario, devoluciones parciales y control de caja. En ningún momento se transfiere la propiedad intelectual ni el código fuente de la plataforma.
          </p>
        </section>

        {/* Cláusula 2 */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-orange-400" />
            <span>2. Período de Prueba Gratuita y Suscripciones</span>
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-400 leading-relaxed">
            <li><strong>Prueba Gratuita (14 Días):</strong> Todo nuevo tenant dispone de catorce (14) días de acceso sin costo a todas las funcionalidades del sistema con datos demo precargados. No se requiere tarjeta de crédito para iniciar la prueba.</li>
            <li><strong>Facturación y Planes:</strong> Finalizados los 14 días de prueba, el cliente podrá optar por el plan mensual recurrente o por el plan vitalicio (Lifetime Deal) mediante pasarela de pago segura (Stripe).</li>
            <li><strong>Modo Solo Lectura por Falta de Pago:</strong> En caso de vencimiento de la suscripción sin renovación, la cuenta entrará en modo de solo lectura durante un período de gracia de cinco (5) días para consulta y exportación antes de la suspensión temporal.</li>
          </ul>
        </section>

        {/* Cláusula 3 */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-400" />
            <span>3. Nivel de Servicio (SLA) y Disponibilidad</span>
          </h2>
          <p className="leading-relaxed">
            Alquileres System compromete sus mejores esfuerzos técnicos para garantizar una disponibilidad del servicio del <strong>99.5%</strong> en base mensual, excluyendo ventanas de mantenimiento preventivo notificadas con al menos veinticuatro (24) horas de anticipación.
          </p>
        </section>

        {/* Cláusula 4 */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span>4. Limitación de Responsabilidad</span>
          </h2>
          <p className="leading-relaxed">
            La plataforma actúa como una herramienta tecnológica de soporte a la gestión empresarial. En la máxima medida permitida por la ley colombiana:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>Alquileres System <strong>NO responderá por lucro cesante, daños indirectos, pérdida de negocio o pérdidas de oportunidades comerciales</strong> derivadas del uso o imposibilidad de uso del software.</li>
            <li>La responsabilidad económica máxima acumulada de Alquileres System frente al cliente estará limitada al monto efectivamente pagado por el cliente por concepto de suscripción en los últimos tres (3) meses anteriores al hecho causante.</li>
          </ul>
        </section>

        {/* Cláusula 5 */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-orange-400" />
            <span>5. Ley Aplicable y Jurisdicción</span>
          </h2>
          <p className="leading-relaxed">
            Este contrato se rige e interpreta bajo las leyes de la <strong>República de Colombia</strong>. Cualquier diferencia o controversia que surja entre las partes se someterá en primera instancia a un arreglo directo de treinta (30) días calendario. En su defecto, las partes acuerdan acudir ante los jueces de la República de Colombia con sede en la ciudad de Bucaramanga, Santander.
          </p>
        </section>

      </main>
    </div>
  );
}
