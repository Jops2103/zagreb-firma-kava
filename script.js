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

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.textContent = 'Šaljem upit…';
  status.textContent = 'Upit se šalje. Molimo pričekajte.';

  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  payload._subject = 'Novi upit — Zagreb Firma Kava';
  payload._template = 'table';
  payload._honey = '';

  try {
    const response = await fetch('https://formsubmit.co/ajax/zagrebfirmakava@proton.me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || result.success !== 'true') {
      throw new Error(result.message || 'Slanje nije potvrđeno.');
    }
    status.textContent = 'Hvala! Upit je poslan. Javit ćemo vam se čim prije.';
    form.reset();
  } catch (error) {
    status.textContent = 'Upit trenutačno nije moguće poslati. Pokušajte ponovno malo kasnije ili nam pišite na zagrebfirmakava@proton.me.';
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  }
});


// Enlarge product and hero photos on click; close with Escape or backdrop.
(function setupImageLightbox(){
  const images = Array.from(document.querySelectorAll('.product-gallery img, .hero-product-image, .capsule-gallery img'));
  if (!images.length) return;
  const overlay = document.createElement('div');
  overlay.className = 'image-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Uvećana fotografija proizvoda');
  const enlarged = document.createElement('img');
  const close = document.createElement('button');
  close.className = 'image-lightbox-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Zatvori uvećanu fotografiju');
  close.textContent = '×';
  const caption = document.createElement('p');
  caption.className = 'image-lightbox-caption';
  overlay.append(enlarged, close, caption);
  document.body.append(overlay);
  let previousFocus = null;

  function openImage(image) {
    previousFocus = document.activeElement;
    enlarged.src = image.currentSrc || image.src;
    enlarged.alt = image.alt || 'Uvećana fotografija proizvoda';
    caption.textContent = image.alt || '';
    overlay.classList.add('open');
    document.body.classList.add('lightbox-open');
    close.focus();
  }
  function closeImage() {
    overlay.classList.remove('open');
    document.body.classList.remove('lightbox-open');
    enlarged.removeAttribute('src');
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }
  images.forEach(image => {
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', (image.alt || 'Fotografija proizvoda') + ' — kliknite za uvećanje');
    image.addEventListener('click', () => openImage(image));
    image.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openImage(image);
      }
    });
  });
  close.addEventListener('click', closeImage);
  overlay.addEventListener('click', event => {
    if (event.target === overlay) closeImage();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlay.classList.contains('open')) closeImage();
  });
})();
