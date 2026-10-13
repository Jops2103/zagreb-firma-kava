const form = document.getElementById('order-form');
const status = document.getElementById('status');

// Keep a clearly named copy of the sender's email in the submitted message body.
// The required email field is validated by the browser before this submit handler runs.
if (form) {
  form.addEventListener('submit', (event) => {
    // Final safeguard: do not send unless every required field is valid.
    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      if (status) status.textContent = 'Ispunite sva obavezna polja označena zvjezdicom (*) i potvrdite suglasnost.';
      return;
    }

    const emailInput = document.getElementById('email');
    const emailCopy = document.getElementById('sender-email-copy');
    if (emailInput && emailCopy) emailCopy.value = emailInput.value.trim();
  });
}
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

    // The minimum is included; any extra quantity can be added in the form.
    selectedCapsules.clear();
    if (additionalCapsulesField) additionalCapsulesField.value = '0';
    if (capsuleVarietiesField) capsuleVarietiesField.value = 'Vrste dodatnih kapsula nisu odabrane';
    if (status) status.textContent = '';
    updateSelectedCapsuleField();
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


// Step 1: when an appliance is selected, the visitor chooses exactly its minimum number of capsule boxes.
const capsuleField = document.getElementById('capsules');
const capsuleVarietiesField = document.getElementById('capsule-varieties');
const capsuleModelField = document.getElementById('model');
const topicField = document.getElementById('topic');
const modelFieldWrap = capsuleModelField ? capsuleModelField.closest('.field') : null;
const capsuleVarietiesWrap = capsuleVarietiesField ? capsuleVarietiesField.closest('.field') : null;
const capsuleQuantityWrap = capsuleField ? capsuleField.closest('.field') : null;
const additionalCapsulesField = document.getElementById('additional-capsules');
const additionalCapsuleVarietiesField = document.getElementById('additional-capsule-varieties');
const additionalCapsulesWrap = document.getElementById('additional-capsules-field');
const additionalCapsulesDetails = document.getElementById('additional-capsules-details');
const additionalCapsulesChoices = document.querySelectorAll('input[name="Dodatne kapsule"]');
const selectedCapsules = new Map();

function capsulePackageLimit() {
  const selectedModel = capsuleModelField ? capsuleModelField.value : '';
  if (/Inovy Mini/i.test(selectedModel)) return 1;
  if (/Inovy & Milk|Inovy Compact/i.test(selectedModel)) return 4;
  return 0;
}

function isCapsuleOnlyOrder() {
  return topicField && topicField.value === 'Želim naručiti kapsule';
}

function isOfferQuestion() {
  return topicField && topicField.value === 'Imam pitanje o ponudi';
}

function wantsAdditionalCapsules() {
  const selected = document.querySelector('input[name="Dodatne kapsule"]:checked');
  return selected && selected.value === 'Da';
}

function resizeCapsuleVarietiesField() {
  [capsuleVarietiesField, additionalCapsuleVarietiesField].forEach(field => {
    if (!field || field.tagName !== 'TEXTAREA') return;
    field.style.height = 'auto';
    field.style.height = `${Math.max(field.scrollHeight, 72)}px`;
  });
}

