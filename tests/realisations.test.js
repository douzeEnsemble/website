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
  textColor,
} from '../js/realisations.js';
import { AWESOME_COLORS } from '../js/site.js';

const FALLBACK = `<li><a href="${PROFILE_URL}">Les projets sur GitHub</a></li>`;

const repo = (name, extra = {}) => ({
  name,
  html_url: `https://github.com/douzeEnsemble/${name}`,
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
  it('vise l’organisation douzeEnsemble, trié par dernière mise à jour', () => {
    expect(PROFILE_URL).toBe('https://github.com/douzeEnsemble');
    expect(REPOS_URL).toBe(
      'https://api.github.com/users/douzeEnsemble/repos?sort=pushed&per_page=100',
    );
    expect(LIMIT).toBe(6);
    expect(PAGES_HOST).toBe('douzeensemble.github.io');
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
      'https://douzeensemble.github.io/Jeu/',
    );
  });

  it('prend la racine pour le dépôt du site utilisateur', () => {
    expect(
      publishedUrl(
        repo('douzeEnsemble.github.io', { homepage: null, has_pages: true }),
      ),
    ).toBe('https://douzeensemble.github.io/');
  });

  it('renvoie null pour un projet non publié', () => {
    expect(publishedUrl(repo('a', { homepage: null }))).toBeNull();
  });
});

describe('textColor', () => {
  it('met du texte sombre sur les couleurs claires', () => {
    expect(textColor('#ffffff')).toBe('#05131d');
    expect(textColor('#f2cd37')).toBe('#05131d');
    expect(textColor('#9a9a9a')).toBe('#05131d');
  });

  it('met du texte blanc sur les couleurs foncées', () => {
    expect(textColor('#05131d')).toBe('#ffffff');
    expect(textColor('#999999')).toBe('#ffffff');
  });

  it('tient compte de chaque composante', () => {
    expect(textColor('#ff0000')).toBe('#ffffff');
    expect(textColor('#00ff00')).toBe('#ffffff');
    expect(textColor('#ffff00')).toBe('#05131d');
    expect(textColor('#00ffff')).toBe('#05131d');
    expect(textColor('#ff00ff')).toBe('#ffffff');
    expect(textColor('#d0d0ff')).toBe('#05131d');
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
      '<li style="--fond: #05131d; --texte: #ffffff;"><a href="https://site.example">' +
        '<strong class="carte-nom">site</strong>' +
        '<p class="carte-description">Le site</p>' +
        '<span class="carte-infos">site.example · JavaScript</span></a></li>' +
        '<li style="--fond: #582a12; --texte: #ffffff;"><a href="https://douzeensemble.github.io/outil/">' +
        '<strong class="carte-nom">outil</strong>' +
        '<span class="carte-infos">douzeensemble.github.io</span></a></li>',
    );
  });

  it('affiche les topics GitHub du projet', () => {
    renderProjects(list, [repo('a', { topics: ['pwa', 'react'] })]);
    expect(list.querySelector('.carte-topics').outerHTML).toBe(
      '<span class="carte-topics">' +
        '<span class="carte-topic">pwa</span>' +
        '<span class="carte-topic">react</span></span>',
    );
    const tags = list.querySelector('.carte-topics');
    expect(tags.nextElementSibling.className).toBe('carte-infos');
  });

  it('n’affiche pas de topics quand la liste est vide', () => {
    renderProjects(list, [repo('a', { topics: [] })]);
    expect(list.querySelector('.carte-topics')).toBeNull();
  });

  it('reprend les couleurs Everyone is awesome dans l’ordre, en boucle', () => {
    renderProjects(list, Array.from({ length: 13 }, (_, i) => repo(`p${i}`)));
    const fonds = [...list.children].map((li) =>
      li.style.getPropertyValue('--fond'),
    );
    expect(fonds).toEqual([...AWESOME_COLORS, ...AWESOME_COLORS.slice(0, 2)]);
    expect(list.children[4].style.getPropertyValue('--texte')).toBe('#05131d');
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
