import { expect, it, vi } from 'vitest';

it('charge les projets au chargement de la page', async () => {
  document.body.innerHTML = '<ul id="projets"><li>attente</li></ul>';
  const fetchFn = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [
      { name: 'site', homepage: 'https://site.example' },
    ],
  });
  window.fetch = fetchFn;
  await import('../js/realisations-main.js');
  await vi.waitFor(() =>
    expect(document.querySelector('#projets .carte-nom').textContent).toBe('site'),
  );
  expect(fetchFn.mock.contexts[0]).toBe(window);
});
