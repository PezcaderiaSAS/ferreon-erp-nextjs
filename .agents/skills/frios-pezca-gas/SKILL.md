---
name: frios-pezca-gas
description: Patrones y estándares para el desarrollo en Google Apps Script para AppFrios Pezca
---

# Google Apps Script Patterns (Frios Pezca)

## Caché Atómica
Siempre que obtengas o guardes datos en la caché, debes usar las funciones utilitarias del sistema que controlan el versionado:
- `getFromCache(key)`
- `saveToCache(key, data, seconds)`
- `invalidarCacheGlobal()` (cuando haya una actualización crítica que deba invalidar todas las cachés)

## Retorno de Vistas (SPA)
El proyecto utiliza un enfoque Single Page Application (SPA).
Para servir vistas:
1. El punto de entrada es siempre `doGet()`, el cual carga `views/Index`.
2. Las vistas parciales se inyectan dinámicamente usando la función `include(filename)` o `getHtmlContent(filename)`.
3. Evita reescribir la lógica de carga HTML. Usa `HtmlService.createHtmlOutputFromFile` de manera consistente como lo hace el `Controller.js`.

## Buenas Prácticas Generales
- Nunca quemar IDs de documentos. Usa `PropertiesService.getScriptProperties()`.
- Validar siempre los retornos de servicios externos o de bases de datos antes de enviarlos a las plantillas.
