#!/usr/bin/env bash

# ==============================================================================
# SCRIPT: init-worktrees.sh
# PROJECT: FerreOn ERP & AppFrios Pezca
# PURPOSE: Automated, zero-collision Git Worktree provisioner with shared node_modules
#          caching, Supabase live type injection, and Peacock UI framing.
# ==============================================================================

set -euo pipefail

# --- CONFIGURACIÓN DE COLORES PARA MJS ---
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- CONFIGURACIÓN DE RUTAS ---
ROOT_DIR="$(pwd)"
GLOBAL_CACHE_DIR="${ROOT_DIR}/.system_generated/node_modules_cache"
WORKTREES_BASE="${ROOT_DIR}/.system_generated/worktrees"

# --- VALIDACIÓN DE ENTORNO GIT ---
if [ ! -d ".git" ]; then
    if [ -d "ferreon-erp-nextjs/.git" ]; then
        cd ferreon-erp-nextjs
        ROOT_DIR="$(pwd)"
        GLOBAL_CACHE_DIR="${ROOT_DIR}/.system_generated/node_modules_cache"
        WORKTREES_BASE="${ROOT_DIR}/.system_generated/worktrees"
        log_info "Detectado repositorio Git en subcarpeta ferreon-erp-nextjs. Contexto ajustado a: ${ROOT_DIR}"
    else
        log_error "Este script debe ejecutarse desde la raíz de un repositorio Git válido."
        exit 1
    fi
fi

# --- PARÁMETROS DE ENTRADA ---
USAGE="Uso: $0 <tipo_agente> <nombre_rama> <rama_base>\nTipos válidos: frontend | backend | tdd"

if [ "$#" -lt 2 ]; then
    log_error "Faltan parámetros obligatorios.\n$USAGE"
    exit 1
fi

AGENT_TYPE="$1"       # frontend | backend | tdd
BRANCH_NAME="$2"      # ej: feat-ui-glassmorphism
BASE_BRANCH="${3:-main}" # Por defecto bifurca desde main

TARGET_PATH="${WORKTREES_BASE}/${AGENT_TYPE}/${BRANCH_NAME}"
PEACOCK_COLOR=""

# --- ASIGNACIÓN DE ADAPTACIONES SENSORIALES (PEACOCK) ---
case "${AGENT_TYPE}" in
    frontend)
        PEACOCK_COLOR="#00f0ff" # Cyan Premium Glassmorphism
        ;;
    backend)
        PEACOCK_COLOR="#00ff88" # Esmeralda Transaccional Defensivo
        ;;
    tdd)
        PEACOCK_COLOR="#ff0055" # Rubí Adversarial / QA
        ;;
    *)
        log_error "Tipo de agente inválido: '${AGENT_TYPE}'.\n$USAGE"
        exit 1
        ;;
esac

# --- PASO 1: VALIDACIÓN Y PREPARACIÓN DEL CACHÉ GLOBAL DE NODE_MODULES ---
log_info "Verificando integridad del caché global de dependencias..."
if [ ! -d "node_modules" ]; then
    log_warn "No se detectó 'node_modules' en la raíz. Ejecutando instalación base..."
    pnpm install --frozen-lockfile || npm ci
fi

if [ ! -d "${GLOBAL_CACHE_DIR}" ]; then
    log_info "Creando repositorio espejo de dependencias en el caché global..."
    mkdir -p "$(dirname "${GLOBAL_CACHE_DIR}")"
    cp -R node_modules "${GLOBAL_CACHE_DIR}"
fi

# --- PASO 2: APROVISIONAMIENTO DEL WORKTREE DE GIT ---
log_info "Inicializando espacio de trabajo aislado (Worktree) en: ${TARGET_PATH}"

if [ -d "${TARGET_PATH}" ]; then
    log_warn "El directorio objetivo ya existe. Limpiando metadatos previos..."
    git worktree remove "${TARGET_PATH}" --force 2>/dev/null || true
    rm -rf "${TARGET_PATH}"
fi

