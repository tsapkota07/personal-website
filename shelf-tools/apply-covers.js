/**
 * apply-covers.js
 *
 * Takes shelf-data.js as the source of truth. For each manga entry with an
 * empty image, looks up its id in results.json and applies the image if found.
 * Everything else (status, notes, color, etc.) is left untouched.
 *
 * results.json is treated as pure fetch output — it drives what gets applied,
 * but shelf-data.js defines what exists and what needs updating.
 *
 * A backup is written to shelf-data.js.bak before any changes are made.
 *
 * Usage:
 *   node apply-covers.js              — applies all entries with an image
 *   node apply-covers.js --high-only  — applies only confidence: 'high' entries
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const highOnly = process.argv.includes('--high-only');

// ── Load files ───────────────────────────────────────────────────────────────

const resultsPath = path.join(__dirname, 'results.json');
const shelfPath = path.join(__dirname, '..', 'shelf-data.js');

if (!fs.existsSync(resultsPath)) {
  console.error('results.json not found. Run fetch-manga-covers.js first.');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
let shelfSource = fs.readFileSync(shelfPath, 'utf8');

// Parse shelf-data.js to know which manga entries have empty images
const sandbox = {};
vm.runInNewContext(shelfSource.replace(/^\s*const\s+SHELF\s*=/m, 'SHELF ='), sandbox);
const shelf = sandbox.SHELF;

// Build set of ids that need patching: manga with empty image AND a result available
const resultById = {};
for (const r of results) resultById[r.id] = r;

const targets = new Set(
  shelf
    .filter((e) => {
      if (e.type !== 'manga') return false;
      if (e.image && e.image.trim() !== '') return false; // already has image
      const r = resultById[e.id];
      if (!r || !r.image) return false; // no result
      if (highOnly && r.confidence !== 'high') return false;
      return true;
    })
    .map((e) => e.id)
);

console.log(`Patching ${targets.size} entries from shelf-data.js...\n`);

// ── Backup ───────────────────────────────────────────────────────────────────

const backupPath = shelfPath + '.bak';
fs.writeFileSync(backupPath, shelfSource);
console.log(`Backup written to shelf-data.js.bak\n`);

// ── Apply patches ────────────────────────────────────────────────────────────

let applied = 0;

// Process line by line: track which id block we're inside, replace only
// the image line within that exact block.
const lines = shelfSource.split('\n');
let currentId = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Entering a new object block — check if its id is one we want to patch
  const idMatch = line.match(/^\s*id:\s*(\d+),/);
  if (idMatch) {
    const id = parseInt(idMatch[1], 10);
    currentId = targets.has(id) ? id : null;
  }

  // Leaving an object block
  if (/^\s*\},?/.test(line) && currentId !== null) {
    currentId = null;
  }

  // Replace image line if we're inside a target block
  if (currentId !== null && /^\s*image:/.test(line)) {
    const result = resultById[currentId];
    const indent = line.match(/^(\s*)/)[1];
    const shelfEntry = shelf.find((e) => e.id === currentId);
    lines[i] = `${indent}image: '${result.image}',`;
    console.log(`  ✓ #${currentId} "${shelfEntry?.title}" → ${result.matchedTitle}`);
    applied++;
    currentId = null;
  }
}

shelfSource = lines.join('\n');

// ── Write ────────────────────────────────────────────────────────────────────

fs.writeFileSync(shelfPath, shelfSource);

console.log(`\nApplied: ${applied}`);
console.log('shelf-data.js updated.');
if (highOnly) {
  console.log('Note: ran with --high-only. Re-run without the flag to also apply low-confidence results.');
}
