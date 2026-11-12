// app.js – Trang chủ Chợ Nugỏrt: flash sale, danh mục, bộ lọc (khoảng giá, số sao, món đã thả tim), sắp xếp, phân trang.
// Mọi lựa chọn đều ghi lên địa chỉ trang (?cat=…&sort=…&page=…), nên tải lại trang, bấm Quay lại,
// hay gửi link cho bạn bè thì vẫn thấy đúng như đang xem.
// Phần dùng chung (đầu trang, giỏ hàng, đăng nhập, gợi ý tìm kiếm) nằm trong common.js, dữ liệu nằm trong data.js.
import { CATS, PRODUCTS, plain, money, tint, discount, esc } from './data.js';
import { $, mountShell, cardHTML, bindCardButtons, isLiked, likedCount } from './common.js';

const PAGE_SIZE = 10;
const SORTS = ['popular', 'newest', 'sold', 'asc', 'desc'];
const RATES = [4.9, 4.7, 4.5];
const PRICE_PRESETS = [
  { label: 'Dưới 100k', min: null, max: 100000 },
  { label: '100k–500k', min: 100000, max: 500000 },
  { label: '500k–2tr', min: 500000, max: 2000000 },
  { label: 'Trên 2tr', min: 2000000, max: null },
];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const comma = (n) => n.toFixed(1).replace('.', ',');

mountShell();

