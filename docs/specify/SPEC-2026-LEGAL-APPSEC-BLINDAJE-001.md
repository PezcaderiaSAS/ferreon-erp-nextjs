# Especificación PRD: Marco Maestro de Blindaje Legal y Seguridad de Código para Alquileres System

**Identificador:** `SPEC-2026-LEGAL-APPSEC-BLINDAJE-001`  
**Directriz Canónica de Marca:** Alquileres System (FerreOn ERP & WMS)  
**Metodología:** Speckit Workflow (GitHub Spec-Kit) + Principios David Cossio (@davidcossios)  
**Estado:** DRAFT — EN PROCESO DE CLARIFICACIÓN (QC 1 / GRILL-ME)  
**Fecha:** 26 de Septiembre de 2026  

---

## 1. El "Qué" (Resumen de la Iniciativa)
Implementar en la plataforma de producción de **Alquileres System** el blindaje legal, regulatorio y de ciberseguridad aplicativa para neutralizar los tres vectores de riesgo críticos asociados al desarrollo acelerado con inteligencia artificial (*Vibe Coding*):
1. **Infraestructura Legal Defensiva:**
   - Actualización de Términos de Servicio (`/terminos`) con cláusulas estrictas de limitación de responsabilidad (*As Is*, *Liability Cap* de 3 meses de suscripción, exención de daños indirectos/lucro cesante por errores algorítmicos en contratos de alquiler y supervisión humana obligatoria *Human-in-the-Loop*).
   - Actualización de Política de Privacidad y Cookies (`/privacidad`) delimitando el rol de Alquileres System como Encargado (Data Processor) respecto a clientes de obra y Responsable respecto al tenant, explicando el aislamiento criptográfico multi-tenant en Supabase (RLS) y el uso exclusivo de cookies técnicas de sesión.
   - Componente UI de Consentimiento Expreso (`ConsentCheckbox.tsx`) activo, desmarcado y bloqueante en los flujos de registro/onboarding, respaldado por validación Zod dual-layer y registro inmutable en `audit_logs`.

2. **Auditoría de Propiedad Intelectual y Licencias:**
   - Script automatizado en Node.js ESM (`scripts/audit-licenses.mjs`) integrado al pipeline de CI/CD para detectar y bloquear dependencias con licencias Copyleft virulentas (GPL, AGPL, SSPL, LGPL restrictiva), permitiendo solo licencias comerciales permisivas (MIT, Apache-2.0, BSD, ISC).
   - Cláusula de Transparencia de IA y mitigación de sesgos algorítmicos en los Términos de Servicio, garantizando el no reentrenamiento con datos del cliente.
   - Plan de mitigación para la librería `xlsx` (v0.18.5).

3. **Auditoría de Seguridad y Resiliencia en Código Vivo:**
   - Verificación de variables de entorno *fail-fast* en arranque (`src/config/env.ts`) para proteger `SUPABASE_SERVICE_ROLE_KEY` y credenciales sensibles.
   - Sanitización estricta contra SQL Injection (consultas parametrizadas con Prisma y RPCs con `SELECT ... FOR UPDATE`) y Prompt Injection (encapsulamiento XML de inputs de texto libre).
   - Implementación del envoltorio universal `safeServerAction` para encapsular Server Actions con `try-catch`, logging estructurado privado con ID de correlación y respuestas completamente opacas al cliente que impidan la fuga de esquemas de tablas o rutas internas.

---

## 2. El "Por Qué" (Justificación y Valor del Negocio)
- **Mitigación de Riesgo de Ruina Legal:** En un ERP de alquiler de maquinaria pesada y equipos de construcción, una falla de cálculo en tarifas por tramos, averías o devoluciones parciales puede derivar en reclamos millonarios por sobrecostos o parálisis de obra. El blindaje contractual transfiere la responsabilidad de verificación final al operador humano y acota la indemnización legal al valor de la suscripción.
- **Cumplimiento Regulatorio y Habeas Data:** Cumplimiento con la Ley 1581 de 2012 y circulares de la SIC (Colombia), LGPD y estándares internacionales, acreditando la responsabilidad demostrada (*Accountability*) mediante logs inmutables de consentimiento.
- **Protección del Valor de la Empresa (Due Diligence / IP):** Inversionistas o adquirentes auditan licencias de software de código abierto. Un paquete GPL inadvertido puede contaminar la propiedad del software propietario.
- **Cero Fuga de Schemas e Información a Atacantes:** Las respuestas con errores crudos de PostgreSQL exponen nombres de tablas y columnas que facilitan ataques dirigidos; opacar los errores con correlation IDs protege la confidencialidad técnica del ERP.

---

## 3. Criterios de Aceptación (Definición de Terminado)
- [ ] Textos legales en `/terminos` y `/privacidad` actualizados con las cláusulas aprobadas.
- [ ] Componente `ConsentCheckbox` integrado y validado con Zod en `/onboarding` y `/auth/login`.
- [ ] Todo registro nuevo genera un evento inmutable en `audit_logs` con IP, fecha UTC y versión de términos.
- [ ] Script `audit-licenses.mjs` funcional en el directorio `scripts/` ejecutándose exitosamente con `npm run audit:licenses`.
- [ ] Validación Zod de variables de entorno activada en el arranque de Next.js.
- [ ] Envoltorio `safeServerAction` creado y aplicado en Server Actions críticas.
- [ ] 0 regresiones en las 60 suites de pruebas unitarias y de integración existentes.
