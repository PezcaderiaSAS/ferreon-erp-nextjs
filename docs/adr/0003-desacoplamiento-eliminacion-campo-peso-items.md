# 3. Desacoplamiento y Eliminación del Campo Peso para Equipos e Ítems en el ERP

Date: 2026-08-19

## Status

accepted

## Context

En las especificaciones iniciales del sistema se incluyeron campos de peso físico (`peso_gramos BIGINT`, `pesoKilos`, `pesoTotalKilos`) en la base de datos, entidades de dominio, formularios de bodega, contratos y generadores de documentos PDF.

Sin embargo, para el modelo operativo actual de FerreOn y el alcance del negocio de alquiler de maquinaria, el peso físico de cada equipo es irrelevante tanto para la gestión de inventario como para la cotización, liquidación y facturación comercial. Mantener el campo obligatorio imponía fricción innecesaria al usuario al crear o importar equipos masivamente (requería ingresar datos no utilizados).

## Decision

1. **Eliminación en la Interfaz de Usuario (UI/UX)**:
   - Eliminado el input de "Peso Físico (Kg)" del modal de creación y edición de equipos. El layout se simplificó a un grid de 2 columnas (`Tarifa Diaria` y `Stock Total`).
   - Removida la columna de peso en la tabla asistida y en el formato de importación CSV/Excel de la carga masiva (`CODIGO, NOMBRE, CATEGORIA, TARIFA_DIARIA, STOCK`).
   - Eliminadas las tarjetas y textos de peso en el catálogo de bodega, ficha técnica y selector de contratos de alquiler.
   - Eliminada la columna de peso de los documentos PDF de cotización, contrato y cuentas de cobro.

2. **Desacoplamiento y Retrocompatibilidad en Dominio y API**:
   - `EquipoEntity` admite el parámetro `pesoGramos` como opcional (por defecto `PesoGramos.fromKilos(0)`), garantizando compatibilidad con esquemas de persistencia previos sin romper invariantes.
   - DTOs de casos de uso (`CrearEquipoDTO`, `CargaMasivaEquipoDTO`, `EditarEquipoDTO`) y esquemas Zod de las API Routes hacen que `pesoKilos` sea opcional.

## Consequences

### Positive
- Reducción drástica del tiempo y fricción requeridos para registrar maquinaria individual o masivamente.
- Formularios y vistas de inventario más limpios, enfocados exclusivamente en datos comerciales y de stock (`código`, `nombre`, `categoría`, `tarifa`, `stockTotal`, `disponible`, `enObra`).
- Menor probabilidad de errores de validación durante importaciones por lotes.
- Cero advertencias y 100% de tests unitarios y build de producción en verde.

### Negative / Trade-offs
- Si en el futuro se requiere calcular logística de carga o transporte basado en peso acumulado de maquinaria, el campo deberá reactivarse en los DTOs y formularios.