function updateSelectedCapsuleField() {
  if (!capsuleField) return;
  const selectedBoxes = Array.from(selectedCapsules.values()).reduce((sum, qty) => sum + qty, 0);
  const minimum = isCapsuleOnlyOrder() ? 0 : capsulePackageLimit();
  capsuleField.value = `${selectedBoxes} kutija`;

  if (additionalCapsulesField) {
    const extraBoxes = Math.max(0, selectedBoxes - (isCapsuleOnlyOrder() ? 0 : minimum));
    const boxWord = extraBoxes === 1 ? 'kutija' : (extraBoxes >= 2 && extraBoxes <= 4 ? 'kutije' : 'kutija');
    additionalCapsulesField.value = `${extraBoxes} ${boxWord}`;
  }

  // For capsule-only orders, every selected box belongs in the main capsule summary.
  const packageBoxes = isCapsuleOnlyOrder() ? selectedBoxes : Math.min(selectedBoxes, minimum);
  const additionalBoxCount = Math.max(0, selectedBoxes - packageBoxes);
  const packageVarieties = new Map();
  const additionalVarieties = new Map();
  let remainingPackageBoxes = packageBoxes;

  selectedCapsules.forEach((qty, name) => {
    const inPackage = Math.min(qty, remainingPackageBoxes);
    if (inPackage > 0) packageVarieties.set(name, inPackage);
    remainingPackageBoxes -= inPackage;
    const extraQty = qty - inPackage;
    if (extraQty > 0) additionalVarieties.set(name, extraQty);
  });

  if (capsuleVarietiesField) {
    capsuleVarietiesField.value = packageVarieties.size
      ? Array.from(packageVarieties, ([name, qty]) => qty > 1 ? `${name} × ${qty}` : name).join(', ')
      : 'Nijedna vrsta još nije odabrana';
  }
  const additionalVarietiesText = additionalVarieties.size
    ? Array.from(additionalVarieties, ([name, qty]) => qty > 1 ? `${name} × ${qty}` : name).join(', ')
    : 'Nijedna dodatna vrsta još nije odabrana';

  // Keep the quantity field numeric-only; variety names stay in the separate field.
  if (additionalCapsulesField) {
    const extraBoxes = additionalBoxCount;
    additionalCapsulesField.value = `${extraBoxes} komada`;
  }
  if (additionalCapsuleVarietiesField) {
    additionalCapsuleVarietiesField.value = additionalVarietiesText;
  }
  // Grow both capsule summary fields to fit all varieties and quantities.
  resizeCapsuleVarietiesField();

  const note = document.getElementById('capsule-selection-note');
  if (note) {
    if (isCapsuleOnlyOrder()) {
      note.textContent = 'Svaki klik na „Odaberi ove kapsule” dodaje jednu kutiju.';
    } else if (minimum > 0) {
      note.textContent = '';
    } else {
      note.textContent = 'Najprije odaberite aparat ili vrstu upita, a zatim izaberite kapsule.';
    }
  }

  const offerQuestionOnly = isOfferQuestion();

  if (modelFieldWrap) {
    modelFieldWrap.hidden = isCapsuleOnlyOrder() || offerQuestionOnly;
  }
  if (capsuleVarietiesWrap) {
    capsuleVarietiesWrap.hidden = offerQuestionOnly;
  }
  if (capsuleQuantityWrap) {
    capsuleQuantityWrap.hidden = offerQuestionOnly;
  }

  if (additionalCapsulesWrap) {
    additionalCapsulesWrap.hidden = offerQuestionOnly || isCapsuleOnlyOrder() || !minimum;
  }
  if (additionalCapsulesDetails) {
    additionalCapsulesDetails.hidden = offerQuestionOnly || !wantsAdditionalCapsules() || isCapsuleOnlyOrder();
  }

  // These details are not sent with a general question, because that request needs only the message.
  [capsuleModelField, capsuleVarietiesField, capsuleField, additionalCapsulesField, additionalCapsuleVarietiesField, ...additionalCapsulesChoices]
    .filter(Boolean)
    .forEach(field => { field.disabled = offerQuestionOnly; });

  const extraDoneButton = document.getElementById('extra-capsules-done');
  if (extraDoneButton) {
    extraDoneButton.hidden = offerQuestionOnly || (isCapsuleOnlyOrder() ? selectedBoxes === 0 : !wantsAdditionalCapsules());
  }
}

