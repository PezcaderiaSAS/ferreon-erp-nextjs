# Informe Técnico Detallado: Arquitectura y Frontend de Ferreon ERP Next.js

Este documento proporciona un desglose a bajo nivel, preciso y exhaustivo sobre el funcionamiento de los módulos, botones, lógica de estado y arquitectura frontend del proyecto **Ferreon ERP** desarrollado en Next.js.

---

## 1. Arquitectura Frontend y Sistema de Diseño (UI/UX)

El proyecto utiliza un enfoque moderno basado en **Glassmorphism** y layouts tipo **Bento Grid**, soportado por **Tailwind CSS**. La configuración se encuentra centralizada en `tailwind.config.ts` y `src/app/globals.css`.

### 1.1. Gestión de Temas (Theming)
El sistema soporta múltiples temas dinámicos mediante atributos de datos (`[data-theme]`) aplicados en la raíz del DOM, modificando variables CSS estructurales:
- **Tech Dark (Default):** Tonos oscuros (`#0E0E0E`, `#171717`) con acentos en verde esmeralda (`green-400` a `green-600`).
- **Digital Earth:** Tonos tierra y cobrizos (`#231C18`, `#31231E`), orientados a una paleta más cálida y rústica.
- **Emerald & Gold:** Tonos verde oscuro (`#061810`) combinados con dorados (`#D4AF37`), transmitiendo una sensación premium.

### 1.2. Clases Utilitarias Globales (Glassmorphism)
En `globals.css` se definen clases maestras para mantener la consistencia visual sin repetir código Tailwind complejo:
- `.bento-grid`: Sistema de grilla responsiva (`grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr))`) para tarjetas de dashboard.
- `.glass-panel`: Paneles translúcidos con desenfoque de fondo (`backdrop-filter: blur(16px)`), bordes sutiles y sombra predefinida (`var(--tw-shadow-glass)`).
- `.glass-button-primary`: Botones principales con gradiente diagonal, sombras pronunciadas (`0 8px 25px`) y efectos de traslación en el hover (`translateY(-2px)`).
- `.glass-header`: Cabeceras translúcidas para navegación o modales.

### 1.3. Componentes Compartidos (UI)
Dentro de `src/components/ui/` se aíslan los componentes más reutilizados:
- `Button.tsx`: Wrapper sobre `.glass-button-primary` y otras variantes de botones estandarizados.
- `BentoCard.tsx`: Tarjeta base para los módulos del dashboard, implementando `.glass-panel`.
- `ThemeSelector.tsx`: Componente que inyecta el `data-theme` en el `<body>` usando el hook `useTheme.ts`.

---

## 2. Enrutador Interno y Gestión de Estado Principal

A diferencia de un enrutamiento tradicional con múltiples páginas físicas en Next.js, el proyecto utiliza un modelo de **Single Page Application (SPA) Monolítica** dentro de `src/app/page.tsx` (App Router).

### 2.1. Lógica de Navegación (`activeTab`)
Todo el flujo de módulos está controlado por un estado principal en `page.tsx`:
```tsx
const [activeTab, setActiveTab] = useState<TabType>("alquileres");
const [previousTab, setPreviousTab] = useState<TabType | null>(null);
```
**Botones de Navegación (Sidebar / Menú):**
- Cada botón en el menú lateral dispara la función `setActiveTab(target)`.
- Se almacena el tab anterior en `previousTab` para permitir retroceder (Botón "Atrás" o "Volver").

### 2.2. Renderizado Condicional por Módulos
La vista principal renderiza bloques grandes de JSX dependiendo del valor de `activeTab` (e.g. `{activeTab === "alquileres" && (...) }`).

---

## 3. Desglose de Módulos y Lógica de Botones

A continuación, se detalla el funcionamiento interno, estados asociados y acciones de los botones principales para cada módulo del sistema.

### 3.1. Módulo de Bodega e Inventario (`activeTab === "bodega"`)
Gestiona el catálogo maestro (`categoriasMaster`) y el stock de equipos (`equipos`).

**Estados Principales:**
- `bodegaSearchQuery`, `bodegaCategoriaFilter`, `bodegaSubcategoriaFilter`, `bodegaDisponibilidadFilter`: Controlan los inputs de búsqueda y selects de filtrado.
- `showEquipoModal`, `equipoEnEdicion`: Controlan la visibilidad y contexto del modal de creación/edición.

**Botones e Interacciones:**
- **Botón "Nuevo Equipo":** 
  - *Acción:* `setShowEquipoModal(true)`. Limpia los estados de los formularios para preparar una inserción limpia.
- **Botón "Carga Masiva":** 
  - *Acción:* `setShowCargaMasivaModal(true)`. Abre un modal complejo que alterna entre vista de TABLA y texto libre para importar inventario.
- **Botones "Editar" (en tabla de bodega):** 
  - *Acción:* `setEquipoEnEdicion(equipo)`. Pre-llena los estados del formulario con la data del equipo seleccionado y ejecuta `setShowEquipoModal(true)`.
- **Botones de Creación Rápida de Categorías ("+"):**
  - *Acción:* Abren `showNuevaCategoriaModal` o `showNuevaSubcategoriaModal`, permitiendo inyectar nuevas ramas al árbol `categoriasMaster` sin salir del flujo de creación de equipo.

### 3.2. Módulo de Alquileres (`activeTab === "alquileres"`)
Gestiona el ciclo de vida de los contratos (Cotización -> Activo -> Finalizado).

**Estados Principales:**
- `contratos`: Arreglo principal de tipo `ContratoAlquiler[]`.
- Depende de `equipos` y `clientes` para poblar selects y calcular disponibilidades.

