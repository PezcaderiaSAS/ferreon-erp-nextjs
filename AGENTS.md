<!-- gitnexus:start -->
# Ecosistema Integrado de Desarrollo: FerreOn & AppFrios Pezca

Este repositorio integra 4 herramientas avanzadas de ingeniería aumentada por IA:

1. **GitNexus** (`abhigyanpatwari/GitNexus`): Inteligencia de código, grafos AST y análisis de radio de explosión (`impact`, `query`, `context`, `detect_changes`).
2. **Ruflo** (`ruvnet/ruflo`): Orquestación multi-agente, enjambres jerárquicos/en malla y memoria persistente (`ReasoningBank`, `AgentDB`).
3. **Everything Claude Code - ECC** (`affaan-m/ecc`): Catálogo de 64 subagentes especializados, TDD con 80%+ de cobertura y revisiones de seguridad.
4. **Spec-Kit** (`github/spec-kit`): Metodología de desarrollo guiado por especificaciones (`specify`, `clarify`, `checklist`, `plan`, `tasks`, `analyze`, `implement`).

5. **Herramientas de Agentes & Comandos Slash**: Ecosistema de utilidades avanzadas (`/archify`, `/scientific-skills`, `/agent-skills`, `/open-design`, `/ponytail`, `/humanizer`, `/agent-toolkit`).
6. **Ecosistema UI/UX & Gobernanza Visual**: Estándares obligatorios de diseño web (`/design-md`, `/ui-tools`, `/styleguide`, `/penpot`, `DESIGN.md`).

---

## 1. GitNexus — Reglas Obligatorias de Código

- **SIEMPRE ejecutar análisis de impacto antes de editar:** Corre `impact({target: "symbolName", direction: "upstream"})` y reporta el blast radius (d=1 se romperá, d=2 probablemente afectado).
- **SIEMPRE ejecutar `detect_changes()` antes de commit** para asegurar que no hay efectos secundarios fuera del alcance esperado.
- **NUNCA ignorar advertencias de riesgo HIGH o CRITICAL.**
- Si el índice está desactualizado, re-indexar con: `node .gitnexus/run.cjs analyze`.

---

## 2. Ruflo — Enjambres y Memoria

- Utiliza la topología adecuada según la complejidad:
  - **Jerárquica:** Para features multi-archivo que requieren coordinación centralizada.
  - **Anillo / Pipeline:** Para flujos TDD e integración continua.
- Persistir patrones aprendidos y soluciones no triviales en `ReasoningBank` (`.swarm/memory.db`) para evitar repetir diagnósticos en sesiones futuras.

---

## 3. ECC — Calidad, TDD e Inmutabilidad

- **Inmutabilidad:** Siempre retornar copias nuevas de objetos y arrays; nunca mutar estado directamente.
- **TDD Obligatorio:** Escribir tests unitarios en `tests/unit/` antes de implementar el código de producción.
- **Security-First:** Validar todas las entradas de usuario en los límites del sistema con esquemas Zod y sanitización de dominio.

---

## 4. Spec-Kit — Flujo de Especificación

Cuando se aborden requerimientos de software complejos, seguir el ciclo Speckit:
1. `/speckit.specify`: Redactar el "Qué" y "Por qué" en PRD (sin código).
2. `/speckit.clarify`: Eliminar ambigüedades con preguntas estructuradas.
3. `/speckit.checklist`: Validar estándares de la industria (idempotencia, latencia cero).
4. `/speckit.plan`: Definir componentes, esquemas de datos y flujos de información ("Cómo").
5. `/speckit.tasks`: Desglosar tareas granulares y secuenciales en `task.md`.
6. `/speckit.analyze`: Auditar consistencia cruzada (Spec -> Plan -> Tasks) buscando fisuras o memory leaks.
7. `/speckit.implement`: Ejecutar **una tarea a la vez**, deteniéndose para confirmación en cada paso.

---

## 5. Herramientas de Agentes & Comandos Slash

