# Future Plans

> Implementation backlog — do not start any of these without explicit instruction.
> Check off boxes as each step is completed.

---

## Phase 0 — Foundation (do first, applies to all modes)


The audit confirmed that all wood-mode CSS rules are correctly scoped under  
  html[data-library="wood"] with no bleed into other modes or regular mode. The
   only shared rules across all three modes are intentional:                   
                                                                               
  - Body background made transparent (so the html-level stone/texture shows    
  through)                                                                     
  - Theme switcher + dark/light toggle hidden (visibility: hidden)             
  - background-attachment: fixed                                               
  - Text-shadow on headings/paragraphs for readability on textured backgrounds 
  - Accent color pinned to #c8860a amber — this will need to be split when Iron
   Man and Noir are designed, since they'll need their own accent colors       
                                                                               
  No isolation problems found. Phase 0 is done in the sense that nothing needs 
  fixing right now — the split accent color is deferred to when those modes are
   actually built. 

- [ ] **Mode isolation**: Audit `style.css` and ensure every library-mode rule is scoped strictly under `html[data-library="wood"]`, `html[data-library="walnut"]`, or `html[data-library="ebony"]`. No rule from one mode should affect another mode or regular mode. Only the `SHELF` data array is shared.

---

## Phase 1 — Medieval Mode (`data-library="wood"`)

### 1.1 — Frame & Layout (do before typography/content, structure first)
- [ ] Replace the current `#medieval-frame` absolute-positioned border approach entirely with a new system:
  - [ ] Make the navbar **full-width** (left edge to right edge of screen) in wood mode — acts as the top bar of the frame
  - [ ] Add **left and right pillars** that extend from the navbar downward along both sides of the page, always visible while scrolling (like side columns of a great hall)
  - [ ] Add a **floor bar** at the very bottom of the page — only visible when scrolled all the way down
  - [ ] Remove the old `#medieval-frame` div and its CSS once the new system is in place
- [ ] Make the page **full-screen width** in medieval mode — remove the centered `max-width` column constraint. Regular mode layout stays unchanged.

### 1.2 — Typography
- [ ] Load and apply a medieval-appropriate font (e.g. a readable blackletter or ornate serif) across the entire mode: headings, body text, nav, shelf cards, controls, modal

### 1.3 — Shelf Page (`shelf.html`)
- [ ] Verify all shelf card text (title, author, status, note) is legible against the stone background with the new font applied

### 1.4 — Home Page (`index.html`)
- [ ] Ensure all text is legible in medieval mode
- [ ] Fix project tech stack tags — currently invisible against the stone background; adjust color/contrast so they show clearly

### 1.5 — Résumé Page (`resume.html`)
- [ ] Ensure all text is legible in medieval mode
- [ ] Apply the medieval font and adjust font colors to warm parchment tones throughout

### 1.6 — "Say Hello" Modal
- [ ] Redesign the contact modal for medieval mode — completely separate from the regular modal appearance
- [ ] Apply stone/parchment textures, period-appropriate typography, candlelit/torch-lit color palette

---

## Phase 2 — Noir Mode (`data-library="ebony"`)

*Aesthetic reference: the game Mouse: P.I. for Hire — high contrast black and white, hard shadows, detective/pulp fiction atmosphere.*

### 2.1 — Frame & Layout
- [ ] Full-width navbar as the top bar of the frame (same structural pattern as medieval)
- [ ] Left and right pillars extending from navbar to bottom — noir-appropriate (e.g. dark alley walls, brick columns)
- [ ] Floor bar at the very bottom, only visible when scrolled all the way down
- [ ] Full-screen width layout — remove centered max-width column in this mode

### 2.2 — Typography
- [ ] Load and apply a noir-appropriate font (e.g. typewriter face or 1940s poster style) across the entire mode

### 2.3 — Shelf Page (`shelf.html`)
- [ ] Style each book/manga cover with a noir frame — harsh rectangular borders, film noir-style treatment
- [ ] Ensure all shelf text is legible in the high-contrast palette

### 2.4 — Home Page (`index.html`)
- [ ] Ensure all text is legible in noir mode
- [ ] Fix project tech stack tags visibility (same issue as medieval — check contrast)

### 2.5 — Résumé Page (`resume.html`)
- [ ] Ensure all text is legible
- [ ] Apply noir font and adjust colors throughout

### 2.6 — "Say Hello" Modal
- [ ] Redesign the contact modal for noir mode — detective agency / private investigator tone, high contrast palette

---

## Phase 3 — Iron Man Mode (`data-library="walnut"`)

*Aesthetic: arc reactor vibes, HUD overlays, metallic reds and golds, glowing tech elements.*

### 3.1 — Frame & Layout
- [ ] Full-width navbar as the top bar of the frame (same structural pattern as medieval/noir)
- [ ] Left and right pillars — tech/HUD panel aesthetic (glowing edges, scan lines, mechanical feel)
- [ ] Floor bar at the very bottom, only visible when scrolled all the way down
- [ ] Full-screen width layout — remove centered max-width column in this mode

### 3.2 — Typography
- [ ] Load and apply a tech/sci-fi font across the entire mode

### 3.3 — Shelf Page (`shelf.html`)
- [ ] Style each book/manga cover with a HUD panel or holographic display frame
- [ ] Ensure all shelf text is legible

### 3.4 — Home Page (`index.html`)
- [ ] Ensure all text is legible in Iron Man mode
- [ ] Fix project tech stack tags visibility

### 3.5 — Résumé Page (`resume.html`)
- [ ] Ensure all text is legible
- [ ] Apply Iron Man font and adjust colors throughout

### 3.6 — "Say Hello" Modal
- [ ] Redesign the contact modal for Iron Man mode — JARVIS/HUD interface aesthetic

---

## Phase 4 — Cross-Mode Polish (do last)

- [ ] Verify mode switching is clean — no flash of wrong styles when cycling between modes
- [ ] Verify the library bar dot-pattern lines look appropriate in each mode (different line patterns per mode were planned)
- [ ] Verify the easter egg toast and unlock animation look appropriate in each mode
- [ ] Test all three modes on mobile viewports — pillars and full-screen layout need responsive handling
- [ ] Final audit: confirm no style from any mode bleeds into regular mode or another mode
