---
name: frios-pezca-doc-compliance
description: Protocolo de cumplimiento obligatorio (Grounding) y verificación documental previa a cualquier acción en AppFrios Pezca para evitar alucinaciones.
---

# Verificación Documental Obligatoria y Grounding (AppFrios Pezca)

Esta skill define el **protocolo ineludible de verificación previa** que todo agente de IA debe ejecutar **ANTES** de escribir código, modificar archivos, crear scripts de mantenimiento o proponer parches en el proyecto AppFrios Pezca.

---

## 1. Reglas de Oro Ineludibles (Anti-Alucinaciones)

1. **GROUNDING DOCUMENTAL OBLIGATORIO:**
   - Nunca asumas el comportamiento de una función, la estructura de una hoja de cálculo o una regla de negocio.
   - Debes consultar la documentación oficial almacenada en la carpeta `sources/` y el archivo `core/Schema.js` antes de cualquier edición.

2. **PROHIBIDO USAR ÍNDICES MÁGICOS:**
   - **Nunca** uses índices numéricos literales como `r[1]`, `r[5]` o `r[7]` para acceder a filas de arreglos.
   - **Siempre** importa o referencia las constantes de cabeceras (`H`), detalle (`D`), clientes (`C`), contratos (`CON`), productos (`P`), lotes (`DL`) y auditoría (`AUD`) definidas en `core/Schema.js`.
   - Ejemplo correcto: `r[H.ID_CLIENTE]`, `r[D.PESO_KG]`.

3. **VERIFICACIÓN ESTRICTA DE CONVERSIÓN DE UNIDADES (GRAMOS vs. KILOS):**
   - En la base de datos (Google Sheets / arrays), el campo `PESO_KG` se almacena internamente como gramos enteros (`PESO_KG * 1000`).
   - Al procesar o depurar números inusualmente altos (ej. `24,575,400`), ten en cuenta que representan gramos y deben convertirse a kilos dividiendo entre 1000 (`peso_kilos = peso_db / 1000`).

4. **ANÁLISIS DE IMPACTO PREVIO CON GITNEXUS:**
   - Antes de modificar cualquier función, clase o módulo, debes ejecutar `impact({target: "nombreDeFuncion", direction: "upstream"})` o revisar el grafo de dependencias de GitNexus.
   - Si la orden de blast radius retorna un riesgo ALTO o CRÍTICO, debes advertir explícitamente al usuario antes de modificar código.

---

## 2. Flujo de Trabajo Obligatorio (Checklist Pre-Ejecución)

Antes de responder o aplicar cambios:

- [ ] **Paso 1: Localizar la Documentación**
  - Buscar referencias en `sources/` o guías en `.agents/skills/`.
- [ ] **Paso 2: Validar el Esquema de Datos**
  - Revisar `core/Schema.js` para confirmar la existencia y nombres exactos de los campos.
- [ ] **Paso 3: Verificar Impacto con GitNexus**
  - Identificar llamadores, dependencias y procesos asociados a las funciones a modificar.
- [ ] **Paso 4: Ejecutar Cambios con Mapeo Nombrado y Muestreo en Seco**
  - Asegurar tipado defensivo, logging en modo en seco antes de persistir cambios.

---

## 3. Ejemplo de Aplicación Correcta vs. Incorrecta

### ❌ INCORRECTO (Alucinación de índices y unidades)

```javascript
// MAL: Usar índices mágicos y no convertir gramos a kilos
const cliente = row[3];
const kilos = row[7]; // Asume que es 7 y que viene en Kilos
```

### ✅ CORRECTO (Cumplimiento de Grounding y Schema.js)

```javascript
// BIEN: Importar constantes de Schema.js y convertir gramos a kilos
const cliente = row[H.ID_CLIENTE];
const pesoKilos = row[D.PESO_KG] / 1000;
```

---

## 4. Reglas Obligatorias de Persistencia y PDFs (FerreOn ERP)

Para evitar la regresión de errores en la generación de documentos PDF (`server_pdf.js`), todo desarrollo debe cumplir estrictamente las siguientes reglas:

### A. Mapeo Canónico Físico de la Hoja `Alquileres`

Debido a que la fila 0 (encabezados) en Google Sheets presenta desalineaciones históricas en ciertos nombres de columnas respecto a lo escrito por `server_alquileres.js`, se deben utilizar las siguientes posiciones físicas absolutas para evitar fallos de lectura:

| Campo | Índice Físico (0-based) | Descripción |
| --- | --- | --- |
| `deposito` | `14` | Valor numérico del depósito abonado |
| `observaciones_generales` | `15` | Texto plano de observaciones registradas (ej. "DON EBER LLEVA") |
| `creado_por` | `16` | Usuario o firma de creación del registro |
| `garantia` | `21` | Monto de garantía en el esquema principal |
| `Garantia_Tipo` | `27` | Tipo de garantía (Efectivo, Pagaré, Voucher, etc.) |
| `Garantia_Monto` | `28` | Monto de garantía específico |
| `Garantia_Estado` | `29` | Estado de custodia de la garantía (Activa / Liberada) |

### B. Inclusión Completa de Ítems de Detalle en PDFs

- **NUNCA** filtrar o descartar renglones de `Alquileres_Detalle` en los PDFs mediante `estado_devolucion === 'DEVUELTO'` o `costo_dano > 0`.
- El PDF de cotización, cuenta de cobro o contrato **debe listar la totalidad de los ítems contratados** en el alquiler sin importar si ya fueron devueltos.
- Utilizar coincidencia *case-insensitive* y `.trim()` para la lectura de columnas en `Alquileres_Detalle`.
- Soportar ítems de servicio virtual como `SERVICIO DE TRANSPORTE` (`item_id = -1`).

### C. Protocolo Ineludible de Despliegue a Producción (`/exec`)

- **NUNCA** asumir que `clasp push` actualiza la aplicación web en producción (`/exec`).
- **SIEMPRE** ejecutar el script de despliegue automatizado de 3 pasos:

  ```powershell
  .\deploy.ps1
  ```

- **Mecánica Obligatoria**:
  1. `clasp push --force`: Sincroniza archivos locales hacia Apps Script.
  2. `clasp version "descripción"`: Crea la versión inmutable `vN` en el servidor.
  3. `clasp deploy --deploymentId <ID> --versionNumber <N>`: Vincula el punto `/exec` activo a la versión `vN`.
