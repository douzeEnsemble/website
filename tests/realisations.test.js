import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LIMIT,
  PAGES_HOST,
  PROFILE_URL,
  REPOS_URL,
  loadProjects,
  publishedUrl,
  renderProjects,
  selectProjects,
} from '../js/realisations.js';

const FALLBACK = `<li><a href="${PROFILE_URL}">Les projets sur GitHub</a></li>`;

const repo = (name, extra = {}) => ({
  name,
  html_url: `https://github.com/RenaudDouze/${name}`,
  description: null,
  homepage: `https://${name}.example`,
  has_pages: false,
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
    expect(PAGES_HOST).toBe('renauddouze.github.io');
  });
});

describe('publishedUrl', () => {
  it('prend le site déclaré sur GitHub', () => {
    expect(publishedUrl(repo('a', { has_pages: true }))).toBe(
      'https://a.example',
    );
  });

  it('accepte un site en http', () => {
    expect(publishedUrl(repo('a', { homepage: 'http://a.example' }))).toBe(
      'http://a.example',
    );
  });

  it('ajoute https quand le site n’a pas de protocole', () => {
    expect(publishedUrl(repo('a', { homepage: 'a.example' }))).toBe(
      'https://a.example',
    );
    expect(publishedUrl(repo('a', { homepage: 'x.fr/https://' }))).toBe(
      'https://x.fr/https://',
    );
  });

  it('prend la page GitHub Pages sans site déclaré', () => {
    expect(publishedUrl(repo('Jeu', { homepage: '', has_pages: true }))).toBe(
      'https://renauddouze.github.io/Jeu/',
    );
  });

  it('prend la racine pour le dépôt du site utilisateur', () => {
    expect(
      publishedUrl(
        repo('RenaudDouze.github.io', { homepage: null, has_pages: true }),
      ),
    ).toBe('https://renauddouze.github.io/');
  });

  it('renvoie null pour un projet non publié', () => {
    expect(publishedUrl(repo('a', { homepage: null }))).toBeNull();
  });
});

describe('selectProjects', () => {
  it('écarte les forks, les dépôts archivés et les projets non publiés', () => {
    const repos = [
      repo('a'),
      repo('fork', { fork: true }),
      repo('archive', { archived: true }),
      repo('prive', { homepage: null }),
      repo('b', { homepage: null, has_pages: true }),
    ];
    expect(selectProjects(repos, 10).map((r) => r.name)).toEqual(['a', 'b']);
  });

  it('garde l’ordre et limite le nombre', () => {
    const repos = [repo('a'), repo('b'), repo('c')];
    expect(selectProjects(repos, 2).map((r) => r.name)).toEqual(['a', 'b']);
  });
});

describe('renderProjects', () => {
  it('affiche une carte par projet publié', () => {
    renderProjects(list, [
      repo('site', { description: 'Le site', language: 'JavaScript' }),
      repo('outil', { homepage: null, has_pages: true }),
    ]);
    expect(list.innerHTML).toBe(
      '<li style="--teinte: 0;"><a href="https://site.example">' +
        '<strong class="carte-nom">site</strong>' +
        '<p class="carte-description">Le site</p>' +
        '<span class="carte-infos">site.example · JavaScript</span></a></li>' +
        '<li style="--teinte: 180;"><a href="https://renauddouze.github.io/outil/">' +
        '<strong class="carte-nom">outil</strong>' +
        '<span class="carte-infos">renauddouze.github.io</span></a></li>',
    );
  });

  it('répartit les teintes sur le cercle chromatique, arrondies', () => {
    renderProjects(list, [...'abcdefg'].map((name) => repo(name)));
    expect(
      [...list.children].map((li) => li.style.getPropertyValue('--teinte')),
    ).toEqual(['0', '51', '103', '154', '206', '257', '309']);
  });

  it('n’interprète pas le HTML des descriptions', () => {
    renderProjects(list, [repo('x', { description: '<b>gras</b>' })]);
    expect(list.querySelector('b')).toBeNull();
    expect(list.querySelector('p').textContent).toBe('<b>gras</b>');
  });
});

describe('loadProjects', () => {
  it('charge les derniers projets depuis GitHub', async () => {
    const repos = Array.from({ length: 8 }, (_, i) => repo(`p${i}`));
    const fetchFn = respond(repos);
    await loadProjects(fetchFn, list);
    expect(fetchFn).toHaveBeenCalledWith(REPOS_URL);
    expect(
      [...list.querySelectorAll('.carte-nom')].map((el) => el.textContent),
    ).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
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
    await loadProjects(
      respond([repo('f', { fork: true }), repo('p', { homepage: null })]),
      list,
    );
    expect(list.innerHTML).toBe(FALLBACK);
  });

  it('garde le lien vers le profil sans réseau', async () => {
    await loadProjects(vi.fn().mockRejectedValue(new Error('hors ligne')), list);
    expect(list.innerHTML).toBe(FALLBACK);
  });
});
