const ORDER_EMAIL = ""; // Dodati poslovni e-mail prije aktiviranja stvarnog slanja obrasca.
const form = document.getElementById('order-form');
const status = document.getElementById('status');
document.getElementById('year').textContent = new Date().getFullYear();
const menu = document.querySelector('.menu');
const nav = document.querySelector('.header nav');
menu.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Zatvori izbornik' : 'Otvori izbornik');
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}));
document.querySelectorAll('.model-select').forEach(button => button.addEventListener('click', () => {
  const model = document.getElementById('model');
  const label = `${button.dataset.model} — ${button.dataset.quantity}`;
  const option = Array.from(model.options).find(item => item.textContent === label);
  if (option) model.value = option.value;
  document.getElementById('topic').value = 'Želim aparat uz mjesečnu kupnju kapsula';
  document.getElementById('narudzba').scrollIntoView({behavior: 'smooth'});
}));
function orderText() {
  const d = new FormData(form);
  return [
    'Upit — Zagreb Firma Kava', '',
    `Ime i prezime: ${d.get('name')}`,
    `Telefon: ${d.get('phone')}`,
    `E-mail: ${d.get('email')}`,
    `Ponuda za: ${d.get('customerType')}`,
    `Odabrani aparat: ${d.get('model')}`,
    `Željena količina: ${d.get('capsules') || 'Nije navedena'}`,
    `Vrsta upita: ${d.get('topic')}`,
    `Poruka: ${d.get('message') || 'Nema dodatne poruke'}`
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
    status.textContent = 'Obrazac je ispunjen, ali još nije povezan sa sustavom za zaprimanje upita. Prije javnog oglašavanja potrebno je povezati poslovni e-mail ili servis za obrasce.';
  }
});
