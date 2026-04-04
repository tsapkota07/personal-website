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
  { id: 'none',      color: null,      title: 'Off'       },
  { id: 'mahogany',  color: '#8b4513', title: 'Mahogany'  },
  { id: 'oak',       color: '#c8902a', title: 'Oak'       },
  { id: 'walnut',    color: '#5c3317', title: 'Walnut'    },
  { id: 'cherry',    color: '#9b2335', title: 'Cherry'    },
  { id: 'pine',      color: '#d4a853', title: 'Pine'      },
  { id: 'ebony',     color: '#2a1e16', title: 'Ebony'     },
  { id: 'driftwood', color: '#8c7b6b', title: 'Driftwood' },
];

function isLibraryUnlocked() {
  if (location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1' ||
      location.hostname === '') return true;
  if (sessionStorage.getItem('shelf_edit') === '1') return true;
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

function showLibraryToggle() {
  if (document.getElementById('library-ring')) return;

  const S = 28, cx = 14, cy = 14, outerR = 12, innerR = 7.5;
  const gapDeg = 5, spanDeg = 45 - gapDeg;

  function pt(angleDeg, r) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function arcPath(i) {
    const c = 315 + i * 45, h = spanDeg / 2;
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

  const modeBtn = document.getElementById('mode-toggle');
  if (modeBtn) modeBtn.insertAdjacentElement('afterend', svg);

  setLibraryMode(sessionStorage.getItem('library_wood') || 'none');
}

if (isLibraryUnlocked()) showLibraryToggle();
