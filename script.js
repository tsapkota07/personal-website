/* ============================================================
   SHARED — runs on every page
   ============================================================ */

/* ── Theme switcher ────────────────────────────────────────
   Sets data-theme on <html>, which cascades CSS variables.
   Saves choice to localStorage so it persists across pages.
   ──────────────────────────────────────────────────────── */
const html = document.documentElement;
const dots = document.querySelectorAll('.ts-dot');

function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  dots.forEach(dot => {
    dot.classList.toggle('active', dot.dataset.theme === theme);
  });
  updateFavicon();
}

function updateFavicon() {
  const accent = getComputedStyle(html).getPropertyValue('--accent').trim();
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
    '<rect width="32" height="32" rx="6" fill="#1a1917"/>' +
    '<text x="16" y="24" font-family="Georgia,serif" font-size="22" ' +
    'font-style="italic" text-anchor="middle" fill="' + accent + '">t</text>' +
    '</svg>';
  const link = document.getElementById('favicon');
  if (link) link.href = 'data:image/svg+xml;base64,' + btoa(svg);
}

const savedTheme = localStorage.getItem('theme') || 'amber';
setTheme(savedTheme);

dots.forEach(dot => {
  dot.addEventListener('click', () => setTheme(dot.dataset.theme));
});

/* ── Light / dark mode toggle ──────────────────────────────
   Sets data-mode on <html>. Dark is default; light is opt-in.
   Persists across pages via localStorage.
   ──────────────────────────────────────────────────────── */
function setMode(mode) {
  html.setAttribute('data-mode', mode);
  localStorage.setItem('mode', mode);
  const btn = document.getElementById('mode-toggle');
  if (btn) btn.textContent = mode === 'light' ? '☽' : '☀︎';
}

const savedMode = localStorage.getItem('mode') || 'dark';
setMode(savedMode);

const modeToggle = document.getElementById('mode-toggle');
if (modeToggle) {
  modeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-mode') || 'dark';
    setMode(current === 'dark' ? 'light' : 'dark');
  });
}

/* ── Nav scroll effect ─────────────────────────────────────
   Adds backdrop blur once the user scrolls past 20px.
   ──────────────────────────────────────────────────────── */
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ── Scroll reveal ─────────────────────────────────────────
   Watches .reveal elements and adds .visible when they enter
   the viewport. CSS handles the actual fade-in transition.
   ──────────────────────────────────────────────────────── */
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── Footer year ───────────────────────────────────────────*/
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
