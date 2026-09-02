---
name: gas-data-engineering-architecture
description: Directrices de Ingeniería y Arquitectura de Datos enfocadas en Google Apps Script (GAS) para manejar datos transaccionales, de manera escalable y segura.
---

# Ingeniería y Arquitectura de Datos en Google Apps Script (GAS)

Esta skill proporciona las bases arquitectónicas para el diseño y manipulación de datos masivos usando Google Sheets como base de datos dentro del entorno de Apps Script.

## 1. Operaciones I/O Optimizadas (Batch Processing)
Google Apps Script tiene un cuello de botella severo en llamadas I/O hacia Google Sheets.
- **NUNCA iterar sobre celdas:** Prohibido el uso de `sheet.getRange(r, c).getValue()` o `setValue()` dentro de un bucle `for` o `while`.
- **Lectura en Memoria:** Siempre extrae los datos completos a un array 2D en memoria: `const data = sheet.getDataRange().getValues();`.
- **Escritura en Bloque:** Modifica el array en memoria y escribe todo de una sola vez: `sheet.getRange(row, col, rows, cols).setValues(dataArray);`.
- **Borrado en Bloque:** Usa `sheet.getRangeList()` para aplicar estilos o borrar información en celdas no contiguas.

## 2. Concurrencia y Transacciones (ACID)
Dado que múltiples usuarios pueden interactuar con el WMS simultáneamente:
- **LockService Obligatorio:** En operaciones de inserción o actualización (e.g., registrar inventario, debitar contratos), siempre envuelve la lógica en un `LockService.getScriptLock()`.
- **Manejo de Bloqueos:** Intenta adquirir el candado con `lock.tryLock(10000)` (10 segundos). Si falla, lanza un error amigable indicando que el sistema está procesando otra transacción.
- **Liberación Segura:** Siempre libera el candado dentro de un bloque `finally { lock.releaseLock(); }`.

## 3. Caché Arquitectónica
- **Reducción de Latencia:** Aplica una estrategia de lectura en caché (Read-Through Cache) usando `CacheService.getScriptCache()` para dashboards, KPIs, o configuraciones estáticas.
- **Serialización Segura:** Los datos deben ser transformados a `JSON.stringify` antes de guardarse, ya que la caché de GAS solo soporta Strings y tiene un límite de 100KB por entrada.
- **Invalidación (Cache Invalidation):** Cuando una transacción muta la base de datos (e.g., registro de un movimiento), invalida o actualiza proactivamente la caché relacionada (e.g., `CacheService.getScriptCache().remove('DASH_DATA_' + idCliente)`).

## 4. Normalización de Esquemas (Zero Magic Indices)
- Todo esquema de datos en hojas de cálculo debe estar representado por constantes en el código.
- Obligatorio utilizar objetos de mapeo como `H.ID_CLIENTE` o `D.PESO_KG` (definidos en `core/Schema.js`). Nunca utilices `row[4]`.

## 5. Prevención de Errores de Precisión (Floating Point)
- Los valores monetarios o pesos críticos (como kilos y gramos) se deben almacenar como **enteros** en la unidad más pequeña.
- Ejemplo: Los kilos se guardan como gramos (`24500` en lugar de `24.5`). Las divisiones se hacen únicamente a nivel de Vista (UI), no en el almacenamiento.

## 6. Integridad Referencial
- Puesto que Google Sheets no tiene constraints de Foreign Keys nativas, la validación debe realizarse en la capa del Controlador (Backend GAS).
- Antes de insertar un detalle de movimiento, debes validar la existencia del `ID_PRODUCTO` o `ID_LOTE` en memoria (usando diccionarios/maps `new Map()` o Set para velocidad O(1)).

## 7. Escalabilidad Futura
- Si una tabla supera los ~100,000 registros y degrada el rendimiento de `getValues()`, evalúa el particionamiento de datos (Partitioning) en múltiples pestañas por año (e.g., `MOV_DETAIL_2026`) o migrar las consultas pesadas a Google BigQuery a través del servicio integrado.
