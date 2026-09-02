---
name: frios-pezca-api
description: Convenciones para endpoints de controladores y lectura optimizada de datos
---

# APIs y Controladores (Frios Pezca)

## Convención de Nomenclatura
Los métodos que fungen como endpoints expuestos al frontend a través de `google.script.run` deben estar prefijados con:
- `apiGet...` (para consultas, reportes, listados)
- `apiPost...` (para inserciones, actualizaciones)

## Lectura en Bloque (I/O Optimizado)
- Para consultas pesadas en las tablas, **NUNCA** leas celda por celda.
- Usa `sheet.getDataRange().getValues()` para cargar toda la información en memoria.
- Recorre y manipula los datos utilizando los índices nombrados definidos en `core/Schema.js`.

## Caché Obligatoria
Cualquier endpoint de tipo consulta (`apiGetDashboardData` por ejemplo) debe consultar la caché antes de hacer llamadas I/O.
- Siempre usa un prefijo de llave unívoco, por ejemplo: `DASH_DATA_` + `idCliente`.
- Maneja un periodo de caducidad razonable (usualmente `21600` segundos por defecto).