**Botones e Interacciones:**
- **Botón "Nuevo Contrato / Cotización":** 
  - *Lógica:* Renderiza un formulario maestro donde se seleccionan equipos dinámicamente. Verifica si `cantidad <= stockDisponible` antes de agregarlo.
- **Botón "Aprobar Cotización" / "Pasar a Activo":**
  - *Mutación:* Modifica el `estado` del contrato en `contratos` de `"COTIZACION"` a `"ACTIVO"`. Descuenta automáticamente del `stockDisponible` de los equipos.
- **Botón "Registrar Devolución" (Contextual):**
  - *Acción:* Cambia el foco a los modales específicos de devoluciones pasando el ID del alquiler.

### 3.3. Módulo de Devoluciones (`activeTab === "devoluciones"`)
Abstraído en componentes especializados en `src/app/components/devoluciones/`.

**Componentes:**
- `<HistorialDevolucionesModal />`: Tabla de registro histórico de devoluciones.
- `<RegistrarDevolucionModal />`: Modal interactivo para procesar retornos.

**Botones e Interacciones:**
- **Botón "Aplicar Devolución" (Submit Modal):**
  - *Lógica:* Evalúa el estado físico de la herramienta (Buen Estado vs Dañado).
  - *Mutación:* Si hay daños, suma al `costoDano` del contrato. Modifica el ítem a `devuelto: true` y reintegra la `cantidadDevuelta` al `stockDisponible`.

### 3.4. Módulo de Cartera y Facturación (`activeTab === "cartera" | "facturacion"`)
Encargado de los pagos, cruce de depósitos y emisión de PDFs en `src/app/components/cartera/`.

**Botones e Interacciones:**
- **Botón "Registrar Pago":**
  - *Lógica:* Recibe el monto, evalúa el saldo pendiente y muta el `totalPagado` del contrato, alterando el estado de la factura a `"PAGADA"` si el saldo es cero.
- **Botón "Imprimir/Descargar Factura":**
  - *Lógica:* Dispara la clase `EnterprisePDFService.generar(...)`. Inyecta `empresaConfig` (Logo, Términos) y usa `formatearMonedaCOP`.

### 3.5. Módulo de Clientes y Terceros (`activeTab === "clientes"`)
Gestiona la lista de clientes. Renderiza tarjetas individuales por cliente (`glass-panel`).

**Botones e Interacciones:**
- **Botón "Generar Alquiler" (En cada tarjeta):**
  - *Lógica:* Renderiza un botón `<button onClick={() => handleOpenNuevoAlquiler(undefined, cliente.id)}>`
  - *Acción:* Pasa directamente al formulario de "Nuevo Contrato" en el módulo de alquileres y pre-selecciona el ID del cliente de forma automática.

### 3.6. Módulo de Configuración de la Empresa (`activeTab === "configuracion"`)
Gestiona las variables globales que nutren los PDFs y la interfaz (`empresaConfig`).

**Estados Principales:**
- `empresaConfig`: Objeto maestro con (razonSocial, nit, direccion, cuentaBancariaInfo, notasFacturaPDF).
- `logoPreview`: Estado temporal Base64 para la previsualización de la imagen cargada.

**Botones e Interacciones:**
- **Input File "Cargar Imagen de Logo":**
  - *Acción:* `onChange={handleLogoUpload}`. Convierte la imagen a Base64 y la deposita en `empresaConfig.logoBase64`.
- **Botón "Eliminar Logo":**
  - *Acción:* Resetea a string vacío tanto `logoPreview` como `empresaConfig.logoBase64`.
- **Botón "Guardar Configuración de Empresa":**
  - *Acción:* Valida y persiste los cambios de configuración.

### 3.7. Módulo de Auditoría y Trazabilidad (`activeTab === "auditoria"`)
Visor de "Audit Trail Forense" de todos los movimientos de estado protegidos.

**Estados Principales:**
- `auditLogs`: Arreglo principal que guarda cada transacción (`AuditLogEntity`).
- Depende de `currentUser` y la matriz `ROLE_INFO` para verificar permisos.

**Botones e Interacciones:**
- **Botón "Exportar JSON":**
  - *Lógica:* Codifica dinámicamente el arreglo `auditLogs` a formato Base64/URI.
  - *Acción:* `<a download="audit_log_{fecha}.json" href="...">`. Descarga el archivo sin hacer llamadas de backend.
- **Tarjetas KPI de Auditoría:** Paneles de métricas calculados "al vuelo" a partir de `auditLogs` (ej. `new Set(auditLogs.map((l) => l.userId)).size`).

---

## 4. Conclusión y Resumen del Flujo de Datos

El ERP Ferreon está diseñado como una **SPA altamente centralizada y reactiva**. 

1. **El Estado es el Rey:** No hay recargas de página completas. Todo funciona mediante la actualización reactiva de arrays de estado gigantes en `page.tsx` (`equipos`, `contratos`, `clientes`, `auditLogs`).
2. **Modales Periféricos:** Las tareas complejas (Pagos y Devoluciones) se han factorizado a componentes hijos que reciben las funciones mutadoras (props) desde el padre `page.tsx`.
3. **Seguridad Integrada:** Cada botón de mutación está validado contra las reglas de `hasPermission(role, permission)` definidas en el sistema RBAC interno.
4. **Excelencia Visual:** Los botones (`glass-button-primary`) y contenedores (`glass-panel`) no solo cumplen funciones lógicas, sino que proporcionan feedback visual inmediato (animaciones de traslación, sombras reactivas), alineándose a las expectativas de un dashboard moderno y premium.
