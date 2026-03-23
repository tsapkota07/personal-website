/**
 * fetch-manga-covers.js
 *
 * Queries the Jikan API (MyAnimeList) for cover images of all manga entries
 * in shelf-data.js that have an empty image field.
 *
 * Output: results.json — a list of { id, title, image, confidence }
 *   confidence: 'high' | 'low'
 *   - high  → title matched closely
 *   - low   → best guess, review manually
 *
 * Usage:
 *   node fetch-manga-covers.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ── Load shelf data ──────────────────────────────────────────────────────────

const shelfPath = path.join(__dirname, '..', 'shelf-data.js');
const raw = fs.readFileSync(shelfPath, 'utf8');

// Execute the JS file in a sandbox to extract the SHELF array.
// `const` is block-scoped and won't leak into the context, so strip it first.
const sandbox = {};
vm.runInNewContext(raw.replace(/^\s*const\s+SHELF\s*=/m, 'SHELF ='), sandbox);
const shelf = sandbox.SHELF;

if (!Array.isArray(shelf)) {
  console.error('Could not load SHELF array from shelf-data.js');
  process.exit(1);
}

const targets = shelf.filter(
  (entry) => entry.type === 'manga' && (!entry.image || entry.image.trim() === '')
);

console.log(`Found ${targets.length} manga entries with missing images.\n`);

// ── Jikan API helper ─────────────────────────────────────────────────────────

const JIKAN_BASE = 'https://api.jikan.moe/v4';
const DELAY_MS = 800; // Jikan rate limit: ~3 req/s, stay safe

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) {
      const wait = attempt * 2000;
      console.log(`  [rate limit] waiting ${wait / 1000}s before retry ${attempt}/${retries}...`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  }
  throw new Error(`HTTP 429 for ${url} (exceeded retries)`);
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

async function findCover(title) {
  const encoded = encodeURIComponent(title);
  const url = `${JIKAN_BASE}/manga?q=${encoded}&limit=5`;
  const data = await fetchJson(url);

  if (!data.data || data.data.length === 0) return null;

  const normTitle = normalize(title);
  const results = data.data;

  // Try exact title match first (English or romanized)
  for (const item of results) {
    const candidates = [
      item.title,
      item.title_english,
      item.title_japanese,
      ...(item.title_synonyms || []),
    ].filter(Boolean);

    for (const c of candidates) {
      if (normalize(c) === normTitle) {
        return {
          image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
          confidence: 'high',
          matchedTitle: c,
        };
      }
    }
  }

  // Fall back to first result
  const first = results[0];
  return {
    image: first.images?.jpg?.large_image_url || first.images?.jpg?.image_url,
    confidence: 'low',
    matchedTitle: first.title,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const results = [];
  let done = 0;

  for (const entry of targets) {
    try {
      await sleep(DELAY_MS);
      const found = await findCover(entry.title);

      if (found) {
        results.push({
          id: entry.id,
          searchedTitle: entry.title,
          matchedTitle: found.matchedTitle,
          image: found.image,
          confidence: found.confidence,
        });
        const flag = found.confidence === 'high' ? '✓' : '?';
        console.log(`[${flag}] #${entry.id} "${entry.title}" → ${found.matchedTitle}`);
      } else {
        results.push({
          id: entry.id,
          searchedTitle: entry.title,
          matchedTitle: null,
          image: null,
          confidence: 'none',
        });
        console.log(`[✗] #${entry.id} "${entry.title}" → not found`);
      }
    } catch (err) {
      console.error(`[!] #${entry.id} "${entry.title}" → error: ${err.message}`);
      results.push({
        id: entry.id,
        searchedTitle: entry.title,
        matchedTitle: null,
        image: null,
        confidence: 'error',
      });
    }

    done++;
    if (done % 10 === 0) console.log(`  ... ${done}/${targets.length} processed`);
  }

  const outPath = path.join(__dirname, 'results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  const high = results.filter((r) => r.confidence === 'high').length;
  const low = results.filter((r) => r.confidence === 'low').length;
  const none = results.filter((r) => r.confidence === 'none' || r.confidence === 'error').length;

  console.log(`\nDone. Results written to shelf-tools/results.json`);
  console.log(`  ✓ High confidence: ${high}`);
  console.log(`  ? Low confidence:  ${low}  ← review these`);
  console.log(`  ✗ Not found:       ${none}  ← fill manually`);
  console.log(`\nNext: review results.json, then run: node apply-covers.js
    \n for covers with high confidence, do : node apply-covers.js --high-only`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
