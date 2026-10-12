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
const additionalCapsulesChoices = document.querySelectorAll('input[name="additional_capsules_choice"]');
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
  const selected = document.querySelector('input[name="additional_capsules_choice"]:checked');
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
    const noExtra = document.querySelector('input[name="additional_capsules_choice"][value="Ne"]');
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
      const noExtra = document.querySelector('input[name="additional_capsules_choice"][value="Ne"]');
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

/* Mobile floating enquiry button: keep it out of the way while the form is in view. */
(function setupMobileOrderCta(){
  const cta = document.querySelector('.mobile-order-cta');
  const orderSection = document.getElementById('narudzba');
  if (!cta || !orderSection || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(entries => {
    const formIsVisible = entries.some(entry => entry.isIntersecting);
    cta.classList.toggle('is-hidden', formIsVisible);
  }, { root: null, threshold: 0.05 });

  observer.observe(orderSection);
})();
