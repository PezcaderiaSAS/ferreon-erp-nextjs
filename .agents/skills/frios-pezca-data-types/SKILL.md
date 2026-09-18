---
name: frios-pezca-data-types
description: Reglas estrictas para esquemas, pesos enteros y prevencion de coma flotante en FerreOn ERP
---

# REGLAS DE ORO INMUTABLES - FINANZAS Y PESOS
1. **PROHIBIDO EL PUNTO FLOTANTE EN DINERO:** Todos los valores monetarios deben calcularse con NUMERIC(12, 2) o centavos enteros en PostgreSQL. Nunca usar FLOAT o REAL.
2. **ALMACENAMIENTO DE PESOS EN GRAMOS ENTEROS:** Todo peso se almacena como peso_gramos BIGINT (peso_kg * 1000). En la UI se formatea visualmente como 0.000 Kg.
3. **PROHIBIDO INDICES MAGICOS:** Nunca asumir indices de columnas (r[1], r[5]). Usar esquemas tipados o constantes de cabecera (H.ID_CLIENTE, D.PESO_KG).
4. **CORTE HORARIO INMUTABLE:** Hora de corte de alquileres y devoluciones fijada estrictamente a las 5:00 PM (America/Bogota).