document.querySelectorAll('.model-select').forEach(button => {
  button.addEventListener('click', () => {
    const model = document.getElementById('model');
    const modelName = button.dataset.model.replace(/^Lavazza Firma /, '');
    const option = Array.from(model.options).find(item =>
      item.textContent.startsWith(`Lavazza ${modelName} —`)
    );
    if (option) model.value = option.value || option.textContent;
    topicField.value = 'Želim aparat uz mjesečnu kupnju kapsula';
    selectedCapsules.clear();
    const noExtra = document.querySelector('input[name="Dodatne kapsule"][value="Ne"]');
    if (noExtra) noExtra.checked = true;
    if (status) status.textContent = '';
    updateSelectedCapsuleField();
    document.getElementById('narudzba').scrollIntoView({ behavior: 'smooth' });
    capsuleModelField.focus({ preventScroll: true });
  });
});

document.querySelectorAll('.capsule-select').forEach(button => {
  button.addEventListener('click', () => {
    if (!capsuleField) return;
    const variety = button.dataset.capsule;
    const selectedBoxes = Array.from(selectedCapsules.values()).reduce((sum, qty) => sum + qty, 0);
    const minimum = isCapsuleOnlyOrder() ? 0 : capsulePackageLimit();
    const addingExtras = !isCapsuleOnlyOrder() && wantsAdditionalCapsules() && selectedBoxes >= minimum;

    if (!isCapsuleOnlyOrder() && !minimum) {
      if (status) status.textContent = 'Najprije odaberite aparat, a zatim odaberite kapsule.';
      return;
    }
    if (!isCapsuleOnlyOrder() && selectedBoxes >= minimum && !addingExtras) {
      if (status) status.textContent = `Za ovaj aparat odaberite ukupno ${minimum} ${minimum === 1 ? 'kutiju' : 'kutije'}. Već ste odabrali tu količinu.`;
      return;
    }

    selectedCapsules.set(variety, (selectedCapsules.get(variety) || 0) + 1);
    updateSelectedCapsuleField();
    if (status) status.textContent = '';
    if (!isCapsuleOnlyOrder() && minimum > 0 && selectedBoxes + 1 === minimum) {
      const enquirySection = document.getElementById('narudzba');
      if (enquirySection) window.setTimeout(() => enquirySection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    }
  });
});

additionalCapsulesChoices.forEach(choice => {
  choice.addEventListener('change', () => {
    if (choice.value === 'Ne') {
      // Switching back to NE cancels every capsule box selected as an extra.
      const minimum = capsulePackageLimit();
      let remainingPackageBoxes = minimum;
      const packageSelections = new Map();

      selectedCapsules.forEach((qty, name) => {
        const keepQty = Math.min(qty, remainingPackageBoxes);
        if (keepQty > 0) packageSelections.set(name, keepQty);
        remainingPackageBoxes -= keepQty;
      });

      selectedCapsules.clear();
      packageSelections.forEach((qty, name) => selectedCapsules.set(name, qty));
    }

    updateSelectedCapsuleField();
    if (choice.value === 'Da') {
      const capsuleSection = document.getElementById('kapsule');
      if (capsuleSection) capsuleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const enquirySection = document.getElementById('narudzba');
      if (enquirySection) enquirySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

const extraCapsulesDoneButton = document.getElementById('extra-capsules-done');
if (extraCapsulesDoneButton) {
  extraCapsulesDoneButton.addEventListener('click', () => {
    const enquirySection = document.getElementById('narudzba');
    if (enquirySection) enquirySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

if (topicField) {
  topicField.addEventListener('change', () => {
    if ((isCapsuleOnlyOrder() || isOfferQuestion()) && capsuleModelField) {
      // Do not include a previously selected appliance with a capsule-only order or a general question.
      capsuleModelField.selectedIndex = 0;
      const noExtra = document.querySelector('input[name="Dodatne kapsule"][value="Ne"]');
      if (noExtra) noExtra.checked = true;
    }
    selectedCapsules.clear();
    if (status) status.textContent = '';
    updateSelectedCapsuleField();
  });
}

if (capsuleModelField) {
  capsuleModelField.addEventListener('change', () => {
    selectedCapsules.clear();
    if (status) status.textContent = '';
    updateSelectedCapsuleField();
  });
}

updateSelectedCapsuleField();

/* Interactive appliance finder. The final choice reuses the existing model-selection flow. */
(function setupApplianceFinder(){
  const finder = document.getElementById('appliance-finder');
  if (!finder) return;

  const steps = Array.from(finder.querySelectorAll('[data-finder-step]'));
  const result = document.getElementById('finder-result');
  const progressLabel = document.getElementById('finder-progress-label');
  const progressFill = document.getElementById('finder-progress-fill');
  const statusMessage = document.getElementById('finder-status');
  const resultTitle = document.getElementById('finder-result-title');
  const resultCopy = document.getElementById('finder-result-copy');
  const resultTag = document.getElementById('finder-result-tag');
  const resultFacts = document.getElementById('finder-result-facts');
  const resultButton = result.querySelector('.finder-result-button');
  let activeStep = 1;

  const useLabels = {
    home: 'za dom',
    apartment: 'za apartman',
    office: 'za ured ili poslovni prostor'
  };

  const models = {
    mini: {
      name: 'Inovy Mini',
      modelValue: 'Lavazza Firma Inovy Mini',
      quantity: 'Min. količina: 1 kutija',
      tag: 'Najkompaktniji izbor',
      facts: ['2 izbora napitaka', 'Spremnik vode 0,7 l', 'Ladica do 6 kapsula']
    },
    compact: {
      name: 'Inovy Compact',
      modelValue: 'Lavazza Firma Inovy Compact',
      quantity: 'Min. količina: 4 kutije',
      tag: 'Uravnotežen izbor',
      facts: ['3 izbora napitaka', 'Spremnik vode 0,9 l', 'Ladica do 10 kapsula']
    },
    milk: {
      name: 'Inovy & Milk',
      modelValue: 'Lavazza Firma Inovy & Milk',
      quantity: 'Min. količina: 4 kutije',
      tag: 'Za napitke s mlijekom',
      facts: ['6 izbora napitaka', 'Spremnik vode 1,8 l', 'Ladica do 19 kapsula']
    }
  };

  function answer(name) {
    const chosen = finder.querySelector(`input[name="${name}"]:checked`);
    return chosen ? chosen.value : '';
  }

  function showStep(step) {
    activeStep = step;
    steps.forEach(item => {
      item.hidden = Number(item.dataset.finderStep) !== step;
    });
    result.hidden = true;
    statusMessage.textContent = '';
    progressLabel.textContent = `Korak ${step} od ${steps.length}`;
    progressFill.style.width = `${(step / steps.length) * 100}%`;
    const fieldset = steps.find(item => Number(item.dataset.finderStep) === step)?.querySelector('fieldset');
    if (fieldset) fieldset.focus({ preventScroll: true });
  }

  function getRecommendation() {
    const drinks = answer('finder-drinks');
    const priority = answer('finder-priority');

    if (drinks === 'milk') return 'milk';
    if (priority === 'compact') return 'mini';
    if (drinks === 'black') return 'compact';
    if (priority === 'variety') return 'milk';
    return 'compact';
  }

  function getReason(key, use) {
    if (key === 'mini') {
      return `Budući da vam je najvažniji manji format, Inovy Mini dobar je kandidat ${use}. Od tri modela na ovoj stranici zauzima najmanje prostora.`;
    }
    if (key === 'milk' && answer('finder-drinks') === 'milk') {
      return `Budući da želite napitke s mlijekom, Inovy & Milk najbolje odgovara tom izboru ${use}. Ima integrirani sustav za pripremu mliječnih napitaka.`;
    }
    if (key === 'milk') {
      return `Ako želite širi izbor napitaka, Inovy & Milk nudi šest mogućnosti, uključujući crnu kavu i napitke s mlijekom. Može biti dobar izbor ${use}.`;
    }
    if (answer('finder-drinks') === 'black') {
      return `Za vaš odabir crne kave, Inovy Compact nudi kompaktan format i tri izbora napitaka ${use}, uz veći spremnik i ladicu od modela Mini.`;
    }
    return `Ako još istražujete mogućnosti, Inovy Compact praktičan je početni izbor ${use}: kompaktan je, a nudi tri izbora napitaka.`;
  }

  function showRecommendation() {
    const use = answer('finder-use');
    const drinks = answer('finder-drinks');
    const priority = answer('finder-priority');
    if (!use || !drinks || !priority) {
      statusMessage.textContent = 'Odaberite jednu opciju prije nego što prikažemo preporuku.';
      return;
    }

    const key = getRecommendation();
    const model = models[key];
    resultTag.textContent = model.tag;
    resultTitle.textContent = model.name;
    resultCopy.textContent = getReason(key, useLabels[use] || 'za vaš prostor');
    resultFacts.replaceChildren();
    model.facts.forEach(fact => {
      const item = document.createElement('li');
      item.textContent = fact;
      resultFacts.append(item);
    });

    resultButton.dataset.model = model.modelValue;
    resultButton.dataset.quantity = model.quantity;
    resultButton.setAttribute('aria-label', `Odaberi aparat ${model.name}`);
    steps.forEach(item => { item.hidden = true; });
    result.hidden = false;
    statusMessage.textContent = '';
    progressLabel.textContent = 'Preporuka je spremna';
    progressFill.style.width = '100%';
    resultTitle.focus({ preventScroll: true });
  }

  finder.querySelectorAll('[data-finder-next]').forEach(button => {
    button.addEventListener('click', () => {
      const current = steps.find(item => Number(item.dataset.finderStep) === activeStep);
      if (!current || !current.querySelector('input[type="radio"]:checked')) {
        statusMessage.textContent = 'Odaberite jednu opciju za nastavak.';
        return;
      }
      showStep(Number(button.dataset.finderNext));
    });
  });

  finder.querySelectorAll('[data-finder-prev]').forEach(button => {
    button.addEventListener('click', () => showStep(Number(button.dataset.finderPrev)));
  });

  const showResultButton = document.getElementById('finder-show-result');
  if (showResultButton) showResultButton.addEventListener('click', showRecommendation);

  const restartButton = document.getElementById('finder-restart');
  if (restartButton) {
    restartButton.addEventListener('click', () => {
      finder.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = false; });
      showStep(1);
    });
  }

  showStep(1);
})();



/* Experimental scroll-snap + scrollytelling. Progressive enhancement; content remains visible without JS. */
(function setupScrollExperience(){
  const progressFill = document.getElementById('scroll-progress-fill');
  let progressFrame = 0;

  function updateReadingProgress(){
    progressFrame = 0;
    if (!progressFill) return;
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    progressFill.style.transform = 'scaleX(' + progress + ')';
  }

  function scheduleProgressUpdate(){
    if (!progressFrame) progressFrame = window.requestAnimationFrame(updateReadingProgress);
  }

  window.addEventListener('scroll', scheduleProgressUpdate, {passive:true});
  window.addEventListener('resize', scheduleProgressUpdate, {passive:true});
  window.addEventListener('load', scheduleProgressUpdate, {once:true});
  updateReadingProgress();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const selectors = [
    '.hero-copy > *',
    '.hero-visual',
    '.info-strip > div',
    '.section-heading',
    '.steps article',
    '.finder-panel',
    '.model-card',
    '.capsule-inner > *',
    '.capsule-card',
    '#order-form',
    '.email-order-note',
    '.footer-main',
    'footer .legal'
  ];
  const targets = Array.from(new Set(selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)))));
  if (!targets.length) return;

  targets.forEach((element,index)=>{
    element.classList.add('reveal-on-scroll');
    element.style.setProperty('--reveal-delay', (Math.min(index % 4,3) * 80) + 'ms');
  });
  document.documentElement.classList.add('motion-ready');

  const observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in-view');
      observer.unobserve(entry.target);
    });
  }, {threshold:0.12, rootMargin:'0px 0px -5% 0px'});

  targets.forEach(element=>observer.observe(element));
})();


