import fs from 'node:fs';
import path from 'node:path';
import { chromium, defineConfig, devices } from '@playwright/test';

const isLiveMode = process.env.E2E_LIVE === '1' || process.env.E2E_LIVE_DB === '1';
const defaultPort = isLiveMode ? '3000' : process.env.E2E_PORT || '3100';
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${defaultPort}`;
const parsedBaseUrl = new URL(baseURL);
const targetPort = parsedBaseUrl.port || (parsedBaseUrl.protocol === 'https:' ? '443' : '80');
const mockSupabasePort = process.env.E2E_MOCK_SUPABASE_PORT || '54329';

const isExternalTarget =
  process.env.E2E_SKIP_WEBSERVER === '1' ||
  Boolean(
    process.env.BASE_URL &&
      !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(process.env.BASE_URL)
  );

function resolveChromiumConfig(): {
  channel?: string;
  executablePath?: string;
} {
  if (process.env.PW_CHANNEL) {
    return { channel: process.env.PW_CHANNEL };
  }

  if (process.env.E2E_CHROMIUM_PATH && fs.existsSync(process.env.E2E_CHROMIUM_PATH)) {
    return { executablePath: process.env.E2E_CHROMIUM_PATH };
  }

  try {
    const defaultExec = chromium.executablePath();
    if (defaultExec && fs.existsSync(defaultExec)) {
      return {};
    }
  } catch {
    // Fallback below if executablePath resolution fails
  }

  const browsersRoot =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'ms-playwright') : '');

  if (browsersRoot && fs.existsSync(browsersRoot)) {
    const entries = fs
      .readdirSync(browsersRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
      .reverse();

    for (const dir of entries) {
      if (dir.startsWith('chromium-')) {
        const winChrome = path.join(browsersRoot, dir, 'chrome-win64', 'chrome.exe');
        if (fs.existsSync(winChrome)) {
          return { executablePath: winChrome };
        }
      }
    }

    for (const dir of entries) {
      if (dir.startsWith('chromium_headless_shell-')) {
        const winShell = path.join(
          browsersRoot,
          dir,
          'chrome-headless-shell-win64',
          'chrome-headless-shell.exe'
        );
        if (fs.existsSync(winShell)) {
          return { executablePath: winShell };
        }
      }
    }
  }

  const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (fs.existsSync(systemChrome)) {
    return { channel: 'chrome' };
  }

  const systemEdge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(systemEdge)) {
    return { channel: 'msedge' };
  }

  return {};
}

const browserResolution = resolveChromiumConfig();
const desktopChromeDevice = { ...devices['Desktop Chrome'] };
if (browserResolution.executablePath) {
  delete (desktopChromeDevice as { channel?: string }).channel;
}

const liveCommand =
  process.env.E2E_SERVER_MODE === 'start'
    ? `npx next start -p ${targetPort} -H 127.0.0.1`
    : `npx next dev -p ${targetPort} -H 127.0.0.1`;

/**
 * Configuración E2E de Playwright para Alquileres System (FerreOn ERP & WMS)
 * Soporta Modo Mock Offline determinístico (default) y Modo Live (`E2E_LIVE=1`).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...(browserResolution.channel ? { channel: browserResolution.channel } : {}),
    ...(browserResolution.executablePath
      ? { launchOptions: { executablePath: browserResolution.executablePath } }
      : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...desktopChromeDevice,
        ...(browserResolution.channel ? { channel: browserResolution.channel } : {}),
        ...(browserResolution.executablePath
          ? { launchOptions: { executablePath: browserResolution.executablePath } }
          : {}),
      },
    },
  ],
  webServer: isExternalTarget
    ? undefined
    : isLiveMode
      ? {
          command: liveCommand,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        }
      : {
          command: 'node e2e/helpers/e2e-webserver.mjs',
          url: `${baseURL}/auth/login`,
          reuseExistingServer: false,
          timeout: 120_000,
          env: {
            ...process.env,
            E2E_PORT: targetPort,
            E2E_HOST: parsedBaseUrl.hostname,
            E2E_MOCK_SUPABASE_PORT: mockSupabasePort,
            E2E_MODE: 'offline',
          },
        },
});