// ---------- Trạng thái <-> địa chỉ trang ----------
function readURL() {
  const u = new URLSearchParams(location.search);
  const price = (k) => {
    const n = Number.parseInt(u.get(k), 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  return {
    cat: CATS.some((c) => c.id === u.get('cat')) ? u.get('cat') : 'all',
    sort: SORTS.includes(u.get('sort')) ? u.get('sort') : 'popular',
    query: u.get('q') || '',
    page: Math.max(1, Number.parseInt(u.get('page'), 10) || 1),
    min: price('min'),
    max: price('max'),
    rate: RATES.includes(Number(u.get('rate'))) ? Number(u.get('rate')) : 0,
    fav: u.get('fav') === '1',
  };
}

const state = readURL();

// push: true thì thêm một bước vào lịch sử (bấm Quay lại được), false thì chỉ sửa địa chỉ hiện tại (lúc đang gõ tìm kiếm)
function writeURL(push) {
  const u = new URLSearchParams();
  if (state.cat !== 'all') u.set('cat', state.cat);
  if (state.query.trim()) u.set('q', state.query.trim());
  if (state.fav) u.set('fav', '1');
  if (state.min != null) u.set('min', state.min);
  if (state.max != null) u.set('max', state.max);
  if (state.rate) u.set('rate', state.rate);
  if (state.sort !== 'popular') u.set('sort', state.sort);
  if (state.page > 1) u.set('page', state.page);
  const search = u.toString() ? `?${u}` : '';
  if (search === location.search) return;
  history[push ? 'pushState' : 'replaceState'](null, '', location.pathname + search);
}

// ---------- Lọc và sắp xếp ----------
function visibleProducts() {
  const q = plain(state.query.trim());
  const list = PRODUCTS.filter((p) => (state.cat === 'all' || p.cat === state.cat)
    && (!q || plain(p.name).includes(q))
    && (!state.fav || isLiked(p.id))
    && (state.min == null || p.price >= state.min)
    && (state.max == null || p.price <= state.max)
    && (!state.rate || p.rating >= state.rate));
  const sorters = {
    popular: (a, b) => b.rating * Math.log10(b.sold + 10) - a.rating * Math.log10(a.sold + 10),
    newest: (a, b) => b.added - a.added,
    sold: (a, b) => b.sold - a.sold,
    asc: (a, b) => a.price - b.price,
    desc: (a, b) => b.price - a.price,
  };
  return list.sort(sorters[state.sort]);
}

// ---------- Vẽ các phần trên trang ----------
// Nút danh mục, nút sắp xếp, chip lọc chỉ vẽ một lần; mỗi lần đổi lựa chọn thì chỉ đánh dấu lại,
// để nút vừa bấm không bị thay mới (người dùng bàn phím không bị mất chỗ đang đứng)
$('cats').innerHTML = CATS.map((c) => `<li><button type="button" data-cat="${c.id}">${c.name}</button></li>`).join('');
$('price-presets').innerHTML = PRICE_PRESETS.map((r, i) => (
  `<button type="button" class="chip chip--sm" data-preset="${i}" aria-pressed="false">${r.label}</button>`
)).join('');
const fiveStars = `<span class="stars stars--sm" aria-hidden="true">${'<svg><use href="#i-star"></use></svg>'.repeat(5)}</span>`;
$('rates').innerHTML = RATES.map((r) => (
  `<button type="button" class="rate" data-rate="${r}" aria-pressed="false">${fiveStars}<span>Từ ${comma(r)} sao</span></button>`
)).join('');

const press = (selector, isOn) => document.querySelectorAll(selector).forEach((b) => {
  const on = isOn(b);
  b.setAttribute('aria-pressed', String(on));
  b.classList.toggle('is-active', on);
});

function markControls() {
  press('[data-cat]', (b) => b.dataset.cat === state.cat);
  press('[data-sort]', (b) => b.dataset.sort === state.sort);
  $('price-sort').value = state.sort === 'asc' || state.sort === 'desc' ? state.sort : '';
  press('[data-preset]', (b) => {
    const r = PRICE_PRESETS[b.dataset.preset];
    return r.min === state.min && r.max === state.max;
  });
  press('[data-rate]', (b) => Number(b.dataset.rate) === state.rate);
  press('#fav-only', () => state.fav);
  $('fav-n').textContent = `(${likedCount()})`;
  const n = (state.min != null || state.max != null ? 1 : 0) + (state.rate ? 1 : 0) + (state.fav ? 1 : 0);
  $('filters-badge').textContent = n;
  $('filters-badge').hidden = n === 0;
  $('filters-clear').disabled = n === 0;
}

const priceText = (n) => (n == null ? '' : n.toLocaleString('vi-VN'));
function fillPriceInputs() {
  $('price-min').value = priceText(state.min);
  $('price-max').value = priceText(state.max);
  $('price-error').hidden = true;
}

function priceLabel() {
  if (state.min != null && state.max != null) return `Giá ${money(state.min)} – ${money(state.max)}`;
  if (state.min != null) return `Giá từ ${money(state.min)}`;
  return `Giá đến ${money(state.max)}`;
}

// Hàng chip "bộ lọc đang bật" ngay dưới thanh sắp xếp
function renderActive() {
  const chips = [];
  const q = state.query.trim();
  if (q) chips.push({ key: 'q', label: `Từ khóa “${q}”` });
  if (state.fav) chips.push({ key: 'fav', label: '♥ Món đã thả tim' });
  if (state.min != null || state.max != null) chips.push({ key: 'price', label: priceLabel() });
  if (state.rate) chips.push({ key: 'rate', label: `Từ ${comma(state.rate)} sao` });
  $('active-filters').hidden = chips.length === 0;
  $('active-list').innerHTML = chips.map((c) => (
    `<li><button type="button" class="pill" data-unset="${c.key}" aria-label="Bỏ lọc: ${esc(c.label)}">${esc(c.label)}<span aria-hidden="true">✕</span></button></li>`
  )).join('');
}

function renderGrid() {
  const list = visibleProducts();
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  state.page = Math.min(state.page, pages);
  const shown = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

  $('grid').innerHTML = shown.map(cardHTML).join('');
  $('none').hidden = list.length > 0;
  $('none').textContent = state.fav && likedCount() === 0
    ? 'Chưa thả tim món nào. Bấm hình trái tim trên món bạn thích để để dành nhé.'
    : 'Không tìm thấy món nào. Thử bỏ bớt bộ lọc, hoặc hỏi con mèo xem nó giấu ở đâu.';
  $('result-count').textContent = `${list.length} sản phẩm`;

  // Phân trang: nút lùi, các số trang, nút tiến
  const pager = $('pager');
  pager.hidden = pages < 2;
  let html = `<button class="btn" type="button" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''} aria-label="Trang trước">‹</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="btn ${i === state.page ? 'is-active' : ''}" type="button" data-page="${i}" ${i === state.page ? 'aria-current="page"' : ''}>${i}</button>`;
  }
  html += `<button class="btn" type="button" data-page="${state.page + 1}" ${state.page === pages ? 'disabled' : ''} aria-label="Trang sau">›</button>`;
  pager.innerHTML = html;
}

/** Vẽ lại sau mỗi lần đổi lựa chọn. Đổi bộ lọc thì về trang 1; chỉ bấm số trang thì giữ trang. */
function update({ push = true, keepPage = false } = {}) {
  if (!keepPage) state.page = 1;
  markControls();
  renderActive();
  renderGrid();
  $('flash').hidden = Boolean(state.query.trim() || state.fav); // đang tìm hay đang xem món đã thả tim thì cất flash sale đi cho gọn
  writeURL(push);
}

// ---------- Flash sale ----------
// Mỗi khung 2 tiếng (0h, 2h, 4h… theo giờ máy) chọn ra 6 món đang giảm giá. Cùng một khung giờ thì ai mở cũng thấy giống nhau.
function flashWindow() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() - (start.getHours() % 2));
  const end = new Date(start);
  end.setHours(start.getHours() + 2);
  const seed = ((start.getFullYear() * 100 + start.getMonth() + 1) * 100 + start.getDate()) * 100 + start.getHours();
  return { end: end.getTime(), seed };
}

