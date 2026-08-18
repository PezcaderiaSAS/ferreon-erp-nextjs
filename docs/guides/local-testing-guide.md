# Guía de Ejecución de Pruebas Locales (FerreOn ERP — `alquileres_app`)

**Proyecto:** FerreOn ERP  
**Fecha:** 2026-08-18  

---

## 1. Prerrequisitos de Entorno Local

Para ejecutar las pruebas y la aplicación en tu máquina local (Windows PowerShell), asegúrate de contar con:

1. **Node.js LTS (v20 o superior):**
   Si no lo tienes instalado, abre una PowerShell como Administrador e instala en 1 segundo con `winget`:
   ```powershell
   winget install OpenJS.NodeJS
   ```
2. **Git:** Instalado y configurado.
3. **Docker Desktop (Opcional para Supabase Local):** Solo necesario si deseas ejecutar una instancia local completa de Supabase en tu equipo.

---

## 2. Instalación Inicial de Dependencias

Navega a la carpeta del proyecto en PowerShell e instala los paquetes:

```powershell
cd ferreon-erp-nextjs
npm install
```

Configura tu archivo de variables locales copiando la plantilla:

```powershell
cp .env.example .env.local
```

---

## 3. Ejecución de Pruebas Unitarias y de Dominio (Vitest)

Las pruebas unitarias verifican la lógica de negocio pura (Value Object `PesoGramos`, `AlquilerEntity`, `CrearAlquilerUseCase`) sin necesidad de conectarse a una base de datos real.

### Comandos de Pruebas Unitarias:

```powershell
# Ejecutar todas las pruebas unitarias en modo lectura única (CI mode)
npm run test

# Ejecutar pruebas en modo observador (Re-ejecuta al modificar archivos)
npm run test:watch

# Generar reporte de cobertura de código (Objetivo >= 80%)
npm run test:coverage
```

---

## 4. Ejecución de Pruebas End-to-End / Visuales (Playwright)

Las pruebas E2E simulan la interacción real de un usuario navegando por la pantalla desde navegadores Chromium, Firefox o WebKit (Mobile & Desktop).

### Comandos Playwright:

```powershell
# Instalar los navegadores de Playwright (solo la primera vez)
npx playwright install

# Ejecutar las pruebas E2E en modo headless
npm run test:e2e

# Abrir la interfaz gráfica interactiva de Playwright
npx playwright test --ui
```

---

## 5. Pruebas Locales de Base de Datos con Supabase CLI (Opcional)

Si deseas probar las políticas RLS y los triggers SQL en un entorno local antes de subir a la nube de Supabase:

```powershell
# 1. Iniciar Supabase Local (requiere Docker Desktop encendido)
npx supabase start

# 2. Aplicar migraciones SQL locales
npx supabase db reset

# 3. Ver panel de control de Supabase Local en el navegador
# URL: http://localhost:54323
```
