# Cover Image Sources

## Books

1. **Open Library** — covers.openlibrary.org
   - Free, no hotlink restrictions, run by the Internet Archive (non-profit, very stable)
   - URL format: `https://covers.openlibrary.org/b/isbn/[ISBN]-L.jpg`
   - Find the ISBN on the book's back cover or Google "[book title] ISBN"
   - Best first stop for almost any published book

2. **Google Books** — books.google.com
   - Huge catalog, most books are on here
   - Search the book → click it → right-click the cover image → copy image URL
   - URLs look like: `https://books.google.com/books/content?id=...&printsec=frontcover...`
   - Less clean URLs but works as a fallback when Open Library has no cover

3. **Open Graph / Publisher sites**
   - Many publishers (Penguin, HarperCollins, etc.) host high-quality cover images directly
   - Google "[book title] site:penguinrandomhouse.com" → right-click cover → copy image URL
   - Clean, official images — best quality but requires a quick search per book

---

## Manga / Manhwa / Webtoons

1. **MyAnimeList (CDN)** — cdn.myanimelist.net
   - Covers almost every manga and manhwa; what was used for your current shelf
   - URL format: `https://cdn.myanimelist.net/images/manga/[path].jpg`
   - To find: search on myanimelist.net → open the manga page → right-click cover → copy image URL
   - Use the `cdn.` subdomain (not `myanimelist.net` directly) for better reliability

2. **Anilist** — anilist.co
   - Good alternative to MAL, especially for newer manhwa and webtoons MAL hasn't indexed yet
   - Search the title → open page → right-click cover → copy image URL
   - Images hosted on `s4.anilist.co` — stable CDN

3. **MangaDex** — mangadex.org
   - Best for finding obscure or lesser-known manga that MAL/Anilist miss
   - Covers served from `uploads.mangadex.org` — generally stable
   - Search → open title → right-click cover → copy image URL

---

## Notes

- Always use the **largest available image** (look for `-L.jpg` or similar size suffixes)
- If a URL stops working after a site redesign, Open Library and Anilist have been the most stable historically
- When in doubt, Open Library for books and MAL for manga will cover 90% of cases
