const cart = { sorvetes: {}, picoles: {}, acai: {} };

// Picolés pricing: regular items get a bulk discount at 10+ units; especiais never discount
const PICOLES_BULK_MIN = 10;
const PICOLES_ESPECIAIS = new Set(['Chocolate', 'Flocos']);

function picolesTotal() {
  return Object.values(cart.picoles).reduce((s, q) => s + q, 0);
}

function regularPicolesCount() {
  return Object.entries(cart.picoles)
    .filter(([f]) => !PICOLES_ESPECIAIS.has(f))
    .reduce((s, [, q]) => s + q, 0);
}

function getItemPrice(cat, flavor) {
  const el = document.querySelector(`[data-category="${cat}"][data-flavor="${CSS.escape(flavor)}"]`);
  if (!el) return 0;
  if (cat === 'picoles' && el.dataset.priceBulk && regularPicolesCount() >= PICOLES_BULK_MIN) {
    return parseFloat(el.dataset.priceBulk);
  }
  return parseFloat(el.dataset.price || 0);
}

function renderPillControls(el, qty) {
  const flavor = el.dataset.flavor;
  if (qty > 0) {
    el.classList.add('selected');
    el.innerHTML =
      `<button class="pill-ctrl" data-action="dec">−</button>` +
      `<span class="pill-name">${flavor}</span>` +
      `<span class="pill-cnt">${qty}</span>` +
      `<button class="pill-ctrl" data-action="inc">+</button>`;
  } else {
    el.classList.remove('selected');
    el.textContent = flavor;
  }
}

function renderPremiumControls(el, qty) {
  const flavor = el.dataset.flavor;
  if (qty > 0) {
    el.classList.add('selected');
    el.innerHTML =
      `<button class="pill-ctrl" data-action="dec">−</button>` +
      `<span class="pill-name">${flavor}</span>` +
      `<span class="pill-cnt">${qty}</span>` +
      `<button class="pill-ctrl" data-action="inc">+</button>`;
  } else {
    el.classList.remove('selected');
    el.textContent = flavor;
  }
}

function updateItem(cat, flavor, delta) {
  const cur = cart[cat][flavor] || 0;
  const next = cur + delta;
  if (next <= 0) delete cart[cat][flavor];
  else cart[cat][flavor] = next;

  const el = document.querySelector(`[data-category="${cat}"][data-flavor="${CSS.escape(flavor)}"]`);
  if (el) {
    if (el.classList.contains('premium-card')) renderPremiumControls(el, cart[cat][flavor] || 0);
    else renderPillControls(el, cart[cat][flavor] || 0);
  }

  const pw = document.getElementById('picoles-warning');
  if (pw) {
    const pt = picolesTotal();
    pw.className = 'picoles-warning' + (pt > 0 && pt < 5 ? ' show' : '');
    pw.textContent = `⚠️ Mínimo de 5 picolés por pedido (${pt}/5 selecionados)`;
  }

  // Update bulk-pricing badge and note
  const regCount = regularPicolesCount();
  const bulkActive = regCount >= PICOLES_BULK_MIN;
  const priceBadge = document.getElementById('picoles-price-badge');
  const bulkNote   = document.getElementById('picoles-bulk-note');
  const onlyNote   = document.getElementById('picoles-only-warning');
  if (priceBadge) priceBadge.textContent = bulkActive ? 'R$ 1,20 / un.' : 'R$ 1,50 / un.';
  if (bulkNote)   bulkNote.className  = 'picoles-bulk-note'  + (bulkActive ? ' active' : '');
  if (onlyNote) {
    const picOnly = picolesTotal() > 0 && !Object.keys(cart.sorvetes).length && !Object.keys(cart.acai).length;
    onlyNote.className = 'picoles-warning' + (picOnly ? ' show' : '');
  }

  let totalQty = 0, totalPrice = 0;
  Object.entries(cart).forEach(([c, flavors]) => {
    Object.entries(flavors).forEach(([f, q]) => {
      totalQty += q;
      totalPrice += getItemPrice(c, f) * q;
    });
  });

  const bar = document.getElementById('order-cart');
  if (totalQty === 0) {
    bar.classList.add('hidden');
    document.body.classList.remove('has-cart');
  } else {
    bar.classList.remove('hidden');
    document.body.classList.add('has-cart');
    document.getElementById('cart-qty').textContent = totalQty;
    document.getElementById('cart-total').textContent = totalPrice.toFixed(2).replace('.', ',');
  }
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-flavor]');
  if (!el) return;
  const cat    = el.dataset.category;
  const flavor = el.dataset.flavor;
  const action = e.target.closest('[data-action]')?.dataset.action;

  if (action === 'dec') { e.stopPropagation(); updateItem(cat, flavor, -1); }
  else if (action === 'inc') { e.stopPropagation(); updateItem(cat, flavor, +1); }
  else { updateItem(cat, flavor, +1); }
});

