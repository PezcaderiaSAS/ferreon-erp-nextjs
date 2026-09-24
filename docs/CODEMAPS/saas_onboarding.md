# Arquitectura SaaS: PLG Onboarding & Dummy Data Seeding

## 1. Visión General (Product-Led Growth)
Para acelerar el **Time-to-Value (TTV)**, FerreOn ERP emplea una estrategia de "Data Seeding" (Sembrado de Datos) durante el onboarding de nuevos Tenants. 
En lugar de presentar un dashboard vacío que genera fricción, el sistema aprovisiona automáticamente una "empresa de prueba" completamente funcional con datos ficticios para que el usuario experimente el valor del software inmediatamente ("Aha! moment").

## 2. Flujo de Estados del Tenant

1. **Registro Inicial:** 
   - El usuario completa el Sign Up. 
   - El Trigger de PostgreSQL crea el Tenant con `autorizado = false` y `subscription_status = 'trialing'`.
   - Se inyectan automáticamente datos dummy transaccionales (Equipos, Clientes, Caja, Compras, Subcontrataciones).

2. **Período de Prueba (14 Días):**
   - El usuario puede operar el sistema 100% sin restricciones de escritura.
   - **Restricción Visual:** Se muestra un Banner global indicando "Modo Prueba - Esperando Activación Oficial".
   - **Restricción Documental:** Los PDFs generados (Contratos, Facturas, Cotizaciones) incluyen una marca de agua ("DOCUMENTO DE PRUEBA - NO VÁLIDO").

3. **Autorización y Pase a Producción (UltraAdmin Gatekeeper):**
   - El UltraAdmin valida los datos de la empresa (NIT, Teléfono, Ciudad).
   - El UltraAdmin cambia `autorizado = true`.
   - El usuario tiene la opción de ejecutar una función "Limpiar Datos de Prueba" (Hard-delete de toda la data sembrada usando metadatos `is_dummy = true` o simplemente borrado en cascada manteniendo los catálogos base).

## 3. Topología del Seeding (Base de Datos Dummy)

El Trigger de Supabase `handle_new_tenant_registration` ejecuta una función secuencial de sembrado (`seed_dummy_tenant_data`) que inserta los siguientes flujos para demostrar capacidad operativa:

*   **Flujo de Bodega y WMS:** 5 Equipos base (Andamios, Taladros, etc.) con sus stocks iniciales.
*   **Flujo Comercial:** 2 Clientes B2B y B2C ficticios.
*   **Flujo Operativo (Alquileres):** 1 Contrato de Alquiler activo con equipos despachados y liquidaciones generadas.
*   **Flujo Financiero (Caja):** 1 Caja de operaciones abierta con saldo inicial y 2 movimientos de ingresos/egresos.
*   **Flujo de Proveeduría (Compras):** 1 Proveedor ficticio y 1 Orden de Compra ingresada al inventario.
*   **Flujo de Subcontratación:** 1 Equipo subcontratado asignado a un contrato vigente.

## 4. Implementación Técnica (PL/pgSQL)
El sembrado se realiza de forma atómica en el mismo hilo transaccional del Trigger de creación del usuario. Si alguna inserción del dummy data falla, todo el registro del Tenant hace Rollback para asegurar consistencia estricta, evitando bases de datos parcialmente sembradas.
