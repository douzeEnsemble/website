// Anti-robot : l'email et le téléphone ne figurent pas en clair dans les
// sources. Ils sont stockés inversés puis encodés en base64, et ne sont
// affichés qu'au clic, ce que les robots collecteurs ne font pas.
export const CONTACTS = {
  email: 'cmYuZWxibWVzbmVlenVvZEB0Y2F0bm9j',
  telephone: 'MDAgMDAgMDAgMDAgMDA=',
};

export function decode(encoded) {
  return [...atob(encoded)].reverse().join('');
}

export function contactHref(type, value) {
  return type === 'email'
    ? `mailto:${value}`
    : `tel:${value.replaceAll(' ', '')}`;
}

export function init(doc, contacts) {
  doc.querySelectorAll('[data-contact]').forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.contact;
      const value = decode(contacts[type]);
      const link = doc.createElement('a');
      link.className = 'contact-lien';
      link.href = contactHref(type, value);
      link.textContent = value;
      button.replaceWith(link);
      link.focus();
    });
  });
}
