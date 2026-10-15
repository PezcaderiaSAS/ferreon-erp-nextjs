---
name: systematic-debugging
description: Depuración científica y estructurada: reproducir el fallo con pruebas mínimas, aislar la causa raíz, formular hipótesis falsables y verificar antes de parchear.
---

# Skill: Depuración Sistemática (Systematic Debugging)

Esta habilidad prohíbe parches a ciegas y exige un enfoque científico estructurado para resolver incidencias en Alquileres System.

## Protocolo de 4 Fases

### Fase 1: Reproducción Determinista
- Identificar los pasos exactos y datos de entrada que producen el error.
- Escribir un test automatizado (unitario en Vitest o prueba mínima reproducible) que falle en rojo (`Red`).
- Prohibido modificar código de producción antes de tener una prueba reproducible.

### Fase 2: Aislamiento de Causa Raíz
- Trazar el flujo de datos desde la entrada (UI / Server Action) hasta el sumidero (Base de datos / RPC / Renderizado).
- Diferenciar síntomas superficiales de la causa raíz (ej. no añadir `null-checks` defensivos cuando la causa real es una consulta SQL con selectores desactualizados).

### Fase 3: Formulación de Hipótesis Falsable
- Formular una hipótesis clara: *"El error ocurre porque la función X asume que el campo Y siempre existe, pero en contratos v2 ese campo fue migrado a Z"*.
- Validar la hipótesis con logs específicos o breakpoints controlados.

### Fase 4: Corrección Quirúrgica y Verificación
- Aplicar la corrección mínima y robusta en el punto de origen.
- Verificar que el test pase en verde (`Green`).
- Comprobar que no existan efectos colaterales ejecutando la suite completa de pruebas.
- Validar con `chrome-devtools MCP` que la consola de JavaScript permanezca limpia con 0 errores y 0 advertencias.
