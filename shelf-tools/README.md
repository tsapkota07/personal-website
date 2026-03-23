# shelf-tools

Utilities for managing shelf-data.js.

## Fetch manga covers

Queries the Jikan API (MyAnimeList) to find cover images for all manga entries
with an empty `image` field.

```bash
cd shelf-tools
node fetch-manga-covers.js
```

This writes `shelf-tools/results.json` with entries like:

```json
[
  {
    "id": 13,
    "title": "Vinland Saga",
    "matchedTitle": "Vinland Saga",
    "image": "https://cdn.myanimelist.net/images/manga/...",
    "confidence": "high"
  },
  ...
]
```

**Confidence levels:**
- `high` — title matched exactly, safe to apply
- `low` — best guess from Jikan, review before applying
- `none` / `error` — not found, fill `image` manually in results.json

## Review results

Open `results.json` and check the `low` confidence entries. You can:
- Edit the `image` URL to a better one
- Set `image` to `null` to skip that entry

## Apply covers

```bash
# Apply only high-confidence matches (safe, recommended first)
node apply-covers.js --high-only

# Apply everything (including low-confidence)
node apply-covers.js
```

A backup of shelf-data.js is saved as `shelf-data.js.bak` before any changes.

## Notes

- Only the `image` field is modified. Status, notes, color, etc. are untouched.
- Jikan has a rate limit (~3 req/s). The script waits 500ms between requests.
- With ~100+ manga entries, expect the fetch to take ~1 minute.