/* Hero slideshow: slow crossfades, with a pause control and reduced-motion support. */
(function setupHeroSlideshow(){
  const gallery = document.querySelector('.hero-photo');
  if (!gallery) return;
  const slides = Array.from(gallery.querySelectorAll('[data-hero-slide]'));
  const toggle = document.getElementById('hero-slideshow-toggle');
  const counter = document.getElementById('hero-slide-count');
  const progress = gallery.querySelector('.hero-slide-progress');
  if (slides.length < 2) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeSlide = slides.find(slide => slide.classList.contains('is-active')) || slides[0];
  let timer = null;
  let paused = reduceMotion.matches;
  const intervalMs = 6200;

  function availableSlides(){
    return slides.filter(slide => slide.dataset.failed !== 'true');
  }
  function renderCounter(){
    const available = availableSlides();
    const position = Math.max(0, available.indexOf(activeSlide)) + 1;
    if (counter) counter.textContent = String(position).padStart(2,'0') + ' / ' + String(available.length).padStart(2,'0');
  }
  function activate(slide){
    if (!slide || slide.dataset.failed === 'true') return;
    activeSlide = slide;
    slides.forEach(item => {
      const active = item === slide;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-hidden', active ? 'false' : 'true');
      item.tabIndex = active ? 0 : -1;
    });
    renderCounter();
    gallery.classList.remove('hero-slideshow-running');
    if (progress) progress.offsetWidth;
    if (!paused && !reduceMotion.matches) requestAnimationFrame(() => gallery.classList.add('hero-slideshow-running'));
  }
  function advance(){
    const available = availableSlides();
    if (available.length < 2) return;
    const current = available.indexOf(activeSlide);
    activate(available[(current + 1 + available.length) % available.length]);
  }
  function stop(){
    if (timer) window.clearInterval(timer);
    timer = null;
    gallery.classList.remove('hero-slideshow-running');
  }
  function start(){
    stop();
    if (paused || reduceMotion.matches || document.hidden || availableSlides().length < 2) return;
    gallery.classList.add('hero-slideshow-running');
    timer = window.setInterval(advance, intervalMs);
  }

  slides.forEach(slide => {
    slide.addEventListener('error', () => {
      const wasActive = slide === activeSlide;
      slide.dataset.failed = 'true';
      slide.style.display = 'none';
      if (wasActive) {
        const next = availableSlides()[0];
        if (next) activate(next);
      }
      renderCounter();
      start();
    }, {once:true});
    slide.tabIndex = slide === activeSlide ? 0 : -1;
    slide.setAttribute('aria-hidden', slide === activeSlide ? 'false' : 'true');
  });

  if (toggle){
    toggle.hidden = reduceMotion.matches;
    toggle.addEventListener('click', () => {
      paused = !paused;
      toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
      toggle.setAttribute('aria-label', paused ? 'Nastavi izmjenu fotografija' : 'Pauziraj izmjenu fotografija');
      toggle.querySelector('span').textContent = paused ? '▶' : 'Ⅱ';
      if (paused) stop(); else start();
    });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });
  if (typeof reduceMotion.addEventListener === 'function'){
    reduceMotion.addEventListener('change', event => {
      if (toggle) toggle.hidden = event.matches;
      if (event.matches){ paused = true; stop(); }
      else { paused = false; start(); }
    });
  }
  renderCounter();
  start();
})();

