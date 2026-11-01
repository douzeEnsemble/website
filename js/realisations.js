import { AWESOME_COLORS } from './site.js';

export const PROFILE_URL = 'https://github.com/douzeEnsemble';
export const REPOS_URL =
  'https://api.github.com/users/douzeEnsemble/repos?sort=pushed&per_page=100';
export const LIMIT = 6;
export const PAGES_HOST = 'douzeensemble.github.io';

// Adresse où le projet est publié : son site déclaré sur GitHub, sinon sa
// page GitHub Pages. null quand le projet n'est publié nulle part.
export function publishedUrl(repo) {
  if (repo.homepage) {
    return /^https?:\/\//.test(repo.homepage)
      ? repo.homepage
      : `https://${repo.homepage}`;
  }
  if (repo.has_pages) {
    return repo.name.toLowerCase() === PAGES_HOST
      ? `https://${PAGES_HOST}/`
      : `https://${PAGES_HOST}/${repo.name}/`;
  }
  return null;
}

// Derniers projets publiés, sans les forks ni les dépôts archivés.
export function selectProjects(repos, limit) {
  return repos
    .filter((repo) => !repo.fork && !repo.archived && publishedUrl(repo))
    .slice(0, limit);
}

// Texte sombre sur les couleurs claires, blanc sur les foncées (luminance
// perçue, sur 255 000 pour rester en calcul entier).
export function textColor(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 299 * r + 587 * g + 114 * b > 153000 ? '#05131d' : '#ffffff';
}

// Une carte par projet, aux couleurs du set LEGO Everyone is awesome, dans
// l'ordre des figurines.
export function renderProjects(list, projects) {
  const doc = list.ownerDocument;
  const element = (tag, className, text) => {
    const el = doc.createElement(tag);
    el.className = className;
    el.textContent = text;
    return el;
  };
  list.replaceChildren(
    ...projects.map((project, i) => {
      const url = publishedUrl(project);
      const item = doc.createElement('li');
      const color = AWESOME_COLORS[i % AWESOME_COLORS.length];
      item.style.setProperty('--fond', color);
      item.style.setProperty('--texte', textColor(color));
      const link = doc.createElement('a');
      link.href = url;
      link.append(element('strong', 'carte-nom', project.name));
      if (project.description) {
        link.append(element('p', 'carte-description', project.description));
      }
      const topics = project.topics ?? [];
      if (topics.length > 0) {
        const tags = element('span', 'carte-topics', '');
        tags.append(
          ...topics.map((topic) => element('span', 'carte-topic', topic)),
        );
        link.append(tags);
      }
      const infos = [new URL(url).host, project.language].filter(Boolean);
      link.append(element('span', 'carte-infos', infos.join(' · ')));
      item.append(link);
      return item;
    }),
  );
}

// En cas d'échec, la liste garde son contenu d'origine (le lien vers le profil).
export async function loadProjects(fetchFn, list) {
  try {
    const response = await fetchFn(REPOS_URL);
    if (!response.ok) {
      return;
    }
    const projects = selectProjects(await response.json(), LIMIT);
    if (projects.length > 0) {
      renderProjects(list, projects);
    }
  } catch {
    // Pas de réseau : on garde le lien vers le profil.
  }
}
