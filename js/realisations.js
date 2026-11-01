export const PROFILE_URL = 'https://github.com/RenaudDouze';
export const REPOS_URL =
  'https://api.github.com/users/RenaudDouze/repos?sort=pushed&per_page=100';
export const LIMIT = 6;
export const PAGES_HOST = 'renauddouze.github.io';

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

export const MARKER_START = '<!-- projets:debut -->';
export const MARKER_END = '<!-- projets:fin -->';

export function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// Une carte par projet, en HTML statique.
export function projectCard(project) {
  const url = publishedUrl(project);
  const parts = [
    `<strong class="carte-nom">${escapeHtml(project.name)}</strong>`,
  ];
  if (project.description) {
    parts.push(
      `<p class="carte-description">${escapeHtml(project.description)}</p>`,
    );
  }
  const topics = project.topics ?? [];
  if (topics.length > 0) {
    const tags = topics
      .map((topic) => `<span class="carte-topic">${escapeHtml(topic)}</span>`)
      .join('');
    parts.push(`<span class="carte-topics">${tags}</span>`);
  }
  const infos = [new URL(url).host, project.language].filter(Boolean);
  parts.push(`<span class="carte-infos">${escapeHtml(infos.join(' · '))}</span>`);
  return `<li><a href="${escapeHtml(url)}">${parts.join('')}</a></li>`;
}

// Remplace le contenu entre les marqueurs de la page par les cartes.
export function injectProjects(html, projects) {
  const start = html.indexOf(MARKER_START);
  const end = html.indexOf(MARKER_END, start);
  if (start === -1 || end === -1) {
    throw new Error('Marqueurs des projets introuvables');
  }
  const cards = projects.map((project) => `\n        ${projectCard(project)}`);
  return (
    html.slice(0, start + MARKER_START.length) +
    cards.join('') +
    '\n        ' +
    html.slice(end)
  );
}

// Récupère les derniers projets publiés depuis l'API GitHub.
export async function fetchProjects(fetchFn, token) {
  const headers = { Accept: 'application/vnd.github+json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetchFn(REPOS_URL, { headers });
  if (!response.ok) {
    throw new Error(`API GitHub : ${response.status}`);
  }
  return selectProjects(await response.json(), LIMIT);
}
