---
name: frios-pezca-emergency
description: Reglas de oro para crear y ejecutar scripts de mantenimiento y manipulación de datos masivos
---

# Scripts de Emergencia y Mantenimiento (Frios Pezca)

Al redactar *scripts de mantenimiento, queries o parches rápidos*, debes seguir ineludiblemente estas reglas de oro, aprendidas de errores graves en producción:

## 1. Índices Nombrados (Reiteración Estricta)
- Es imperativo el uso de `core/Schema.js`.
- El cruce de información requiere usar los índices correctos para la cabecera (`H`) y el detalle (`D`).

## 2. Precisión Numérica
- Recuerda que la DB guarda gramos. No asumas kilos directamente. Un valor enorme no es un error si representa los gramos. `peso_kilos = peso_db / 1000`.

## 3. Verificación de Cruce `MOV_HEADER` vs `MOV_DETAIL`
- No asumas nombres de campos al cruzar `MOV_HEADER` y `MOV_DETAIL`.
- Los IDs de clientes (`CLI002`), fechas (`yyyy-MM-dd`), y tipos de movimiento (`ENTRADA`/`SALIDA`) deben ser estrictamente validados ANTES de realizar operaciones matemáticas en bucles.
- Un solo error de mapeo al cruzar un arreglo en memoria colapsará la facturación.
- Verifica exhaustivamente usando logs (`console.log`) en ejecuciones en seco antes de persistir los datos con `setValues()`.
