# Especificación Funcional (Spec): SPEC-016
# Optimización UX: Eliminación de Widgets Flotantes y Reingeniería Profesional de Firmas en Documentos

---

## 1. Resumen Ejecutivo y Caso de Negocio
A solicitud expresa del cliente tras la retroalimentación de uso en producción:
1. **Eliminación de Elementos Flotantes de Experiencia**: El widget flotante de gamificación (`AcademiaIsland`), que muestra el nivel ("Aprendiz de Taller 0 XP"), flota en la esquina inferior de la pantalla sobreponiéndose sobre botones de acción, tablas de datos y textos operativos, dificultando la lectura y operatividad del usuario comercial. Se requiere su remoción total de las pantallas operativas y la recuperación del espacio vertical útil en el layout principal.
2. **Reingeniería Visual y Profesional del Bloque de Firmas**: En los documentos PDF y vistas impresas (Contratos de Alquiler, Cuentas de Cobro y Actas), la firma digital se encuentra actualmente diagramada de forma invertida/anti-estética: la línea horizontal divisoria se ubica en el tope superior, el nombre de la empresa ("FERREON") queda debajo de la línea, la rúbrica digital aparece comprimida bajo el nombre, y finalmente el texto "Firma Autorizada y Sello" al fondo.
   - En la práctica legal y comercial corporativa estándar, la rúbrica o firma manuscrita/digital debe reposar **sobre** la línea de firma, y debajo de la línea deben constar los datos formales de identificación del firmante (Razón Social/Nombre, NIT/C.C. y cargo).

---

## 2. Requisitos del Sistema en Sintaxis EARS

### 2.1 Módulo UX / Layout General (Eliminación de Elementos Flotantes)
- **EARS-01 [Ubiquitous - Eliminación de Widget Flotante]**:
  El sistema **Alquileres System** NO DEBERÁ renderizar ningún elemento flotante superpuesto (`AcademiaIsland`) en el contenedor global de la aplicación (`AppShell.tsx`), garantizando que ninguna vista operativa sufra oclusiones o bloqueos visuales de lectura.
- **EARS-02 [Event-Driven - Normalización de Padding Inferior]**:
  CUANDO el usuario navega en cualquier sección del sistema, el contenedor principal `<main>` DEBERÁ utilizar un padding inferior optimizado (`pb-6 sm:pb-8`), eliminando los 112px artificiales (`pb-24 sm:pb-28`) que estaban reservados para la convivencia con el widget flotante.
- **EARS-03 [State-Driven - Conservación de la Academia en Puntos Fijos]**:
  MIENTRAS el usuario requiera consultar las misiones de aprendizaje o la guía de flujos, el acceso a la Academia permanecerá disponible de manera voluntaria a través de la barra de navegación superior (`TopNav`) y configuración, sin generar interferencias visuales pasivas.

### 2.2 Módulo de Documentos Legales (Reingeniería de Firmas en PDF e Impresión)
- **EARS-04 [Ubiquitous - Estructura Jerárquica Profesional de Firmas]**:
  Tanto en `ContratoAlquilerPDF.tsx` (`@react-pdf/renderer`) como en `EnterprisePDFService` (HTML de impresión de Cuentas de Cobro y Contratos), cada columna de firma (Cliente y Emisor) DEBERÁ estructurarse verticalmente en 3 zonas estrictas:
  1. **Zona Superior de Estampado**: Altura fija (44px - 50px) para alojar la imagen de la firma/rúbrica digital (`sigImage`), alineada verticalmente al fondo para simular que reposa naturalmente sobre la línea. Si no hay firma digital, debe mantenerse el espacio en blanco para firma manuscrita.
  2. **Línea Divisoria de Firma**: Una línea horizontal sólida de 1px (`#334155` o `#475569`) con ancho controlado (100% de la caja de firma, aprox. 180px - 220px).
  3. **Zona Inferior de Identificación**: Textos tipográficos ordenados con jerarquía clara:
     - **Columna Emisor / Acreedor**:
       - Título de Rol: `Firma Autorizada y Sello` o `Acreedor / Emisor`
       - Nombre de Empresa / Tenant: `${emp.razonSocial}` (ej. `FERREON`)
       - Identificación Tributaria: `NIT: ${emp.nit}`
     - **Columna Cliente / Deudor**:
       - Título de Aceptación: `Acepto y Recibí a Satisfacción`
       - Nombre / Razón Social: `${clienteNombre}`
       - Documento: `C.C. / NIT: ${clienteNit}`
       - Metadato Legal (Opcional si existe): `Firmado digitalmente: ${fechaFirmaCliente}`
- **EARS-05 [State-Driven - Formatos Carta y Media Carta (A5)]**:
  MIENTRAS el usuario alterne entre formato `Carta` y formato `A5`, las dimensiones de la zona de firma, el grosor de la línea y el tamaño de las fuentes DEBERÁN escalar proporcionalmente para evitar saltos de página accidentales en documentos compactos de una sola hoja.
- **EARS-06 [Unwanted Behavior - Degradación Grácil Sin Firma]**:
  SI la empresa emisora o el cliente no tienen firma digital cargada (`firmaDigitalBase64` nulo o vacío), el sistema DEBERÁ preservar el contenedor superior de 44px en blanco y la línea horizontal limpia, permitiendo la firma manual física sin deformar la maquetación.

---

## 3. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Eliminación del widget flotante de experiencia en la interfaz
  Dado que un usuario comercial o de bodega accede a Alquileres System
  Cuando navega por el Dashboard, Mostrador POS, Inventario o Devoluciones
  Entonces no debe aparecer ningún widget flotante de XP ("Aprendiz de Taller") en el pie de página
  Y las tablas y formularios deben ocupar su espacio natural sin desbordamientos ni paddings muertos excesivos

Escenario: Renderizado corporativo y profesional del bloque de firmas con rúbrica digital
  Dado que la empresa tiene cargada su rúbrica digital en /configuracion
  Cuando se emite un Contrato de Alquiler o Cuenta de Cobro en formato Carta o A5
  Entonces la imagen de la rúbrica debe mostrarse directamente ENCIMA de la línea horizontal
  Y debajo de la línea debe mostrarse la Razón Social de la empresa ("FERREON"), el NIT y la leyenda de "Firma Autorizada y Sello"
  Y el bloque del cliente debe mantener simetría exacta con la línea horizontal y sus datos de deudor debajo

Escenario: Generación de documento sin firma digital precargada
  Dado que la empresa no tiene rúbrica cargada
  Cuando se genera el PDF o se visualiza la Cuenta de Cobro
  Entonces debe mostrarse un espacio en blanco de 44px sobre la línea horizontal
  Y la línea horizontal debe permanecer visible y continua para recibir la firma manual con lapicero
```
