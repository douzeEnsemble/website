// @vitest-environment node
import { cpSync, existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SITE_FILES } from '../scripts/build-site.js';

const repoRoot = process.cwd();
let fetchFn;
let log;

// Copie du dépôt dans un dossier temporaire, pour ne rien écrire ici.
function fakeCheckout() {
  const dir = mkdtempSync(join(tmpdir(), 'build-'));
  for (const file of SITE_FILES) {
    cpSync(join(repoRoot, file), join(dir, file), { recursive: true });
  }
  return dir;
}

beforeEach(() => {
  vi.resetModules();
  fetchFn = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [
      { name: 'site', homepage: 'https://site.example', fork: false },
    ],
  });
  vi.stubGlobal('fetch', fetchFn);
  vi.stubEnv('GITHUB_TOKEN', 'jeton');
  log = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('construit le site dans _site par défaut, avec le jeton GitHub', async () => {
  const dir = fakeCheckout();
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
  vi.stubEnv('SITE_OUT', undefined);
  await import('../scripts/build.js');
  expect(fetchFn.mock.calls[0][1].headers.Authorization).toBe('Bearer jeton');
  const page = readFileSync(join(dir, '_site', 'realisations', 'index.html'));
  expect(page.toString()).toContain('carte-nom">site<');
  expect(log).toHaveBeenCalledWith('1 réalisations générées');
});

it('construit le site dans SITE_OUT', async () => {
  const dir = fakeCheckout();
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
  vi.stubEnv('SITE_OUT', 'ailleurs');
  await import('../scripts/build.js');
  expect(existsSync(join(dir, 'ailleurs', 'CNAME'))).toBe(true);
  expect(existsSync(join(dir, '_site'))).toBe(false);
});
