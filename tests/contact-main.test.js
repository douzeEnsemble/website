import { expect, it } from 'vitest';

it('active les boutons au chargement de la page', async () => {
  document.body.innerHTML =
    '<button data-contact="email">Afficher l’email</button>';
  await import('../js/contact-main.js');
  document.querySelector('button').click();
  expect(document.querySelector('a').href).toBe(
    'mailto:contact@douzeensemble.fr',
  );
});
