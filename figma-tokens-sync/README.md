# 🎨 Alquileres System — Guía de Sincronización con Figma

Esta guía describe cómo vincular de manera canónica los tokens de diseño y componentes de **Alquileres System** con tu espacio de trabajo en Figma.

---

## Opción 1: Plugin Automatizado Local (Recomendado — 1 Clic)

Hemos creado un plugin nativo de Figma dentro de esta carpeta (`figma-tokens-sync/`) que genera automáticamente las colecciones de Variables, modos duales (*Salmón Pastel* y *Cyber Cyan*), espaciados, radios de esquina y estilos tipográficos en tu archivo de diseño:

1. Abre la aplicación de **Figma Desktop** y entra a tu archivo de diseño (o crea un archivo nuevo).
2. Haz clic derecho en el lienzo o ve al menú superior:
   `Plugins` ➔ `Development` ➔ `Import plugin from manifest...`
3. Selecciona el archivo:
   `c:\Users\Personal\Documents\FRIOSPEZCADERIA\FerreOn\ferreon-erp-nextjs\figma-tokens-sync\manifest.json`
4. Ejecuta el plugin:
   `Plugins` ➔ `Development` ➔ `Alquileres System — Tokens & Variables Sync`
5. **¡Listo!** Verás la notificación en Figma:
   > *✅ ¡Tokens y Variables de Alquileres System importados con éxito!*
   En el panel derecho de Figma verás la colección **`Alquileres System — Design Tokens`** con los modos conmutables `Salmon Pastel (Light)` y `Cyber Cyan (Dark / Industrial)`.

---

## Opción 2: Sincronización Continua con Tokens Studio (GitHub Sync)

Si utilizas el plugin oficial **Tokens Studio for Figma**:

1. En Figma, abre el plugin **Tokens Studio**.
2. Ve a la pestaña **Settings** ➔ **Sync Providers** ➔ **Add New** ➔ Selecciona **GitHub**.
3. Ingresa los siguientes datos de tu repositorio:
   * **Repository**: `PezcaderiaSAS/ferreon-erp-nextjs`
   * **Default Branch**: `main`
   * **File Path**: `figma_design_tokens.json`
   * **Personal Access Token**: Tu token de GitHub con permisos de lectura (`repo:read`).
4. Haz clic en **Save** y luego en **Pull**.
5. Todos los tokens y temas se actualizarán automáticamente cada vez que se haga commit en la rama `main`.

---

## Opción 3: Auditoría Directa vía Figma URL / REST API

Si ya dispones de un archivo oficial en Figma y deseas que lo auditemos directamente:
1. Copia la URL de tu archivo en Figma (ejemplo: `https://www.figma.com/design/AbCdEf12345/Alquileres-System-UI`).
2. Proporciónanos el enlace aquí en el chat para extraer sus nodos y contrastarlo matemáticamente contra el código.
