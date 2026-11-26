import type { BrowserContext } from '@playwright/test';
import {
  DEFAULT_MOCK_SUPABASE_URL,
  type MockSupabaseSession,
} from '../helpers/mock-supabase';

const MAX_CHUNK_SIZE = 3180;

export function getSupabaseCookieName(
  supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_MOCK_SUPABASE_URL
): string {
  const parsed = new URL(supabaseUrl);
  const projectRef = parsed.hostname.split('.')[0];
  return `sb-${projectRef}-auth-token`;
}

export function encodeSupabaseSessionCookieValue(session: MockSupabaseSession): string {
  const json = JSON.stringify(session);
  return `base64-${Buffer.from(json, 'utf8').toString('base64url')}`;
}

export function chunkCookieValue(
  name: string,
  value: string,
  maxChunkSize: number = MAX_CHUNK_SIZE
): Array<{ name: string; value: string }> {
  const encodedLen = encodeURIComponent(value).length;
  if (encodedLen <= maxChunkSize) {
    return [{ name, value }];
  }

  const chunks: Array<{ name: string; value: string }> = [];
  let cursor = 0;
  let index = 0;
  while (cursor < value.length) {
    const slice = value.slice(cursor, cursor + maxChunkSize);
    chunks.push({ name: `${name}.${index}`, value: slice });
    cursor += maxChunkSize;
    index += 1;
  }
  return chunks;
}

export function buildSupabasePlaywrightCookies(
  baseUrl: string,
  session: MockSupabaseSession,
  supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_MOCK_SUPABASE_URL
): Array<{
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Lax';
}> {
  const parsedBase = new URL(baseUrl);
  const cookieName = getSupabaseCookieName(supabaseUrl);
  const encodedValue = encodeSupabaseSessionCookieValue(session);
  const chunks = chunkCookieValue(cookieName, encodedValue);

  return chunks.map((chunk) => ({
    name: chunk.name,
    value: chunk.value,
    domain: parsedBase.hostname,
    path: '/',
    httpOnly: false,
    secure: parsedBase.protocol === 'https:',
    sameSite: 'Lax' as const,
  }));
}

export async function injectAuthCookies(
  context: BrowserContext,
  baseUrl: string,
  session: MockSupabaseSession,
  supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_MOCK_SUPABASE_URL
): Promise<void> {
  const cookies = buildSupabasePlaywrightCookies(baseUrl, session, supabaseUrl);
  await context.addCookies(cookies);
}

export function buildCookieHeader(
  session: MockSupabaseSession,
  supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_MOCK_SUPABASE_URL
): string {
  const cookieName = getSupabaseCookieName(supabaseUrl);
  const encodedValue = encodeSupabaseSessionCookieValue(session);
  const chunks = chunkCookieValue(cookieName, encodedValue);
  return chunks.map((c) => `${c.name}=${c.value}`).join('; ');
}
