# SPEC-012: Módulo de Mantenimiento Preventivo, Horómetros y Alertas de Uso WMS
**Proyecto**: Alquileres System (FerreOn ERP & WMS)  
**Estado**: Borrador / Especificación SDD  
**Autor**: Coordinator & Planner  
**Fecha**: 2026-10-23  

---

## 1. Declaración de Propósito y Reglas de Negocio
Prevenir fallas mecánicas de maquinaria en obra y paradas no planificadas mediante el seguimiento automatizado de horas de uso (horómetros) y días acumulados de alquiler, alertando preventivamente al personal de bodega y aplicando Poka-Yoke al momento del despacho.

---

## 2. Requerimientos Funcionales en Notación EARS

### Ubicuo (Comportamiento Fundamental del Sistema)
- **EARS-U01**: El sistema SIEMPRE computará los días acumulados en obra de cada equipo basándose en las devoluciones efectivas registradas en contratos de alquiler.
- **EARS-U02**: El sistema SIEMPRE preservará en el Kardex inmutable (`kardex_inventario`) un registro con `tipo_movimiento = 'MANTENIMIENTO_PREVENTIVO'` cada vez que un técnico registre la puesta a punto de un equipo.

### Event-Driven (Respuestas ante Eventos Operativos)
- **EARS-E01**: CUANDO se procese una devolución física de un equipo con horómetro, EL SISTEMA solicitará opcionalmente la lectura actual del horómetro y actualizará las horas acumuladas del equipo.
- **EARS-E02**: CUANDO las horas acumuladas superen el límite configurado (`horas_uso_acumuladas >= horas_limite_mantenimiento`) o los días en obra superen el umbral (`dias_uso_acumulados >= dias_limite_mantenimiento`), EL SISTEMA marcará el equipo con el estado de alerta preventiva `REQUIERE_MANTENIMIENTO` y derivará las unidades recibidas a `stock_mantenimiento`.
- **EARS-E03**: CUANDO el encargado de bodega ejecute la acción "Completar Mantenimiento Preventivo", EL SISTEMA solicitará las observaciones técnicas, costo incurrido, reiniciará los contadores de ciclo a cero, actualizará `ultimo_mantenimiento_at = NOW()` y transferirá las unidades de `stock_mantenimiento` a `stock_disponible`.

### Unwanted Behavior / Poka-Yoke (Prevención de Errores)
- **EARS-W01**: SI un usuario intenta despachar en mostrador POS o formalizar un contrato con un equipo que no posee unidades disponibles o se encuentra al 100% en mantenimiento preventivo, EL SISTEMA bloqueará la adición al carrito e indicará "Equipo en Mantenimiento Preventivo - Bloqueado para Despacho".
- **EARS-W02**: SI el valor del horómetro ingresado en la devolución es inferior al horómetro registrado en el despacho previo, EL SISTEMA rechazará el valor alertando "Lectura de horómetro inconsistente (menor a la inicial)".

### State-Driven (Visualización y Estados en UI)
- **EARS-S01**: MIENTRAS un equipo posea una utilización entre el 80% y el 99% de su ciclo de horas/días de mantenimiento, EL SISTEMA mostrará un badge de alerta preventiva amarillo (`🟡 Próximo a Mantenimiento`) en el catálogo de Bodega y en el Dashboard.
- **EARS-S02**: MIENTRAS un equipo posea unidades en `stock_mantenimiento`, EL SISTEMA ofrecerá en la tabla de Bodega una píldora de filtro rápido "En Taller / Mantenimiento" con acción de 1 clic para liberar o registrar orden técnica.
