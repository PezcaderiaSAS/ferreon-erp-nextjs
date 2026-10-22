# Guía de Reactivación y Roadmap para el Siguiente Git Pull
**Alquileres System (FerreOn ERP & WMS)**  
*Generado: 2026-10-22 — Cierre de Sesión Sincronizada*

---

## 1. Estado Consolidado en este Cierre

- **Base de Datos (Supabase `eqruvswlpsttuyuglwts`)**:
  - Migración canónica registrada: `20261022221833_pos_core_suite_and_dbre_optimizations`.
  - 4 RPCs activas con prevención de deadlocks (`ORDER BY id ASC FOR UPDATE`):
    1. `alquiler_crear_pos_rapido_v1`
    2. `cotizacion_convertir_pos_1clic`
    3. `devolucion_pos_inspeccion_rapida_v1`
    4. `alquiler_generar_adenda_transaccional_v1`
  - Tablas operativas con RLS: `alquiler_adendas` y `catalogo_averias_equipos`.
  - Tipos TypeScript sincronizados en `src/infrastructure/persistence/supabase/database.types.ts`.
- **Frontend & Compilación Next.js**:
  - Desacoplamiento de esquemas Zod en `src/core/domain/schemas/posSchemas.ts` (resolviendo la restricción `'use server'`).
  - `npm run build`: **32/32 rutas en verde (código 0)**.
  - Vitest POS: **29/29 tests unitarios pasando al 100%**.
  - TypeScript (`npx tsc --noEmit`): **0 errores**.
- **Infraestructura Cloud**:
  - Repositorio remoto: `origin/main` actualizado con commits de optimización DBRE y desacoplamiento de esquemas.
  - Despliegue en Vercel: CI/CD reactivado automáticamente.
- **Firma Digital Corporativa**:
  - Interfaz en `/configuracion` lista con input de archivo para PNG/JPG.
  - Almacenamiento en `public.empresas.configuracion->>'firmaDigitalBase64'`.
  - Renderizado automático en `ContratoAlquilerPDF.tsx` y `pdf-factura-generator.service.ts`.

---

## 2. Protocolo de Inicio al Realizar `git pull` en la Próxima Sesión

Cuando inicies la siguiente sesión o en otra máquina de trabajo, sigue estos pasos en orden:

### Paso 1: Sincronización del Código
```bash
git pull origin main
```

### Paso 2: Verificación del Entorno Node.js & Next.js
```bash
# Verificar dependencias (si hay cambios en package.json)
npm install

# Comprobar tipado estricto
npx tsc --noEmit

# Ejecutar suite de pruebas unitarias POS
npx vitest run tests/unit/pos-core.service.test.ts
```

### Paso 3: Activación y Verificación de Harness² (Python Framework)
Harness² está configurado en `harness2/` para pruebas y orquestación de agentes con Google AI Studio / Gemini:
```powershell
# En Windows PowerShell
cd harness2
.\.venv\Scripts\Activate.ps1
pytest tests/ -v
cd ..
```
*Nota: Si se ejecutan tareas intensivas con Gemini, verificar que `.env` en `harness2/` tenga configurada la variable `GEMINI_API_KEY` o usar el PlatformLock (`k=1`) para evitar errores 429 de cuota.*

### Paso 4: Activación del Toolchain de Agencias de Agentes
El proyecto cuenta con el ecosistema multi-agente configurado y listo:
1. **GitNexus (Code Intelligence)**:
   - Si se realizaron cambios estructurales, regenerar el grafo de llamadas:
     ```bash
     node .gitnexus/run.cjs analyze
     ```
   - Usar `impact({target: "symbolName", direction: "upstream"})` antes de editar cualquier método transaccional.
2. **Ruflo Multi-Agent Mesh**:
   - Soporte para orquestación jerárquica y memoria persistente (`ruflo-orchestration`, `ruflo-memory`).
3. **ECC (Everything Claude Code) v2.0.0**:
   - 64 subagentes especializados, TDD riguroso y quality gates listos para tareas frontend, backend y base de datos.
4. **Agency Agents Suite**:
   - Agentes de arquitectura, DBRE (`agency-database-reliability-engineer`), optimización SQL (`agency-database-optimizer`), y workflows de negocio (`agency-workflow-architect`).

### Paso 5: Workflows y Comandos Slash Listos
Todos los workflows en `.agent/workflows/` y `.agents/workflows/` están plenamente operativos:
- `/sdd-flow`: Ciclo completo de especificación EARS, plan técnico y ejecución.
- `/feature`: Desarrollo de tareas con validación dual en DevTools (Laptop y Móvil).
- `/audit-project`: Inspección integral de código y sincronización de memoria.
- `/build-fix`: Diagnóstico y resolución quirúrgica de errores de build.
- `/session-sync`: Condensación y consolidación de `MEMORY.md` ($\le 50$ líneas).

---

## 3. Checklist de Tareas Pendientes para la Próxima Sesión

- [ ] **TAREA 1: Verificación Visual de la Firma Digital en Vercel**:
  - Acceder a `https://alquileres-erp-nextjs-ruby.vercel.app/configuracion`.
  - Aplicar recarga forzada (`Ctrl + F5`) para purgar la caché local del navegador.
  - Confirmar que la sección *"Firma / Rúbrica del Emisor"* esté visible debajo del Logo Corporativo.
- [ ] **TAREA 2: Prueba de Carga y Persistencia de la Rúbrica**:
  - Subir una imagen de firma (PNG con fondo transparente recomendado).
  - Hacer clic en *"Guardar Configuración"*.
  - Verificar que persista en el estado de la empresa y tras recargar la página.
- [ ] **TAREA 3: Prueba de Generación y Renderizado en PDF**:
  - Ir a `/alquileres` o crear un contrato rápido con atajo `F2`.
  - Abrir el visor de PDF (Carta y A5).
  - Validar que la rúbrica corporativa se estampe nítidamente en la sección del emisor/arrendador.
- [ ] **TAREA 4: Validación de Adendas y Averías en Vivo**:
  - Abrir un contrato activo y probar el modal de adendas versionadas (`v1.0 -> v1.1`).
  - Probar una devolución rápida con cargo por avería del catálogo sembrado.
