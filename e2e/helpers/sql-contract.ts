import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();

/**
 * Removes SQL line comments (-- ...) and block comments (/* ... *\/) ONLY outside
 * single-quoted strings ('...') and PostgreSQL dollar-quoted blocks ($$...$$ or $tag$...$tag$).
 */
export function stripSqlComments(sql: string): string {
  const out: string[] = [];
  let i = 0;
  const len = sql.length;

  while (i < len) {
    const ch = sql[i];
    const next = i + 1 < len ? sql[i + 1] : '';

    // Single-quoted SQL string literal (handles '' escape)
    if (ch === "'") {
      out.push(ch);
      i += 1;
      while (i < len) {
        out.push(sql[i]);
        if (sql[i] === "'") {
          if (i + 1 < len && sql[i + 1] === "'") {
            out.push(sql[i + 1]);
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    // Dollar-quoted literal: $tag$ ... $tag$
    if (ch === '$') {
      const rest = sql.slice(i);
      const tagMatch = rest.match(/^\$([A-Za-z_][A-Za-z0-9_]*)?\$/);
      if (tagMatch) {
        const tag = tagMatch[0];
        const endIdx = sql.indexOf(tag, i + tag.length);
        if (endIdx !== -1) {
          out.push(sql.slice(i, endIdx + tag.length));
          i = endIdx + tag.length;
          continue;
        }
      }
    }

    // Line comment: -- ... \n
    if (ch === '-' && next === '-') {
      i += 2;
      while (i < len && sql[i] !== '\n') {
        i += 1;
      }
      if (i < len && sql[i] === '\n') {
        out.push('\n');
        i += 1;
      }
      continue;
    }

    // Block comment: /* ... */ (supports PostgreSQL nested block comments)
    if (ch === '/' && next === '*') {
      let depth = 1;
      i += 2;
      while (i < len && depth > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') {
          depth += 1;
          i += 2;
        } else if (sql[i] === '*' && sql[i + 1] === '/') {
          depth -= 1;
          i += 2;
        } else {
          if (sql[i] === '\n') out.push('\n');
          i += 1;
        }
      }
      out.push(' ');
      continue;
    }

    out.push(ch);
    i += 1;
  }

  return out.join('');
}

export async function loadMigration(filenameOrPattern: string | RegExp): Promise<{
  filePath: string;
  raw: string;
  stripped: string;
}> {
  const migrationsDir = path.join(REPO_ROOT, 'supabase', 'migrations');
  if (!existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }
  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  let matched: string | undefined;

  if (typeof filenameOrPattern === 'string') {
    matched =
      files.find((f) => f === filenameOrPattern) ||
      files.find((f) => f.includes(filenameOrPattern));
  } else {
    matched = files.find((f) => filenameOrPattern.test(f));
  }

  if (!matched) {
    throw new Error(
      `Expected migration matching '${String(filenameOrPattern)}' not found in ${migrationsDir}`
    );
  }

  const filePath = path.join(migrationsDir, matched);
  const raw = await fs.readFile(filePath, 'utf8');
  return { filePath, raw, stripped: stripSqlComments(raw) };
}

export async function loadSqlScript(relativePath: string): Promise<{
  filePath: string;
  raw: string;
  stripped: string;
}> {
  const filePath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(REPO_ROOT, relativePath);
  if (!existsSync(filePath)) {
    throw new Error(`Expected SQL script not found: ${filePath}`);
  }
  const raw = await fs.readFile(filePath, 'utf8');
  return { filePath, raw, stripped: stripSqlComments(raw) };
}

export function assertMigrationMatches(
  sql: string,
  pattern: RegExp,
  description: string
): void {
  const stripped = stripSqlComments(sql);
  if (!pattern.test(stripped)) {
    throw new Error(
      `SQL contract assertion failed (${description}): expected stripped SQL to match ${pattern}`
    );
  }
}

export function assertMigrationNotMatches(
  sql: string,
  pattern: RegExp,
  description: string
): void {
  const stripped = stripSqlComments(sql);
  if (pattern.test(stripped)) {
    throw new Error(
      `SQL contract assertion failed (${description}): expected stripped SQL NOT to match ${pattern}`
    );
  }
}

export function extractCreateTableBlock(sql: string, tableName: string): string {
  const stripped = stripSqlComments(sql);
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startRegex = new RegExp(
    `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:public\\.)?${escaped}\\s*\\(`,
    'i'
  );
  const match = startRegex.exec(stripped);
  if (!match) {
    throw new Error(`CREATE TABLE block for '${tableName}' not found`);
  }
  const startIdx = match.index;
  let depth = 0;
  let inSingle = false;
  let i = match.index + match[0].length - 1;
  for (; i < stripped.length; i++) {
    const ch = stripped[i];
    if (ch === "'") {
      inSingle = !inSingle;
      continue;
    }
    if (!inSingle) {
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          const semi = stripped.indexOf(';', i);
          return stripped.slice(startIdx, semi !== -1 ? semi + 1 : i + 1);
        }
      }
    }
  }
  throw new Error(`Unclosed CREATE TABLE block for '${tableName}'`);
}

export function extractFunctionBody(sql: string, fnName: string): string {
  const stripped = stripSqlComments(sql);
  const escaped = fnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fnRegex = new RegExp(
    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+(?:public\\.)?${escaped}\\b[\\s\\S]*?AS\\s+(\\$[A-Za-z_0-9]*\\$)([\\s\\S]*?)\\1`,
    'i'
  );
  const match = fnRegex.exec(stripped);
  if (!match) {
    throw new Error(`Function body for '${fnName}' not found`);
  }
  return match[0];
}

export function extractPoliciesForTable(sql: string, tableName: string): string[] {
  const stripped = stripSqlComments(sql);
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const policyRegex = new RegExp(
    `CREATE\\s+POLICY\\s+(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_]*)\\s+ON\\s+(?:public\\.)?${escaped}\\b[\\s\\S]*?;`,
    'gi'
  );
  const matches = stripped.match(policyRegex);
  return matches || [];
}

function parseDotEnvKeysAndValues(content: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    map[key] = val;
  }
  return map;
}

export async function assertEnvExampleParity(
  prodPath: string = '.env.production.example',
  previewPath: string = '.env.preview.example'
): Promise<{ prodKeys: string[]; previewKeys: string[] }> {
  const absProd = path.isAbsolute(prodPath) ? prodPath : path.join(REPO_ROOT, prodPath);
  const absPrev = path.isAbsolute(previewPath) ? previewPath : path.join(REPO_ROOT, previewPath);

  if (!existsSync(absProd)) {
    throw new Error(`Missing production env example file: ${absProd}`);
  }
  if (!existsSync(absPrev)) {
    throw new Error(`Missing preview env example file: ${absPrev}`);
  }

  const prodVars = parseDotEnvKeysAndValues(await fs.readFile(absProd, 'utf8'));
  const prevVars = parseDotEnvKeysAndValues(await fs.readFile(absPrev, 'utf8'));

  const prodKeys = Object.keys(prodVars);
  const previewKeys = Object.keys(prevVars);

  const requiredKeys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_APP_URL'];
  for (const key of requiredKeys) {
    if (!prodKeys.includes(key)) {
      throw new Error(`Production env example missing required key: ${key}`);
    }
    if (!previewKeys.includes(key)) {
      throw new Error(`Preview env example missing required key: ${key}`);
    }
  }

  if (
    prodVars.NEXT_PUBLIC_SUPABASE_URL &&
    prevVars.NEXT_PUBLIC_SUPABASE_URL &&
    prodVars.NEXT_PUBLIC_SUPABASE_URL === prevVars.NEXT_PUBLIC_SUPABASE_URL &&
    !prodVars.NEXT_PUBLIC_SUPABASE_URL.includes('<')
  ) {
    throw new Error(
      `Environment parity violation: prod and preview share identical NEXT_PUBLIC_SUPABASE_URL (${prodVars.NEXT_PUBLIC_SUPABASE_URL})`
    );
  }

  if (prevVars.ALLOW_INDEXING === 'true') {
    throw new Error(`Environment parity violation: preview ALLOW_INDEXING must not be 'true'`);
  }

  return { prodKeys, previewKeys };
}

export async function assertNoHardcodedSecrets(filePath: string): Promise<void> {
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(REPO_ROOT, filePath);
  if (!existsSync(absPath)) {
    throw new Error(`Target file for secret scan not found: ${absPath}`);
  }
  const content = await fs.readFile(absPath, 'utf8');
  const jwtPattern = /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/;
  const serviceKeyAssign = /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]{20,}['"]/;
  if (jwtPattern.test(content)) {
    throw new Error(`Hardcoded JWT detected in ${filePath}`);
  }
  if (serviceKeyAssign.test(content)) {
    throw new Error(`Hardcoded SUPABASE_SERVICE_ROLE_KEY detected in ${filePath}`);
  }
}