function seededRand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

let flashEnd = 0;
function renderFlash() {
  const { end, seed } = flashWindow();
  flashEnd = end;
  const rand = seededRand(seed);
  const deals = PRODUCTS.filter((p) => p.old);
  for (let i = deals.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deals[i], deals[j]] = [deals[j], deals[i]];
  }
  $('flash-list').innerHTML = deals.slice(0, 6).map((p) => {
    const pct = Math.round((0.3 + rand() * 0.66) * 100); // đã bán được bao nhiêu phần trăm số suất flash sale
    const total = 40 + Math.floor(rand() * 160);
    const hot = pct >= 85;
    return `
      <li>
        <a class="flash__item" href="product.html?id=${p.id}" aria-label="${esc(p.name)}, giá ${money(p.price)}, giảm ${discount(p)}%">
          <span class="flash__img" style="background:${tint(p.id)}" aria-hidden="true">${p.icon}<span class="flash__off">-${discount(p)}%</span></span>
          <b class="flash__price" aria-hidden="true">${money(p.price)}</b>
          <span class="flash__bar${hot ? ' is-hot' : ''}" style="--p:${pct}%" aria-hidden="true">
            <span>${hot ? '🔥 Sắp cháy hàng' : `Đã bán ${Math.round((total * pct) / 100)}`}</span>
          </span>
        </a>
      </li>`;
  }).join('');
  const endAt = new Date(end);
  $('flash-sr').textContent = `kết thúc lúc ${String(endAt.getHours()).padStart(2, '0')} giờ`;
}

function tickFlash() {
  let left = flashEnd - Date.now();
  if (left <= 0) { // hết khung giờ: đổi lượt món mới
    renderFlash();
    left = flashEnd - Date.now();
  }
  const s = Math.floor(left / 1000);
  const two = (n) => String(n).padStart(2, '0');
  $('flash-h').textContent = two(Math.floor(s / 3600));
  $('flash-m').textContent = two(Math.floor((s % 3600) / 60));
  $('flash-s').textContent = two(s % 60);
}

// ---------- Khoảng giá ----------
// Nhận cả số có dấu chấm (100.000) lẫn kiểu gõ tắt: 100k, 1,5tr, 2 triệu
function parsePrice(text) {
  const t = plain(text).replace(/\s+/g, '');
  if (!t) return null;
  const m = t.match(/^(\d+(?:[.,]\d+)?)(k|nghin|tr|trieu)$/);
  if (m) return Math.round(Number.parseFloat(m[1].replace(',', '.')) * (m[2] === 'k' || m[2] === 'nghin' ? 1e3 : 1e6));
  const digits = t.replace(/\D/g, '');
  return digits ? Number(digits) : null;
}

$('price-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const min = parsePrice($('price-min').value);
  const max = parsePrice($('price-max').value);
  if (min != null && max != null && min > max) {
    $('price-error').hidden = false;
    return;
  }
  state.min = min;
  state.max = max;
  fillPriceInputs();
  update();
});
$('price-form').addEventListener('input', () => { $('price-error').hidden = true; }); // sửa lại số thì tắt lời nhắc lỗi

