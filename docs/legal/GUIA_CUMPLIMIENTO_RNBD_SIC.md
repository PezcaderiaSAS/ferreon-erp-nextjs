# GUÍA MAESTRA DE CUMPLIMIENTO LEGAL Y PREVENCIÓN DE SANCIONES (SIC & LATAM)
**Alquileres System — Software as a Service**

**Objetivo:** Proteger a la empresa operadora de Alquileres System y a sus clientes ferreteros de investigaciones, medidas cautelares y sanciones económicas de hasta **2.000 SMMLV** impuestas por la Superintendencia de Industria y Comercio (SIC) en Colombia o agencias homólogas en LATAM (INAI/SABG en México, APDP en Perú, ANPD en Brasil, Agencia en Chile).

---

## 1. MARCO SANCIONATORIO Y RIESGOS ECONÓMICOS (VIGENCIA 2026)

### Sanciones Aplicables por la SIC (Art. 22 Ley 1581 de 2012):
1. **Multas de hasta 2.000 SMMLV:** Las multas en Colombia se calculan en Salarios Mínimos Mensuales Legales Vigentes (SMMLV) al momento de la tasación.
2. **Suspensión de actividades:** Hasta por seis (6) meses para realizar adecuaciones técnicas obligatorias.
3. **Cierre temporal o definitivo:** Clausura de las operaciones de tratamiento de datos personales en caso de reincidencia o vulneración de datos sensibles.

### Obligación de Registro en el RNBD (Registro Nacional de Bases de Datos):
- **Tope de Activos (2026):** Están obligadas a registrar sus bases de datos ante la SIC todas las sociedades y entidades cuyos activos totales superen las **100.000 UVT** ($5.237.400.000 COP para el año fiscal 2026).
- **Para empresas por debajo del tope:** Aunque no tengan el deber de registrarse en el RNBD, **SÍ están 100% obligadas** a cumplir la Ley 1581 (obtener autorización previa, contar con política publicada y atender reclamos en plazos perentorios).

---

## 2. PILARES DE CUMPLIMIENTO EN ALQUILERES SYSTEM

### Pilar 1: Cero Filtración a Modelos de IA Generativa
- **Riesgo Legal Evitado:** La Circular Externa 002 de 2024 de la SIC prohíbe el uso de datos personales en sistemas de IA sin autorización expresa y transparente que informe la finalidad algorítmica específica.
- **Medida Aplicada en Alquileres System:** La plataforma se declara **100% Determinística**. Los algoritmos de cotización, arqueo de caja y kardex corren en código local sobre Postgres; ningún prompt ni dato de cliente se envía a modelos de lenguaje externos.

### Pilar 2: Principio de Responsabilidad Demostrada (Accountability)
- La SIC exige poder demostrar mediante evidencia documental y técnica que el titular aceptó el tratamiento de sus datos.
- **Implementación Técnica en el ERP:**
  - Checkbox obligatorio con enlace a Términos y Privacidad en el registro y en el onboarding.
  - Registro inmutable en la tabla `public.audit_logs`:
    - `evento`: `'CONSENTIMIENTO_TERMINOS_Y_DATOS'`
    - `usuario_id`, `empresa_id`
    - `detalles`: `{ "version_terminos": "1.0.0", "version_privacidad": "1.0.0", "ip": "...", "timestamp": "...", "user_agent": "..." }`

### Pilar 3: Separación de Roles (Responsable vs. Encargado)
- **Ferretería / Tenant:** Es el **Responsable del Tratamiento** frente a sus clientes de alquiler de maquinaria. Debe contar con la autorización de sus clientes (por ejemplo, en el formato de contrato impreso o digital de entrega de equipo).
- **Alquileres System:** Es el **Encargado del Tratamiento**. Opera la infraestructura en la nube y garantiza aislamiento lógico por tenant.

### Pilar 4: Tiempos Perentorios de Respuesta (Habeas Data)
- **Consultas:** Plazo máximo legal de **10 días hábiles** (prorrogable por 5 días hábiles previa notificación justificada).
- **Reclamos / Supresiones / Rectificaciones:** Plazo máximo legal de **15 días hábiles** (prorrogable por 8 días hábiles).
- La plataforma provee opciones de edición inmediata y soft-delete de clientes para que los tenants respondan dentro del término legal.

---

## 3. CHECKLIST OPERATIVO PARA AUDITORÍA DE LA SIC

| Requisito Legal | Estado en Alquileres System | Evidencia / Mecanismo |
| :--- | :--- | :--- |
| **Política de Tratamiento publicada** | ✅ CUMPLIDO | Visible públicamente en `/privacidad` con canal de contacto claro. |
| **Términos de Servicio SaaS publicados** | ✅ CUMPLIDO | Visible públicamente en `/terminos` con SLA y limitación de responsabilidad. |
| **Página de Compromiso de Seguridad** | ✅ CUMPLIDO | Visible públicamente en `/seguridad` con certificación de determinismo y RLS. |
| **Autorización previa y explícita** | ✅ CUMPLIDO | Checkbox bloqueante en `/auth/login` y `/onboarding`. |
| **Canal de atención para Habeas Data** | ✅ CUMPLIDO | Correo habilitado: `privacidad@alquileres-system.com` / `contacto@pezcaderia.com`. |
| **Acuerdo de Encargado (DPA)** | ✅ CUMPLIDO | Documento vinculante `DPA_Acuerdo_Tratamiento.md` incorporado por referencia. |
| **Cifrado de datos y aislamiento** | ✅ CUMPLIDO | Row Level Security (RLS) en Postgres + TLS 1.3 en transporte. |
