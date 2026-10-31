import { expect, it } from 'vitest';

it('initialise la page au chargement', async () => {
  document.body.innerHTML = '<h1>douzeEnsemble</h1>';
  await import('../js/main.js');
  expect(document.body.style.background).toMatch(/^rgb\(/);
  expect(document.querySelector('h1').style.color).toMatch(/^rgb\(/);
});
