---
name: frios-pezca-data-types
description: Reglas estrictas para manejar los esquemas, conversiones de gramos a kilos y fechas
---

# Tipos de Datos y Esquemas (Frios Pezca)

## 1. PROHIBIDO USAR ÍNDICES MÁGICOS
Nunca asumas los índices de las columnas (`r[1]`, `r[5]`). **Siempre** debes referenciar el archivo `core/Schema.js` e importar o copiar las constantes correspondientes.
Ejemplo correcto:
- Usa `r[H.ID_CLIENTE]` en vez de `r[3]`
- Usa `r[D.PESO_KG]` en vez de `r[7]`

## 2. CONVERSIÓN DE CANTIDADES (Gramos vs Kilos)
El campo `PESO_KG` en la base de datos se almacena internamente como **gramos enteros** (`PESO_KG * 1000`) para evitar errores de precisión de coma flotante.
- Si ves un valor como `24,575,400`, significa `24.575` Kilos.
- Al leer desde la DB y mostrar en UI: Divide entre `1000`.
- Al escribir en DB desde la UI: Multiplica por `1000` y asegúrate de redondear a entero (`Math.round()`).

## 3. Integridad de Fechas
Todas las fechas generadas por App Script o leídas desde la hoja de cálculo deben ser validadas.
- Revisa siempre que los rangos de fechas (ej. mayo a julio) tengan registros correctos en caso de procesamientos históricos.
- Los formatos de fecha deben coincidir para operaciones de agregación. Usa `UtilsText` o las librerías integradas si aplican.
