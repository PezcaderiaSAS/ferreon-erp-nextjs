# Configuración y Ejecución de Harness2 a Costo 0 USD (Google AI Studio)

Este documento certifica cómo levantar y verificar el framework de experimentación **Harness2** localmente en cualquier entorno tras clonar o hacer `git pull`.

---

## 1. Arquitectura y Parámetros
- **Proveedor:** Google AI Studio (Capa Gratuita / Free Tier - 0 USD).
- **Modelo Principal / Solver / Judge:** `gemini-3.8-flash`.
- **Modelo Agente IDE:** `antigravity-preview-09-2026`.
- **Estrategia Concurrente:** Secuencial (`mode=sequential`, `k=1`, `max_tasks=1`) para evitar errores `429 Too Many Requests`.
- **Compatibilidad de Sistema:** Windows y Linux (rutas normalizadas con `.as_posix()` y bloqueo seguro sin `fcntl`).

---

## 2. Instalación Rápida
En la carpeta `harness2/`:

```bash
# 1. Crear el entorno virtual con Python 3.12 y uv
uv venv --python 3.12

# 2. Instalar dependencias en modo editable
uv pip install -e ".[dev]"
uv pip install google-genai
```

---

## 3. Configuración del Entorno `.env`
Copia el archivo `.env.example` a `.env`:

```ini
MODEL_PROVIDER=google_ai_studio
PRIMARY_MODEL_ID=gemini-3.8-flash
IDE_AGENT_MODEL_ID=antigravity-preview-09-2026

GEMINI_API_KEY=tu_api_key_de_google_ai_studio_aqui
GOOGLE_API_KEY=tu_api_key_de_google_ai_studio_aqui

HARNESS2_SOLVER_MODEL=google/gemini-3.8-flash
HARNESS2_IMPROVER_MODEL=google/gemini-3.8-flash
HARNESS2_JUDGE_MODEL=gemini-3.8-flash
HARNESS2_IDE_MODEL=antigravity-preview-09-2026

HARNESS2_RUNS_DIR=runs/
HARNESS2_DEFAULT_MODE=sequential
HARNESS2_DEFAULT_K=1
HARNESS2_DEFAULT_MAX_TASKS=1
```

---

## 4. Verificación de Funcionamiento
Ejecuta la suite de pruebas unitarias para certificar la salud del entorno:

```bash
# En Windows
.venv\Scripts\pytest tests/unit

# En Linux / Mac
.venv/bin/pytest tests/unit
```
Resultado esperado: Todas las pruebas aprobadas sin fallos de importación ni dependencias faltantes.
