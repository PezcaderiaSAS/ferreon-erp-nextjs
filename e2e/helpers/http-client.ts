import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  maxRedirects?: number;
  timeout?: number;
}

export interface HttpResult<T = unknown> {
  status: number;
  headers: Record<string, string>;
  bodyText: string;
  json: T | null;
  response: APIResponse;
}

function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k.toLowerCase()] = v;
  }
  return out;
}

async function parseResponse<T>(response: APIResponse): Promise<HttpResult<T>> {
  const status = response.status();
  const headers = normalizeHeaders(response.headers());
  const bodyText = await response.text();
  let json: T | null = null;
  if (bodyText) {
    try {
      json = JSON.parse(bodyText) as T;
    } catch {
      json = null;
    }
  }
  return { status, headers, bodyText, json, response };
}

export class E2EHttpClient {
  constructor(private readonly api: APIRequestContext) {}

  async get<T = unknown>(path: string, opts: HttpRequestOptions = {}): Promise<HttpResult<T>> {
    const response = await this.api.get(path, {
      headers: opts.headers,
      maxRedirects: opts.maxRedirects,
      timeout: opts.timeout,
    });
    return parseResponse<T>(response);
  }

  async post<T = unknown>(
    path: string,
    body?: unknown,
    opts: HttpRequestOptions = {}
  ): Promise<HttpResult<T>> {
    const response = await this.api.post(path, {
      data: body,
      headers: opts.headers,
      maxRedirects: opts.maxRedirects,
      timeout: opts.timeout,
    });
    return parseResponse<T>(response);
  }

  async put<T = unknown>(
    path: string,
    body?: unknown,
    opts: HttpRequestOptions = {}
  ): Promise<HttpResult<T>> {
    const response = await this.api.put(path, {
      data: body,
      headers: opts.headers,
      maxRedirects: opts.maxRedirects,
      timeout: opts.timeout,
    });
    return parseResponse<T>(response);
  }

  async patch<T = unknown>(
    path: string,
    body?: unknown,
    opts: HttpRequestOptions = {}
  ): Promise<HttpResult<T>> {
    const response = await this.api.patch(path, {
      data: body,
      headers: opts.headers,
      maxRedirects: opts.maxRedirects,
      timeout: opts.timeout,
    });
    return parseResponse<T>(response);
  }

  async delete<T = unknown>(path: string, opts: HttpRequestOptions = {}): Promise<HttpResult<T>> {
    const response = await this.api.delete(path, {
      headers: opts.headers,
      maxRedirects: opts.maxRedirects,
      timeout: opts.timeout,
    });
    return parseResponse<T>(response);
  }

  async getRobotsTxt(opts: HttpRequestOptions = {}): Promise<{
    status: number;
    headers: Record<string, string>;
    body: string;
  }> {
    const res = await this.get('/robots.txt', opts);
    return {
      status: res.status,
      headers: res.headers,
      body: res.bodyText,
    };
  }

  assertHeader(
    headers: Record<string, string>,
    name: string,
    expected: string | RegExp
  ): void {
    const normalized = normalizeHeaders(headers);
    const val = normalized[name.toLowerCase()];
    expect(val, `Expected header '${name}' to be present`).toBeDefined();
    if (typeof expected === 'string') {
      expect(val).toBe(expected);
    } else {
      expect(val).toMatch(expected);
    }
  }

  assertNoIndexHeaders(responseOrHeaders: HttpResult | Record<string, string>): void {
    const headers =
      'headers' in responseOrHeaders && 'status' in responseOrHeaders
        ? (responseOrHeaders as HttpResult).headers
        : normalizeHeaders(responseOrHeaders as Record<string, string>);
    const xRobots = headers['x-robots-tag'] || '';
    expect(xRobots.toLowerCase()).toContain('noindex');
    expect(xRobots.toLowerCase()).toContain('nofollow');
  }

  async assertRedirect(
    path: string,
    expectedStatus: number | number[],
    expectedLocationRegex: RegExp,
    opts: HttpRequestOptions = {}
  ): Promise<HttpResult> {
    const res = await this.get(path, { ...opts, maxRedirects: 0 });
    const allowed = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    expect(
      allowed,
      `Expected ${path} to return redirect ${allowed.join('/')} but got ${res.status}`
    ).toContain(res.status);
    const location = res.headers['location'] || '';
    expect(
      location,
      `Expected Location header on ${path} to match ${expectedLocationRegex}, got '${location}'`
    ).toMatch(expectedLocationRegex);
    return res;
  }

  async assertUnauthorized(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    opts: HttpRequestOptions = {}
  ): Promise<HttpResult> {
    let res: HttpResult;
    const reqOpts = { ...opts, maxRedirects: 0 };
    if (method === 'GET') res = await this.get(path, reqOpts);
    else if (method === 'POST') res = await this.post(path, body, reqOpts);
    else if (method === 'PUT') res = await this.put(path, body, reqOpts);
    else if (method === 'PATCH') res = await this.patch(path, body, reqOpts);
    else res = await this.delete(path, reqOpts);

    if (res.status === 307 || res.status === 302) {
      expect(res.headers['location'] || '').toMatch(/\/auth\/login/);
    } else {
      expect(
        [401, 403],
        `Expected ${method} ${path} unauthenticated to return 401/403 (or 307->login), got ${res.status}`
      ).toContain(res.status);
    }
    return res;
  }
}
