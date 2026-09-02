---
description: Validar con rigor científico algoritmos matemáticos, cálculos financieros, conversiones de unidades y precisión de coma flotante.
argument-hint: "[archivo_o_funcion_de_calculo]"
---

# Scientific Skills — Validación Matemática y Rigor Científico

Este flujo de trabajo audita y valida formalmente algoritmos de cálculo, funciones de facturación, lógica de pesaje y conversiones de unidades para garantizar determinismo y exactitud numérica.

## Cuándo Usar

- **Obligatorio:** Al escribir o modificar funciones de cálculo financiero, liquidación de frío o pesaje en AppFrios Pezca y FerreOn.
- Para verificar errores de redondeo por representación de punto flotante en JavaScript/TypeScript.
- Al diseñar tests de propiedades (*Property-Based Testing*) para lógica crítica de negocio.

## Proceso de Ejecución

1. **Analizar la Función:** Examinar variables numéricas, rangos y operaciones aritméticas.
2. **Consultar Skill:** Aplicar las reglas de `.agents/skills/scientific-agent-skills/SKILL.md`.
3. **Verificar Invariantes:**
   - Confirmar manejo seguro de enteros (ej. `PESO_KG * 1000` en gramos enteros).
   - Auditar consistencia entre cabeceras y detalles (`MOV_HEADER` vs `MOV_DETAIL`).
   - Validar casos extremos (0, valores negativos, números gigantescos, decimales periódicos).
4. **Emitir Certificación de Exactitud:** Entregar reporte de pruebas y correcciones numéricas.
