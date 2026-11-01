// @vitest-environment node
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MARKER_END, MARKER_START } from '../js/realisations.js';
import { REALISATIONS_PAGE, SITE_FILES, buildSite } from '../scripts/build-site.js';

const project = {
  name: 'site',
  homepage: 'https://site.example',
  fork: false,
  archived: false,
};

const respond = (body, ok = true) =>
  vi.fn().mockResolvedValue({ ok, status: 500, json: async () => body });

function fakeRepo() {
  const root = mkdtempSync(join(tmpdir(), 'site-'));
  for (const dir of ['js', 'contact', 'prestations', 'realisations', 'tests']) {
    mkdirSync(join(root, dir));
  }
  writeFileSync(join(root, 'CNAME'), 'www.douzeensemble.fr');
  writeFileSync(join(root, 'index.html'), 'accueil');
  writeFileSync(join(root, 'style.css'), 'css');
  writeFileSync(join(root, 'js', 'main.js'), 'js');
  writeFileSync(join(root, 'contact', 'index.html'), 'contact');
  writeFileSync(join(root, 'prestations', 'index.html'), 'prestations');
  writeFileSync(join(root, 'tests', 'x.test.js'), 'test');
  writeFileSync(join(root, 'package.json'), '{}');
  writeFileSync(
    join(root, REALISATIONS_PAGE),
    `<ul>${MARKER_START}<li>repli</li>${MARKER_END}</ul>`,
  );
  return root;
}

describe('SITE_FILES', () => {
  it('liste les fichiers publiés', () => {
    expect(SITE_FILES).toEqual([
      'CNAME',
      'index.html',
      'style.css',
      'js',
      'contact',
      'prestations',
      'realisations',
    ]);
    expect(REALISATIONS_PAGE).toBe(join('realisations', 'index.html'));
  });
});

describe('buildSite', () => {
  let root;
  let out;

  beforeEach(() => {
    root = fakeRepo();
    out = join(root, '_site');
  });

  it('copie le site et y écrit les cartes', async () => {
    const fetchFn = respond([project]);
    const projects = await buildSite({ root, out, fetchFn, token: 'jeton' });
    expect(projects).toEqual([project]);
    expect(fetchFn.mock.calls[0][1].headers.Authorization).toBe('Bearer jeton');
    expect(readFileSync(join(out, 'CNAME'), 'utf8')).toBe('www.douzeensemble.fr');
    expect(readFileSync(join(out, 'index.html'), 'utf8')).toBe('accueil');
    expect(readFileSync(join(out, 'style.css'), 'utf8')).toBe('css');
    expect(readFileSync(join(out, 'js', 'main.js'), 'utf8')).toBe('js');
    expect(readFileSync(join(out, 'contact', 'index.html'), 'utf8')).toBe(
      'contact',
    );
    expect(readFileSync(join(out, 'prestations', 'index.html'), 'utf8')).toBe(
      'prestations',
    );
    const page = readFileSync(join(out, REALISATIONS_PAGE), 'utf8');
    expect(page).toContain('<strong class="carte-nom">site</strong>');
    expect(page).not.toContain('repli');
    expect(existsSync(join(out, 'tests'))).toBe(false);
    expect(existsSync(join(out, 'package.json'))).toBe(false);
    expect(readFileSync(join(root, REALISATIONS_PAGE), 'utf8')).toContain(
      'repli',
    );
  });

  it('vide le dossier de sortie avant de construire', async () => {
    mkdirSync(join(out, 'ancien'), { recursive: true });
    await buildSite({ root, out, fetchFn: respond([project]) });
    expect(existsSync(join(out, 'ancien'))).toBe(false);
  });

  it('place une sortie relative dans la racine', async () => {
    await buildSite({ root, out: 'sortie', fetchFn: respond([project]) });
    expect(existsSync(join(root, 'sortie', 'index.html'))).toBe(true);
  });

  it('crée les dossiers parents de la sortie', async () => {
    out = join(root, 'a', 'b');
    await buildSite({ root, out, fetchFn: respond([project]) });
    expect(existsSync(join(out, 'index.html'))).toBe(true);
  });

  it('n’écrit rien si GitHub ne répond pas', async () => {
    await expect(
      buildSite({ root, out, fetchFn: respond([], false) }),
    ).rejects.toThrow('API GitHub : 500');
    expect(existsSync(out)).toBe(false);
  });
});
