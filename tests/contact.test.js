import { beforeEach, describe, expect, it } from 'vitest';
import { CONTACTS, contactHref, decode, init } from '../js/contact.js';

const encode = (text) => btoa([...text].reverse().join(''));

const page = () => {
  document.body.innerHTML =
    '<button data-contact="email">Afficher l’email</button>' +
    '<button data-contact="telephone">Afficher le téléphone</button>' +
    '<button>Autre</button>';
};

describe('CONTACTS', () => {
  it('cache l’email de contact', () => {
    expect(decode(CONTACTS.email)).toBe('contact@douzeensemble.fr');
    expect(CONTACTS.email).not.toContain('douzeensemble');
  });

  it('cache le numéro de téléphone', () => {
    expect(decode(CONTACTS.telephone)).toMatch(/^[\d ]+$/);
    expect(CONTACTS.telephone).not.toBe(decode(CONTACTS.telephone));
  });
});

describe('decode', () => {
  it('décode le base64 et remet le texte à l’endroit', () => {
    expect(decode(encode('abc@d.fr'))).toBe('abc@d.fr');
  });
});

describe('contactHref', () => {
  it('fait un lien mailto pour l’email', () => {
    expect(contactHref('email', 'a@b.fr')).toBe('mailto:a@b.fr');
  });

  it('fait un lien tel sans espaces pour le téléphone', () => {
    expect(contactHref('telephone', '06 12 34 56 78')).toBe('tel:0612345678');
  });
});

describe('init', () => {
  const contacts = {
    email: encode('a@b.fr'),
    telephone: encode('06 12 34 56 78'),
  };

  beforeEach(() => {
    page();
    init(document, contacts);
  });

  it('n’affiche rien en clair avant le clic', () => {
    expect(document.body.innerHTML).not.toContain('a@b.fr');
    expect(document.body.innerHTML).not.toContain('06 12');
  });

  it('remplace le bouton par le lien email au clic', () => {
    document.querySelector('[data-contact="email"]').click();
    const link = document.querySelector('a');
    expect(link.outerHTML).toBe(
      '<a class="contact-lien" href="mailto:a@b.fr">a@b.fr</a>',
    );
    expect(document.activeElement).toBe(link);
    expect(document.querySelector('[data-contact="email"]')).toBeNull();
  });

  it('remplace le bouton par le lien téléphone au clic', () => {
    document.querySelector('[data-contact="telephone"]').click();
    expect(document.querySelector('a').outerHTML).toBe(
      '<a class="contact-lien" href="tel:0612345678">06 12 34 56 78</a>',
    );
    expect(document.querySelector('[data-contact="email"]')).not.toBeNull();
  });

  it('ignore les autres boutons', () => {
    document.querySelectorAll('button')[2].click();
    expect(document.querySelectorAll('button')).toHaveLength(3);
  });
});
