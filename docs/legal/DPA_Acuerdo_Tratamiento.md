# ACUERDO DE TRANSMISIÓN Y PROCESAMIENTO DE DATOS PERSONALES (DPA)
**Alquileres System — Software as a Service (SaaS)**

**Versión:** 1.0.0  
**Fecha de Entrada en Vigor:** 24 de Septiembre de 2026  
**Jurisdicción Principal:** República de Colombia  
**Alcance Regional:** Países miembros de la Alianza del Pacífico y LATAM (Colombia, México, Chile, Perú)  

---

### ENTRE LAS PARTES

1. **EL RESPONSABLE DEL TRATAMIENTO:** La persona natural o jurídica (empresa, ferretería o negocio de maquinaria) debidamente registrada como Tenant en la plataforma **Alquileres System** (en adelante, el **"CLIENTE"** o **"EL RESPONSABLE"**).
2. **EL ENCARGADO DEL TRATAMIENTO:** **Alquileres System / PEZCADERIA S.A.S.**, sociedad comercial legalmente constituida bajo las leyes de la República de Colombia, operadora y propietaria exclusiva de la plataforma SaaS (en adelante, **"EL ENCARGADO"** o **"LA PLATAFORMA"**).

---

### CLÁUSULA PRIMERA: MARCO LEGAL APLICABLE

Este Acuerdo de Procesamiento de Datos (DPA) se suscribe de conformidad con:
- **Colombia:** Ley Estatutaria 1581 de 2012, Decreto Reglamentario 1377 de 2013, Decreto Único 1074 de 2015, y Circulares Externas 002 de 2024 de la Superintendencia de Industria y Comercio (SIC).
- **México:** Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
- **Perú:** Ley 29733 (Ley de Protección de Datos Personales) y D.S. 016-2024-JUS.
- **Chile:** Ley 19.628 y Ley 21.719 de Protección de la Vida Privada.
- **Brasil:** Lei Geral de Proteção de Dados (LGPD - Ley 13.709/2018).

---

### CLÁUSULA SEGUNDA: NATURALEZA Y ROL DE LAS PARTES

1. **El CLIENTE como Responsable:** El CLIENTE es el único titular o custodio legal de las bases de datos de sus clientes finales, proveedores, empleados y contratistas que ingresa, registra o procesa dentro del software Alquileres System. Es responsabilidad exclusiva del CLIENTE obtener la **Autorización Previa, Expresa e Informada** de dichos titulares antes de ingresarlos a la plataforma.
2. **Alquileres System como Encargado:** LA PLATAFORMA actúa estrictamente en calidad de **Encargado del Tratamiento**, procesando los datos personales única y exclusivamente por cuenta, instrucción y beneficio del CLIENTE, para la operación de los módulos de cotizaciones, contratos de alquiler, inventario de bodega, facturación y caja.

---

### CLÁUSULA TERCERA: COMPROMISO DE DETERMINISMO Y POLÍTICA CERO IA EXTERNA

1. **Prohibición Absoluta de Filtración a Modelos de IA:** EL ENCARGADO certifica de manera vinculante que **NINGÚN dato personal, comercial, financiero o transaccional** del CLIENTE o de sus clientes finales será compartido, transmitido, transferido o cedido a proveedores de Modelos de Lenguaje Grande (LLMs) externos (tales como OpenAI, Anthropic, Google, entre otros) para entrenamiento, re-entrenamiento o afinamiento de modelos algorítmicos.
2. **Cómputo Determinístico:** Todos los cálculos matemáticos, deducciones de stock, liquidación de depósitos en garantía, arqueos de caja en COP y generación de contratos operan bajo lógica de código determinística y relacional alojada en bases de datos aisladas lógicamente con Row Level Security (RLS).

---

### CLÁUSULA CUARTA: MEDIDAS DE SEGURIDAD Y CONFIDENCIALIDAD

EL ENCARGADO implementará y mantendrá medidas técnicas, administrativas y operativas de seguridad de estándar bancario/empresarial:
- **Aislamiento Multi-Tenant (RLS):** Cada tenant cuenta con aislamiento estricto en PostgreSQL mediante políticas de Row Level Security a nivel de fila (`empresa_id = get_current_tenant_id()`), imposibilitando el acceso cruzado entre empresas.
- **Cifrado en Tránsito:** Todas las comunicaciones están forzadas bajo protocolo TLS 1.3 con certificados criptográficos de curva elíptica.
- **Cifrado en Reposo:** Bases de datos y almacenamiento de archivos cifrados mediante algoritmo AES-256 bits.
- **Auditoría Inmutable:** Registro continuo en `public.audit_logs` de transacciones críticas (aperturas de caja, devoluciones, modificaciones de contrato y accesos administrativos).

---

### CLÁUSULA QUINTA: ATENCIÓN DE DERECHOS DE LOS TITULARES (HÁBEAS DATA)

1. En caso de que un titular de datos (cliente final de una ferretería) radique ante EL ENCARGADO una solicitud de consulta, actualización, rectificación o supresión de datos (derechos ARCO), EL ENCARGADO redirigirá inmediatamente la solicitud al CLIENTE dentro de los tres (3) días hábiles siguientes.
2. EL ENCARGADO facilitará al CLIENTE las herramientas de software necesarias (soft-delete, anonimización o descarga en CSV/JSON) para dar oportuno cumplimiento a los términos perentorios fijados por la Ley 1581 (10 días hábiles para consultas, 15 días hábiles para reclamos).

---

### CLÁUSULA SEXTA: DISPOSICIÓN FINAL Y PORTABILIDAD DE LA INFORMACIÓN

Al término de la suscripción o cancelación de la cuenta:
1. El CLIENTE tendrá un plazo de gracia de treinta (30) días calendario para solicitar la exportación íntegra de sus datos estructurados.
2. Transcurrido dicho término, EL ENCARGADO procederá al borrado seguro y destrucción criptográfica definitiva de las copias en caliente, conservando únicamente respaldos cifrados por el período legal exigido para obligaciones tributarias y de auditoría.

---

### CLÁUSULA SÉPTIMA: VIGENCIA Y MODIFICACIONES

El presente Acuerdo rige a partir del momento en que el CLIENTE acepta expresamente los Términos de Servicio y la Política de Privacidad de Alquileres System, y permanecerá vigente mientras subsista cualquier tratamiento de datos derivado de la relación contractual SaaS.
