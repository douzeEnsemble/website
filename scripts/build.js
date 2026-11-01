import { buildSite } from './build-site.js';

const projects = await buildSite({
  root: process.cwd(),
  out: process.env.SITE_OUT ?? '_site',
  fetchFn: fetch,
  token: process.env.GITHUB_TOKEN,
});
console.log(`${projects.length} réalisations générées`);
