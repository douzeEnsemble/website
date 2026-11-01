export const PROFILE_URL = 'https://github.com/RenaudDouze';
export const REPOS_URL =
  'https://api.github.com/users/RenaudDouze/repos?sort=pushed&per_page=100';
export const LIMIT = 6;

// Derniers projets mis à jour, sans les forks ni les dépôts archivés.
export function selectProjects(repos, limit) {
  return repos.filter((repo) => !repo.fork && !repo.archived).slice(0, limit);
}

export function renderProjects(list, projects) {
  const doc = list.ownerDocument;
  list.replaceChildren(
    ...projects.map((project) => {
      const item = doc.createElement('li');
      const link = doc.createElement('a');
      link.href = project.html_url;
      link.textContent = project.name;
      item.append(link);
      if (project.description) {
        const description = doc.createElement('span');
        description.textContent = project.description;
        item.append(' ', description);
      }
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
