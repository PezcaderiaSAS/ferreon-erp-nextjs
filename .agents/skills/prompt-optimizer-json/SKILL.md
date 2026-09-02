---
name: prompt-optimizer-json
description: Optimiza prompts del usuario transformándolos en una estructura JSON estandarizada bajo las mejores prácticas avanzadas de Prompt Engineering (rol, contexto, tarea, instrucciones paso a paso, restricciones negativas y positivas, variables dinámicas, formato de salida estricto y ejemplos Few-Shot).
---

# Prompt Optimizer JSON

Esta skill está diseñada para transformar cualquier prompt en bruto o solicitud informal ingresada por el usuario en una especificación estructurada y altamente optimizada en formato **JSON**. 

El objetivo es maximizar la comprensión, precisión, alineación y tasa de éxito en la ejecución por parte de cualquier Modelo de Lenguaje de Inteligencia Artificial (LLM), eliminando ambigüedades y aplicando técnicas avanzadas de **Prompt Engineering**.

---

## 1. Esquema JSON Estandarizado (`OptimizedPrompt`)

Cualquier prompt optimizado generado por esta skill DEBE cumplir strictly con el siguiente esquema JSON:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "meta": {
    "title": "Nombre descriptivo del prompt optimizado",
    "version": "1.0.0",
    "target_model_tier": "fast | balanced | advanced",
    "created_at": "YYYY-MM-DD"
  },
  "role_definition": {
    "identity": "Definición del rol o persona experta de la IA",
    "expertise": ["Área de especialización 1", "Área de especialización 2"],
    "tone_and_style": "Tono de comunicación (ej. Técnico, Directo, Profesional, Conciso)"
  },
  "context": {
    "background": "Antecedentes y contexto del dominio o del negocio",
    "target_audience": "Público objetivo o destinatario de la respuesta",
    "domain_rules": ["Regla de dominio 1", "Regla de dominio 2"]
  },
  "task_specification": {
    "primary_objective": "Objetivo principal claro, directo e inequívoco",
    "subtasks": [
      "Subtarea 1 a realizar",
      "Subtarea 2 a realizar"
    ]
  },
  "execution_instructions": {
    "reasoning_process": "Metodología o cadena de pensamiento sugerida (Chain of Thought)",
    "step_by_step": [
      "Paso 1: Analizar / Verificar...",
      "Paso 2: Procesar / Generar...",
      "Paso 3: Validar / Formatear..."
    ]
  },
  "constraints": {
    "must_do": [
      "Acción obligatoria 1",
      "Acción obligatoria 2"
    ],
    "must_not_do": [
      "Restricción negativa 1 (ej: No asumir datos no provistos)",
      "Restricción negativa 2 (ej: No alucinar nombres de funciones)"
    ]
  },
  "input_variables": [
    {
      "name": "variable_name",
      "type": "string | number | boolean | object | array",
      "description": "Descripción de qué representa esta variable dinámicamente",
      "required": true
    }
  ],
  "output_format": {
    "type": "json | markdown | code | text",
    "structure_details": "Descripción detallada o esquema del formato de respuesta esperado",
    "language": "Español | Inglés | Especificado por el usuario"
  },
  "few_shot_examples": [
    {
      "input": "Ejemplo de entrada representativa con variables",
      "output": "Ejemplo de salida ideal esperada"
    }
  ]
}
```

---

## 2. Principios de Optimización Aplicados

Al procesar una solicitud del usuario, aplica los siguientes principios:

1. **Definición de Rol (Role Prompting):** Asigna un rol experto hiperespecífico (ej: *"Arquitecto Senior de Software especialista en Apps Script"* en vez de *"Programador"*).
2. **Claridad del Objetivo (Task Clarity):** Separa claramente el *qué* (tarea principal) del *cómo* (pasos de ejecución).
3. **Delimitación de Variables:** Identifica cualquier dato variable que deba ser inyectado dinámicamente y defínelo en `input_variables`.
4. **Cadena de Pensamiento (Chain-of-Thought):** Descompón tareas complejas en pasos secuenciales dentro de `execution_instructions.step_by_step`.
5. **Restricciones Negativas Explícitas:** Incluye reglas de lo que el modelo **NO DEBE HACER** en `constraints.must_not_do` para evitar alucinaciones, respuestas verbosas o desviaciones de alcance.
6. **Formato Estricto de Salida:** Define explícitamente el tipo y la estructura del resultado en `output_format`.
7. **Ejemplos Pocos Ensayos (Few-Shot Prompting):** Si la tarea requiere una estructura compleja o poco convencional, incluye al menos un par entrada/salida en `few_shot_examples`.

---

## 3. Flujo de Trabajo para Optimizar un Prompt

Cuando el usuario te pida optimizar un prompt o te envíe una solicitud para estructurar en JSON:

1. **Analizar la Entrada del Usuario:**
   - Identificar intención real, dominio, vacíos de información o suposiciones implícitas.
2. **Completar Vacíos con Mejores Prácticas:**
   - Inferir el rol experto más idóneo.
   - Establecer restricciones de seguridad, calidad y formato.
3. **Construir el JSON Optimizado:**
   - Generar el objeto JSON respetando el esquema `OptimizedPrompt`.
4. **Presentar el Resultado:**
   - Entregar el bloque JSON válido en un bloque de código Markdown (`json`).
   - Proporcionar un breve resumen (3-4 viñetas) explicando las mejoras clave aplicadas.

---

## 4. Ejemplo de Transformación

### Entrada del usuario (Prompt original / crudo):
> *"Créame una función para validar cédulas en Colombia en Javascript."*

### Salida Optimizada por la Skill (JSON):

```json
{
  "meta": {
    "title": "Validador de Documentos de Identidad (Cédula) en Colombia",
    "version": "1.0.0",
    "target_model_tier": "balanced",
    "created_at": "2026-07-23"
  },
  "role_definition": {
    "identity": "Ingeniero Principal de Software especialista en Validación de Datos y Normativa Colombiana",
    "expertise": ["JavaScript (ES6+)", "Expresiones Regulares", "Saneamiento de Entradas"],
    "tone_and_style": "Técnico, Eficiente y Orientado a Producción"
  },
  "context": {
    "background": "Se requiere validar números de cédula de ciudadanía o extranjería en Colombia para prevenir errores de registro e inyecciones de código.",
    "target_audience": "Desarrolladores Web / Node.js",
    "domain_rules": [
      "Las cédulas colombianas contienen entre 6 y 10 dígitos numéricos.",
      "Pueden contener separadores de miles (puntos) que deben ser eliminados antes de validar."
    ]
  },
  "task_specification": {
    "primary_objective": "Escribir una función en JavaScript pura (ES6+) que valide y sanitice números de cédula colombianos.",
    "subtasks": [
      "Eliminar caracteres no numéricos (espacios, puntos, guiones).",
      "Verificar longitud válida (6 a 10 dígitos).",
      "Retornar un objeto con el estado de validez, el valor sanitizado y posibles mensajes de error."
    ]
  },
  "execution_instructions": {
    "reasoning_process": "Primero limpiar la entrada, luego validar tipos y rangos, y finalmente estructurar la respuesta con tipado defensivo.",
    "step_by_step": [
      "Paso 1: Convertir la entrada a string y aplicar Trim/Regex para conservar solo dígitos.",
      "Paso 2: Validar si la longitud está entre 6 y 10 caracteres.",
      "Paso 3: Validar que no sea una secuencia nula o de ceros repetidos.",
      "Paso 4: Retornar objeto `{ isValid: boolean, sanitizedValue: string, error?: string }`."
    ]
  },
  "constraints": {
    "must_do": [
      "Usar sintaxis ES6+ limpia y autodocumentada.",
      "Manejar casos borde (null, undefined, tipos no válidos).",
      "Incluir comentarios JSDoc."
    ],
    "must_not_do": [
      "No usar librerías externas o dependencias de npm.",
      "No mutar los argumentos de entrada.",
      "No retornar tipos primitivos simples (usar siempre el objeto de respuesta estructurado)."
    ]
  },
  "input_variables": [
    {
      "name": "cedulaInput",
      "type": "string | number",
      "description": "Número de cédula ingresado por el usuario o formulario",
      "required": true
    }
  ],
  "output_format": {
    "type": "code",
    "structure_details": "Código JavaScript ejecutable con JSDoc y ejemplos de prueba unitaria básica",
    "language": "Español"
  },
  "few_shot_examples": [
    {
      "input": "validarCedula('1.018.456.789')",
      "output": "{ isValid: true, sanitizedValue: '1018456789' }"
    },
    {
      "input": "validarCedula('12345')",
      "output": "{ isValid: false, sanitizedValue: '12345', error: 'La cédula debe contener entre 6 y 10 dígitos.' }"
    }
  ]
}
```
