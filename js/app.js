/* ── ORDER CART ────────────────────────────────── */
let inquiry = JSON.parse(localStorage.getItem('siptwice_order') || '[]');
// Each item: { name, price, qty }

function saveInquiry() {
  localStorage.setItem('siptwice_order', JSON.stringify(inquiry));
  updateInquiryCount();
}

function updateInquiryCount() {
  const total = inquiry.reduce((sum, i) => sum + (i.qty || 1), 0);
  document.querySelectorAll('.inquiry-count').forEach(el => {
    el.textContent = total;
    el.style.display = total ? 'inline-block' : 'none';
  });
  document.querySelectorAll('[data-inquiry-count]').forEach(el => {
    el.textContent = `${total} item${total !== 1 ? 's' : ''}`;
  });
}

function addToInquiry(name, price, btn) {
  const exists = inquiry.find(i => i.name === name);
  if (exists) {
    removeFromInquiry(name);
    if (btn) { btn.textContent = '+ Add to Order'; btn.classList.remove('added'); }
    return;
  }
  inquiry.push({ name, price, qty: 1 });
  saveInquiry();
  if (btn) { btn.textContent = '✓ Added'; btn.classList.add('added'); }
}

function removeFromInquiry(name) {
  inquiry = inquiry.filter(i => i.name !== name);
  saveInquiry();
  document.querySelectorAll(`.card-add[data-name="${CSS.escape(name)}"]`).forEach(btn => {
    btn.textContent = '+ Add to Order';
    btn.classList.remove('added');
  });
  renderInquiryList();
}

function changeQty(name, delta) {
  const item = inquiry.find(i => i.name === name);
  if (!item) return;
  item.qty = (item.qty || 1) + delta;
  if (item.qty <= 0) {
    removeFromInquiry(name);
    return;
  }
  saveInquiry();
  renderInquiryList();
}

function buildInquiryMessage() {
  if (!inquiry.length) return '';
  const lines = inquiry.map(i => {
    const qty = i.qty || 1;
    return qty > 1
      ? `• ${qty}x ${i.name} — ${i.price} each`
      : `• ${i.name} — ${i.price}`;
  }).join('\n');
  return `Hi Sip Twice! I'd like to order the following:\n\n${lines}\n\nPlease confirm availability and arrange delivery. Thank you!`;
}

function renderInquiryList() {
  const body = document.getElementById('inquiry-body');
  if (!body) return;
  if (!inquiry.length) {
    body.innerHTML = '<div class="inquiry-empty">Your order is empty.<br/>Browse and add products you like.</div>';
    return;
  }
  body.innerHTML = inquiry.map(item => {
    const qty = item.qty || 1;
    const safeName = item.name.replace(/'/g, "\\'");
    return `
    <div class="inquiry-item">
      <div class="inquiry-item-info">
        <div class="inquiry-item-name">${item.name}</div>
        <div class="inquiry-item-price">${item.price}</div>
      </div>
      <div class="inquiry-item-controls">
        <button class="qty-btn" onclick="changeQty('${safeName}', -1)">−</button>
        <span class="qty-val">${qty}</span>
        <button class="qty-btn" onclick="changeQty('${safeName}', 1)">+</button>
        <button class="inquiry-item-remove" onclick="removeFromInquiry('${safeName}')">×</button>
      </div>
    </div>`;
  }).join('');
}

function openInquiry() {
  renderInquiryList();
  document.getElementById('order-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeInquiry() {
  document.getElementById('order-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function sendInquiry(channel) {
  if (!inquiry.length) { alert('Please add at least one product to your order.'); return; }
  const msg = buildInquiryMessage();
  const encoded = encodeURIComponent(msg);
  if (channel === 'fb') {
    window.open(`https://www.facebook.com/messages/t/461074500421635`, '_blank');
    navigator.clipboard && navigator.clipboard.writeText(msg);
  } else {
    window.open(`viber://chat?number=%2B639560847104&text=${encoded}`, '_blank');
  }
}

/* ── SIDEBAR ──────────────────────────────────── */
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sb.classList.toggle('open');
  overlay.classList.toggle('open');
}

/* ── PRODUCT CARD RENDERER ────────────────────── */
const CAT_EMOJI = {
  promos:'🔥', whisky:'🥃', gin:'🌿', vodka:'🫧',
  brandy:'🍂', wine:'🍷', tequila:'🌵', cognac:'✨',
  rum:'🏝️', liqueur:'🍬', soju:'🇰🇷', beer:'🍺'
};
const CAT_LABEL = {
  promos:'Promo', whisky:'Whisky', gin:'Gin', vodka:'Vodka',
  brandy:'Brandy', wine:'Wine', tequila:'Tequila', cognac:'Cognac',
  rum:'Rum', liqueur:'Liqueur', soju:'Soju', beer:'Beer'
};

function pctOff(srp, price) {
  const s = parseFloat((srp||'').replace(/[₱,\s]/g,''));
  const p = parseFloat((price||'').replace(/[₱,\s]/g,''));
  if (!s || !p || s <= p) return 0;
  return Math.round((s - p) / s * 100);
}

function renderCard(p, cat) {
  const pct = pctOff(p.srp, p.price);
  const isAdded = inquiry.some(i => i.name === p.name);
  const catLabel = p.subcategory || CAT_LABEL[cat] || cat;
  return `
<div class="product-card">
  <div class="card-image">
    ${pct ? `<div class="card-badge">Save ${pct}%</div>` : ''}
    <div class="card-image-placeholder">
      <span class="bottle-icon">${CAT_EMOJI[cat]||'🥃'}</span>
    </div>
  </div>
  <div class="card-body">
    <div class="card-category">${catLabel}</div>
    <div class="card-name">${p.name}</div>
    <div class="card-desc">${p.details || ''}</div>
    ${p.promo ? `<div class="card-promo-tag">${p.promo}</div>` : ''}
    <div class="card-pricing">
      <div class="card-price">${p.price}</div>
      ${p.srp ? `<div class="card-srp">${p.srp}</div>` : ''}
    </div>
    <button class="card-add ${isAdded ? 'added' : ''}"
      data-name="${p.name.replace(/"/g,'&quot;')}"
      onclick="handleAdd(this, '${p.name.replace(/'/g,"\\'")}', '${p.price}')">
      ${isAdded ? '✓ Added' : '+ Add to Order'}
    </button>
  </div>
</div>`;
}

function handleAdd(btn, name, price) {
  addToInquiry(name, price, btn);
}

/* ── INIT ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateInquiryCount();

  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) overlay.onclick = toggleSidebar;

  const modalOverlay = document.getElementById('order-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeInquiry();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeInquiry();
  });
});
