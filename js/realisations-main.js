import { loadProjects } from './realisations.js';

loadProjects(window.fetch.bind(window), document.getElementById('projets'));
