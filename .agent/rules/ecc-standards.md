# Estándares de Ingeniería ECC (Everything Claude Code)

Toda modificación, script o componente en este proyecto DEBE seguir los siguientes 5 mandamientos de calidad:

1. **Inmutabilidad (CRÍTICO):** Nunca mutar objetos o arrays directamente. Retornar nuevas copias con los cambios aplicados (`[...array, item]`, `{ ...obj, key: val }`).
2. **Cobertura de Pruebas (Mínimo 80%):** Todo nuevo caso de uso o entidad de dominio debe incluir pruebas unitarias en `tests/unit/` antes de considerarse completo.
3. **Manejo de Errores Exhaustivo:** No tragar errores en silencio (`catch (e) {}`). Registrar contexto detallado o reportar feedback entendible al usuario.
4. **Validación en Fronteras:** Validar toda entrada de datos (mediante schemas Zod o métodos de dominio `sanitizar()` / `validarInvariantes()`).
5. **Separación de Responsabilidades:** Utilizar el patrón Repository para desacoplar la lógica de negocio de los mecanismos de persistencia (Zustand, Supabase, LocalStorage).
