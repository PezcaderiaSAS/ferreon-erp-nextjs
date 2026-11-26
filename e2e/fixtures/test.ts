import {
  test as base,
  expect,
  request as playwrightRequest,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import {
  buildMockSession,
  createMockDbClient,
  DEFAULT_MOCK_SUPABASE_URL,
  type MockDbClient,
  type MockSupabaseSession,
  type MockUserSeed,
} from '../helpers/mock-supabase';
import { E2EHttpClient } from '../helpers/http-client';
import { buildCookieHeader, injectAuthCookies } from './auth-cookies';
import { TENANT_A, TENANT_B } from './tenants';

export interface E2EFixtures {
  mockDb: MockDbClient;
  authedPage: Page;
  tenantBPage: Page;
  unauthPage: Page;
  httpClient: E2EHttpClient;
  authedHttpClient: E2EHttpClient;
  tenantBHttpClient: E2EHttpClient;
}

const isLiveMode = process.env.E2E_LIVE === '1' || process.env.E2E_LIVE_DB === '1';

function getSupabaseBaseUrl(): string {
  if (isLiveMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
  return DEFAULT_MOCK_SUPABASE_URL;
}

async function resolveSessionForIdentity(identity: MockUserSeed): Promise<MockSupabaseSession> {
  const supabaseUrl = getSupabaseBaseUrl();

  if (isLiveMode) {
    const email =
      identity.id === TENANT_A.id
        ? process.env.E2E_TEST_EMAIL || identity.email
        : process.env.E2E_TEST_EMAIL_B || identity.email;
    const password =
      identity.id === TENANT_A.id
        ? process.env.E2E_TEST_PASSWORD || identity.password
        : process.env.E2E_TEST_PASSWORD_B || identity.password;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!anonKey || !password) {
      throw new Error(
        `Live E2E mode requires NEXT_PUBLIC_SUPABASE_ANON_KEY and credentials for ${email}`
      );
    }
    const res = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new Error(`Live Supabase sign-in failed (${res.status}) for ${email}`);
    }
    return (await res.json()) as MockSupabaseSession;
  }

  return buildMockSession(identity, supabaseUrl);
}

function attachRuntimeErrorTrackers(page: Page): {
  assertClean: () => void;
} {
  const pageErrors: string[] = [];
  const serverErrors: string[] = [];

  page.on('pageerror', (err) => {
    pageErrors.push(err?.message || String(err));
  });

  page.on('response', (res) => {
    const status = res.status();
    if (status >= 500) {
      serverErrors.push(`${res.request().method()} ${res.url()} -> ${status}`);
    }
  });

  return {
    assertClean() {
      expect(pageErrors, `Uncaught pageerror(s): ${pageErrors.join(' | ')}`).toEqual([]);
      expect(serverErrors, `HTTP 5xx response(s): ${serverErrors.join(' | ')}`).toEqual([]);
    },
  };
}

async function createCleanContextWithSession(
  browser: Browser,
  baseURL: string,
  session: MockSupabaseSession | null
): Promise<{ context: BrowserContext; page: Page; tracker: ReturnType<typeof attachRuntimeErrorTrackers> }> {
  const context = await browser.newContext({ baseURL });
  await context.addInitScript(() => {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // Ignore storage restrictions on about:blank
    }
  });
  if (session) {
    await injectAuthCookies(context, baseURL, session, getSupabaseBaseUrl());
  }
  const page = await context.newPage();
  const tracker = attachRuntimeErrorTrackers(page);
  return { context, page, tracker };
}

export const test = base.extend<E2EFixtures>({
  mockDb: async ({}, use) => {
    const client = createMockDbClient(DEFAULT_MOCK_SUPABASE_URL, !isLiveMode);
    if (client.isEnabled) {
      await client.reset();
    }
    await use(client);
  },

  authedPage: async ({ browser, baseURL, mockDb }, use) => {
    void mockDb;
    const resolvedBaseUrl = baseURL || 'http://127.0.0.1:3100';
    const session = await resolveSessionForIdentity(TENANT_A);
    const { context, page, tracker } = await createCleanContextWithSession(
      browser,
      resolvedBaseUrl,
      session
    );
    await use(page);
    tracker.assertClean();
    await context.close();
  },

  tenantBPage: async ({ browser, baseURL, mockDb }, use) => {
    void mockDb;
    const resolvedBaseUrl = baseURL || 'http://127.0.0.1:3100';
    const session = await resolveSessionForIdentity(TENANT_B);
    const { context, page, tracker } = await createCleanContextWithSession(
      browser,
      resolvedBaseUrl,
      session
    );
    await use(page);
    tracker.assertClean();
    await context.close();
  },

  unauthPage: async ({ browser, baseURL, mockDb }, use) => {
    void mockDb;
    const resolvedBaseUrl = baseURL || 'http://127.0.0.1:3100';
    const { context, page, tracker } = await createCleanContextWithSession(
      browser,
      resolvedBaseUrl,
      null
    );
    await use(page);
    tracker.assertClean();
    await context.close();
  },

  httpClient: async ({ baseURL, mockDb }, use) => {
    void mockDb;
    const resolvedBaseUrl = baseURL || 'http://127.0.0.1:3100';
    const apiContext = await playwrightRequest.newContext({ baseURL: resolvedBaseUrl });
    await use(new E2EHttpClient(apiContext));
    await apiContext.dispose();
  },

  authedHttpClient: async ({ baseURL, mockDb }, use) => {
    void mockDb;
    const resolvedBaseUrl = baseURL || 'http://127.0.0.1:3100';
    const session = await resolveSessionForIdentity(TENANT_A);
    const cookieHeader = buildCookieHeader(session, getSupabaseBaseUrl());
    const apiContext = await playwrightRequest.newContext({
      baseURL: resolvedBaseUrl,
      extraHTTPHeaders: {
        Cookie: cookieHeader,
      },
    });
    await use(new E2EHttpClient(apiContext));
    await apiContext.dispose();
  },

  tenantBHttpClient: async ({ baseURL, mockDb }, use) => {
    void mockDb;
    const resolvedBaseUrl = baseURL || 'http://127.0.0.1:3100';
    const session = await resolveSessionForIdentity(TENANT_B);
    const cookieHeader = buildCookieHeader(session, getSupabaseBaseUrl());
    const apiContext = await playwrightRequest.newContext({
      baseURL: resolvedBaseUrl,
      extraHTTPHeaders: {
        Cookie: cookieHeader,
      },
    });
    await use(new E2EHttpClient(apiContext));
    await apiContext.dispose();
  },
});

export { expect };
