# Plan de Pruebas QA — FerreOn ERP
<!-- AUTO-GENERATED: 2026-08-25 | Versión: 1.0.0 -->

> **Entorno:** Next.js 14 + Supabase + Redis (Upstash) | **Target:** Producción (Vercel) + Local (localhost:3001)

---

## 🛠️ Stack de Extensiones VS Code para Live Testing

Antes de ejecutar las pruebas, asegúrate de tener instaladas las siguientes extensiones en VS Code. Estas extensiones forman el **entorno de QA en vivo** durante el desarrollo.

| Extensión | Uso en QA | Acción Requerida |
|-----------|-----------|-----------------|
| **Live Server** | Auto-refresh del navegador al guardar cambios. | `Instalar: ritwickdey.liveserver` |
| **Live Preview** | Vista previa integrada dentro de VS Code sin salir del editor. | `Instalar: ms-vscode.live-server` |
| **ESLint** | Detecta errores de código en tiempo real mientras editas. | `Instalar: dbaeumer.vscode-eslint` |
| **Prettier** | Formatea el código automáticamente al guardar. | `Instalar: esbenp.prettier-vscode` |
| **Error Lens** | Muestra errores de TypeScript/ESLint **inline** en la línea afectada. | `Instalar: usernamehw.errorlens` |
| **GitLens** | Muestra `git blame` por línea para rastrear qué commit introdujo un bug. | `Instalar: eamodio.gitlens` |

---

## ⚙️ Configuración Previa al Inicio de Pruebas

### Paso 1 — Abrir Live Preview integrado
1. Presiona `Ctrl+Shift+P` en VS Code.
2. Escribe `Live Preview: Show Preview` y selecciónalo.
3. Apunta la URL del panel a `http://localhost:3001`.

### Paso 2 — Settings recomendados (.vscode/settings.json)
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["javascript", "typescript", "typescriptreact"]
}
```

---

## 📋 Fase 1 — Estabilidad Técnica (Hydration & SSR)
> **Herramienta:** Live Preview + Error Lens

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 1.1 | **Hydration Bodega** | Navegar `/bodega` → Recargar (`Ctrl+R`) | Mensaje "Cargando inventario..." <1s, luego tabla. Sin errores en consola. | `[ ]` |
| 1.2 | **Hydration Clientes** | Navegar `/clientes` → Recargar | Sin error "Text content did not match". | `[ ]` |
| 1.3 | **Hydration Alquileres** | Navegar `/alquileres` → Recargar | Tabla carga correctamente. Sin error React. | `[ ]` |
| 1.4 | **Error Lens limpio** | Abrir `bodega/page.tsx`, `alquileres/page.tsx`, `clientes/page.tsx` | Ninguna línea muestra subrayado rojo de Error Lens. | `[ ]` |
| 1.5 | **TypeScript OK** | Terminal: `npm run typecheck` | Sin errores de compilación. | `[ ]` |

---

## 📋 Fase 2 — Creación de Datos (CRUD)
> **Herramienta:** Live Preview (ver resultado inmediato) + GitLens

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 2.1 | **Crear Cliente** | `/clientes` → "Añadir Nuevo Cliente" → "QA Test Corp", NIT "900.123.456-7" → Guardar | Cliente aparece en tabla inmediatamente. | `[ ]` |
| 2.2 | **Persistencia Cliente** | Recargar `/clientes` (`F5`) | "QA Test Corp" sigue visible (Supabase persistió). | `[ ]` |
| 2.3 | **Crear Equipo** | `/bodega` → "Añadir Equipo" → Nombre: "Taladro QA", Stock: 5 | Equipo en tabla con estado "Disponible". | `[ ]` |
| 2.4 | **Persistencia Equipo** | Recargar `/bodega` | "Taladro QA" sigue con stock 5. | `[ ]` |
| 2.5 | **Regla: Stock Negativo** | Editar equipo → Stock disponible: -1 → Guardar | Sistema rechaza con mensaje de error claro. | `[ ]` |

---

## 📋 Fase 3 — Transacciones (Ciclo de Vida de Alquiler)
> **Herramienta:** Live Preview en dos pestañas: Alquileres + Bodega

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 3.1 | **Crear Alquiler** | `/alquileres` → "Nuevo Contrato" → "QA Test Corp" → "Taladro QA", cantidad 2 → Crear | Contrato en estado "Activo". | `[ ]` |
| 3.2 | **Descuento de Stock** | `/bodega` → Ver "Taladro QA" | En Obra: 2 / Disponible: 3. Sin negativos. | `[ ]` |
| 3.3 | **Idempotencia** | Crear el mismo contrato dos veces rápido | Solo se crea UN contrato (IdempotencyManager bloquea duplicado). | `[ ]` |
| 3.4 | **Stock Insuficiente** | Crear alquiler con "Taladro QA" cantidad 10 | Sistema rechaza: "Stock insuficiente para...". | `[ ]` |

---

## 📋 Fase 4 — Pagos, PDF y Devolución
> **Herramienta:** Live Preview + GitLens para verificar función de pago

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 4.1 | **Registrar Pago** | Contrato activo → "Registrar Pago" → Monto parcial → Confirmar | Saldo pendiente se reduce, estado del contrato actualiza. | `[ ]` |
| 4.2 | **Generar PDF** | Vista del contrato → "Generar PDF" / "Descargar" | Navegador descarga/muestra PDF con info correcta. | `[ ]` |
| 4.3 | **Registrar Devolución** | Contrato → "Registrar Devolución" → Cantidad: 2 → Confirmar | Estado pasa a "Finalizado". | `[ ]` |
| 4.4 | **Retorno de Stock** | `/bodega` → Ver "Taladro QA" | En Obra: 0 / Disponible: 5. Ciclo cerrado. | `[ ]` |

---

## 📋 Fase 5 — Validación en Producción (Vercel)
> **Herramienta:** Panel Live Preview apuntando a URL de Vercel + Extensión Vercel en VS Code

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 5.1 | **Smoke Test Producción** | En Live Preview, URL = dominio Vercel | Página carga sin pantalla blanca ni error 500. | `[ ]` |
| 5.2 | **Variables de Entorno** | Navegar a `/api/clientes` en producción | Devuelve JSON válido (no error "Missing env var"). | `[ ]` |
| 5.3 | **Redis en Producción** | Crear cliente desde producción y recargar | Cliente persiste (Supabase + Redis funcionando). | `[ ]` |
| 5.4 | **Estado del Deploy** | Terminal: `npx vercel ls` | Último deployment listado como **READY**. | `[ ]` |

---

## 🧪 Comandos de Validación (Terminal Integrada de VS Code)

```bash
# Verificar tipos TypeScript
npm run typecheck

# Ejecutar suite de pruebas unitarias
npm run test

# Verificar cobertura (objetivo: >80%)
npm run test:coverage

# Lint completo
npm run lint

# Ver estado del último despliegue en Vercel
npx vercel ls
```

---

## 🏁 Criterio de Aceptación Final

Para certificar la versión como **Estable y Lista para Producción**:

- [ ] Fase 1 — 5/5 casos en verde ✅
- [ ] Fase 2 — 5/5 casos en verde ✅
- [ ] Fase 3 — 4/4 casos en verde ✅
- [ ] Fase 4 — 4/4 casos en verde ✅
- [ ] Fase 5 — 4/4 casos en verde ✅
- [ ] `npm run typecheck` → sin errores
- [ ] `npm run test:coverage` → cobertura ≥ 80%
- [ ] `npm run lint` → sin errores críticos
- [ ] Vercel deployment en estado **READY**

<!-- /AUTO-GENERATED -->
