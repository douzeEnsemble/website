import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LIMIT,
  PROFILE_URL,
  REPOS_URL,
  loadProjects,
  renderProjects,
  selectProjects,
} from '../js/realisations.js';

const FALLBACK = `<li><a href="${PROFILE_URL}">Les projets sur GitHub</a></li>`;

const repo = (name, extra = {}) => ({
  name,
  html_url: `https://github.com/RenaudDouze/${name}`,
  description: null,
  fork: false,
  archived: false,
  ...extra,
});

const respond = (body, ok = true) =>
  vi.fn().mockResolvedValue({ ok, json: async () => body });

let list;

beforeEach(() => {
  document.body.innerHTML = `<ul id="projets">${FALLBACK}</ul>`;
  list = document.getElementById('projets');
});

describe('constantes', () => {
  it('vise le profil RenaudDouze, trié par dernière mise à jour', () => {
    expect(PROFILE_URL).toBe('https://github.com/RenaudDouze');
    expect(REPOS_URL).toBe(
      'https://api.github.com/users/RenaudDouze/repos?sort=pushed&per_page=100',
    );
    expect(LIMIT).toBe(6);
  });
});

describe('selectProjects', () => {
  it('écarte les forks et les dépôts archivés', () => {
    const repos = [
      repo('a'),
      repo('fork', { fork: true }),
      repo('archive', { archived: true }),
      repo('b'),
    ];
    expect(selectProjects(repos, 10).map((r) => r.name)).toEqual(['a', 'b']);
  });

  it('garde l’ordre et limite le nombre', () => {
    const repos = [repo('a'), repo('b'), repo('c')];
    expect(selectProjects(repos, 2).map((r) => r.name)).toEqual(['a', 'b']);
  });
});

describe('renderProjects', () => {
  it('affiche un lien par projet, avec sa description', () => {
    renderProjects(list, [
      repo('site', { description: 'Le site' }),
      repo('outil'),
    ]);
    expect(list.innerHTML).toBe(
      '<li><a href="https://github.com/RenaudDouze/site">site</a> <span>Le site</span></li>' +
        '<li><a href="https://github.com/RenaudDouze/outil">outil</a></li>',
    );
  });

  it('n’interprète pas le HTML des descriptions', () => {
    renderProjects(list, [repo('x', { description: '<b>gras</b>' })]);
    expect(list.querySelector('b')).toBeNull();
    expect(list.querySelector('span').textContent).toBe('<b>gras</b>');
  });
});

describe('loadProjects', () => {
  it('charge les derniers projets depuis GitHub', async () => {
    const repos = Array.from({ length: 8 }, (_, i) => repo(`p${i}`));
    const fetchFn = respond(repos);
    await loadProjects(fetchFn, list);
    expect(fetchFn).toHaveBeenCalledWith(REPOS_URL);
    expect([...list.querySelectorAll('a')].map((a) => a.textContent)).toEqual(
      ['p0', 'p1', 'p2', 'p3', 'p4', 'p5'],
    );
  });

  it('garde le lien vers le profil si GitHub répond en erreur', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => [repo('x')],
    });
    await loadProjects(fetchFn, list);
    expect(list.innerHTML).toBe(FALLBACK);
  });

  it('garde le lien vers le profil sans projet à afficher', async () => {
    await loadProjects(respond([repo('f', { fork: true })]), list);
    expect(list.innerHTML).toBe(FALLBACK);
  });

  it('garde le lien vers le profil sans réseau', async () => {
    await loadProjects(vi.fn().mockRejectedValue(new Error('hors ligne')), list);
    expect(list.innerHTML).toBe(FALLBACK);
  });
});
