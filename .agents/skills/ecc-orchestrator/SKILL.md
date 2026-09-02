---
name: ecc-orchestrator
description: Orquestador Everything Claude Code (ECC) v2.0.0. Catálogo de 64 subagentes especializados, TDD estricto, revisión de seguridad, calidad y workflows automatizados.
---

# Everything Claude Code (ECC) — Agent Orchestrator & Standards

**Everything Claude Code (ECC)** proporciona un ecosistema de desarrollo guiado por agentes especializados, metodologías TDD y aseguramiento continuo de calidad de software.

---

## 1. Principios Centrales de ECC

1. **Agent-First:** Delegar subtareas complejas a subagentes especialistas de dominio.
2. **Test-Driven (TDD):** Escribir pruebas unitarias/integración antes de implementar código productivo (cobertura mínima requerida: **80%+**).
3. **Inmutabilidad Estricta:** Siempre crear nuevos objetos y retornar copias; nunca mutar estado existente.
4. **Security-First:** Validar toda entrada en límites de sistema, prevenir SQL Injection, XSS y asegurar llaves/secretos.
5. **Planificar Antes de Ejecutar:** Utilizar agentes de planeación (`planner`, `architect`) para diseñar la solución antes de tocar archivos.

---

## 2. Matriz de Agentes Especializados Más Utilizados

| Subagente | Especialidad / Propósito | Cuándo Usar |
| :--- | :--- | :--- |
| **`planner`** | Planificación de funcionalidades y refactorización | Tareas de más de 3 archivos o cambios arquitectónicos |
| **`architect`** | Diseño de sistemas, contratos de API y escalabilidad | Decisiones de infraestructura y modelos de dominio |
| **`tdd-guide`** | Desarrollo guiado por pruebas (Ciclo Red-Green-Refactor) | Nuevas funciones, casos de uso o corrección de defectos |
| **`code-reviewer`** | Calidad de código, mantenibilidad y deuda técnica | Inmediatamente después de escribir o editar código |
| **`security-reviewer`**| Detección de vulnerabilidades, Auth y RBAC | Antes de commits y al modificar endpoints de autenticación |
| **`build-error-resolver`** | Resolución quirúrgica de errores de compilación/tipos | Ante fallos de `tsc`, Vite o Next.js build |
| **`refactor-cleaner`** | Limpieza segura de código muerto | Tareas de mantenimiento y reducción de líneas huérfanas |
| **`e2e-runner`** | Pruebas end-to-end con Playwright | Flujos críticos de usuario y validación de interfaces |

---

## 3. Comandos / Workflows Clave de ECC

- `/tdd-workflow`: Ejecuta el ciclo obligatorio TDD (Escribir Test que falle -> Código mínimo -> Refactorizar).
- `/code-review`: Revisa cambios locales o pull requests con enfoque estricto en legibilidad y rendimiento.
- `/security-scan`: Ejecuta auditoría de seguridad preventiva en variables de entorno, permisos y sanitización.
- `/quality-gate`: Verifica formateo, linters y tipado estricto de TypeScript antes de finalizar tareas.
