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

        {/* Cláusula 6 */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>6. Herramienta de Asistencia, Deslinde por Cálculos y Supervisión Humana (Human-in-the-Loop)</span>
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed text-xs sm:text-sm">
            <p>
              <strong>6.1. Naturaleza Asistencial:</strong> El Cliente reconoce y acepta de manera informada y expresa que <strong>Alquileres System</strong> opera exclusivamente como una plataforma de software de asistencia tecnológica para el cálculo, cotización, emisión de contratos y liquidación de maquinaria, andamios y equipos de construcción.
            </p>
            <p>
              <strong>6.2. Deber de Verificación Humana (Human-in-the-Loop):</strong> El software no sustituye el criterio técnico, contable ni operativo del Cliente. Es deber ineludible y exclusivo del personal del Cliente verificar y convalidar:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>Las tarifas diarias pactadas, recargos por mora y fletes de entrega/recogida.</li>
              <li>Las fechas efectivas de despacho y devolución de maquinaria en obra.</li>
              <li>Los cobros adicionales resultantes de liquidaciones por averías físicas, roturas o piezas faltantes.</li>
              <li>La exactitud matemática y tributaria de los contratos PDF antes de su firma y entrega al arrendatario.</li>
            </ul>
            <p>
              <strong>6.3. Exclusión Absoluta por Daños Consecuenciales y Lucro Cesante:</strong> En ningún caso Alquileres System responderá por parálisis de obra, penalidades contractuales con contratistas, discrepancias aritméticas de coma flotante o pérdidas financieras derivadas del uso o imposibilidad de uso del software. La plataforma se suministra <em>&quot;TAL CUAL&quot;</em> y <em>&quot;SEGÚN DISPONIBILIDAD&quot;</em>.
            </p>
            <p>
              <strong>6.4. Límite Indemnizatorio Máximo:</strong> Cualquier eventual responsabilidad económica acumulada quedará contractualmente topada al valor neto pagado por el Cliente en los últimos tres (3) meses de suscripción efectiva, o la suma de USD $100 (la que sea menor).
            </p>
          </div>
        </section>

        {/* Cláusula 7 */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>7. Transparencia en Inteligencia Artificial y Protección contra Sesgos Tecnológicos</span>
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed text-xs sm:text-sm">
            <p>
              <strong>7.1. Declaración de Automatización y Modelos de Lenguaje:</strong> Alquileres System puede incorporar algoritmos heurísticos y modelos de procesamiento de lenguaje natural (IA) para optimizar la categorización de inventario, asistencia en soporte y sugerencias de contratos.
            </p>
            <p>
              <strong>7.2. Ausencia de Decisiones Automatizadas Vinculantes:</strong> Ninguna sugerencia generada por componentes de inteligencia artificial tiene carácter vinculante sin la revisión y ratificación explícita de un operador humano. La empresa queda indemne ante demandas derivadas de sesgos tecnológicos imprevistos en modelos fundacionales.
            </p>
            <p>
              <strong>7.3. Confinamiento de Datos (Cero Reentrenamiento):</strong> Alquileres System certifica que los datos operativos, financieros y de clientes de cada tenant se mantienen bajo estricto aislamiento lógico (RLS) y <strong>NUNCA</strong> son utilizados para entrenar modelos de IA públicos ni compartidos con terceros sin consentimiento.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
