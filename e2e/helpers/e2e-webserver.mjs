import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  createMockSupabaseServer,
  MOCK_ANON_KEY,
  MOCK_SERVICE_ROLE_KEY,
} from './mock-supabase-server.mjs';

const require = createRequire(import.meta.url);

const appPort = String(process.env.E2E_PORT || 3100);
const appHost = String(process.env.E2E_HOST || '127.0.0.1');
const mockPort = Number(process.env.E2E_MOCK_SUPABASE_PORT || 54329);
const mockHost = String(process.env.E2E_MOCK_SUPABASE_HOST || '127.0.0.1');
const serverMode = process.env.E2E_SERVER_MODE === 'start' ? 'start' : 'dev';

const mockBaseUrl = `http://${mockHost}:${mockPort}`;
const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://${appHost}:${appPort}`;

async function waitForMockHealth(url, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/__e2e__/health`);
      if (res.ok) {
        const data = await res.json();
        if (data?.ok) return;
      }
    } catch {
      // Retry until ready
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`MockSupabaseServer failed health check at ${url}/__e2e__/health`);
}

async function main() {
  const mockServer = createMockSupabaseServer({ port: mockPort, host: mockHost });
  await mockServer.start();
  await waitForMockHealth(mockBaseUrl);
  console.log(`[e2e-webserver] MockSupabaseServer ready at ${mockBaseUrl}`);

  const nextBinPath = require.resolve('next/dist/bin/next');
  const nextArgs = [nextBinPath, serverMode, '-p', appPort, '-H', appHost];

  const isolatedEnv = {
    ...process.env,
    NODE_ENV: serverMode === 'start' ? 'production' : 'development',
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PUBLIC_SUPABASE_URL: mockBaseUrl,
    SUPABASE_URL: mockBaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: MOCK_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: MOCK_SERVICE_ROLE_KEY,
    SUPABASE_SECRET_KEY: MOCK_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL: appBaseUrl,
    NEXT_PUBLIC_SITE_URL: appBaseUrl,
    CRON_SECRET: 'e2e-mock-cron-secret-000000',
    DATABASE_URL: 'postgresql://e2e:e2e@127.0.0.1:5432/e2e_mock',
    DIRECT_URL: 'postgresql://e2e:e2e@127.0.0.1:5432/e2e_mock',
    UPSTASH_REDIS_REST_URL: '',
    UPSTASH_REDIS_REST_TOKEN: '',
    ALLOW_INDEXING: 'false',
    VERCEL_ENV: process.env.VERCEL_ENV || 'development',
  };

  console.log(`[e2e-webserver] Starting next ${serverMode} on ${appBaseUrl}...`);
  const nextChild = spawn(process.execPath, nextArgs, {
    stdio: 'inherit',
    env: isolatedEnv,
    windowsHide: true,
  });

  let shuttingDown = false;
  const shutdown = async (signal = 'SIGTERM', exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      if (!nextChild.killed) {
        nextChild.kill(signal);
      }
    } catch {
      // Ignore child kill errors
    }
    try {
      await mockServer.stop();
    } catch {
      // Ignore server stop errors
    }
    process.exit(exitCode);
  };

  nextChild.on('exit', async (code) => {
    await shutdown('SIGTERM', code ?? 0);
  });

  nextChild.on('error', async (err) => {
    console.error('[e2e-webserver] Next.js process error:', err);
    await shutdown('SIGTERM', 1);
  });

  process.on('SIGINT', () => shutdown('SIGINT', 0));
  process.on('SIGTERM', () => shutdown('SIGTERM', 0));
}

main().catch((err) => {
  console.error('[e2e-webserver] Fatal startup error:', err);
  process.exit(1);
});