document.getElementById('order-btn').addEventListener('click', () => {
  const pt = picolesTotal();
  if (pt > 0 && pt < 5) {
    alert(`Mínimo de 5 picolés por pedido!\nVocê tem ${pt} selecionado(s).`);
    return;
  }
  const hasDelivery = Object.keys(cart.sorvetes).length > 0 || Object.keys(cart.acai).length > 0;

  const labels = { sorvetes: 'Sorvetes (10L)', picoles: 'Picolés', acai: 'Açaí (10L)' };
  let msg = 'Olá! Gostaria de fazer um pedido, por favor:\n\n';
  let grandTotal = 0;

  Object.entries(cart).forEach(([cat, flavors]) => {
    if (!Object.keys(flavors).length) return;
    msg += `${labels[cat]}:\n`;
    Object.entries(flavors).forEach(([flavor, qty]) => {
      const price = getItemPrice(cat, flavor);
      const sub = price * qty;
      grandTotal += sub;
      msg += `- ${flavor} x${qty} = R$${sub.toFixed(2).replace('.', ',')}\n`;
    });
    msg += '\n';
  });

  msg += `Total: R$${grandTotal.toFixed(2).replace('.', ',')}\n`;
  msg += hasDelivery ? 'Entrega' : 'Retirada no local';
  window.open(`https://wa.me/5524999362315?text=${encodeURIComponent(msg)}`, '_blank');
});

document.getElementById('cart-clear').addEventListener('click', () => {
  Object.keys(cart).forEach(cat => cart[cat] = {});
  document.querySelectorAll('[data-flavor]').forEach(el => {
    const flavor = el.dataset.flavor;
    el.classList.remove('selected');
    el.textContent = flavor;
  });
  const pw = document.getElementById('picoles-warning');
  if (pw) pw.classList.remove('show');
  const ow = document.getElementById('picoles-only-warning');
  if (ow) ow.classList.remove('show');
  const priceBadge = document.getElementById('picoles-price-badge');
  const bulkNote   = document.getElementById('picoles-bulk-note');
  if (priceBadge) priceBadge.textContent = 'R$ 1,50 / un.';
  if (bulkNote)   bulkNote.classList.remove('active');
  document.getElementById('order-cart').classList.add('hidden');
  document.body.classList.remove('has-cart');
});

const sections = ['sorvetes','picoles','acai'].map(id => document.getElementById(id));
const links    = document.querySelectorAll('nav a');
const nav      = document.getElementById('main-nav');

function updateActiveNav() {
  const atBottom = window.scrollY + window.innerHeight >= document.body.scrollHeight - 10;
  const threshold = window.scrollY + nav.offsetHeight + 10;
  let active = sections[0];
  if (atBottom) {
    active = sections[sections.length - 1];
  } else {
    for (const s of sections) {
      if (s && s.offsetTop <= threshold) active = s;
    }
  }
  links.forEach(l => l.classList.remove('active'));
  document.querySelector(`nav a[href="#${active.id}"]`)?.classList.add('active');
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();
