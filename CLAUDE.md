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
- `logo.png` — cropped from `flyer-3.jpeg` using Pillow (see below)
- `flyer-1.jpeg` — picolés menu reference
- `flyer-2.jpeg` — açaí menu reference
- `flyer-3.jpeg` — sorvetes menu + clearest logo source

## Logo extraction

The logo was cropped from `flyer-3.jpeg` using Python + Pillow:

```python
from PIL import Image
img = Image.open('flyer-3.jpeg')
w, h = img.size
logo = img.crop((int(w*0.30), int(h*0.025), int(w*0.70), int(h*0.225)))
logo.save('logo.png')
```

Re-run this if the logo needs updating.

## Architecture

The page is a `div.page` (max-width 480px, centered) on a purple body background — giving a mobile-card appearance on desktop. Three anchor sections (`#sorvetes`, `#picoles`, `#acai`) are linked from a sticky `<nav>`. An IntersectionObserver in `script.js` highlights the active nav link.

### Color palette (CSS variables in `styles.css`)
- `--roxo` / `--roxo-medio` / `--roxo-claro` / `--roxo-bg` — purple scale (sorvetes section)
- `--pink` / `--pink-claro` / `--pink-bg` — pink scale (picolés section)
- `--acai` / `--acai-medio` / `--acai-bg` — deep purple scale (açaí section)
- `--verde` / `--verde-escuro` — lime green (brand accent, cart bar, badges)
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

Premium flavors use `.premium-card` inside a `.premium-grid` (2-column) instead of pills.

### Cart system (`script.js`)
- Pills and premium cards carry `data-category`, `data-flavor`, `data-price` attributes.
- Clicking a pill/card adds 1 unit; inline −/+ controls appear on the element itself.
- A fixed floating bar (`#order-cart`) shows total qty + price; hidden when cart is empty.
- `body.has-cart` adds bottom padding to prevent content being obscured by the bar.
- Picolés require a minimum of 10 units — validated before sending the WhatsApp order.
- WhatsApp link: `https://wa.me/5524999362315?text=${encodeURIComponent(msg)}` — build the message as a plain string with `\n`, then encode the whole thing (no inline emojis in the URL).
- `CSS.escape()` is used when querying elements by flavor name (handles spaces and accents).
