// product.js – Trang chi tiết sản phẩm: ảnh, giá, chọn phân loại và số lượng, thông tin shop,
// mô tả, thông số, đánh giá và gợi ý món cùng loại. Sản phẩm lấy theo ?id= trên đường dẫn.
import {
  PRODUCTS, SHOPS, byId, catName, variantsOf, stockOf, reviewsOf, money, sold, tint, discount, esc,
} from './data.js';
import { $, mountShell, addToCart, toggleCart, toast, isLiked, toggleLike, cardHTML, bindCardButtons } from './common.js';

mountShell();
bindCardButtons();

const id = Number(new URLSearchParams(location.search).get('id'));
const p = byId.get(id);
const root = $('pd');

// ---------- Tiện ích nhỏ ----------
const comma = (n) => n.toFixed(1).replace('.', ',');
const starRow = (n, cls = '') => `<span class="stars ${cls}" aria-label="${comma(n)} trên 5 sao">${
  [1, 2, 3, 4, 5].map((i) => `<svg class="${i <= Math.round(n) ? '' : 'is-off'}" aria-hidden="true"><use href="#i-star"></use></svg>`).join('')
}</span>`;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Bốn "ảnh" của món hàng: ảnh chính, cận cảnh, lúc đóng hộp, và lúc được mèo kiểm định
const SHOTS = [
  { label: 'Ảnh chính', html: () => `<span class="shot__icon">${p.icon}</span>`, bg: () => tint(p.id) },
  { label: 'Cận cảnh', html: () => `<span class="shot__icon shot__icon--zoom">${p.icon}</span>`, bg: () => tint(p.id, 86) },
  { label: 'Đóng gói', html: () => `<span class="shot__icon shot__icon--small">${p.icon}</span><span class="shot__box">📦</span>`, bg: () => '#f3e6d6' },
  { label: 'Mèo kiểm định', html: () => `<span class="shot__icon shot__icon--side">${p.icon}</span><span class="shot__cat">🐱</span>`, bg: () => tint(p.id + 3, 90) },
];

