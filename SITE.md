# FerreOn ERP - Visión del Sitio y Roadmap

## 1. Visión del Sitio
`alquileres_app` es el módulo central del ERP de FerreOn para gestionar alquileres de equipos de construcción. Funciona como una Single Page Application (SPA) con navegación por pestañas y diseño responsivo adaptado para dispositivos móviles (Mobile-First). La estética es de alta gama usando Glassmorphism (paneles de cristal oscuro y luces neón).

## 2. Tecnologías Clave
- Next.js 14 (App Router)
- Tailwind CSS
- UI interactiva orientada a UX Premium y navegación fluida (bidireccional).

## 3. Configuración Stitch
- **Project ID**: 2532550202617516448

## 4. Sitemap (Páginas/Pestañas)
- `[x]` `dashboard` (Página de inicio, KPI, accesos rápidos)
- `[x]` `alquileres` (Listado y creación de contratos)
- `[x]` `bodega` (Inventario de equipos)
- `[x]` `devoluciones` (Recepción y reporte de daños)
- `[x]` `facturacion` (Facturas y cuentas de cobro)
- `[x]` `clientes` (Directorio y gestión de clientes)

## 5. Roadmap de Implementación (Stitch Loop)
1. **Generar Dashboard (`dashboard`):** KPI principales y navegación global.
2. **Generar Pestaña Alquileres (`alquileres`):** Lista de contratos activos y botón de nuevo alquiler.
3. **Generar Pestaña Bodega (`bodega`):** Inventario con conversión de unidades (gramos a kilos visualmente).
4. **Generar Pestaña Devoluciones (`devoluciones`):** Recepción de ítems y formulario de registro de daños.
5. **Generar Pestaña Facturación (`facturacion`):** Estados de cuenta.
6. **Generar Pestaña Clientes (`clientes`):** Listado y creación de clientes.

## 6. Creative Freedom
- Incluir animaciones de carga esqueleto (skeleton loaders) de cristal al cambiar de pestañas.
- Notificaciones Toast flotantes con estilo neón tras acciones exitosas.
