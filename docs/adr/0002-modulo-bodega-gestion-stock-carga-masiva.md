# ADR-0002: Gestión Integral de Bodega: Creación Individual, Carga Masiva, Ajuste de Stock y Ficha Técnica

**Date**: 2026-08-19  
**Status**: accepted  
**Deciders**: Equipo de Desarrollo Frontend & Backend FerreOn  

## Context

El catálogo de Bodega e Inventario requería una evolución funcional para permitir operaciones completas de gestión de activos:
1. Creación individual de equipos con tarifas, pesos y stock inicial.
2. Carga masiva en lote para importar catálogos extensos desde archivos Excel o texto plano delimitado (CSV/TSV).
3. Modificación de especificaciones y ajuste seguro de stock físico sin violar los contratos activos en obra.
4. Visualización detallada de la ficha técnica con barras de disponibilidad en tiempo real.

## Decision

Implementar la suite de gestión de Bodega en `src/app/page.tsx` articulada con los Casos de Uso del dominio (`CrearEquipoUseCase`, `CargaMasivaEquiposUseCase`, `EditarEquipoUseCase`):
- **Creación Individual**: Modal reactivo con validación de código único en mayúsculas, tarifa diaria en COP, peso en kilogramos (convertido internamente a `peso_gramos BIGINT`) y stock inicial.
- **Carga Masiva Bimodal**:
  - *Modo 1 (Tabla Dinámica)*: Interfaz visual de filas editables con validación de unicidad en lote.
  - *Modo 2 (Pegar CSV/Excel)*: Parser automático de líneas delimitadas con vista previa instantánea y botón de datos de prueba.
- **Ajuste de Stock Inteligente**:
  - Al editar un equipo existente, el sistema valida que el nuevo stock total no sea inferior a las unidades actualmente en obra (`nuevoTotal >= stockEnObra`), recalculando automáticamente el stock disponible (`nuevoDisponible = nuevoTotal - stockEnObra`).
- **Ficha Técnica & Búsqueda Avanzada**:
  - Filtros instantáneos por término de búsqueda, categoría dinámica y disponibilidad (Todos / Disponibles / Agotados).
  - Modal de Ficha Técnica con barras de progreso de ocupación y acceso directo a alquiler.

## Consequences

### Positive
- Alta velocidad en la digitalización de inventarios extensos mediante carga masiva.
- Protección transaccional del stock en obra: es matemáticamente imposible dejar en negativo el stock disponible o perder trazabilidad de equipos despachados.
- UI Glassmorphism fluida con KPIs en vivo (Total Referencias, Stock Físico, Disponible, En Obra).

### Negative / Trade-offs
- La carga masiva se procesa del lado del cliente antes de persistir, por lo que lotes extremadamente grandes (> 5.000 filas) deberán segmentarse o procesarse vía stream en el backend.
