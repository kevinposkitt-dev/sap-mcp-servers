import { mkdtempSync, readFileSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import { saveCachedToken } from '../src/cookie-cache.js';
import type { CachedToken, Logger } from '../src/types.js';

const logger: Logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

const token: CachedToken = {
  access_token: 'secret-session-cookie',
  expiresAt: Date.now() + 60_000,
  authMethod: 'interactive'
};

describe('saveCachedToken', () => {
  it('creates and retains a user-only cache file mode', () => {
    const directory = mkdtempSync(join(tmpdir(), 'sap-mcp-auth-'));
    const file = join(directory, 'nested', 'token-cache.json');

    saveCachedToken(file, token, logger);
    expect(statSync(file).mode & 0o777).toBe(0o600);
    expect(JSON.parse(readFileSync(file, 'utf8')).access_token).toBe(token.access_token);

    saveCachedToken(file, { ...token, expiresAt: token.expiresAt + 1 }, logger);
    expect(statSync(file).mode & 0o777).toBe(0o600);
  });
});
