# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the site

```
python -m http.server 3000
```

Then open `http://localhost:3000`. The `.claude/launch.json` is already configured for this.

## Project structure

Single-page static site split across three files. No build step, no framework, no dependencies beyond a Google Fonts import.

- `index.html` — markup only (sections, nav, footer, floating cart HTML)
- `styles.css` — all CSS (variables, layout, pills, premium cards, cart bar)
- `script.js` — all JS (cart logic, WhatsApp order, clear cart, nav scroll-spy)
- `images/logo.png` — cropped from `flyer-3.jpeg` using Pillow (see below)

## Logo extraction

The logo was cropped from `flyer-3.jpeg` (not in repo) using Python + Pillow:

```python
from PIL import Image
img = Image.open('flyer-3.jpeg')
w, h = img.size
logo = img.crop((int(w*0.30), int(h*0.025), int(w*0.70), int(h*0.225)))
logo.save('images/logo.png')
```

Re-run this if the logo needs updating.

## Architecture

The page is a full-width layout (max-width 900px on sec-body) with three anchor sections (`#sorvetes`, `#picoles`, `#acai`) linked from a sticky `<nav>`. An IntersectionObserver in `script.js` highlights the active nav link.

### Color palette (CSS variables in `styles.css`)
- `--roxo` / `--roxo-medio` / `--roxo-claro` / `--roxo-bg` — purple scale (sorvetes section)
- `--acai` / `--acai-medio` / `--acai-bg` — deep purple scale (açaí section)
- `--verde` / `--verde-escuro` / `--verde-claro` / `--verde-bg` — green scale (picolés section, brand accent)
- `--amarelo` — yellow (premium sorvetes badge text)

### Section pattern
Each product section (`#sorvetes`, `#picoles`, `#acai`) follows:
```
<section id="…">
  <div class="sec-header"> … h2 + subtitle </div>
  <div class="sec-body">
    <div class="badge-wrap"><span class="badge">…</span></div>
    <div class="grid"> <div class="pill">…</div> … </div>
  </div>
</section>
```
Flavor pills use `.pill.empty` as invisible spacers to fill incomplete grid rows.

Premium flavors use `.premium-card` instead of pills (different background color per section).

Picolés are split into two columns (`.picoles-cols`) — "Cremosos" and "Frutas" — each using `repeat(2, minmax(0, 1fr))` internally so pills are always equal-width.

### Cart system (`script.js`)
- Pills and premium cards carry `data-category`, `data-flavor`, `data-price` attributes.
- Clicking a pill/card adds 1 unit; inline −/+ controls appear on the element itself via `renderControls()`.
- A fixed floating bar (`#order-cart`) shows total qty + price; hidden when cart is empty.
- `body.has-cart` adds bottom padding to prevent content being obscured by the bar.
- Picolés require a minimum of 5 units — validated before sending the WhatsApp order.
- Picolés-only orders are allowed but marked as "Retirada no local" in the WhatsApp message; orders with sorvetes or açaí are marked "Entrega".
- WhatsApp link: `https://wa.me/5524999362315?text=${encodeURIComponent(msg)}` — build the message as a plain string with `\n`, then encode the whole thing.
- `CSS.escape()` is used when querying elements by flavor name (handles spaces and accents).
