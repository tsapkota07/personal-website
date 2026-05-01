/*
  ============================================================
  CONTACT MODAL
  ============================================================
  Formspree ID is set below. Replace 'YOUR_FORM_ID' with the
  ID from your Formspree dashboard (formspree.io).
*/

const FORMSPREE_ID = 'xpqybgnk';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── DOM refs ───────────────────────────────────────────────
const overlay   = document.getElementById('contactOverlay');
const modalCard = document.getElementById('contactCard');
const closeBtn  = document.getElementById('contactClose');
const form      = document.getElementById('contactForm');
const submitBtn = document.getElementById('contactSubmit');
const successEl = document.getElementById('contactSuccess');
const errorEl   = document.getElementById('contactError');
const triggers  = document.querySelectorAll('[data-open-contact]');

// Guard: only run if the modal HTML is on this page
if (overlay) {

  // ── Focus trap ──────────────────────────────────────────
  /*
    Collects all keyboard-focusable elements inside the modal
    that are currently visible (not inside a .hidden element).
    On Tab / Shift+Tab, wraps around instead of leaving the modal.
  */
  function getFocusable() {
    return Array.from(
      modalCard.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.closest('.hidden'));
  }

  function onTrapTab(e) {
    if (e.key !== 'Tab') return;
    const focusable = getFocusable();
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift+Tab going backwards: wrap to last
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab going forwards: wrap to first
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // ── Validation ──────────────────────────────────────────
  /*
    Each field maps to an error <p id="err-{name}">.
    Returns true if the field is valid, false otherwise.
    Also toggles .invalid on the input for border styling.
  */
  function validateField(input) {
    const val = input.value.trim();
    let msg = '';

    if (input.name === 'name') {
      if (!val)            msg = 'name is required.';
      else if (val.length < 2) msg = 'name must be at least 2 characters.';
    } else if (input.name === 'email') {
      if (!val)                 msg = 'email is required.';
      else if (!EMAIL_RE.test(val)) msg = 'please enter a valid email address.';
    } else if (input.name === 'message') {
      if (!val)             msg = 'message is required.';
      else if (val.length < 10) msg = 'please write at least 10 characters.';
    }

    const errEl = document.getElementById(`err-${input.name}`);
    if (errEl) errEl.textContent = msg;
    input.classList.toggle('invalid', !!msg);
    return msg === '';
  }

  // Validate on blur; re-validate on input once a field has been touched
  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('invalid')) validateField(field);
    });
  });

  // ── Open ────────────────────────────────────────────────
  function openModal() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onTrapTab);

    // Reset to idle state
    form.classList.remove('hidden');
    successEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    submitBtn.textContent = 'send →';
    submitBtn.disabled = false;

    // Clear any previous validation state
    form.querySelectorAll('input, textarea').forEach(f => {
      f.classList.remove('invalid');
      const err = document.getElementById(`err-${f.name}`);
      if (err) err.textContent = '';
    });

    // Focus the first input
    const first = form.querySelector('input');
    if (first) setTimeout(() => first.focus(), 60);
  }

  // ── Close ────────────────────────────────────────────────
  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onTrapTab);
  }

  triggers.forEach(el => el.addEventListener('click', openModal));
  closeBtn.addEventListener('click', closeModal);

  // Backdrop click closes modal
  overlay.addEventListener('click', e => {
    if (!modalCard.contains(e.target)) closeModal();
  });

  // Escape closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  // ── Form submission ──────────────────────────────────────
  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Show animation immediately on every click, disable button right away
    submitBtn.innerHTML =
      '<span class="book-loader" aria-hidden="true">' +
        '<span class="bl-left"></span>' +
        '<span class="bl-spine"></span>' +
        '<span class="bl-page"></span>' +
      '</span>';
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    errorEl.classList.add('hidden');

    const minDelay = new Promise(resolve => setTimeout(resolve, 1000));

    // Validate all fields
    const fields = Array.from(form.querySelectorAll('input, textarea'));
    const allValid = fields.map(f => validateField(f)).every(Boolean);

    if (!allValid) {
      // Wait out the animation, then restore and focus first invalid field
      await minDelay;
      submitBtn.innerHTML = 'send →';
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    try {
      const [res] = await Promise.all([
        fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name:    form.elements['name'].value.trim(),
            email:   form.elements['email'].value.trim(),
            message: form.elements['message'].value.trim(),
          }),
        }),
        minDelay,
      ]);

      if (res.ok) {
        form.classList.add('hidden');
        successEl.classList.remove('hidden');
      } else {
        throw new Error('Submission failed');
      }
    } catch {
      submitBtn.innerHTML = 'send →';
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      errorEl.classList.remove('hidden');
    }
  });

}