/* Scroll-linked film strip. Clicking its thumbnail opens the user's video in a new YouTube tab. */
(function setupScrollFilm(){
  const section = document.getElementById('lavazza-film');
  const banner = section && section.querySelector('.film-banner');
  if (!section || !banner) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let framePending = false;

  function updateFilm(){
    framePending = false;
    if (reduceMotion.matches){
      banner.style.opacity = '1';
      banner.style.transform = 'none';
      return;
    }
    const scrollRange = Math.max(1, section.offsetHeight - window.innerHeight);
    const sectionProgress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / scrollRange));
    const fade = Math.min(1, Math.max(0, (sectionProgress - 0.04) / 0.92));
    banner.style.opacity = String(1 - fade);
    banner.style.transform = 'translate3d(0,' + (-fade * 18).toFixed(1) + 'px,0) scale(' + (1 - fade * 0.035).toFixed(4) + ')';
    banner.style.pointerEvents = fade > 0.94 ? 'none' : 'auto';
  }
  function scheduleUpdate(){
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateFilm);
  }
  window.addEventListener('scroll', scheduleUpdate, {passive:true});
  window.addEventListener('resize', scheduleUpdate, {passive:true});
  if (typeof reduceMotion.addEventListener === 'function') reduceMotion.addEventListener('change', scheduleUpdate);
  updateFilm();
})();