- **/archify:** Modelado y diagramación de arquitectura C4 en Mermaid antes de cambios estructurales.
- **/scientific-skills:** Validación de exactitud numérica, precisión de punto flotante y manejo de unidades (gramos enteros).
- **/agent-skills:** Auditoría de rendimiento web (Core Web Vitals), accesibilidad y patrones Clean Code (Addy Osmani).
- **/open-design:** Transformación e interoperabilidad de especificaciones visuales a componentes web limpios.
- **/ponytail:** Tailoring de prompts y context slicing optimizado.
- **/humanizer:** Refinamiento y humanización de mensajes de UI, comentarios de código y documentación técnica.
- **/stitch-design:** Generación de interfaces y componentes con Google Stitch basados en marcas y Glassmorphism.
- **/ricoui:** Extracción de sistemas de diseño de marcas y tokens desde Rico UI (`design.ricoui.com/brands`).
- **/agent-toolkit:** Centro de mando y directorio interactivo de herramientas.

---

## 6. Gobernanza UI/UX & Estándares Visuales

- **DESIGN.md:** Obligatorio consultar y apegarse a los tokens de color HSL, tipografía, espaciados y sombras definidos en `DESIGN.md`.
- **/design-md:** Auditar y sincronizar tokens de diseño en componentes.
- **/ui-tools:** Generación de sombras avanzadas, glassmorphism, gradientes y micro-animaciones GPU.
- **/styleguide:** Referencia de sistemas de diseño líderes (Shopify Polaris, GitHub Primer, Radix UI).
- **/penpot:** Directrices de diseño y prototipado colaborativo en estándares web abiertos.
- **Google Stitch & Rico UI:** Motor de generación rápida y presets de marca (`stitch.json` y `scripts/ricoui-mcp.mjs`).

---

## Recursos Rápidos

| Herramienta / Dominio | Comando Slash | Habilidad / Documentación |
| :--- | :--- | :--- |
| **GitNexus** | N/A | `.agents/skills/gitnexus-intelligence/SKILL.md` |
| **Ruflo Swarms** | N/A | `.agents/skills/ruflo-orchestration/SKILL.md` |
| **Ruflo Memory** | N/A | `.agents/skills/ruflo-memory/SKILL.md` |
| **ECC Orchestrator** | N/A | `.agents/skills/ecc-orchestrator/SKILL.md` |
| **Spec-Kit Workflow** | `/speckit-workflow` | `.agents/skills/speckit-workflow/SKILL.md` |
| **System Design GT** | `/system-design-ground-truth` | `.agents/skills/system-design-ground-truth/SKILL.md` |
| **Ponytail Prompts** | `/ponytail` | `.agents/skills/ponytail/SKILL.md` |
| **Agent Skills (Addy)** | `/agent-skills` | `.agents/skills/agent-skills/SKILL.md` |
| **Open Design** | `/open-design` | `.agents/skills/open-design/SKILL.md` |
| **Archify C4** | `/archify` | `.agents/skills/archify/SKILL.md` |
| **Scientific Skills** | `/scientific-skills` | `.agents/skills/scientific-agent-skills/SKILL.md` |
| **Humanizer** | `/humanizer` | `.agents/skills/humanizer/SKILL.md` |
| **Stitch & Rico UI** | `/stitch-design` / `/ricoui` | `.agents/skills/stitch-ricoui-design/SKILL.md` |
| **Ecosistema UI/UX** | `/design-md` | `.agents/skills/ui-ux-ecosystem/SKILL.md` |
| **UI Tools & CSS** | `/ui-tools` | `.agent/workflows/ui-tools.md` |
| **Styleguides** | `/styleguide` | `.agent/workflows/styleguide.md` |
| **Penpot** | `/penpot` | `.agent/workflows/penpot.md` |
| **Agent Toolkit Hub** | `/agent-toolkit` | `.agent/workflows/agent-toolkit.md` |
| **Tokens del Proyecto**| N/A | `DESIGN.md` |

<!-- gitnexus:end -->