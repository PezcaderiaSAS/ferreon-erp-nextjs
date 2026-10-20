# SPEC-010: Core Operativo de Alquileres de Inicio a Fin (Modo POS Ultra-Rápido)

## 1. Declaración del Problema & Propósito Empresarial
En operaciones de alquiler de equipos y maquinaria para construcción y ferretería, la velocidad de despacho y recepción en mostrador/bodega es un factor crítico de negocio. El flujo actual, aunque robusto, requiere múltiples pasos en wizard que ralentizan la atención en horas pico. 

El propósito de esta especificación empresarial es implementar una experiencia **Mostrador POS Ultra-Rápido (< 30 segundos por operación)** que unifique el ciclo de vida completo:
1. Registro instantáneo de nuevos alquileres (con soporte para escáner de códigos de barras/QR, atajos de teclado y autocompletado inteligente).
2. Flujo comercial de cotizaciones con conversión transaccional 1-clic a contrato con cobro de depósito en caja.
3. Edición fluida in-place de contratos activos con gestión de adendas versionadas (v1.0 -> v1.1).
4. Devoluciones de equipos con checklist visual de inspección (Bueno / Sucio / Dañado / Pérdida), costeo paramétrico de averías y liquidación inmediata contra depósito.

---

## 2. Requisitos del Sistema en Notación EARS

### 2.1 Requisitos Ubicuos (Ubiquitous Requirements)
- **EARS-U01 (Aislamiento Multi-Tenant Estricto)**: El sistema DEBERÁ forzar en cada transacción de lectura, escritura, adenda o devolución el identificador `empresa_id` del tenant activo sin excepción.
- **EARS-U02 (Defensa de Caja y Saldo)**: El sistema DEBERÁ registrar de forma atómica cualquier ingreso de depósito o cobro/reembolso de averías en la sesión de caja activa de la empresa.
- **EARS-U03 (Tiempos de Respuesta Mostrador)**: El sistema DEBERÁ procesar cualquier acción operativa de mostrador en un tiempo de renderizado inferior a 200 ms y con soporte para navegación 100% por teclado (`Tab`, `Enter`, `F2-F9`).

### 2.2 Requisitos Basados en Eventos (Event-Driven Requirements)
- **EARS-E01 (Búsqueda por Código de Barras / QR)**: CUANDO el operador escanee un código de barras o código QR de un equipo en la barra de búsqueda rápida, el sistema DEBERÁ agregarlo inmediatamente al carrito de alquiler con cantidad 1 o incrementar la existente si ya estaba en lista.
- **EARS-E02 (Conversión de Cotización 1-Clic)**: CUANDO el usuario presione el botón de formalización rápida en una cotización, el sistema DEBERÁ verificar disponibilidad física en tiempo real, solicitar el método de pago del depósito en un modal compacto y emitir contrato activo + comprobante de caja en menos de 1 segundo.
- **EARS-E03 (Inspección en Devolución)**: CUANDO se devuelva un equipo y se marque en estado "Dañado" o "Sucio", el sistema DEBERÁ sugerir el costo de reparación/limpieza según el catálogo predeterminado y descontarlo del depósito en garantía o liquidarlo como saldo a cobrar.
- **EARS-E04 (Adenda por Modificación)**: CUANDO se edite un contrato activo agregando ítems o prorrogando fechas, el sistema DEBERÁ generar una adenda numerada (ej. `AD-01`), actualizar el inventario y recalcular el saldo pendiente sin interrumpir la vigencia del contrato.

### 2.3 Requisitos de Estado (State-Driven Requirements)
- **EARS-S01 (Contrato en Estado ACTIVO)**: MIENTRAS un contrato de alquiler se encuentre en estado `ACTIVO`, el inventario físico de sus equipos permanecerá descontado del stock disponible y reflejado como `en_obra`.
- **EARS-S02 (Contrato con Devolución Parcial)**: MIENTRAS un contrato cuente con ítems pendientes de entrega, su estado cambiará a `PARCIALMENTE_DEVUELTO` y el saldo liquidado se congelará hasta la devolución final.

### 2.4 Requisitos Opcionales (Feature-Driven Requirements)
- **EARS-O01 (Atajos de Teclado POS)**: DONDE la pantalla de mostrador esté activa, el sistema DEBERÁ permitir pulsar `F2` para buscar cliente, `F4` para buscar equipos, `F8` para aplicar descuentos y `F9` para finalizar y cobrar.

---

## 3. Criterios de Aceptación y Calidad (Quality Gates)
1. **Velocidad de Creación**: Flujo de creación de contrato completable en menos de 30 segundos por un operador entrenado.
2. **0 Errores en Consola**: Validación obligatoria con Chrome DevTools MCP en resolución de laptop (1366x768) y móvil (375 px).
3. **Cobertura de Pruebas**: Mínimo 85% de cobertura en tests unitarios e integrados con Vitest para los servicios de POS, Adendas y Liquidación.
4. **Auditoría Inmutable**: Todo cambio de tarifas, fletes o daño de equipos debe generar un registro de auditoría (`AuditLogger.logAsync`).
