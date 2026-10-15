# Constitución Técnica — Alquileres System (v5.0 Enterprise)

## Preámbulo
Esta Constitución establece los principios innegociables de ingeniería, diseño, seguridad y arquitectura para el proyecto **Alquileres System** (FerreOn & AppFrios Pezca). Toda decisión técnica, plan de implementación o línea de código generada por agentes o humanos debe respetar estrictamente estos mandatos.

---

## 1. Identidad y Dominio de Negocio
1. **Terminología Oficial**: El producto se denomina exclusivamente **Alquileres System**. 
2. **Entidades Clave**: Clientes, Equipos/Activos, Cotizaciones, Contratos de Alquiler, Despachos, Devoluciones (totales y parciales), Facturas/Cuentas de Cobro y Pagos.
3. **Manejo de Moneda y Formato COP**:
   - Todo monto financiero en pesos colombianos (COP) debe almacenarse como valor numérico entero o redondeado con precisión sin decimales para transacciones corrientes.
   - Formato visual obligatorio: `$ #.##0` (p. ej. `$ 1.250.000 COP`).
   - Prohibido renderizar centavos o conversiones no tipificadas para transacciones locales.

---

## 2. Arquitectura de Software y Frontend (Next.js 14 App Router)
1. **Server Components por Defecto**: Las páginas (`page.tsx`) y layouts (`layout.tsx`) son React Server Components (RSC) responsables de la autenticación de sesión y la carga inicial de datos.
2. **Client Islands Aisladas**: La directiva `'use client'` solo se utiliza en hojas terminales del árbol donde se requiera interactividad (formularios, drawers, modales, gráficos interactivos).
3. **Server Actions Delgadas e Idempotentes**:
   - Toda mutación de estado reside en Server Actions con tipado Zod estricto.
   - Manejo de sesiones mediante `@supabase/ssr` con cookies seguras.
   - Prohibido acoplar lógica transaccional masiva dentro de Server Actions; delegar operaciones financieras complejas a RPCs PostgreSQL en Supabase.
4. **Gestión de Estado**: Estado de servidor gestionado con Server Components y revalidación de rutas (`revalidatePath`). Zustand se reserva para estado UI local efímero (filtros, pasos de wizards, estados visuales de drawers).

---

## 3. Persistencia de Datos y Seguridad (Supabase PostgreSQL)
1. **Row Level Security (RLS)**: Obligatorio en el 100% de las tablas relacionales. Ninguna consulta debe omitir las políticas de aislamiento de empresa/tenant o usuario.
2. **Transaccionalidad Atómica y Concurrencia**:
   - Bloqueo a nivel de fila (`FOR UPDATE`) en stock de equipos y balances contables para evitar sobreventa (*overselling*) o duplicidad de estados.
   - Transacciones atómicas garantizadas con reversión total (`ROLLBACK`) ante excepciones.
3. **Ley Canónica de Fechas, Zona Horaria (Colombia UTC-5) y Motores PDF**:
   - **Huso Horario Inmutable:** Todo contrato, cotización, devolución, factura o comprobante opera bajo `America/Bogota` (UTC-5).
   - **Prohibición de Conversiones Implícitas UTC:** Queda terminantemente prohibido utilizar `new Date("YYYY-MM-DD").toISOString()` o `new Date("YYYY-MM-DD").toLocaleDateString()` directamente sobre cadenas puras de fecha, ya que causan saltos de día involuntarios al evaluar a medianoche UTC (19:00:00 del día anterior en Colombia).
   - **Utilidades Canónicas Obligatorias:** Todo procesamiento de fechas DEBE realizarse mediante `src/core/utils/fechas.ts`:
     - `parsearFechaLocal(fecha)`: Ancla determinísticamente la fecha a las 12:00:00 locales.
     - `formatearFechaISO(fecha)`: Genera invariablemente el formato `YYYY-MM-DD` sin desfase.
     - `formatearFechaLocal(fecha)`: Produce la representación oficial colombiana `DD/MM/YYYY`.
     - `calcularDiasEntreFechas(inicio, fin)`: Cómputo de días con guardia matemática de mínimo 1 día.
     - `resolverFechaYHoraDocumento(payload)`: Emisión legal de fecha y hora exacta en zona colombiana.
   - **Protección contra Sobreescritura en Cascada:** Al editar formularios de alquiler/cotización, cambiar las fechas maestras del encabezado jamás debe sobreescribir las fechas de los ítems individuales ya configurados.
   - **Gobernanza de Documentos PDF:** Las tablas de maquinaria en PDFs deben incluir sin excepción las 7 columnas canónicas con fechas exactas, días calculados $\ge 1$ y subtotales congruentes.

---

## 4. Disyuntor Semántico de Artefactos (Spec-Driven Development)
1. **Strict Mode (Planificación y Diseño)**:
   - Ningún agente modificará archivos de código fuente sin antes presentar y obtener aprobación humana de los artefactos correspondientes:
     - Especificación funcional en notación EARS (`specs/NNN-*/spec.md`).
     - Plan técnico de arquitectura y dependencias (`specs/NNN-*/plan.md`).
     - Lista de tareas atómicas (`specs/NNN-*/tasks.md`).
2. **Aprobación de Puerta**: Cada hito sensible requiere confirmación antes de la fase de construcción.

---

## 5. Loop Engineering con Verificación Dual en DevTools MCP
1. **Regla Innegociable y Continua**:
   - Tras CADA modificación o actualización de código, es obligatorio abrir la aplicación mediante el navegador de pruebas y validar los siguientes 4 puntos antes de marcar la tarea como completada:
     1. **0 Errores y 0 Advertencias en la Consola JavaScript**.
     2. **Evaluación de Layout en Pantalla Laptop**: Resolución estándar de 1366x768 px o 1440x900 px sin desbordamientos horizontales ni elementos truncados.
     3. **Evaluación de Layout Responsive en Móvil**: Resolución 375 px (viewport estándar smartphone) garantizando legibilidad, drawers adaptativos y botones accesibles (mínimo 44x44 px).
     4. **Prueba Interactiva Funcional**: Validación del flujo de usuario recién modificado.

---

## 6. Gobernanza de Memoria y Continuidad
1. **Memoria Viva a Corto Plazo**: [MEMORY.md](file:///c:/Users/USUARIO/Documents/Aplicaciones/FerreOn/Alquileres_erp/MEMORY.md) no debe exceder un límite estricto de **50 líneas**, registrando únicamente el estado actual, decisiones clave, aprendizajes y próximos pasos inmediatos.
2. **Banco de Memoria Canónico**: Los 5 documentos en `docs/memory-bank/` constituyen la fuente de verdad histórica y arquitectónica del proyecto.