/* Desktop wheel scrolling advances one chapter at a measured, smooth pace. */
(function setupGentleWheelScroll(){
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (motionQuery.matches || !finePointer.matches) return;

  const root = document.documentElement;
  const sectionSelector = '.hero, .film-section, .film-snap-point, .how-section, .finder-section, #ponuda, #kapsule, .order-section, footer';
  let busy = false;
  let unlockTimer = null;
  let animationFrame = 0;

  function getStops(){
    const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    return Array.from(document.querySelectorAll(sectionSelector))
      .map(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const margin = parseFloat(style.scrollMarginTop) || 0;
        return {element, top: Math.max(0, rect.top + window.scrollY - padding - margin)};
      })
      .sort((a,b) => a.top - b.top)
      .filter((stop,index,all) => index === 0 || Math.abs(stop.top - all[index-1].top) > 90);
  }

  function animateTo(target){
    const start = window.scrollY;
    const distance = target - start;
    if (Math.abs(distance) < 24) return;
    const duration = 880;
    const startTime = performance.now();
    const oldSnap = root.style.scrollSnapType;
    const oldBehavior = root.style.scrollBehavior;
    root.style.scrollSnapType = 'none';
    root.style.scrollBehavior = 'auto';

    function step(now){
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
      window.scrollTo(0, start + distance * eased);
      if (t < 1){
        animationFrame = window.requestAnimationFrame(step);
      } else {
        animationFrame = 0;
        window.scrollTo(0, target);
        root.style.scrollSnapType = oldSnap;
        root.style.scrollBehavior = oldBehavior;
        busy = false;
      }
    }
    animationFrame = window.requestAnimationFrame(step);
  }

  window.addEventListener('wheel', event => {
    if (motionQuery.matches || !finePointer.matches) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (Math.abs(event.deltaY) < 8) return;
    if (event.target instanceof Element && event.target.closest('textarea, select, input, [contenteditable="true"]')) return;

    const stops = getStops();
    if (stops.length < 2) return;
    event.preventDefault();
    if (busy) return;

    const current = window.scrollY;
    const direction = Math.sign(event.deltaY);
    let targetStop;
    if (direction > 0){
      targetStop = stops.find(stop => stop.top > current + 100);
      if (!targetStop) return;
    } else {
      for (let index = stops.length - 1; index >= 0; index--){
        if (stops[index].top < current - 100){
          targetStop = stops[index];
          break;
        }
      }
      if (!targetStop) return;
    }

    busy = true;
    if (unlockTimer) window.clearTimeout(unlockTimer);
    animateTo(Math.min(Math.max(0, targetStop.top), root.scrollHeight - window.innerHeight));
    unlockTimer = window.setTimeout(() => { busy = false; }, 1250);
  }, {passive:false});

  motionQuery.addEventListener?.('change', event => {
    if (event.matches && animationFrame){
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      root.style.scrollSnapType = '';
      root.style.scrollBehavior = '';
      busy = false;
    }
  });
})();
