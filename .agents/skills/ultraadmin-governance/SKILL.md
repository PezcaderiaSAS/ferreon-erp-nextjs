---
name: ultraadmin-governance
description: Blindaje de memoria de enjambre y control de secretos en FerreOn ERP
---

# GOBERNANZA DE SEGURIDAD Y MEMORIA PERSISTENTE
1. **FILTRADO DE SECRETOS EN MEMORIA (.swarm/memory.db):** Queda estrictamente prohibido guardar llaves service_role, credenciales JWT, contrasenas de BD o tokens RBAC/ABAC en la memoria semantica (AgentDB) o episodica.
2. **VALIDACION ZOD DUAL-LAYER:** Todo endpoint de API y mutacion de base de datos debe validar esquemas con Zod antes de tocar persistencia.
3. **AUDITORIA INMUTABLE:** Modificaciones criticas deben registrarse con audit_log atomico.
