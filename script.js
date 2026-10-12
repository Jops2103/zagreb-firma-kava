const form = document.getElementById('order-form');
const status = document.getElementById('status');
const menu = document.querySelector('.menu');
const nav = document.querySelector('.header nav');

document.getElementById('year').textContent = new Date().getFullYear();

// FormSubmit redirects here after accepting a submission.
const successMessage = document.getElementById('success-message');
const params = new URLSearchParams(window.location.search);
if (params.get('upit') === 'poslan' && successMessage) {
  successMessage.hidden = false;
  if (status) status.textContent = 'Poruka uspješno proslijeđena!';

  // Remove the one-time success flag immediately so refreshing cannot replay it.
  params.delete('upit');
  const remainingQuery = params.toString();
  const cleanUrl = window.location.pathname + (remainingQuery ? '?' + remainingQuery : '') + window.location.hash;
  window.history.replaceState({}, document.title, cleanUrl);

  window.setTimeout(() => {
    successMessage.hidden = true;
    if (status && status.textContent === 'Poruka uspješno proslijeđena!') {
      status.textContent = '';
    }
  }, 30000);
}

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
    caption.textContent = image.classList.contains('hero-product-image') ? 'Lavazza Firma' : (image.alt || '');
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


// Copy the direct email address for visitors who prefer ordering by email.
document.querySelectorAll('[data-copy-email]').forEach(button => {
  button.addEventListener('click', async () => {
    const email = button.getAttribute('data-copy-email');
    const status = document.querySelector('.email-copy-status');
    try {
      await navigator.clipboard.writeText(email);
      if (status) status.textContent = 'E-mail adresa kopirana. Zalijepite je u svoju poruku.';
    } catch (error) {
      if (status) status.textContent = 'Označite adresu e-pošte iznad i kopirajte je.';
    }
  });
});


// Keep the visible field limited to a count; send selected variety names separately with the enquiry.
const capsuleField = document.getElementById('capsules');
const capsuleVarietiesField = document.getElementById('capsule-varieties');
const capsuleModelField = document.getElementById('model');
const selectedCapsules = new Set();

function capsulePackageLimit() {
  const selectedModel = capsuleModelField ? capsuleModelField.value : '';
  if (/Inovy Mini/i.test(selectedModel)) return 1;
  if (/Inovy & Milk|Inovy Compact/i.test(selectedModel)) return 4;
  return 4;
}

function updateSelectedCapsuleField() {
  if (!capsuleField) return;
  const limit = capsulePackageLimit();
  capsuleField.value = `${selectedCapsules.size}/${limit}`;
  if (capsuleVarietiesField) capsuleVarietiesField.value = Array.from(selectedCapsules).join(', ');
}

document.querySelectorAll('.capsule-select').forEach(button => {
  button.addEventListener('click', () => {
    if (!capsuleField) return;
    const variety = button.dataset.capsule;
    const limit = capsulePackageLimit();

    if (!selectedCapsules.has(variety) && selectedCapsules.size >= limit) {
      if (status) status.textContent = `Za odabrani aparat možete izabrati najviše ${limit} vrsta kapsula.`;
      return;
    }
    selectedCapsules.add(variety);
    updateSelectedCapsuleField();

    const topic = document.getElementById('topic');
    if (topic) topic.value = 'Želim naručiti kapsule';
    document.getElementById('narudzba').scrollIntoView({ behavior: 'smooth' });
    capsuleField.focus({ preventScroll: true });
  });
});

if (capsuleModelField) {
  capsuleModelField.addEventListener('change', () => {
    const limit = capsulePackageLimit();
    while (selectedCapsules.size > limit) selectedCapsules.delete(Array.from(selectedCapsules).at(-1));
    updateSelectedCapsuleField();
  });
}