function renderProduct() {
  const shop = SHOPS[p.cat];
  const off = discount(p);
  const stock = stockOf(p);
  const reviews = reviewsOf(p);
  const variants = variantsOf(p);
  document.title = `${p.name} · Chợ Nugỏrt`;

  root.innerHTML = `
    <nav class="crumbs" aria-label="Đường dẫn">
      <a href="./">Chợ Nugỏrt</a><span aria-hidden="true">›</span>
      <a href="./?cat=${p.cat}">${catName(p.cat)}</a><span aria-hidden="true">›</span>
      <span aria-current="page">${esc(p.name)}</span>
    </nav>

    <section class="pd__top">
      <div class="gallery">
        <div class="gallery__main" id="g-main"></div>
        <button class="gallery__nav gallery__nav--prev" type="button" data-shot-step="-1" aria-label="Ảnh trước">‹</button>
        <button class="gallery__nav gallery__nav--next" type="button" data-shot-step="1" aria-label="Ảnh sau">›</button>
        <ul class="gallery__thumbs" id="g-thumbs">
          ${SHOTS.map((s, i) => `
            <li><button type="button" class="shot shot--thumb" data-shot="${i}" style="background:${s.bg()}" aria-label="${s.label}">${s.html()}</button></li>`).join('')}
        </ul>
      </div>

      <div class="pd__info">
        <h1 class="pd__title">${p.fav ? '<span class="tag tag--inline">Yêu thích</span>' : ''}${esc(p.name)}</h1>
        <div class="pd__stats">
          <a href="#reviews"><b>${comma(p.rating)}</b> ${starRow(p.rating)}</a>
          <a href="#reviews"><b>${sold(reviews.count)}</b> đánh giá</a>
          <span><b>${sold(p.sold)}</b> đã bán</span>
        </div>

        <div class="pd__price">
          ${p.old ? `<s>${money(p.old)}</s>` : ''}
          <b>${money(p.price)}</b>
          ${off ? `<span class="pd__off">-${off}%</span>` : ''}
        </div>

        <dl class="pd__rows">
          <div>
            <dt>Vận chuyển</dt>
            <dd class="pd__ship">
              <svg aria-hidden="true"><use href="#i-truck"></use></svg>
              <span><b>Miễn phí vận chuyển</b><br>Gửi từ ${esc(p.from)} bằng tên lửa, nhận trong 2–4 ngày</span>
            </dd>
          </div>
          <div>
            <dt>An tâm</dt>
            <dd class="pd__ship">
              <svg aria-hidden="true"><use href="#i-shield"></use></svg>
              <span>Đổi trả trong 7 ngày Trái Đất · Hàng do mèo kiểm định</span>
            </dd>
          </div>
          <div id="variant-row">
            <dt>Phân loại</dt>
            <dd>
              <div class="chips" id="variants">
                ${variants.map((v) => `<button type="button" class="chip" data-variant="${esc(v)}" aria-pressed="false">${esc(v)}</button>`).join('')}
              </div>
              <p class="pd__warn" id="variant-warn" role="alert" hidden>Chọn phân loại trước đã nha</p>
            </dd>
          </div>
          <div>
            <dt>Số lượng</dt>
            <dd class="qty-row">
              <div class="qty">
                <button type="button" data-qty="-1" aria-label="Bớt một">−</button>
                <label class="sr-only" for="qty">Số lượng</label>
                <input id="qty" type="number" inputmode="numeric" min="1" max="${stock}" value="1">
                <button type="button" data-qty="1" aria-label="Thêm một">+</button>
              </div>
              <span class="qty-row__stock">Còn ${stock} sản phẩm</span>
            </dd>
          </div>
        </dl>

        <div class="pd__actions">
          <button class="btn btn--ghost btn--lg" type="button" data-buy="cart">
            <svg aria-hidden="true"><use href="#i-cart"></use></svg> Thêm vào giỏ hàng
          </button>
          <button class="btn btn--primary btn--lg" type="button" data-buy="now">Mua ngay</button>
          <button class="like like--lg" type="button" id="pd-like" aria-pressed="${isLiked(p.id)}" aria-label="Yêu thích">
            <svg aria-hidden="true"><use href="#i-heart"></use></svg>
          </button>
        </div>
      </div>
    </section>

    <section class="shop-card" aria-label="Thông tin shop">
      <span class="shop-card__avatar" aria-hidden="true">${shop.icon}</span>
      <div class="shop-card__name">
        <b>${shop.name}</b>
        <span>Online 5 phút trước</span>
      </div>
      <dl class="shop-card__stats">
        <div><dt>Đánh giá</dt><dd>${comma(4.6 + (p.id % 4) * 0.1)}</dd></div>
        <div><dt>Sản phẩm</dt><dd>${PRODUCTS.filter((x) => x.cat === p.cat).length}</dd></div>
        <div><dt>Phản hồi</dt><dd>${92 + (p.id % 7)}%</dd></div>
        <div><dt>Tham gia</dt><dd>${2 + (p.id % 5)} năm trước</dd></div>
      </dl>
      <a class="btn" href="./?cat=${p.cat}">Xem shop</a>
    </section>

    <div class="pd__cols">
      <section class="panel" aria-labelledby="desc-title">
        <h2 class="panel__title" id="desc-title">Chi tiết sản phẩm</h2>
        <dl class="specs">
          <div><dt>Danh mục</dt><dd><a href="./?cat=${p.cat}">${catName(p.cat)}</a></dd></div>
          <div><dt>Thương hiệu</dt><dd>${shop.name}</dd></div>
          <div><dt>Phân loại</dt><dd>${variants.map(esc).join(', ')}</dd></div>
          <div><dt>Kho hàng</dt><dd>${stock}</dd></div>
          <div><dt>Gửi từ</dt><dd>${esc(p.from)}</dd></div>
          <div><dt>Bảo hành</dt><dd>7 ngày Trái Đất</dd></div>
        </dl>
        <h2 class="panel__title">Mô tả sản phẩm</h2>
        <p class="desc">${esc(p.desc)}</p>
      </section>

      <section class="panel" id="reviews" aria-labelledby="rv-title">
        <h2 class="panel__title" id="rv-title">Đánh giá sản phẩm</h2>
        <div class="rv-summary">
          <div class="rv-summary__score">
            <p><b>${comma(p.rating)}</b> trên 5</p>
            ${starRow(p.rating, 'stars--lg')}
          </div>
          <div class="chips" id="rv-filters"></div>
        </div>
        <ul class="rv-list" id="rv-list"></ul>
      </section>
    </div>

    <section class="related" aria-labelledby="rel-title">
      <h2 class="related__title" id="rel-title">Có thể bạn cũng thích</h2>
      <ul class="grid" id="related"></ul>
    </section>

    <div class="buybar" aria-label="Mua nhanh">
      <button class="btn btn--ghost" type="button" data-buy="cart">Thêm vào giỏ</button>
      <button class="btn btn--primary" type="button" data-buy="now">Mua ngay · ${money(p.price)}</button>
    </div>`;

  // ---------- Ảnh ----------
  let shot = 0;
  const showShot = (i) => {
    shot = (i + SHOTS.length) % SHOTS.length;
    const s = SHOTS[shot];
    $('g-main').innerHTML = `<div class="shot shot--main" style="background:${s.bg()}" role="img" aria-label="${esc(p.name)}, ${s.label.toLowerCase()}">${s.html()}</div>
      ${off ? `<span class="sale sale--lg">${off}%<br>GIẢM</span>` : ''}`;
    document.querySelectorAll('[data-shot]').forEach((b) => b.classList.toggle('is-active', Number(b.dataset.shot) === shot));
  };
  showShot(0);

  // ---------- Phân loại và số lượng ----------
  let variant = '';
  const qtyInput = $('qty');
  const clampQty = (n) => Math.min(stock, Math.max(1, Math.round(Number(n) || 1)));
  qtyInput.addEventListener('change', () => { qtyInput.value = clampQty(qtyInput.value); });

  // ---------- Đánh giá ----------
  const filters = [
    { id: 'all', label: `Tất cả (${sold(reviews.count)})`, test: (r) => r.base },
    ...[5, 4, 3, 2, 1].map((n, i) => ({
      id: String(n), label: `${n} Sao (${sold(Math.round(reviews.count * reviews.split[i]))})`, test: (r) => r.stars === n,
    })),
    { id: 'text', label: 'Có bình luận', test: (r) => r.base && r.text },
  ];
  let filter = 'all';
  const helpful = new Set();
  const renderReviews = () => {
    $('rv-filters').innerHTML = filters.map((f) => (
      `<button type="button" class="chip" data-rv="${f.id}" aria-pressed="${f.id === filter}">${f.label}</button>`
    )).join('');
    const list = reviews.list.map((r, i) => ({ ...r, i })).filter(filters.find((f) => f.id === filter).test);
    $('rv-list').innerHTML = list.length ? list.map((r) => `
      <li class="rv">
        <span class="rv__avatar" style="background:${tint(r.name.length * 7 + r.i)}" aria-hidden="true">${r.name[0].toUpperCase()}</span>
        <div>
          <p class="rv__name">${esc(r.name)}</p>
          ${starRow(r.stars, 'stars--sm')}
          <p class="rv__meta">${r.date} · Phân loại: ${esc(r.variant)}</p>
          ${r.text ? `<p class="rv__text">${esc(r.text)}</p>` : ''}
          <button type="button" class="rv__help" data-help="${r.i}" aria-pressed="${helpful.has(r.i)}">👍 Hữu ích (${r.helpful + (helpful.has(r.i) ? 1 : 0)})</button>
        </div>
      </li>`).join('') : '<li class="rv-empty">Chưa có đánh giá nào ở mức này.</li>';
  };
  renderReviews();

  // ---------- Gợi ý món khác: cùng danh mục trước, thiếu thì lấy thêm món bán chạy ----------
  const others = PRODUCTS.filter((x) => x.id !== p.id);
  const related = [...others.filter((x) => x.cat === p.cat), ...others.filter((x) => x.cat !== p.cat).sort((a, b) => b.sold - a.sold)].slice(0, 5);
  $('related').innerHTML = related.map(cardHTML).join('');

  // ---------- Mua hàng ----------
  const buy = (now, from) => {
    if (!variant) {
      $('variant-warn').hidden = false;
      $('variant-row').classList.add('is-missing');
      $('variant-row').scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      return;
    }
    const qty = clampQty(qtyInput.value);
    addToCart(p.id, qty, variant);
    flyToCart(from);
    if (now) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      setTimeout(() => toggleCart(true), reduceMotion ? 0 : 450);
      toast('Đã thêm vào giỏ, bấm Thanh toán để đặt hàng (demo thôi nha)');
    } else {
      toast(`Đã thêm ${qty} × ${variant} vào giỏ`);
    }
  };

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.shot) showShot(Number(t.dataset.shot));
    else if (t.dataset.shotStep) showShot(shot + Number(t.dataset.shotStep));
    else if (t.dataset.variant !== undefined) {
      variant = variant === t.dataset.variant ? '' : t.dataset.variant;
      document.querySelectorAll('[data-variant]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.variant === variant)));
      if (variant) {
        $('variant-warn').hidden = true;
        $('variant-row').classList.remove('is-missing');
      }
    } else if (t.dataset.qty) {
      qtyInput.value = clampQty(Number(qtyInput.value) + Number(t.dataset.qty));
    } else if (t.dataset.buy) {
      buy(t.dataset.buy === 'now', t);
    } else if (t.id === 'pd-like') {
      const on = toggleLike(p.id);
      t.setAttribute('aria-pressed', String(on));
      toast(on ? 'Đã thêm vào danh sách yêu thích' : 'Đã bỏ khỏi danh sách yêu thích');
    } else if (t.dataset.rv) {
      filter = t.dataset.rv;
      renderReviews();
    } else if (t.dataset.help) {
      const i = Number(t.dataset.help);
      if (helpful.has(i)) helpful.delete(i);
      else helpful.add(i);
      renderReviews();
    }
  });

  // Vuốt ngang trên ảnh chính để đổi ảnh (điện thoại)
  let touchX = null;
  $('g-main').addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  $('g-main').addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) showShot(shot + (dx < 0 ? 1 : -1));
    touchX = null;
  });
}

