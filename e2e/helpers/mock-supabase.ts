import crypto from 'node:crypto';

export const DEFAULT_MOCK_SUPABASE_PORT = Number(process.env.E2E_MOCK_SUPABASE_PORT || 54329);
export const DEFAULT_MOCK_SUPABASE_URL =
  process.env.E2E_MOCK_SUPABASE_URL || `http://127.0.0.1:${DEFAULT_MOCK_SUPABASE_PORT}`;

export const MOCK_JWT_SECRET = 'e2e-mock-jwt-secret-alquileres-system-2026';
export const MOCK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e2e-mock-anon-key-00000000000000000000';
export const MOCK_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e2e-mock-service-role-key-000000000000';

export interface MockUserMetadata {
  nombre?: string;
  rol?: string;
  empresa_id?: string;
  terminos_version?: string;
  [key: string]: unknown;
}

export interface MockUserSeed {
  id: string;
  email: string;
  password?: string;
  user_metadata: MockUserMetadata;
  app_metadata?: Record<string, unknown>;
}

export interface MockRpcOverride {
  status?: number;
  data?: unknown;
  error?: {
    code?: string;
    message: string;
    details?: string | null;
    hint?: string | null;
  };
}

export interface MockSeedPayload {
  resetFirst?: boolean;
  tables?: Record<string, Record<string, unknown>[]>;
  replaceTables?: Record<string, Record<string, unknown>[]>;
  users?: MockUserSeed[];
  rpcs?: Record<string, MockRpcOverride>;
}

export interface MockRequestRecord {
  timestamp: string;
  method: string;
  path: string;
  query: string;
  body: unknown;
  authMode: 'anon' | 'authenticated' | 'service_role';
  tenantId: string | null;
  status: number;
}

export interface MockStateSnapshot {
  tables: Record<string, Record<string, unknown>[]>;
  users: Array<{ id: string; email: string; user_metadata: MockUserMetadata }>;
  rpcOverrides: Record<string, MockRpcOverride>;
}

export interface MockSupabaseSession {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: {
    id: string;
    aud: string;
    role: string;
    email: string;
    email_confirmed_at: string;
    phone: string;
    confirmed_at: string;
    last_sign_in_at: string;
    app_metadata: Record<string, unknown>;
    user_metadata: MockUserMetadata;
    identities: unknown[];
    created_at: string;
    updated_at: string;
  };
}

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function signMockJwt(
  payload: Record<string, unknown>,
  secret: string = MOCK_JWT_SECRET
): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest()
  );
  return `${header}.${body}.${sig}`;
}

export function buildMockSession(
  user: MockUserSeed,
  supabaseUrl: string = DEFAULT_MOCK_SUPABASE_URL,
  secret: string = MOCK_JWT_SECRET
): MockSupabaseSession {
  const nowSec = Math.floor(Date.now() / 1000);
  const expiresIn = 3600;
  const nowIso = new Date(nowSec * 1000).toISOString();
  const appMeta = user.app_metadata || { provider: 'email', providers: ['email'] };
  const issuer = `${supabaseUrl.replace(/\/+$/, '')}/auth/v1`;

  const accessToken = signMockJwt(
    {
      aud: 'authenticated',
      exp: nowSec + expiresIn,
      iat: nowSec,
      iss: issuer,
      sub: user.id,
      email: user.email,
      phone: '',
      app_metadata: appMeta,
      user_metadata: user.user_metadata,
      role: 'authenticated',
      aal: 'aal1',
      session_id: `sess-${user.id}`,
    },
    secret
  );

  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: expiresIn,
    expires_at: nowSec + expiresIn,
    refresh_token: `mock-refresh-${user.id}`,
    user: {
      id: user.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      email_confirmed_at: '2026-01-01T00:00:00.000Z',
      phone: '',
      confirmed_at: '2026-01-01T00:00:00.000Z',
      last_sign_in_at: nowIso,
      app_metadata: appMeta,
      user_metadata: user.user_metadata,
      identities: [],
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: nowIso,
    },
  };
}

export interface MockDbClient {
  readonly baseUrl: string;
  readonly isEnabled: boolean;
  health(): Promise<{ ok: boolean; mode: string; port: number; tables: string[] }>;
  reset(): Promise<void>;
  seed(payload: MockSeedPayload): Promise<void>;
  getState(): Promise<MockStateSnapshot>;
  getRequests(clear?: boolean): Promise<MockRequestRecord[]>;
  clearRequests(): Promise<void>;
}

export function createMockDbClient(
  baseUrl: string = DEFAULT_MOCK_SUPABASE_URL,
  isEnabled: boolean = process.env.E2E_LIVE !== '1' && process.env.E2E_LIVE_DB !== '1'
): MockDbClient {
  const normalizedUrl = baseUrl.replace(/\/+$/, '');

  async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    if (!isEnabled) {
      throw new Error(
        `MockDbClient operation '${path}' is disabled in E2E_LIVE mode. Use live test credentials instead.`
      );
    }
    const res = await fetch(`${normalizedUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MockSupabase control plane ${path} failed (${res.status}): ${text}`);
    }
    return (await res.json()) as T;
  }

  return {
    baseUrl: normalizedUrl,
    isEnabled,
    async health() {
      return requestJson('/__e2e__/health', { method: 'GET' });
    },
    async reset() {
      await requestJson('/__e2e__/reset', { method: 'POST', body: '{}' });
    },
    async seed(payload: MockSeedPayload) {
      await requestJson('/__e2e__/seed', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async getState() {
      return requestJson('/__e2e__/state', { method: 'GET' });
    },
    async getRequests(clear = false) {
      const suffix = clear ? '?clear=1' : '';
      const data = await requestJson<{ requests: MockRequestRecord[] }>(
        `/__e2e__/requests${suffix}`,
        { method: 'GET' }
      );
      return data.requests;
    },
    async clearRequests() {
      await requestJson('/__e2e__/requests', { method: 'DELETE' });
    },
  };
}
