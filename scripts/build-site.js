import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fetchProjects, injectProjects } from '../js/realisations.js';

// Fichiers publiés sur GitHub Pages.
export const SITE_FILES = [
  'CNAME',
  'index.html',
  'style.css',
  'js',
  'contact',
  'prestations',
  'realisations',
];

export const REALISATIONS_PAGE = join('realisations', 'index.html');

// Copie le site dans `output` (relatif à `root`) et y écrit les cartes des
// réalisations.
export async function buildSite({ root, out: output, fetchFn, token }) {
  const projects = await fetchProjects(fetchFn, token);
  const out = resolve(root, output);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const file of SITE_FILES) {
    cpSync(join(root, file), join(out, file), { recursive: true });
  }
  const page = join(out, REALISATIONS_PAGE);
  writeFileSync(page, injectProjects(String(readFileSync(page)), projects));
  return projects;
}
