/*
  ============================================================
  SHELF PAGE — search, sort, filter, render
  ============================================================
  Depends on SHELF array defined in shelf-data.js (loaded first).
*/

const STATUS_LABEL = {
  reading:  'reading',
  finished: 'finished',
  want:     'want to read',
};

// ── State ──────────────────────────────────────────────────
let activeType   = 'all';   // 'all' | 'book' | 'manga'
let activeStatus = 'all';   // 'all' | 'reading' | 'finished' | 'want'
let activeSort   = 'none'; // default: books before manga
let searchQuery  = '';

// ── DOM refs ───────────────────────────────────────────────
const grid     = document.getElementById('shelf-grid');
const countEl  = document.getElementById('shelf-count');
const emptyEl  = document.getElementById('shelf-empty');
const searchEl = document.getElementById('shelf-search');

// ── Filter + sort logic ────────────────────────────────────
function getFiltered() {
  return SHELF
    .filter(item => {
      if (activeType !== 'all' && item.type !== activeType) return false;
      if (activeStatus !== 'all' && item.status !== activeStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (activeSort) {
        case 'title-asc':  return a.title.localeCompare(b.title);
        case 'title-desc': return b.title.localeCompare(a.title);
        case 'author-asc': return a.author.localeCompare(b.author);
        case 'none':
          if (a.type !== b.type) return a.type === 'book' ? -1 : 1;
          return 0;
default:           return 0;
      }
    });
}

// ── Render ─────────────────────────────────────────────────
function render() {
  const items = getFiltered();

  // Count label
  const noun = items.length === 1 ? 'item' : 'items';
  countEl.textContent = `${items.length} ${noun}`;

  // Empty state
  const isEmpty = items.length === 0;
  emptyEl.classList.toggle('hidden', !isEmpty);
  grid.classList.toggle('hidden', isEmpty);

  if (isEmpty) return;

  /*
    Each card has:
    - A colored cover block (with initials on the spine)
    - Title, author, and a status badge

    The status badge uses a data attribute so CSS can color
    it differently per status without any inline styles.
  */
  const hasChapter = item =>
    item.type === 'manga' && item.chapter != null && item.chapter !== '';

  grid.innerHTML = items.map(item => {
    const flippable = hasChapter(item);
    return `
    <div class="shelf-card" data-id="${item.id}">
      <div class="shelf-card-flip${flippable ? ' shelf-card-flip--clickable' : ''}">
        <div class="shelf-card-flip-inner">
          <div class="shelf-card-cover" style="--c: ${item.color};">
            <span class="shelf-card-initials">${escapeHtml(item.initials)}</span>
            ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" class="shelf-card-img" loading="lazy" onerror="this.style.display='none'">` : ''}
          </div>
          ${flippable ? `
          <div class="shelf-card-back">
            <span class="shelf-card-chapter-label">chapter</span>
            <span class="shelf-card-chapter-num">${escapeHtml(String(item.chapter))}</span>
          </div>` : ''}
        </div>
      </div>
      <div class="shelf-card-body">
        <span class="shelf-card-title">${escapeHtml(item.title)}</span>
        <span class="shelf-card-author">${escapeHtml(item.author)}</span>
        <span class="shelf-card-status" data-status="${item.status}">
          ${STATUS_LABEL[item.status]}
        </span>
        ${item.note ? `<span class="shelf-card-note">${escapeHtml(item.note)}</span>` : ''}
      </div>
    </div>
  `;
  }).join('');

}

// ── Safety: escape user-controlled strings before innerHTML ─
function escapeHtml(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

// ── Wire up type filter buttons ────────────────────────────
document.querySelectorAll('[data-filter-type]').forEach(btn => {
  btn.addEventListener('click', () => {
    activeType = btn.dataset.filterType;
    document.querySelectorAll('[data-filter-type]')
      .forEach(b => b.classList.toggle('active', b === btn));
    render();
  });
});

// ── Wire up status filter buttons ─────────────────────────
document.querySelectorAll('[data-filter-status]').forEach(btn => {
  btn.addEventListener('click', () => {
    activeStatus = btn.dataset.filterStatus;
    document.querySelectorAll('[data-filter-status]')
      .forEach(b => b.classList.toggle('active', b === btn));
    render();
  });
});

// ── Wire up sort select ────────────────────────────────────
document.getElementById('shelf-sort').addEventListener('change', e => {
  activeSort = e.target.value;
  render();
});

// ── Wire up search ─────────────────────────────────────────
/*
  We debounce the search slightly (150ms) so the grid doesn't
  re-render on every single keystroke — feels more responsive.
*/
let searchTimer;
searchEl.addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = e.target.value.trim();
    render();
  }, 150);
});

// ── Initial render ─────────────────────────────────────────
render();

// ── Grid event delegation ───────────────────────────────────
grid.addEventListener('click', e => {
  const flip = e.target.closest('.shelf-card-flip--clickable');
  if (flip) flip.classList.toggle('flipped');
});
