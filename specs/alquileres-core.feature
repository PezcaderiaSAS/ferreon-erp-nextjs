# language: es
Caracteristica: Gestion Paralela de alquileres-core en FerreOn ERP
  Como: Agente Especialista (adversarial-reviewer)
  Quiero: Procesar los requerimientos de alquileres-core de manera aislada
  Para: Eliminar condiciones de carrera y garantizar cero regresiones

  Esquema del Escenario: Verificacion de contrato y pre-validacion de impacto
    Dados un estado inicial limpio en la rama "alquileres-core-adversarial-reviewer"
    Cuando se ejecute la verificacion de impacto con GitNexus
    Entonces el radio de explosion debe reportar CERO conflictos con los 14,034 simbolos
    Y los tipos TypeScript de Supabase deben reflejar exactamente la ultima migracion

  Escenario: Validacion de reglas de dominio e inmutabilidad
    Dado un valor financiero o peso ingresado
    Cuando se procese en la capa transaccional
    Entonces el peso debe persistirse como entero en "peso_gramos BIGINT"
    Y ninguna operacion monetaria debe usar punto flotante
