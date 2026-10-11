const ORDER_EMAIL = ""; // Dodati poslovni e-mail prije aktiviranja stvarnog slanja obrasca.
const form = document.getElementById('order-form');
const status = document.getElementById('status');
const menu = document.querySelector('.menu');
const nav = document.querySelector('.header nav');

document.getElementById('year').textContent = new Date().getFullYear();

function closeMenu({ returnFocus = false } = {}) {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Otvori izbornik');
  if (returnFocus) menu.focus();
}

menu.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Zatvori izbornik' : 'Otvori izbornik');
});

nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => closeMenu());
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    closeMenu({ returnFocus: true });
  }
});

window.matchMedia('(min-width: 701px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

document.querySelectorAll('.model-select').forEach(button => {
  button.addEventListener('click', () => {
    const model = document.getElementById('model');
    const modelName = button.dataset.model.replace(/^Lavazza Firma /, '');
    const option = Array.from(model.options).find(item =>
      item.textContent.startsWith(`Lavazza ${modelName} —`)
    );

    if (option) model.value = option.value || option.textContent;
    document.getElementById('topic').value = 'Želim aparat uz mjesečnu kupnju kapsula';
    document.getElementById('narudzba').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('model').focus({ preventScroll: true });
  });
});

function orderText() {
  const data = new FormData(form);
  return [
    'Upit — Zagreb Firma Kava', '',
    `Ime i prezime: ${data.get('name')}`,
    `Telefon: ${data.get('phone')}`,
    `E-mail: ${data.get('email')}`,
    `Ponuda za: ${data.get('customerType')}`,
    `Odabrani aparat: ${data.get('model')}`,
    `Željena količina: ${data.get('capsules') || 'Nije navedena'}`,
    `Vrsta upita: ${data.get('topic')}`,
    `Poruka: ${data.get('message') || 'Nema dodatne poruke'}`
  ].join('\n');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const body = orderText();
  if (ORDER_EMAIL) {
    window.location.href = `mailto:${encodeURIComponent(ORDER_EMAIL)}?subject=${encodeURIComponent('Upit — Zagreb Firma Kava')}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Otvara se vaša e-mail aplikacija s pripremljenim upitom. Provjerite poruku i pritisnite Pošalji.';
  } else {
    status.textContent = 'Obrazac još nije povezan sa sustavom za zaprimanje upita, pa poruka nije poslana. Prije javne objave dodajte poslovni e-mail ili povežite servis za obrasce.';
  }
});
