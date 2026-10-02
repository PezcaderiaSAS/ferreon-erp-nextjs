# 🎨 Alquileres System — Tokens & Variables Sync (Bidireccional)

Plugin oficial nativo para **Figma** diseñado para sincronizar de manera **bidireccional** los tokens de diseño de **Alquileres System** entre el código de producción (Next.js / Tailwind / W3C JSON) y el lienzo de Figma sin depender de servicios SaaS de pago ni extensiones de terceros.

---

## 🚀 Arquitectura y Capacidades

| Módulo / Pestaña | Flujo | Descripción Técnica |
| :--- | :---: | :--- |
| **📥 Importar** | **Código ➔ Figma** | Inyecta o actualiza la colección nativa `Alquileres System — Design Tokens` con modos duales (*Salmon Pastel* y *Cyber Cyan*), espaciados y radios. |
| **📤 Exportar** | **Figma ➔ Código** | Extrae todas las variables locales del archivo de Figma y genera un árbol JSON estandarizado bajo la especificación **W3C Design Tokens Community Group**. |
| **🎨 Vincular** | **Lienzo ➔ Variables** | Recorre los frames de las 14 pantallas y enlaza los colores fijos (`#ff7a59`, `#f8fafc`, etc.) a sus correspondientes variables semánticas. |
| **🧹 Limpieza** | **Mantenimiento** | Purga frames huérfanos (`Generated Design`), elimina pantallas duplicadas y audita la presencia de las 14 pantallas canónicas. |

---

## 🛠️ Cómo Cargar y Usar el Plugin en Figma

### En Figma Desktop o Figma Web:
1. Haz clic en el menú superior o clic derecho en el lienzo:
   `Plugins` ➔ `Administrar plugins...` (o `Development` / `Desarrollo`).
2. Haz clic en **`Importar plugin desde manifest...`** (o el botón `+`).
3. Selecciona el archivo:
   `c:\Users\Personal\Documents\FRIOSPEZCADERIA\FerreOn\ferreon-erp-nextjs\figma-tokens-sync\manifest.json`
4. Ejecuta el plugin:
   **`Alquileres System — Tokens & Variables Sync`**
5. Se abrirá la ventana interactiva del plugin con las 4 pestañas:
   * Haz clic en **⚡ Inyectar Variables Oficiales** para poblar el Design System.
   * Haz clic en **🔗 Vincular Variables** para conectar los colores de tus pantallas.
   * Haz clic en **🔍 Extraer Variables** si realizas ajustes en Figma y deseas llevarlos de regreso al código Next.js.