// ---------- Gập / mở phần Danh mục và Bộ lọc ----------
// Danh sách từ từ co lại (hay trải ra) và mờ dần, không biến mất cái rụp
const anims = new Map();
function toggleSection(button, body, holder, open = button.getAttribute('aria-expanded') !== 'true') {
  button.setAttribute('aria-expanded', String(open));
  anims.get(body)?.cancel();
  if (reduceMotion) {
    holder.classList.toggle('is-collapsed', !open);
    return;
  }
  holder.classList.remove('is-collapsed'); // hiện ra trước để đo chiều cao thật
  const shown = { height: `${body.scrollHeight}px`, opacity: 1 };
  const hidden = { height: '0px', opacity: 0 };
  body.style.overflow = 'hidden';
  const anim = body.animate(open ? [hidden, shown] : [shown, hidden], { duration: 380, easing: 'cubic-bezier(.25, .8, .25, 1)' });
  anims.set(body, anim);
  anim.onfinish = () => {
    body.style.overflow = '';
    holder.classList.toggle('is-collapsed', !open);
    anims.delete(body);
  };
}

// Điện thoại: bộ lọc gập sẵn cho đỡ dài, bấm "Bộ lọc" mới mở
if (!window.matchMedia('(min-width: 900px)').matches) {
  $('filters-toggle').setAttribute('aria-expanded', 'false');
  $('filters').classList.add('is-collapsed');
}

// ---------- Sự kiện ----------
const unset = {
  q: () => { state.query = ''; $('search-input').value = ''; },
  fav: () => { state.fav = false; },
  price: () => { state.min = null; state.max = null; fillPriceInputs(); },
  rate: () => { state.rate = 0; },
};

document.addEventListener('click', (e) => {
  // Nút trái tim trên đầu trang: đang ở trang chủ thì lọc tại chỗ, khỏi tải lại trang
  const likeLink = e.target.closest('#like-link');
  if (likeLink && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
    state.fav = true;
    update();
    document.querySelector('.content').scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    return;
  }

  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.cat) {
    state.cat = t.dataset.cat;
    update();
  } else if (t.dataset.sort) {
    state.sort = t.dataset.sort;
    update();
  } else if (t.dataset.page) {
    state.page = Number(t.dataset.page);
    update({ keepPage: true });
    document.querySelector('.toolbar').scrollIntoView({ block: 'center' });
  } else if (t.dataset.preset) {
    const r = PRICE_PRESETS[t.dataset.preset];
    const on = t.getAttribute('aria-pressed') === 'true';
    state.min = on ? null : r.min;
    state.max = on ? null : r.max;
    fillPriceInputs();
    update();
  } else if (t.dataset.rate) {
    state.rate = state.rate === Number(t.dataset.rate) ? 0 : Number(t.dataset.rate);
    update();
  } else if (t.id === 'fav-only') {
    state.fav = !state.fav;
    update();
  } else if (t.id === 'filters-clear') {
    unset.price();
    unset.rate();
    unset.fav();
    update();
  } else if (t.dataset.unset) {
    const key = t.dataset.unset;
    if (key === 'all') Object.values(unset).forEach((f) => f());
    else unset[key]();
    update();
    // Chip vừa bấm đã biến mất: đưa con trỏ bàn phím sang chip còn lại, hết chip thì về nút sắp xếp đang chọn
    (document.querySelector('[data-unset]:not([data-unset="all"])') || document.querySelector('[data-sort].is-active') || $('price-sort')).focus();
  } else if (t.id === 'cats-toggle') {
    toggleSection(t, $('cats'), document.querySelector('.sidebar'));
  } else if (t.id === 'filters-toggle') {
    toggleSection(t, $('filters-body'), $('filters'));
  }
});
bindCardButtons(); // nút "Thêm vào giỏ" và nút tim trên từng thẻ

// Thả tim hay bỏ tim thì cập nhật số đếm ở bộ lọc. Đang xem món đã thả tim mà bỏ tim một món thì món đó vẫn nằm đó
// (bấm lại được nếu lỡ tay), lần lọc sau mới biến mất.
document.addEventListener('likes-change', markControls);

$('price-sort').addEventListener('change', (e) => {
  state.sort = e.target.value || 'popular';
  update();
});

// Ở trang chủ thì tìm ngay khi gõ, không cần tải lại trang
$('search-input').addEventListener('input', (e) => {
  state.query = e.target.value;
  update({ push: false });
});
$('search').addEventListener('submit', (e) => e.preventDefault());

// Bấm Quay lại / Đi tiếp trên trình duyệt: đọc lại lựa chọn từ địa chỉ trang
window.addEventListener('popstate', () => {
  Object.assign(state, readURL());
  $('search-input').value = state.query;
  fillPriceInputs();
  update({ push: false, keepPage: true });
});

fillPriceInputs();
update({ push: false, keepPage: true });
renderFlash();
tickFlash();
setInterval(tickFlash, 1000);
