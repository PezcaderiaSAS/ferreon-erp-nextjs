---
description: Auditar y optimizar código frontend/web contra estándares de Addy Osmani (Web Vitals, UX engineering, Clean Code).
argument-hint: "[ruta/al/componente_o_modulo]"
---

# Agent Skills — Auditoría de Calidad y Rendimiento (Addy Osmani)

Este flujo de trabajo evalúa y refactoriza componentes web contra los estándares de rendimiento, UX engineering y clean code de Addy Osmani.

## Cuándo Usar

- Al finalizar o refactorizar un componente visual o página en Next.js / React.
- Cuando se detecte lentitud en la interacción (INP) o cambios bruscos de diseño (CLS).
- Para auditar la mantenibilidad y modularidad de funciones de interfaz.

## Proceso de Ejecución

1. **Inspeccionar Código:** Cargar el archivo o módulo objetivo.
2. **Consultar Skill:** Aplicar las reglas de `.agents/skills/agent-skills/SKILL.md`.
3. **Evaluar 3 Ejes:**
   - **Rendimiento Web:** LCP (<2.5s), INP (<200ms), CLS (<0.1).
   - **Ergonomía UX:** Feedback inmediato (<100ms), micro-animaciones GPU, estados vacíos y de carga defensivos.
   - **Clean Code:** Funciones de responsabilidad única (<50 líneas), inmutabilidad estricta.
4. **Emitir Diagnóstico y Parches:** Presentar el reporte de calidad y aplicar mejoras quirúrgicas.