# Crear u obtener rama y enlazar worktree
if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
    log_info "La rama '${BRANCH_NAME}' ya existe. Enlazando directamente..."
    git worktree add "${TARGET_PATH}" "${BRANCH_NAME}"
else
    log_info "Creando nueva rama '${BRANCH_NAME}' ramificada desde '${BASE_BRANCH}'..."
    git worktree add -b "${BRANCH_NAME}" "${TARGET_PATH}" "${BASE_BRANCH}"
fi

# --- PASO 3: ENLACE SIMBÓLICO ATÓMICO DE NODE_MODULES ---
log_info "Inyectando enlace simbólico inmutable hacia el caché compartido..."
rm -rf "${TARGET_PATH}/node_modules" # Prevenir colisiones
ln -s "${GLOBAL_CACHE_DIR}" "${TARGET_PATH}/node_modules" 2>/dev/null || {
    if command -v cmd.exe >/dev/null 2>&1; then
        win_target=$(cygpath -w "${GLOBAL_CACHE_DIR}" 2>/dev/null || echo "${GLOBAL_CACHE_DIR}")
        win_link=$(cygpath -w "${TARGET_PATH}/node_modules" 2>/dev/null || echo "${TARGET_PATH}/node_modules")
        cmd.exe //c "mklink /J \"$win_link\" \"$win_target\"" >/dev/null 2>&1 || true
    fi
}

# --- PASO 4: CONFIGURACIÓN ANTIGRAVITY UI & ACOPLAMIENTO PEACOCK ---
log_info "Configurando interfaz visual del IDE para evitar fatiga cognitiva del operador..."
VSCODE_SETTINGS_DIR="${TARGET_PATH}/.vscode"
mkdir -p "${VSCODE_SETTINGS_DIR}"

cat <<EOF > "${VSCODE_SETTINGS_DIR}/settings.json"
{
    "peacock.color": "${PEACOCK_COLOR}",
    "peacock.affectStatusBar": true,
    "peacock.affectTitleBar": true,
    "peacock.affectActivityBar": true,
    "files.readonlyFromRepositories": {
        "**/pnpm-lock.yaml": true,
        "**/package-lock.json": true
    }
}
EOF

# --- PASO 5: INYECCIÓN DE TIPOS EN TIEMPO REAL (SOLO PARA FRENTES FRONTEND/NEXT-GEN) ---
if [ "${AGENT_TYPE}" == "frontend" ]; then
    log_info "Ejecutando sincronización de contratos de datos con Supabase..."
    if command -v supabase &> /dev/null; then
        cd "${TARGET_PATH}/ferreon-erp-nextjs" 2>/dev/null || cd "${TARGET_PATH}"
        
        if supabase status &> /dev/null; then
            log_info "Generando tipado TypeScript relacional (frios-pezca-data-types)..."
            mkdir -p src/types
            supabase gen types typescript --local > src/types/supabase.ts || log_warn "No se pudo autogenerar el tipado. El agente backend deberá resolverlo."
        else
            log_warn "El contenedor de Supabase no está corriendo localmente. Saltando tipado estricto."
        fi
        cd "${ROOT_DIR}"
    else
        log_warn "Supabase CLI no detectado en el PATH global de este entorno."
    fi
fi

# --- PASO 6: INICIALIZACIÓN DE LA MEMORIA DEL ENJAMBRE ---
log_info "Vinculando entorno al analizador AST de GitNexus..."
if command -v gitnexus &> /dev/null; then
    (cd "${TARGET_PATH}" && gitnexus impact --init-context || true)
fi

log_success "¡Espacio paralelo aprovisionado con éxito!"
echo -e "${CYAN}------------------------------------------------------------"
echo -e " Agente Asignado : ${AGENT_TYPE^^}"
echo -e " Rama Activa     : ${BRANCH_NAME}"
echo -e " Ruta Física     : ${TARGET_PATH}"
echo -e " Color de Enfoque: ${PEACOCK_COLOR}"
echo -e "------------------------------------------------------------${NC}"
