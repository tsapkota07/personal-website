/*
  ============================================================
  SHELF EDITOR — localhost only
  ============================================================
  This entire file is a no-op on any deployed site.
  location.hostname is a read-only browser property; it always
  reflects the real URL and cannot be spoofed by a visitor.
*/

(function () {
  'use strict';

  // ── Guard ─────────────────────────────────────────────────
  // SHA-256 hash of the secret stored in the internship tracker dev panel.
  // The secret itself never lives here — only its hash.
  const EDIT_KEY_HASH = 'f502d5e792eb995ec198515c509d2bec0074fecab408ba931620ccfb24f52b6e';

  async function resolveAccess() {
    if (location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1' ||
        location.hostname === '') return true;

    if (sessionStorage.getItem('shelf_edit') === '1') return true;

    const key = new URLSearchParams(location.search).get('shelf_edit');
    if (!key) return false;

    const hash = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)))
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    if (hash === EDIT_KEY_HASH) {
      sessionStorage.setItem('shelf_edit', '1');
      const url = new URL(location.href);
      url.searchParams.delete('shelf_edit');
      history.replaceState(null, '', url.toString());
      return true;
    }

    return false;
  }

  // ── State ─────────────────────────────────────────────────
  const STORAGE_KEY = 'shelf_editor_v1';
  let editMode  = false;
  let editingId = null; // null = adding new

  // ── Persist / restore ─────────────────────────────────────
  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SHELF));
  }

  function loadSaved() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      SHELF.length = 0;
      saved.forEach(item => SHELF.push(item));
    } catch (e) {
      console.warn('[shelf-editor] Could not restore saved data:', e);
    }
  }

  // ── Toggle edit mode ──────────────────────────────────────
  function toggleEditMode() {
    editMode = !editMode;
    document.getElementById('editorToggle').classList.toggle('active', editMode);
    if (editMode) {
      injectBar();
    } else {
      removeBar();
      purgeEditUI();
    }
    render(); // re-render shelf (MutationObserver will add edit buttons if needed)
  }

  // ── Edit mode banner ──────────────────────────────────────
  function injectBar() {
    if (document.getElementById('editorBar')) return;
    const bar = document.createElement('div');
    bar.id = 'editorBar';
    bar.className = 'editor-bar reveal visible';
    bar.innerHTML = `
      <span class="editor-bar-label">✏ edit mode — changes save to localStorage. export to deploy.</span>
      <div class="editor-bar-actions">
        <button class="editor-bar-btn" id="editorAddBtn">+ add entry</button>
        <button class="editor-bar-btn editor-bar-btn--export" id="editorExportBtn">export shelf-data.js ↓</button>
        <button class="editor-bar-btn editor-bar-btn--reset" id="editorResetBtn">reset to file</button>
      </div>
    `;
    // Insert before the shelf grid / count
    const countEl = document.getElementById('shelf-count');
    if (countEl) countEl.before(bar);
    else document.querySelector('.main').prepend(bar);

    document.getElementById('editorAddBtn').addEventListener('click', () => openModal(null));
    document.getElementById('editorExportBtn').addEventListener('click', exportFile);
    document.getElementById('editorResetBtn').addEventListener('click', resetToFile);
  }

  function removeBar() {
    document.getElementById('editorBar')?.remove();
  }

  function purgeEditUI() {
    document.querySelectorAll('.shelf-card-edit-actions').forEach(el => el.remove());
    document.querySelectorAll('.shelf-card-chapter-ctrl').forEach(el => el.remove());
    document.querySelectorAll('.shelf-card--add').forEach(el => el.remove());
  }

  // ── Inject edit/delete buttons under each rendered card ───
  function injectEditButtons() {
    const grid = document.getElementById('shelf-grid');
    if (!grid) return;

    // Remove any stale edit UI left from previous render
    purgeEditUI();

    grid.querySelectorAll('.shelf-card[data-id]').forEach(card => {
      const id = parseInt(card.dataset.id, 10);
      const item = SHELF.find(i => i.id === id);

      // Chapter +/- for manga with a chapter set
      if (item && item.type === 'manga' && item.chapter != null && item.chapter !== '') {
        const ctrl = document.createElement('div');
        ctrl.className = 'shelf-card-chapter-ctrl';
        ctrl.innerHTML = `
          <button class="shelf-chapter-btn" data-delta="-1" aria-label="Previous chapter">−</button>
          <span class="shelf-chapter-display">ch. ${item.chapter}</span>
          <button class="shelf-chapter-btn" data-delta="1" aria-label="Next chapter">+</button>
        `;
        ctrl.querySelector('[data-delta="-1"]').addEventListener('click', () => updateChapter(id, -1, ctrl));
        ctrl.querySelector('[data-delta="1"]').addEventListener('click', () => updateChapter(id, 1, ctrl));
        card.appendChild(ctrl);
      }

      const actions = document.createElement('div');
      actions.className = 'shelf-card-edit-actions';
      actions.innerHTML = `
        <button class="shelf-edit-btn" data-action="edit">edit</button>
        <button class="shelf-edit-btn shelf-edit-btn--del" data-action="delete">delete</button>
      `;
      actions.querySelector('[data-action="edit"]')
        .addEventListener('click', () => openModal(id));
      actions.querySelector('[data-action="delete"]')
        .addEventListener('click', () => deleteEntry(id));
      card.appendChild(actions);
    });

    // "Add new" card at the end of the grid
    const addCard = document.createElement('div');
    addCard.className = 'shelf-card shelf-card--add';
    addCard.title = 'Add new entry';
    addCard.innerHTML = '<div class="shelf-card-add-cover"><span>+</span></div>';
    addCard.addEventListener('click', () => openModal(null));
    grid.appendChild(addCard);
  }

  // ── Watch grid for re-renders (shelf.js sets innerHTML) ───
  // Disconnect while injecting so our own DOM appends don't
  // re-trigger the observer and cause an infinite loop.
  let gridObserver;
  function watchGrid() {
    const grid = document.getElementById('shelf-grid');
    if (!grid) return;
    gridObserver = new MutationObserver(() => {
      if (editMode) {
        gridObserver.disconnect();
        injectEditButtons();
        gridObserver.observe(grid, { childList: true });
      }
    });
    gridObserver.observe(grid, { childList: true });
  }

  // ── Chapter increment/decrement ───────────────────────────
  function updateChapter(id, delta, ctrl) {
    const item = SHELF.find(i => i.id === id);
    if (!item) return;
    const next = Math.max(1, (parseInt(item.chapter, 10) || 0) + delta);
    item.chapter = String(next);
    // Update back face number
    const card = document.querySelector(`.shelf-card[data-id="${id}"]`);
    if (card) {
      const num = card.querySelector('.shelf-card-chapter-num');
      if (num) num.textContent = next;
    }
    // Update the ctrl display
    const display = ctrl.querySelector('.shelf-chapter-display');
    if (display) display.textContent = `ch. ${next}`;
    saveData();
  }

  // ── Delete ────────────────────────────────────────────────
  function deleteEntry(id) {
    const idx = SHELF.findIndex(item => item.id === id);
    if (idx === -1) return;
    if (!confirm(`Delete "${SHELF[idx].title}"?`)) return;
    SHELF.splice(idx, 1);
    saveData();
    render();
  }

  // ── Reset to original file ────────────────────────────────
  function resetToFile() {
    if (!confirm('Reset all edits? This clears localStorage and reloads the original shelf-data.js.')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  // ── Editor modal ──────────────────────────────────────────
  function buildModal() {
    if (document.getElementById('editorOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'editorOverlay';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.innerHTML = `
      <div class="modal-card" id="editorCard">
        <button class="modal-close" id="editorClose" aria-label="Close">✕</button>

        <div class="modal-shelf-header">
          <div class="modal-lamp"></div>
          <div class="modal-mini-books">
            <div class="mmb" style="--h:55px;--c:#3a1c1c;"></div>
            <div class="mmb" style="--h:42px;--c:#1c2e3a;"></div>
            <div class="mmb" style="--h:62px;--c:#1c3a22;"></div>
            <div class="mmb" style="--h:48px;--c:#3a1c2e;"></div>
            <div class="mmb" style="--h:58px;--c:#2a2214;"></div>
            <div class="mmb" style="--h:44px;--c:#1a1c3a;"></div>
            <div class="mmb" style="--h:65px;--c:#2e3a1c;"></div>
            <div class="mmb" style="--h:50px;--c:#3a2a1a;"></div>
            <div class="mmb" style="--h:40px;--c:#1c3a3a;"></div>
          </div>
          <div class="modal-lamp"></div>
          <div class="modal-shelf-plank"></div>
        </div>

        <div class="modal-body">
          <h2 class="modal-title" id="editorModalTitle">add entry.</h2>

          <form id="editorForm" class="contact-form" novalidate>
            <div class="form-field">
              <label for="ef-title">title</label>
              <input type="text" id="ef-title" name="title" required placeholder="title" autocomplete="off" />
              <p class="field-error" id="ef-err-title"></p>
            </div>
            <div class="form-field">
              <label for="ef-author">author</label>
              <input type="text" id="ef-author" name="author" required placeholder="author" autocomplete="off" />
              <p class="field-error" id="ef-err-author"></p>
            </div>
            <div class="form-field">
              <label for="ef-type">type</label>
              <select id="ef-type" name="type" class="editor-select">
                <option value="book">book</option>
                <option value="manga">manga</option>
              </select>
            </div>
            <div class="form-field" id="ef-chapter-field" style="display:none;">
              <label for="ef-chapter">current chapter</label>
              <input type="text" id="ef-chapter" name="chapter" placeholder="e.g. 47" autocomplete="off" />
            </div>
            <div class="form-field">
              <label for="ef-status">status</label>
              <select id="ef-status" name="status" class="editor-select">
                <option value="reading">reading</option>
                <option value="finished">finished</option>
                <option value="want">want to read</option>
              </select>
            </div>
            <div class="form-field">
              <label for="ef-image">image url</label>
              <input type="text" id="ef-image" name="image" placeholder="https://covers.openlibrary.org/..." autocomplete="off" />
            </div>
            <div class="form-field">
              <label for="ef-note">note <span style="opacity:.5">(optional)</span></label>
              <input type="text" id="ef-note" name="note" placeholder="short note..." autocomplete="off" />
            </div>
            <div class="form-field">
              <label for="ef-initials">initials <span style="opacity:.5">(fallback, max 3)</span></label>
              <input type="text" id="ef-initials" name="initials" maxlength="3" placeholder="AB" autocomplete="off" />
            </div>
            <button type="submit" class="form-submit" id="editorSubmit">save →</button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.getElementById('editorClose').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => {
      if (!document.getElementById('editorCard').contains(e.target)) closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });
    document.getElementById('editorForm').addEventListener('submit', handleSubmit);
    document.getElementById('ef-type').addEventListener('change', e => {
      document.getElementById('ef-chapter-field').style.display =
        e.target.value === 'manga' ? '' : 'none';
    });
  }

  function openModal(id) {
    buildModal();
    editingId = id;

    const title = document.getElementById('editorModalTitle');
    const form  = document.getElementById('editorForm');

    // Clear errors
    ['title', 'author'].forEach(f => {
      const err = document.getElementById(`ef-err-${f}`);
      if (err) err.textContent = '';
      form.elements[f]?.classList.remove('invalid');
    });

    if (id !== null) {
      const item = SHELF.find(i => i.id === id);
      if (!item) return;
      title.textContent = 'edit entry.';
      form.elements['title'].value    = item.title    || '';
      form.elements['author'].value   = item.author   || '';
      form.elements['type'].value     = item.type     || 'book';
      form.elements['status'].value   = item.status   || 'finished';
      form.elements['image'].value    = item.image    || '';
      form.elements['note'].value     = item.note     || '';
      form.elements['initials'].value = item.initials || '';
      form.elements['chapter'].value  = item.chapter  != null ? item.chapter : '';
      document.getElementById('ef-chapter-field').style.display =
        item.type === 'manga' ? '' : 'none';
    } else {
      title.textContent = 'add entry.';
      form.reset();
      document.getElementById('ef-chapter-field').style.display = 'none';
    }

    document.getElementById('editorOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => form.elements['title'].focus(), 60);
  }

  function closeModal() {
    document.getElementById('editorOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form   = e.target;
    const title  = form.elements['title'].value.trim();
    const author = form.elements['author'].value.trim();

    // Basic validation
    let valid = true;
    [['title', title], ['author', author]].forEach(([name, val]) => {
      const err = document.getElementById(`ef-err-${name}`);
      if (!val) {
        if (err) err.textContent = `${name} is required.`;
        form.elements[name].classList.add('invalid');
        valid = false;
      } else {
        if (err) err.textContent = '';
        form.elements[name].classList.remove('invalid');
      }
    });
    if (!valid) return;

    const type     = form.elements['type'].value;
    const initials = form.elements['initials'].value.trim().toUpperCase()
                     || title.slice(0, 2).toUpperCase();
    const image    = form.elements['image'].value.trim();
    const note     = form.elements['note'].value.trim();
    const chapter  = type === 'manga' ? form.elements['chapter'].value.trim() : '';

    const updates = {
      title, author, type,
      status:   form.elements['status'].value,
      color:    type === 'book' ? '#2e1a0e' : '#101020',
      initials,
      ...(image   ? { image   } : {}),
      ...(note    ? { note    } : {}),
      ...(chapter ? { chapter } : {}),
    };

    if (editingId !== null) {
      const idx = SHELF.findIndex(i => i.id === editingId);
      if (idx !== -1) {
        SHELF[idx] = { ...SHELF[idx], ...updates };
        // Explicitly remove optional fields if user cleared them
        if (!image)   delete SHELF[idx].image;
        if (!note)    delete SHELF[idx].note;
        if (!chapter) delete SHELF[idx].chapter;
      }
    } else {
      const maxId = SHELF.reduce((m, i) => Math.max(m, i.id), 0);
      SHELF.push({ id: maxId + 1, ...updates });
    }

    saveData();
    closeModal();
    render();
  }

  // ── Export shelf-data.js ──────────────────────────────────
  function exportFile() {
    function fmtVal(v) {
      if (typeof v === 'number') return v;
      return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    }

    const entries = SHELF.map(item => {
      const keep = ['id','type','title','author','status','color','initials','chapter','image','note'];
      const lines = keep
        .filter(k => item[k] !== undefined && item[k] !== null && item[k] !== '')
        .map(k => `    ${k}: ${fmtVal(item[k])},`)
        .join('\n');
      return `  {\n${lines}\n  }`;
    }).join(',\n');

    const header = `/*
  ============================================================
  SHELF DATA
  ============================================================
  This is the only file you need to edit to manage your shelf.

  Fields:
    id:       unique number
    type:     'book' or 'manga'
    title:    string
    author:   string
    status:   'reading' | 'finished' | 'want'
    color:    fallback color if image fails to load
    initials: fallback initials if image fails to load
    image:    (optional) direct URL to cover image
    note:     (optional) short note shown on the card
*/

const SHELF = [

${entries}

];
`;

    const blob = new Blob([header], { type: 'text/javascript' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'shelf-data.js';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Init ──────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    if (!await resolveAccess()) return;

    loadSaved();

    // Inject toggle button into controls row
    const controlsRow = document.querySelector('.shelf-controls-row');
    if (controlsRow) {
      const btn = document.createElement('button');
      btn.id        = 'editorToggle';
      btn.className = 'filter-btn editor-toggle-btn';
      btn.textContent = 'edit mode';
      btn.title     = 'localhost only';
      btn.addEventListener('click', toggleEditMode);
      controlsRow.appendChild(btn);
    }

    watchGrid();

    // Re-render so saved data (if any) is shown immediately
    render();
  });

})();
