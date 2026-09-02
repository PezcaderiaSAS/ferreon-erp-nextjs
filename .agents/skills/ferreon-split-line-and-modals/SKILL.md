---
name: ferreon-split-line-and-modals
description: Reglas de implementación para devoluciones parciales y creación On-The-Fly con modales.
---

# FerreOn Split Line and Nested Modals Patterns

**Extracted:** 2026-08-26
**Context:** Aplicable para nuevos desarrollos en módulos de FerreOn ERP que manejen fraccionamiento de facturación y formularios extensos que requieran la creación de registros dependientes en línea sin perder el estado.

## Problem 1: Facturación Inversa por Devoluciones Parciales
Al devolver solo una fracción del inventario alquilado (ej. 2 de 5 andamios), sobrescribir las fechas arruina los cálculos de los andamios restantes.

## Solution 1: Split Line Financiero
1. Si `cantidad a devolver < cantidad total`, se **clona** el registro actual.
2. Al registro clonado se le asigna la `cantidad devuelta`, la `fecha real de devolución` y se marca como `devuelto`.
3. Al registro original se le **resta** la cantidad devuelta para que su tiempo de uso siga corriendo de manera inmutable.
4. El consolidador maestro (ej. `liquidarDevolucion`) debe iterar tanto los ítems originales como los clonados para facturar los totales de manera unificada y precisa.

## Problem 2: Fricción UX y Pérdida de Datos en Formularios Maestros
El usuario pierde los datos digitados o interrumpe su flujo en formularios maestros extensos (como Contratos de Alquiler) si debe navegar a otra vista para crear un registro faltante (como un nuevo Cliente).

## Solution 2: Modales Anidados On-The-Fly (Latencia Cero)
1. Reutilizar componentes de formulario existentes (ej. `ClienteForm`) incrustándolos dentro de un componente wrapper `<Modal>` en el mismo nivel raíz.
2. Interceptar la propiedad `onSuccess: (entidad) => void` del sub-formulario.
3. Actualizar el estado local del formulario maestro auto-rellenando el selector principal extrayendo el ID de la entidad generada, sin recargar la página.

## When to Use
Activa este Skill cuando se solicite implementar lógicas de "devoluciones parciales" en nuevos módulos de inventario, o cuando se requiera insertar "Creación rápida" o "+ Nuevo" dentro de un formulario complejo existente en React/Next.js.
