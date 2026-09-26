# Checklist de Estándares: Blindaje Legal, Licencias y Ciberseguridad

**Identificador:** `CHECKLIST-LEGAL-APPSEC-001`  
**Referencia:** `SPEC-2026-LEGAL-APPSEC-BLINDAJE-001`  
**Fecha:** 26 de Septiembre de 2026  

---

## 1. Estándares Legales y Regulatorios (David Cossio Shield & Habeas Data SIC)
- [ ] **Exención de Responsabilidad por Cálculos Algorítmicos:** La Cláusula 6 de `/terminos` delimita explícitamente que Alquileres System es una herramienta de asistencia y el usuario retiene el deber no delegable de verificación técnica de tarifas y devoluciones.
- [ ] **Tope de Responsabilidad (Liability Cap):** Acotado al valor cobrado en los últimos 3 meses de suscripción del tenant o $100 USD (el menor).
- [ ] **Separación Responsable vs. Encargado:** `/privacidad` define que el Cliente es el Responsable del tratamiento de sus clientes de obra y Alquileres System es el Encargado (Data Processor).
- [ ] **Aislamiento Multi-Tenant Documentado:** Se documenta la seguridad RLS de Supabase, cifrado TLS 1.3 y AES-256 bits.
- [ ] **Consentimiento Expreso Activo:** Checkbox desmarcado por defecto, bloqueante para el botón de registro/onboarding.
- [ ] **Modal Intersticial para Existentes:** Tenants con sesiones activas que no tengan registrada la versión `1.0.0` ven un modal bloqueante que requiere su aceptación.
- [ ] **Accountability Inmutable:** Registro en `audit_logs` con IP, User Agent, Tenant ID, User ID, timestamp UTC y versión de términos.

---

## 2. Propiedad Intelectual y Licencias (Vibe Coding Defense)
- [ ] **Script Automatizado de Auditoría:** `scripts/audit-licenses.mjs` escanea todas las dependencias en `package.json` y `node_modules`.
- [ ] **Lista Blanca Estricta:** Solo se aprueban licencias permisivas (`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`, `0BSD`, `Unlicense`, `CC0-1.0`).
- [ ] **Bloqueo Copyleft:** El script falla con código de salida `exit 1` ante cualquier indicio de `GPL`, `AGPL`, `SSPL`, `EUPL`.
- [ ] **Migración SheetJS:** Reemplazo de `xlsx: ^0.18.5` por `exceljs` (100% MIT) en `NeuExcelImportWizard.tsx`.
- [ ] **Declaración de Transparencia de IA:** Cláusula 7 en `/terminos` declarando asistencia tecnológica, mitigación de sesgos y no uso de datos para reentrenar modelos públicos.

---

## 3. Resiliencia Aplicativa y Ciberseguridad (AppSec Hardening)
- [ ] **Validación Fail-Fast de Entorno:** Esquema Zod en `src/config/env.ts` que valida en el arranque la existencia de `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` y `CRON_SECRET`.
- [ ] **Prevención de Fuga de Credenciales:** Verificación de que ninguna clave de rol administrativo posea el prefijo `NEXT_PUBLIC_`.
- [ ] **Anti-SQL Injection:** Todas las consultas transaccionales canalizadas vía Prisma parametrizado o RPCs PostgreSQL atómicas.
- [ ] **Anti-Prompt Injection:** Sanitización y encapsulamiento XML de entradas de texto libre antes de ser procesadas por LLMs o agentes.
- [ ] **Wrapper safeServerAction:** Envoltorio que atrapa excepciones, genera un Correlation ID (`ERR-XXXXX`), registra el error con stack trace únicamente en consola privada y retorna al cliente un mensaje opaco y sanitizado.
- [ ] **Zero Regressions:** 100% de suites de tests unitarios pasando tras las modificaciones.
