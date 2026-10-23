# Especificación del Sistema (EARS): SPEC-013
## Módulo de Firma Digital Touch en Pantalla para el Cliente (Pad Táctil y Estampado en Contratos)

---

### 1. Contexto y Objetivos del Negocio
- **Sistema Canónico**: **Alquileres System**.
- **Propósito**: Permitir que el cliente / arrendatario formalice la entrega y recepción de maquinaria en alquiler directamente en el mostrador POS o en bodega, firmando con el dedo o stylus sobre una tablet, smartphone o pantalla táctil (o cursor de ratón). La firma se estampa digitalmente en el contrato de alquiler en PDF con trazabilidad de fecha y hora bajo el marco de la Ley 527 de 1999 (Comercio Electrónico y Equivalencia Funcional de Firma Digital en Colombia).

---

### 2. Requisitos del Sistema (EARS Syntax)

#### Requisitos Ubicuos (Ubiquitous - Operación Estándar)
- **[U01]**: El sistema DEBE ofrecer un componente reutilizable de lienzo táctil (`FirmaTouchCanvas`) con soporte bidireccional para punteros táctiles (`PointerEvents` / `TouchEvents`) y eventos de ratón (`MouseEvent`).
- **[U02]**: El sistema DEBE renderizar los trazos con resolución nativa de pantalla (`window.devicePixelRatio`) para evitar pixelado o distorsión en pantallas de alta densidad (Retina / OLED).
- **[U03]**: El sistema DEBE estampar la firma del cliente en el recuadro "Acepto y Recibí a Satisfacción" en el PDF del contrato de alquiler (`ContratoAlquilerPDF` y `EnterprisePDFService`).

#### Requisitos Basados en Eventos (Event-driven)
- **[E01]**: CUANDO el usuario presione el botón "Limpiar Trazo", el sistema DEBE borrar inmediatamente el contenido del lienzo, restablecer el estado interno y deshabilitar el botón de confirmación.
- **[E02]**: CUANDO el cliente trace su firma y presione "Confirmar y Certificar Firma", el sistema DEBE exportar la imagen en formato PNG optimizado con fondo transparente y resolución adecuada (~15-30 KB Base64).
- **[E03]**: CUANDO se confirme la firma para un contrato de alquiler existente, el sistema DEBE persistir la firma mediante `guardarFirmaClienteAlquilerAction`, registrando la fecha/hora de estampado y actualizando la vista previa del documento.

#### Requisitos de Manejo de Errores y Poka-Yoke (Unwanted Behaviour)
- **[W01]**: SI el cliente intenta confirmar la firma sin haber realizado ningún trazo en el lienzo (canvas en blanco), el sistema DEBE bloquear la confirmación y mostrar una advertencia visual ("Debe ingresar su firma en el recuadro antes de continuar").
- **[W02]**: SI la carga útil de la imagen no es un Data URL de imagen válido (`data:image/png;base64,...`) o excede 500 KB, la Server Action DEBE rechazar la petición con un error tipado de validación Zod.

#### Requisitos de Estado (State-driven)
- **[S01]**: MIENTRAS no exista firma capturada del cliente para un contrato, el sistema DEBE conservar la línea de firma en blanco tradicional con los datos del cliente (C.C. / NIT y Nombre) para permitir firma física manuscrita (Retrocompatibilidad total).
- **[S02]**: MIENTRAS el modal de firma esté abierto en un dispositivo móvil (375 px), el lienzo DEBE adaptar su ancho al contenedor al 100% y desactivar el scroll de la página para evitar que el gesto de firma desplace la pantalla (`touch-action: none`).