// Món hàng "bay" từ nút bấm vào biểu tượng giỏ hàng
function flyToCart(from) {
  if (reduceMotion || !from) return;
  const a = from.getBoundingClientRect();
  const b = $('cart-btn').getBoundingClientRect();
  const el = document.createElement('span');
  el.className = 'fly';
  el.textContent = p.icon;
  el.style.left = `${a.left + a.width / 2}px`;
  el.style.top = `${a.top + a.height / 2}px`;
  document.body.append(el);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  el.animate([
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
    { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 80}px)) scale(1.2)`, opacity: 1, offset: 0.5 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.3)`, opacity: 0.2 },
  ], { duration: 700, easing: 'cubic-bezier(.5,0,.5,1)' }).onfinish = () => el.remove();
}

// ---------- Vẽ trang (đặt cuối file, sau khi mọi hằng số ở trên đã sẵn sàng) ----------
if (!p) {
  root.innerHTML = `
    <div class="pd-missing">
      <p class="pd-missing__icon" aria-hidden="true">🙀</p>
      <h1>Không tìm thấy món này</h1>
      <p>Có thể mèo đã tha nó đi đâu mất rồi.</p>
      <a class="btn btn--primary" href="./">Về trang chủ Chợ Nugỏrt</a>
    </div>`;
} else {
  renderProduct();
}
