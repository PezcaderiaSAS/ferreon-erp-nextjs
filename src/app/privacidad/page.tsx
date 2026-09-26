'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Layers, Lock, FileText, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';

export default function PrivacidadPage() {
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

      {/* Hero del Documento */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Cumplimiento Legal y Habeas Data Vigente</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Política de Tratamiento y Privacidad de Datos Personales
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Conforme a la Ley Estatutaria 1581 de 2012 de Colombia, la Circular Externa 002 de 2024 de la SIC y los estándares de protección de datos en Latinoamérica (LGPD, LFPDPPP, Ley 29733 y Ley 21.719).
        </p>
        <div className="text-xs text-slate-500">Última actualización: 24 de Septiembre de 2026 | Versión 1.0.0</div>
      </div>

      {/* Contenido Legal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-10">
        
        {/* Banner Destacado: Política Cero IA Externa */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Declaración de Determinismo y No Transferencia a Modelos de IA</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            <strong>Alquileres System opera como un software relacional determinístico.</strong> Ningún dato comercial, financiero, de inventario ni de clientes personales registrado en esta plataforma es compartido, transferido o utilizado para entrenar modelos de Inteligencia Artificial (LLMs) públicos ni privados de terceros (tales como OpenAI, Google, Anthropic o Meta). Tu información operativa se almacena bajo cifrado de grado bancario y aislamiento lógico por tenant.
          </p>
        </div>

        {/* Sección 1: Identificación del Responsable */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-orange-400" />
            <span>1. Identificación del Responsable y del Encargado</span>
          </h2>
          <div className="text-sm text-slate-300 space-y-2 leading-relaxed">
            <p>
              La plataforma <strong>Alquileres System</strong> es desarrollada y operada por <strong>PEZCADERIA S.A.S.</strong>, sociedad comercial constituida bajo las leyes de la República de Colombia.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>Razón Social:</strong> PEZCADERIA S.A.S. (Operador SaaS Alquileres System)</li>
              <li><strong>Domicilio Principal:</strong> Bucaramanga, Santander, Colombia</li>
              <li><strong>Canal Oficial de Habeas Data:</strong> privacidad@alquileres-system.com / pezcaderia.2022@gmail.com</li>
              <li><strong>Rol respecto a usuarios del ERP:</strong> Responsable del Tratamiento</li>
              <li><strong>Rol respecto a clientes de las ferreterías:</strong> Encargado del Tratamiento (Data Processor)</li>
            </ul>
          </div>
        </section>

        {/* Sección 2: Datos Recolectados y Finalidades */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-orange-400" />
            <span>2. Datos Personales Objeto de Tratamiento y Finalidades</span>
          </h2>
          <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
            <p>
              Tratamos los datos estrictamente necesarios para la prestación del servicio SaaS de gestión de alquileres y maquinaria:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="font-semibold text-white text-xs uppercase tracking-wider text-orange-400">Datos de la Empresa / Usuario</div>
                <p className="text-xs text-slate-400">Nombre o razón social, NIT/Cédula, correo electrónico, teléfono, ciudad y rol operativo para gestionar acceso, facturación de suscripción y soporte técnico.</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="font-semibold text-white text-xs uppercase tracking-wider text-orange-400">Datos Transaccionales del Negocio</div>
                <p className="text-xs text-slate-400">Clientes finales de contratos, órdenes de alquiler, inspecciones de averías, arqueos de caja y comprobantes para la emisión de contratos en PDF y control de flota.</p>
              </div>
            </div>
            <p className="pt-2 text-xs text-slate-400">
              <strong>Finalidades Legítimas:</strong> (i) Ejecutar la relación contractual del servicio de software; (ii) Emitir comprobantes y gestionar suscripciones con pasarelas certificadas (Stripe); (iii) Garantizar la seguridad, prevención de fraudes y auditoría inmutable de la plataforma; (iv) Proveer soporte técnico y notificaciones operativas.
            </p>
          </div>
        </section>

        {/* Sección 3: Derechos de los Titulares (ARCO) */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-orange-400" />
            <span>3. Derechos de los Titulares (Habeas Data) y Procedimiento</span>
          </h2>
          <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
            <p>
              Todo titular de datos personales tiene derecho a conocer, actualizar, rectificar y solicitar la supresión de sus datos, así como a revocar la autorización otorgada (Derechos de Acceso, Rectificación, Cancelación y Oposición - ARCO).
            </p>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs text-slate-400">
              <div><strong>Plazos de Respuesta Legal en Colombia (Ley 1581):</strong></div>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Consultas:</strong> Serán atendidas en un término máximo de diez (10) días hábiles.</li>
                <li><strong>Reclamos y Supresión:</strong> Serán tramitados en un término máximo de quince (15) días hábiles.</li>
              </ul>
              <div className="pt-1">Para ejercer tus derechos, envía una comunicación formal a: <code className="text-orange-400">privacidad@alquileres-system.com</code> con el asunto &quot;Ejercicio Derecho Habeas Data&quot;.</div>
            </div>
          </div>
        </section>

        {/* Sección 4: Medidas de Seguridad y Aislamiento Multi-Tenant */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-orange-400" />
            <span>4. Seguridad Técnica, Aislamiento Lógico (RLS) y Cookies Técnicas</span>
          </h2>
          <div className="text-sm text-slate-300 space-y-4 leading-relaxed">
            <p>
              Implementamos el principio de <strong>Seguridad por Diseño y por Defecto</strong> exigido por la Superintendencia de Industria y Comercio (SIC) y estándares internacionales:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong>Row Level Security (RLS) en Supabase:</strong> Cada consulta SQL exige la validación del identificador único de la empresa (<code>empresa_id</code>) incrustado en el token criptográfico JWT. El motor PostgreSQL bloquea a nivel de kernel cualquier intento de lectura o mutación cruzada entre empresas.</li>
              <li><strong>Cifrado Integral:</strong> Toda la transmisión de datos ocurre bajo TLS 1.3 con certificados HSTS forzados, y los datos en reposo se encriptan con el estándar AES-256 bits.</li>
              <li><strong>Auditoría Inmutable (Accountability):</strong> Toda acción sensible y otorgamiento de consentimiento contractual queda grabado de forma inmutable en <code>audit_logs</code> con sello de tiempo UTC y dirección IP.</li>
            </ul>

            <div className="pt-2 border-t border-slate-800/80">
              <h3 className="font-semibold text-white text-base mb-2">Política de Cookies Estrictamente Necesarias</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Alquileres System aplica el principio de minimización de datos. La plataforma <strong>únicamente utiliza cookies técnicas y de sesión esenciales</strong> provistas por el motor de autenticación (Supabase Auth: <code>sb-access-token</code>, <code>sb-refresh-token</code>) con flags <code>HttpOnly</code>, <code>Secure</code> y <code>SameSite=Lax</code> para autenticar turnos de trabajo y prevenir ataques CSRF. <strong>NO</strong> utilizamos cookies de seguimiento publicitario, píxeles de redes sociales ni rastreadores conductuales de terceros en el entorno del ERP.
              </p>
            </div>
          </div>
        </section>

        {/* Sección 5: Contacto */}
        <section className="text-center space-y-3 pt-4 border-t border-slate-900">
          <div className="flex items-center justify-center gap-2 text-orange-400 font-semibold text-sm">
            <Mail className="w-4 h-4" />
            <span>Oficial de Privacidad y Cumplimiento Normativo</span>
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Si tienes dudas sobre esta política o requieres firmar un Acuerdo de Transmisión de Datos (DPA) bilateral para tu empresa, contáctanos en <span className="text-slate-300">privacidad@alquileres-system.com</span>.
          </p>
        </section>

      </main>
    </div>
  );
}
