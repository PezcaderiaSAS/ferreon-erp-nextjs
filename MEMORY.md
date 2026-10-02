# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- Plataforma: Alquileres System (Next.js en Vercel + Supabase Postgres RLS + GAS `frontend/`).
- Bug resuelto en producción: En nuevos registros de alquiler y cotización, el selector asistido de cliente ya no queda bloqueado en solo lectura.
- Pruebas automatizadas: 396/396 tests pasando (100%), 0 errores de TypeScript y compilación de producción exitosa (32/32 rutas).
- Figma: 14 de 14 vistas canónicas al 100%. Inyectadas las 33 variables oficiales (Salmon Pastel y Cyber Cyan adaptadas a Figma Free) y vinculadas 6,389 capas al Design System.

## Decisiones (y por qué)
- **Separación de `initialData` vs `modoInicial`**: `initialData` solo debe existir para registros reales persistidos (`initialData.id !== undefined`). Parámetros de modo (`COTIZACION`) se pasan vía `modoInicial` para no falsear `isEditMode`.
- **Plugin Bidireccional Local con UI**: Al incluir `ui.html` y comunicación por mensajes con `code.js`, se elimina la dependencia de Tokens Studio Pro y se permite tanto inyectar como extraer tokens W3C en 1 clic.

## Aprendizajes y errores a evitar
- Nunca pasar objetos planos como `{ tipoDocumento: 'COTIZACION' }` a través de `initialData`, ya que `Boolean(initialData)` activa modos de edición bloqueantes en formularios maestros.
- En cuentas Figma Free rige el límite estricto de 1 modo por colección (`Limited to 1 modes only`); el fallback con colecciones hermanas permite tener temas Light y Dark sin plan de pago.

## Próximos pasos
- Siguiente hito funcional: Automatización CI/CD de Paridad de Tokens o integración de pasarela de pagos / analítica de flota.
