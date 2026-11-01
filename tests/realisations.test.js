import { describe, expect, it, vi } from 'vitest';
import {
  LIMIT,
  MARKER_END,
  MARKER_START,
  PAGES_HOST,
  PROFILE_URL,
  REPOS_URL,
  escapeHtml,
  fetchProjects,
  injectProjects,
  projectCard,
  publishedUrl,
  selectProjects,
} from '../js/realisations.js';

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

describe('constantes', () => {
  it('vise le profil RenaudDouze, trié par dernière mise à jour', () => {
    expect(PROFILE_URL).toBe('https://github.com/RenaudDouze');
    expect(REPOS_URL).toBe(
      'https://api.github.com/users/RenaudDouze/repos?sort=pushed&per_page=100',
    );
    expect(LIMIT).toBe(6);
    expect(MARKER_START).toBe('<!-- projets:debut -->');
    expect(MARKER_END).toBe('<!-- projets:fin -->');
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

describe('escapeHtml', () => {
  it('échappe les caractères spéciaux du HTML', () => {
    expect(escapeHtml('<a href="x">A & B</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;A &amp; B&lt;/a&gt;',
    );
  });

  it('accepte autre chose que du texte', () => {
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('projectCard', () => {
  it('fait une carte complète', () => {
    expect(
      projectCard(
        repo('site', {
          description: 'Le site',
          language: 'JavaScript',
          topics: ['pwa', 'react'],
        }),
      ),
    ).toBe(
      '<li><a href="https://site.example">' +
        '<strong class="carte-nom">site</strong>' +
        '<p class="carte-description">Le site</p>' +
        '<span class="carte-topics">' +
        '<span class="carte-topic">pwa</span>' +
        '<span class="carte-topic">react</span></span>' +
        '<span class="carte-infos">site.example · JavaScript</span></a></li>',
    );
  });

  it('fait une carte minimale', () => {
    expect(projectCard(repo('outil', { homepage: null, has_pages: true }))).toBe(
      '<li><a href="https://renauddouze.github.io/outil/">' +
        '<strong class="carte-nom">outil</strong>' +
        '<span class="carte-infos">renauddouze.github.io</span></a></li>',
    );
  });

  it('n’affiche pas de topics quand la liste est vide', () => {
    expect(projectCard(repo('a', { topics: [] }))).not.toContain('carte-topics');
  });

  it('échappe les textes venant de GitHub', () => {
    const card = projectCard(
      repo('<i>', {
        homepage: 'https://x.example/?a="b"',
        description: '<b>gras</b>',
        topics: ['<t>'],
        language: '<l>',
      }),
    );
    expect(card).not.toMatch(/<(i|b|t|l)>/);
    expect(card).toContain('href="https://x.example/?a=&quot;b&quot;"');
    expect(card).toContain('&lt;b&gt;gras&lt;/b&gt;');
    expect(card).toContain('&lt;t&gt;');
    expect(card).toContain('x.example · &lt;l&gt;');
  });
});

describe('injectProjects', () => {
  const page = `<ul>\n        ${MARKER_START}\n        <li>repli</li>\n        ${MARKER_END}\n      </ul>`;

  it('remplace le repli par les cartes', () => {
    expect(injectProjects(page, [repo('a'), repo('b')])).toBe(
      `<ul>\n        ${MARKER_START}` +
        `\n        ${projectCard(repo('a'))}` +
        `\n        ${projectCard(repo('b'))}` +
        `\n        ${MARKER_END}\n      </ul>`,
    );
  });

  it('refuse une page sans marqueur de début', () => {
    expect(() => injectProjects(MARKER_END, [])).toThrow(
      'Marqueurs des projets introuvables',
    );
  });

  it('refuse une page sans marqueur de fin', () => {
    expect(() => injectProjects(MARKER_START, [])).toThrow(
      'Marqueurs des projets introuvables',
    );
  });

  it('refuse des marqueurs dans le désordre', () => {
    expect(() => injectProjects(MARKER_END + MARKER_START, [])).toThrow(
      'Marqueurs des projets introuvables',
    );
  });

  it('accepte des marqueurs collés', () => {
    expect(injectProjects(MARKER_START + MARKER_END, [])).toBe(
      `${MARKER_START}\n        ${MARKER_END}`,
    );
  });
});

describe('fetchProjects', () => {
  const respond = (body, ok = true, status = 200) =>
    vi.fn().mockResolvedValue({ ok, status, json: async () => body });

  it('récupère les derniers projets publiés', async () => {
    const repos = Array.from({ length: 8 }, (_, i) => repo(`p${i}`));
    repos.unshift(repo('fork', { fork: true }));
    const fetchFn = respond(repos);
    const projects = await fetchProjects(fetchFn);
    expect(projects.map((p) => p.name)).toEqual([
      'p0',
      'p1',
      'p2',
      'p3',
      'p4',
      'p5',
    ]);
    expect(fetchFn).toHaveBeenCalledWith(REPOS_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    });
  });

  it('s’authentifie avec le jeton fourni', async () => {
    const fetchFn = respond([]);
    await fetchProjects(fetchFn, 'secret');
    expect(fetchFn).toHaveBeenCalledWith(REPOS_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer secret',
      },
    });
  });

  it('échoue si GitHub répond en erreur', async () => {
    await expect(fetchProjects(respond([repo('a')], false, 403))).rejects.toThrow(
      'API GitHub : 403',
    );
  });
});
