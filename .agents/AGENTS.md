# Reglas del Proyecto FerreOn & AppFrios Pezca

- **Idioma Principal**: Toda la comunicación, documentación generada, planes, explicaciones y código/comentarios deben estar optimizados para el idioma **Español**.
- **Toolchain de Desarrollo Aumentado**: Este proyecto utiliza la integración de **Ruflo**, **GitNexus**, **ECC (Everything Claude Code)**, **Spec-Kit**, **System Design Ground Truth**, **Herramientas de Agentes** y **Ecosistema UI/UX**.
- **Verificación Previa**: Consultar siempre el grafo de dependencias con GitNexus (`impact`/`query`) antes de editar archivos.
- **Desarrollo por Especificación**: Guiar tareas complejas mediante el ciclo Speckit (`specify`, `clarify`, `checklist`, `plan`, `tasks`, `analyze`, `implement`).
- **Gobernanza Arquitectónica y Numérica**: Utilizar `/archify` para diagramación C4 antes de cambios de estructura y `/scientific-skills` para validar exactitud de cálculo y conversiones de unidades.
- **Gobernanza Visual UI/UX**: Prohibido usar estilos ad-hoc o colores hardcodeados; es obligatorio utilizar los tokens de `DESIGN.md`, el skill `ui-ux-ecosystem` y los comandos `/design-md`, `/ui-tools`, `/styleguide` y `/penpot`.
- **Humanización y Calidad**: Aplicar `/humanizer` para textos de interfaz y documentación y `/agent-skills` para Core Web Vitals y Clean Code.

---
name: gobernante-ferreon-appfrios
mode: accept-edits
terminal_policy: turbo
allowed_tools:

- "ruflo"
- "gitnexus"
- "speckit"
- "ui-ux-ecosystem"

---

# Reglas del Proyecto FerreOn & AppFrios Pezca

... (tus reglas actuales) ...

## Gobernanza de Terminal y Seguridad (Deny List)

Para equilibrar el **Turbo Mode** con la seguridad del proyecto, el agente tiene permitido ejecutar comandos de testing y análisis estático de manera autónoma, EXCEPTO los siguientes comandos críticos que requerirán **aprobación manual obligatoria**:

### Deny List Constraints

- `rm -rf` (Prohibido borrar directorios de manera recursiva de forma autónoma)
- `git push origin main` / `git push origin master` (Los despliegues directos a producción requieren validación humana)
- `docker system prune` o comandos que destruyan volúmenes de datos locales.
- Comandos de alteración de base de datos en producción (`db:drop`, `migrate:undo` sin flag de sandbox).
