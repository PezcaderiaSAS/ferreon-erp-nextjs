# Product Context — Alquileres System (FerreOn ERP & WMS)

## 1. Visión General del Producto
**Alquileres System** es una plataforma SaaS integral de nivel empresarial diseñada específicamente para la gestión de contratos de alquiler de maquinaria, andamios, herramientas y equipos de construcción, combinando capacidades avanzadas de ERP (Facturación, Caja, Clientes, Cuentas por Cobrar/Pagar) y WMS (Gestión de Almacenes, Bodega, Trazabilidad por Series, Kardex e Inventario en Obra).

> [!IMPORTANT]
> **DIRECTRIZ SUPREMA DE MARCA**: El nombre oficial, canónico e institucional de la plataforma es **"Alquileres System"**. Toda interfaz, metadato de SEO, documento legal, factura y comunicación con el usuario debe preservar estrictamente esta denominación.

---

## 2. Problemas Centrales que Resuelve
1. **Pérdida y Descontrol de Equipos en Obra:**
   Elimina la incertidumbre sobre qué cliente tiene qué equipo, cuántos días lleva en obra y si existen daños físicos o pérdidas en la devolución mediante liquidación atómica.
2. **Discrepancias Financieras y de Facturación:**
   Automatiza el cálculo preciso de tarifas diarias, fletes de entrega/recogida, depósitos en garantía e impuestos configurables por país (IVA, IGV, etc.), generando documentos PDF institucionales y facturación electrónica.
3. **Bloqueos Operativos en Bodega por Picos de Demanda:**
   Evita la sobreventa o reservas duplicadas en almacén mediante transacciones pesimistas (`SELECT ... FOR UPDATE`) en el motor de base de datos.
4. **Fuga de Liquidez en Caja Chica y Flujo de Fondos:**
   Integra arqueos de caja en tiempo real, trazabilidad de abonos parciales y liquidación de pagos mixtos (efectivo, transferencias, retenciones).

---

## 3. Glosario Canónico de Entidades y Términos

| Término | Definición en Alquileres System |
| :--- | :--- |
| **Contrato de Alquiler** | Documento transaccional vinculante que formaliza la entrega de equipos a un cliente por un periodo determinado con tarifas diarias pactadas. |
| **Cotización** | Documento comercial previo al contrato con cálculo de costos estimados; puede convertirse a contrato en 1 clic. |
| **Equipo / Ítem WMS** | Maquinaria, herramienta o andamio identificado por SKU o número de serie, con estado físico (`Disponible`, `En Obra`, `Mantenimiento`, `Baja`). |
| **Stock Disponible** | Cantidad de unidades de un equipo físicamente presentes en bodega listas para despacho inmediato. |
| **Stock en Obra** | Cantidad de unidades actualmente en posesión activa de clientes bajo contratos vigentes. |
| **Liquidación de Devolución** | Proceso de recepción en bodega donde se inspecciona el estado de los ítems (buenos, dañados, extraviados), calculando cobros adicionales o devolución de garantías. |
| **Arqueo de Caja** | Cierre de turno donde se concilia el saldo físico esperado contra los movimientos registrados en el sistema. |
| **Tenant / Empresa** | Organización cliente en el modelo multi-tenant con aislamiento de datos estricto (`empresa_id`). |
