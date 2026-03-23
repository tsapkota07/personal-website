/**
 * filter-results.js
 *
 * Removes entries from results.json by confidence level.
 *
 * Usage:
 *   node filter-results.js --remove-low    — removes low confidence entries
 *   node filter-results.js --remove-high   — removes high confidence entries
 */

const fs = require('fs');
const path = require('path');

const removeLow  = process.argv.includes('--remove-low');
const removeHigh = process.argv.includes('--remove-high');

if (!removeLow && !removeHigh) {
  console.error('Usage: node filter-results.js --remove-low | --remove-high');
  process.exit(1);
}

if (removeLow && removeHigh) {
  console.error('Cannot use both --remove-low and --remove-high at the same time.');
  process.exit(1);
}

const resultsPath = path.join(__dirname, 'results.json');

if (!fs.existsSync(resultsPath)) {
  console.error('results.json not found.');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const before = results.length;

const filtered = results.filter((r) => {
  if (removeLow  && r.confidence === 'low')  return false;
  if (removeHigh && r.confidence === 'high') return false;
  return true;
});

const removed = before - filtered.length;

fs.writeFileSync(resultsPath, JSON.stringify(filtered, null, 2));
console.log(`Removed ${removed} ${removeLow ? 'low' : 'high'} confidence entries. ${filtered.length} entries remaining.`);
