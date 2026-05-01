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

/* ── Library mode ──────────────────────────────────────────
   Hidden mode — unlocked by finding both shelf easter eggs,
   or automatically on localhost / when shelf_edit is active.
   8-dot ring picker: top-left = off, others = wood patterns.
   Persists for the tab session only (sessionStorage).
   ──────────────────────────────────────────────────────── */
const WOODS = [
  { id: 'none',     color: null,      title: 'Off'      },
  { id: 'wood',     color: '#c8860a', title: 'Wood'     },
  { id: 'walnut',   color: '#5c3317', title: 'Walnut'   },
  { id: 'ebony',    color: '#2a1e16', title: 'Ebony'    },
];

function isLibraryUnlocked() {
  if (sessionStorage.getItem('library_unlocked') === '1') return true;
  return false;
}

function setLibraryMode(woodId) {
  html.setAttribute('data-library', woodId);
  sessionStorage.setItem('library_wood', woodId);
  const ring = document.getElementById('library-ring');
  if (!ring) return;
  const wood = WOODS.find(w => w.id === woodId);
  ring.querySelectorAll('.library-ring-seg').forEach((path, i) => {
    const isActive = WOODS[i].id === woodId;
    path.style.fill = isActive
      ? (wood.color || getComputedStyle(html).getPropertyValue('--text').trim())
      : '';
  });
  ring.title = wood.title;
}

function showLibraryToggle(animate) {
  if (document.getElementById('library-ring')) return;

  const S = 28, cx = 14, cy = 14, outerR = 12, innerR = 7.5;
  const gapDeg = 5, spanDeg = 90 - gapDeg;

  function pt(angleDeg, r) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function arcPath(i) {
    const c = 315 + i * 90, h = spanDeg / 2;
    const [ox1, oy1] = pt(c - h, outerR), [ox2, oy2] = pt(c + h, outerR);
    const [ix1, iy1] = pt(c - h, innerR), [ix2, iy2] = pt(c + h, innerR);
    const f = n => n.toFixed(3);
    return `M${f(ox1)} ${f(oy1)} A${outerR} ${outerR} 0 0 1 ${f(ox2)} ${f(oy2)}` +
           ` L${f(ix2)} ${f(iy2)} A${innerR} ${innerR} 0 0 0 ${f(ix1)} ${f(iy1)} Z`;
  }

  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', S);
  svg.setAttribute('height', S);
  svg.setAttribute('viewBox', `0 0 ${S} ${S}`);
  svg.id = 'library-ring';
  svg.style.cursor = 'pointer';
  svg.setAttribute('aria-label', 'Library mode');
  svg.setAttribute('role', 'button');

  WOODS.forEach((_, i) => {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', arcPath(i));
    path.classList.add('library-ring-seg');
    svg.appendChild(path);
  });

  svg.addEventListener('click', () => {
    const current = sessionStorage.getItem('library_wood') || 'none';
    const idx = WOODS.findIndex(w => w.id === current);
    const next = WOODS[(idx - 1 + WOODS.length) % WOODS.length];
    setLibraryMode(next.id);
  });

  const leftLine = document.createElement('div');
  leftLine.className = 'library-line library-line--left';

  const rightLine = document.createElement('div');
  rightLine.className = 'library-line library-line--right';

  const bar = document.createElement('div');
  bar.id = 'library-bar';
  bar.appendChild(leftLine);
  bar.appendChild(svg);
  bar.appendChild(rightLine);
  const nav = document.querySelector('.nav');
  if (nav) nav.insertAdjacentElement('afterend', bar);

  if (animate) {
    requestAnimationFrame(() => bar.classList.add('library-bar--unlocking'));
  } else {
    bar.classList.add('library-bar--loaded');
  }

  // Inject page pillars and floor (hidden by CSS until wood mode is active)
  if (!document.getElementById('wood-pillar-left')) {
    const pl = document.createElement('div');
    pl.id = 'wood-pillar-left';
    const pr = document.createElement('div');
    pr.id = 'wood-pillar-right';
    const fl = document.createElement('div');
    fl.id = 'wood-floor';
    document.body.appendChild(pl);
    document.body.appendChild(pr);
    document.body.appendChild(fl);
  }

  setLibraryMode(sessionStorage.getItem('library_wood') || 'none');
}

if (isLibraryUnlocked()) showLibraryToggle();
