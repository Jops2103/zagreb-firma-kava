/* On refresh, remove any section hash and return to the top, including on mobile browsers that restore scroll late. */
(function resetScrollPositionOnRefresh(){
  const navigation = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (!navigation || navigation.type !== 'reload') return;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // A saved URL hash can make mobile browsers jump back to a section after the initial scroll.
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  const returnToTop = () => window.scrollTo(0, 0);
  returnToTop();
  window.addEventListener('load', returnToTop, { once: true });
  window.addEventListener('pageshow', () => {
    returnToTop();
    window.setTimeout(returnToTop, 100);
    window.setTimeout(returnToTop, 400);
  }, { once: true });
})();

const form = document.getElementById('order-form');
const status = document.getElementById('status');

// Keep a clearly named copy of the sender's email in the submitted message body.
// The required email field is validated by the browser before this submit handler runs.
if (form) {
  form.addEventListener('submit', (event) => {
    // Validate standard required fields first.
    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      if (status) status.textContent = 'Ispunite sva obavezna polja označena zvjezdicom (*) i potvrdite suglasnost.';
      return;
    }

    // When an appliance is selected, the required minimum capsule boxes must also be selected.
    const selectedModel = document.getElementById('model');
    const selectedTopic = document.getElementById('topic');
    const capsuleInput = document.getElementById('capsules');
    const capsuleWrap = capsuleInput && capsuleInput.closest('.capsule-selection-field');
    const capsuleNote = document.getElementById('capsule-selection-note');
    const selectedCount = Array.from(selectedCapsules.values()).reduce((sum, qty) => sum + qty, 0);
    const minimum = capsulePackageLimit();
    const applianceOrder = selectedTopic && selectedTopic.value === 'Želim aparat uz mjesečnu kupnju kapsula';
    if (applianceOrder && selectedModel && selectedModel.value && minimum > 0 && selectedCount < minimum) {
      event.preventDefault();
      if (capsuleWrap) capsuleWrap.classList.add('capsule-selection-invalid');
      if (capsuleInput) capsuleInput.setAttribute('aria-invalid', 'true');
      if (capsuleNote) {
        capsuleNote.textContent = `Obavezno: odaberite najmanje ${minimum} ${minimum === 1 ? 'kutiju kapsula' : 'kutije kapsula'} za odabrani aparat. Kliknite kapsule u galeriji iznad.`;
        capsuleNote.classList.add('capsule-error-note');
      }
      if (status) status.textContent = 'Upit nije poslan. Obavezno odaberite minimalnu količinu kapsula za odabrani aparat.';
      if (capsuleWrap) {
        capsuleWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        capsuleInput?.focus({ preventScroll: true });
      }
      return;
    }

    // Give every submission a distinct subject so mail clients are less likely to group inquiries into one conversation.
    const subjectInput = form.querySelector('input[name="_subject"]');
    const topicForSubject = (selectedTopic && selectedTopic.value || 'Novi upit').trim();
    const modelForSubject = (selectedModel && selectedModel.value || '').trim();
    const subjectDetails = [topicForSubject, modelForSubject && modelForSubject !== 'Nisam još odabrao/la' ? modelForSubject : 'bez odabranog aparata']
      .filter(Boolean)
      .join(' — ');
    const submittedAt = new Date();
    const readableTime = submittedAt.toLocaleString('hr-HR', { dateStyle: 'short', timeStyle: 'medium' });
    if (subjectInput) subjectInput.value = `ZFK — ${subjectDetails} — ${readableTime} — #${Date.now()}`;

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

// Enlarge product and hero photos on click; close with Escape or backdrop.
(function setupImageLightbox(){
  const images = Array.from(document.querySelectorAll('.product-gallery img, .model-image-gallery img, .hero-product-image'));
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
  const previous = document.createElement('button');
  previous.className = 'image-lightbox-nav image-lightbox-previous';
  previous.type = 'button';
  previous.setAttribute('aria-label', 'Prethodna fotografija');
  previous.textContent = '‹';
  const next = document.createElement('button');
  next.className = 'image-lightbox-nav image-lightbox-next';
  next.type = 'button';
  next.setAttribute('aria-label', 'Sljedeća fotografija');
  next.textContent = '›';
  overlay.append(enlarged, previous, next, close, caption);
  document.body.append(overlay);
  let previousFocus = null;
  let activeImages = [];
  let activeIndex = 0;

  function showImage(index) {
    if (!activeImages.length) return;
    activeIndex = (index + activeImages.length) % activeImages.length;
    const image = activeImages[activeIndex];
    enlarged.src = image.currentSrc || image.src;
    enlarged.alt = image.alt || 'Uvećana fotografija proizvoda';
    caption.textContent = (image.classList.contains('hero-product-image') ? 'Lavazza Firma' : (image.alt || '')) +
      (activeImages.length > 1 ? ` · ${activeIndex + 1} / ${activeImages.length}` : '');
    const hasNavigation = activeImages.length > 1;
    previous.hidden = !hasNavigation;
    next.hidden = !hasNavigation;
  }
  function openImage(image) {
    previousFocus = document.activeElement;
    const gallery = image.closest('.product-gallery, .model-image-gallery, .capsule-gallery');
    activeImages = gallery
      ? Array.from(gallery.querySelectorAll('img'))
      : [image];
    activeIndex = Math.max(0, activeImages.indexOf(image));
    showImage(activeIndex);
    overlay.classList.add('open');
    document.body.classList.add('lightbox-open');
    close.focus();
  }
  function closeImage() {
    overlay.classList.remove('open');
    document.body.classList.remove('lightbox-open');
    enlarged.removeAttribute('src');
    activeImages = [];
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }
  previous.addEventListener('click', () => showImage(activeIndex - 1));
  next.addEventListener('click', () => showImage(activeIndex + 1));
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

  // On touchscreens, swipe left/right in the enlarged image to browse the same gallery.
  let touchStartX = 0;
  let touchStartY = 0;
  overlay.addEventListener('touchstart', event => {
    if (!overlay.classList.contains('open') || !event.changedTouches.length) return;
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
  }, {passive:true});
  overlay.addEventListener('touchend', event => {
    if (!overlay.classList.contains('open') || !event.changedTouches.length || activeImages.length < 2) return;
    const dx = event.changedTouches[0].clientX - touchStartX;
    const dy = event.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      showImage(activeIndex + (dx < 0 ? 1 : -1));
    }
  }, {passive:true});

  document.addEventListener('keydown', event => {
    if (!overlay.classList.contains('open')) return;
    if (event.key === 'Escape') closeImage();
    else if (event.key === 'ArrowLeft' && activeImages.length > 1) showImage(activeIndex - 1);
    else if (event.key === 'ArrowRight' && activeImages.length > 1) showImage(activeIndex + 1);
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
const capsuleSelectionStorageKey = 'zfk-selected-capsules-v1';

function saveCapsuleSelections() {
  try { localStorage.setItem(capsuleSelectionStorageKey, JSON.stringify(Array.from(selectedCapsules.entries()))); } catch (error) { /* Storage may be unavailable; current-page selection still works. */ }
}

function restoreCapsuleSelections() {
  try {
    const saved = JSON.parse(localStorage.getItem(capsuleSelectionStorageKey) || '[]');
    if (Array.isArray(saved)) saved.forEach(entry => {
      if (Array.isArray(entry) && typeof entry[0] === 'string' && Number.isFinite(entry[1]) && entry[1] > 0) {
        selectedCapsules.set(entry[0], Math.floor(entry[1]));
      }
    });
  } catch (error) { /* Ignore invalid or unavailable saved selections. */ }
}

function capsulePackageLimit() {
  const selectedModel = capsuleModelField ? capsuleModelField.value : '';
  if (/LB\s*300/i.test(selectedModel)) return 1;
  if (/LB\s*1200/i.test(selectedModel)) return 2;
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
  const boxLabel = selectedBoxes === 1
    ? '1 kutija'
    : selectedBoxes >= 2 && selectedBoxes <= 4
      ? `${selectedBoxes} kutije`
      : selectedBoxes >= 5
        ? `${selectedBoxes} kutija`
        : '';
  capsuleField.value = boxLabel;

  // Clear the visible validation state as soon as the required capsule quantity is selected.
  const capsuleSelectionWrap = capsuleField.closest('.capsule-selection-field');
  const capsuleSelectionNote = document.getElementById('capsule-selection-note');
  if (capsuleSelectionWrap && selectedBoxes >= minimum && minimum > 0) {
    capsuleSelectionWrap.classList.remove('capsule-selection-invalid');
    capsuleField.removeAttribute('aria-invalid');
    if (capsuleSelectionNote) capsuleSelectionNote.classList.remove('capsule-error-note');
    if (status && status.textContent.startsWith('Upit nije poslan. Obavezno odaberite')) status.textContent = '';
  }

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
      const selectedCount = Array.from(selectedCapsules.values()).reduce((sum, qty) => sum + qty, 0);
      note.textContent = selectedCount < minimum
        ? `Za odabrani aparat obavezno odaberite najmanje ${minimum} ${minimum === 1 ? 'kutiju kapsula' : 'kutije kapsula'}. Nakon odabira vratit ćemo vas na upit, gdje možete izabrati želite li odmah naručiti još kutija.`
        : 'Minimalna količina je odabrana. Nastavite na upit i odaberite DA ako želite dodati još kutija.';
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
    const modelName = (button.dataset.model || '').replace(/^Lavazza (?:Firma )?/, '');
    const modelOption = Array.from(capsuleModelField.options).find(item =>
      item.textContent.toLowerCase().includes(modelName.toLowerCase())
    );
    if (modelOption) capsuleModelField.value = modelOption.value || modelOption.textContent;
    topicField.value = 'Želim aparat uz mjesečnu kupnju kapsula';
    selectedCapsules.clear();
    saveCapsuleSelections();
    const noExtra = document.querySelector('input[name="Dodatne kapsule"][value="Ne"]');
    if (noExtra) noExtra.checked = true;
    if (status) status.textContent = '';
    updateSelectedCapsuleField();
    const capsuleSection = document.getElementById('kapsule');
    if (capsuleSection) capsuleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const note = document.getElementById('capsule-selection-note');
    if (note) note.focus?.({ preventScroll: true });
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
    saveCapsuleSelections();
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
      saveCapsuleSelections();
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
    saveCapsuleSelections();
    if (status) status.textContent = '';
    updateSelectedCapsuleField();
  });
}

if (capsuleModelField) {
  capsuleModelField.addEventListener('change', () => {
    selectedCapsules.clear();
    saveCapsuleSelections();
    if (status) status.textContent = '';
    updateSelectedCapsuleField();
  });
}

// Do not revive a stale capsule quantity from an earlier visit. Keep saved choices
// only when returning from a capsule detail page, where the query parameter records
// the user's explicit add-to-order action.
const capsuleFromDetail = params.get('odaberiKapsulu');
if (capsuleFromDetail) {
  restoreCapsuleSelections();
} else {
  selectedCapsules.clear();
  try { localStorage.removeItem(capsuleSelectionStorageKey); } catch (error) { /* Storage may be unavailable. */ }
}
updateSelectedCapsuleField();

// A capsule chosen on its detail page adds one box without clearing earlier choices.
if (capsuleFromDetail && capsuleField && topicField) {
  const matchingCapsuleButton = Array.from(document.querySelectorAll('.capsule-select'))
    .find(button => button.dataset.capsule === capsuleFromDetail);
  if (matchingCapsuleButton) {
    topicField.value = 'Želim naručiti kapsule';
    selectedCapsules.set(capsuleFromDetail, (selectedCapsules.get(capsuleFromDetail) || 0) + 1);
    saveCapsuleSelections();
    updateSelectedCapsuleField();
    if (status) status.textContent = '';
    params.delete('odaberiKapsulu');
    const remainingQuery = params.toString();
    const cleanUrl = window.location.pathname + (remainingQuery ? '?' + remainingQuery : '') + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
  }
}

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
      name: 'LB 300 mini',
      modelValue: 'Lavazza LB 300',
      quantity: 'Min. količina: 1 kutija',
      tag: 'Najkompaktniji izbor',
      facts: ['2 izbora napitaka', 'Spremnik vode 0,7 l', 'Ladica do 6 kapsula']
    },
    compact: {
      name: 'LF 900',
      modelValue: 'Lavazza Firma LF 900',
      quantity: 'Min. količina: 4 kutije',
      tag: 'Uravnotežen izbor',
      facts: ['3 izbora napitaka', 'Spremnik vode 0,9 l', 'Ladica do 10 kapsula']
    },
    milk: {
      name: 'LB 1200 Classy & Milk',
      modelValue: 'Lavazza LB 1200',
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
      return `Budući da vam je najvažniji manji format, LB 300 mini dobar je kandidat ${use}. Od četiri modela na ovoj stranici zauzima najmanje prostora.`;
    }
    if (key === 'milk' && answer('finder-drinks') === 'milk') {
      return `Budući da želite napitke s mlijekom, LB 1200 Classy & Milk najbolje odgovara tom izboru ${use}. Ima integrirani sustav za pripremu mliječnih napitaka.`;
    }
    if (key === 'milk') {
      return `Ako želite širi izbor napitaka, LB 1200 Classy & Milk nudi šest mogućnosti, uključujući crnu kavu i napitke s mlijekom. Može biti dobar izbor ${use}.`;
    }
    if (answer('finder-drinks') === 'black') {
      return `Za vaš odabir crne kave, LF 900 nudi kompaktan format i tri izbora napitaka ${use}, uz veći spremnik i ladicu od modela Mini.`;
    }
    return `Ako još istražujete mogućnosti, LF 900 praktičan je početni izbor ${use}: kompaktan je, a nudi tri izbora napitaka.`;
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



/* Native page scrolling; only in-page actions use the browser's gentle smooth-scroll behavior. */


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

/* Gentle image parallax for the full-width video thumbnail; the PLAY link opens YouTube in a new tab. */
(function setupFilmImageParallax(){
  const section = document.getElementById('lavazza-film');
  const image = section && section.querySelector('.film-banner-image');
  if (!section || !image) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) return;
  let framePending = false;

  function updateImagePosition(){
    framePending = false;
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    if (rect.bottom < 0 || rect.top > viewportHeight) return;
    const progress = Math.max(0, Math.min(1, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
    // Stronger parallax: the enlarged photo travels upward as the page scrolls down.
    const shift = (progress - 0.5) * -260;
    image.style.setProperty('--film-image-shift', shift.toFixed(1) + 'px');
  }
  function requestUpdate(){
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateImagePosition);
  }
  window.addEventListener('scroll', requestUpdate, {passive:true});
  window.addEventListener('resize', requestUpdate);
  updateImagePosition();
})();


/* On phones, move the same PLAY link onto the hero photo; restore it to the capsule banner on wider screens. */
(function placeMobilePlayOnHeroImage(){
  const play = document.querySelector('#lavazza-film .film-banner-play');
  const banner = document.querySelector('#lavazza-film .film-banner');
  const heroImage = document.querySelector('.hero-image-wrap');
  if (!play || !banner || !heroImage) return;

  const mobile = window.matchMedia('(max-width: 700px), (orientation: landscape) and (max-height: 520px)');
  function place(){
    if (mobile.matches){
      if (play.parentElement !== heroImage) heroImage.appendChild(play);
    } else if (play.parentElement !== banner){
      banner.appendChild(play);
    }
  }
  place();
  if (typeof mobile.addEventListener === 'function') mobile.addEventListener('change', place);
  else if (typeof mobile.addListener === 'function') mobile.addListener(place);
})();


/* Mobile-specific scroll effects: lightweight reveal and subtle portrait hero parallax. */
(function setupMobileScrollEffects(){
  const mobile = window.matchMedia('(max-width:700px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!mobile.matches) return;

  const revealTargets = Array.from(document.querySelectorAll('.model-card, .capsule-card, #kako-radi .steps article'));
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {threshold:0.12, rootMargin:'0px 0px -36px 0px'});

    const groups = [
      Array.from(document.querySelectorAll('.model-card')),
      Array.from(document.querySelectorAll('.capsule-card')),
      Array.from(document.querySelectorAll('#kako-radi .steps article'))
    ];
    groups.forEach(group => group.forEach((element,index) => {
      element.classList.add('mobile-reveal');
      element.style.setProperty('--mobile-reveal-delay', Math.min(index,3) * 55 + 'ms');
      observer.observe(element);
    }));
  }

  // Keep the parallax deliberately subtle and limited to portrait phones.
  const portrait = window.matchMedia('(max-width:700px) and (orientation:portrait)');
  const hero = document.querySelector('.hero-image-wrap');
  const heroImage = hero && hero.querySelector('.hero-product-image');
  if (!hero || !heroImage || reduceMotion.matches || !portrait.matches) return;

  let framePending = false;
  function updateParallax(){
    framePending = false;
    if (!portrait.matches || !mobile.matches || reduceMotion.matches) {
      heroImage.style.removeProperty('--mobile-hero-shift');
      return;
    }
    const rect = hero.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    if (rect.bottom < 0 || rect.top > viewportHeight) return;
    const distance = (viewportHeight * 0.5) - (rect.top + rect.height * 0.5);
    const shift = Math.max(-12, Math.min(12, distance * -0.025));
    heroImage.style.setProperty('--mobile-hero-shift', shift.toFixed(1) + 'px');
  }
  function scheduleParallax(){
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateParallax);
  }
  window.addEventListener('scroll', scheduleParallax, {passive:true});
  window.addEventListener('resize', scheduleParallax);
  if (typeof portrait.addEventListener === 'function') portrait.addEventListener('change', scheduleParallax);
  updateParallax();
})();
