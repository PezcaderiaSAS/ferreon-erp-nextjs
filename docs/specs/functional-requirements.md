# Especificación de Requerimientos Funcionales y No Funcionales (FerreOn ERP)

## 1. Requerimientos Funcionales (User Stories)

### 1.1 Gestión de Alquileres de Equipos
- **RF-01 (Creación de Alquiler):** El usuario `OPERADOR` debe poder registrar un nuevo contrato de alquiler seleccionando un cliente existente, agregando uno o varios equipos del catálogo con su cantidad, tarifa diaria y fechas de contrato.
- **RF-02 (Gestión de Depósitos y Garantías):** El sistema debe permitir ingresar el monto del depósito recibido y los datos de garantía (`Garantia_Tipo`, `Garantia_Monto`, `Garantia_Estado`).
- **RF-03 (Devolución de Equipos):** Al registrar la devolución parcial o total de los equipos, el sistema debe recalcular los días efectivos de alquiler, registrar costos por daños (`costo_dano`) y restituir el stock disponible del item en el catálogo.

### 1.2 Facturación y Cuentas de Cobro
- **RF-04 (Emisión de Cuenta de Cobro):** El sistema debe generar una cuenta de cobro/factura vinculada al alquiler con un número consecutivo unívoco (`numero_cc`).
- **RF-05 (Registro de Pagos):** El usuario debe poder abonar a la factura de un alquiler actualizando el `saldo_pendiente`.
- **RF-06 (Generación de PDF):** El sistema debe permitir descargar la cuenta de cobro/factura/contrato en formato PDF. **Regla de Negocio:** El PDF debe incluir el 100% de los ítems contratados sin omitir los ítems devueltos.

---

## 2. Requerimientos No Funcionales

- **RNF-01 (Costo $0 USD):** La infraestructura debe operar completamente dentro de los Tiers Gratuitos de Vercel (Serverless Hobby) y Supabase (Free Tier: 500MB PostgreSQL, 1GB Storage, 50k MAU Auth).
- **RNF-02 (Concurrencia sin Bloqueos):** El sistema debe soportar solicitudes concurrentes simultáneas sin fallos HTTP 500 por colisión de bloqueos.
- **RNF-03 (Seguridad RLS & JWT):** Toda la comunicación API debe ser SSL/TLS HTTPS con tokens Bearer JWT y protección de datos a nivel de fila (RLS).
- **RNF-04 (Cobertura de Testing):** Mínimo 80% de cobertura en pruebas unitarias para la lógica financiera y de dominio.
