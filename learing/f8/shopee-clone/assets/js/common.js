// common.js – Phần dùng chung cho mọi trang của Chợ Nugỏrt:
// thanh đầu trang (tìm kiếm, giỏ hàng), chân trang, hộp đăng nhập/đăng ký và thông báo nhỏ.
// Mỗi trang chỉ cần gọi mountShell() một lần, rồi dùng addToCart(), toast()… khi cần.
import { byId, money, sold, tint, discount, esc, variantsOf } from './data.js';

export const $ = (id) => document.getElementById(id);

// Trình duyệt có thể chặn localStorage (chế độ ẩn danh…), nên đọc/ghi đều phải bọc try/catch
export function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
export function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* không lưu được thì thôi */ }
}

// ---------- Khung trang ----------
const ICONS = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <defs>
      <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m16.5 16.5 4.5 4.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
      <symbol id="i-cart" viewBox="0 0 24 24"><path d="M3 4h2.5l2.2 10.5h10.6L20.5 7H7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19" r="1.6" fill="currentColor"/><circle cx="17" cy="19" r="1.6" fill="currentColor"/></symbol>
      <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
      <symbol id="i-star" viewBox="0 0 24 24"><path fill="currentColor" d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8Z"/></symbol>
      <symbol id="i-list" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
      <symbol id="i-bag" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8Z" fill="currentColor"/><path d="M9 8V7a3 3 0 0 1 6 0v1" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
      <symbol id="i-truck" viewBox="0 0 24 24"><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="7" cy="17" r="1.8" fill="currentColor"/><circle cx="17" cy="17" r="1.8" fill="currentColor"/></symbol>
      <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V6l-7-3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
      <symbol id="i-back" viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    </defs>
  </svg>`;

const HEADER = `
  <header class="header">
    <div class="wrap">
      <nav class="topbar" aria-label="Liên kết phụ">
        <ul>
          <li><a href="../../../index.html">← Về căn phòng nhỏ</a></li>
          <li class="hide-sm">Giao hàng bằng tên lửa, chậm nhất 3 năm ánh sáng</li>
        </ul>
        <ul>
          <li><button type="button" data-auth="register">Đăng ký</button></li>
          <li><button type="button" data-auth="login">Đăng nhập</button></li>
        </ul>
      </nav>
      <div class="mainbar">
        <a class="logo" href="./" aria-label="Chợ Nugỏrt, về trang chủ">
          <svg class="logo__icon" aria-hidden="true"><use href="#i-bag"></use></svg>
          <span>Chợ <b>Nugỏrt</b></span>
        </a>
        <form class="search" id="search" role="search" action="./">
          <label class="sr-only" for="search-input">Tìm sản phẩm</label>
          <input id="search-input" name="q" type="search" placeholder="Tìm bàn phím, hạt cho mèo, vé lên Sao Hỏa…" autocomplete="off">
          <button type="submit" aria-label="Tìm"><svg aria-hidden="true"><use href="#i-search"></use></svg></button>
        </form>
        <div class="cart" id="cart">
          <button class="cart__btn" id="cart-btn" type="button" aria-expanded="false" aria-controls="cart-panel">
            <svg aria-hidden="true"><use href="#i-cart"></use></svg>
            <span class="sr-only">Giỏ hàng</span>
            <span class="cart__count" id="cart-count" hidden>0</span>
          </button>
          <div class="cart__panel" id="cart-panel" hidden>
            <h2>Giỏ hàng</h2>
            <ul class="cart__list" id="cart-list"></ul>
            <p class="cart__empty" id="cart-empty">Giỏ còn trống trơn. Mèo nhìn bạn với ánh mắt thất vọng.</p>
            <div class="cart__foot" id="cart-foot" hidden>
              <span>Tổng: <b id="cart-total"></b></span>
              <button class="btn btn--primary" id="checkout" type="button">Thanh toán</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>`;

const FOOTER = `
  <footer class="footer">
    <div class="wrap footer__cols">
      <div>
        <h3>Chăm sóc khách hàng</h3>
        <ul><li>Trung tâm trợ giúp</li><li>Hướng dẫn mua hàng</li><li>Đổi trả trong 7 ngày Trái Đất</li></ul>
      </div>
      <div>
        <h3>Về Chợ Nugỏrt</h3>
        <ul><li>Giới thiệu</li><li>Tuyển dụng (cần người dọn lông mèo)</li><li>Điều khoản</li></ul>
      </div>
      <div>
        <h3>Thanh toán</h3>
        <ul><li>Tiền mặt</li><li>Chuyển khoản</li><li>Cá khô</li></ul>
      </div>
      <div>
        <h3>Vận chuyển</h3>
        <ul><li>Xe máy</li><li>Tên lửa SHOJINLUV-01</li><li>Mèo ngậm tha tới</li></ul>
      </div>
    </div>
    <p class="footer__note wrap">Đây là trang bài tập giao diện của Shojinluv. Sản phẩm, giá cả, đánh giá và đơn hàng đều là bịa, không mua bán thật.</p>
  </footer>`;

const MODAL = `
  <div class="modal" id="auth" hidden>
    <div class="modal__backdrop" data-close></div>
    <div class="modal__box" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div class="modal__head">
        <h2 id="auth-title">Đăng nhập</h2>
        <button class="modal__switch" id="auth-switch" type="button">Đăng ký</button>
      </div>
      <form id="auth-form" novalidate>
        <label>Email<input type="email" name="email" autocomplete="off" placeholder="meo@canphongnho.vn"></label>
        <label>Mật khẩu<input type="password" name="password" autocomplete="off" placeholder="••••••••"></label>
        <label id="auth-repeat" hidden>Nhập lại mật khẩu<input type="password" name="repeat" autocomplete="off" placeholder="••••••••"></label>
        <p class="modal__msg" id="auth-msg" role="status"></p>
        <div class="modal__actions">
          <button class="btn" type="button" data-close>Trở lại</button>
          <button class="btn btn--primary" id="auth-submit" type="submit">Đăng nhập</button>
        </div>
      </form>
    </div>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

/** Chèn khung trang (đầu trang, chân trang, hộp đăng nhập) quanh phần <main> của trang. */
export function mountShell() {
  document.body.insertAdjacentHTML('afterbegin', ICONS + HEADER);
  document.body.insertAdjacentHTML('beforeend', FOOTER + MODAL);
  const q = new URLSearchParams(location.search).get('q');
  if (q) $('search-input').value = q;
  bindShell();
  renderCart();
}

// ---------- Thông báo nhỏ ----------
let toastTimer;
export function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-show'), 2400);
}

// ---------- Giỏ hàng ----------
// Lưu trong trình duyệt dạng { "id|phân loại": { id, variant, qty } }.
// Bản cũ chỉ lưu { id: số lượng } nên đổi sang dạng mới cho khỏi mất giỏ.
const CART_KEY = 'cho-nugort-cart';
const cart = (() => {
  const raw = load(CART_KEY, {});
  const out = {};
  for (const [key, v] of Object.entries(raw)) {
    if (typeof v === 'number') out[`${key}|`] = { id: Number(key), variant: '', qty: v };
    else if (v && byId.has(v.id)) out[key] = v;
  }
  return out;
})();

export function cartCount() {
  return Object.values(cart).reduce((n, x) => n + x.qty, 0);
}

export function renderCart() {
  const items = Object.entries(cart).map(([key, x]) => ({ key, ...x, p: byId.get(x.id) })).filter((x) => x.p);
  const count = items.reduce((n, x) => n + x.qty, 0);
  const total = items.reduce((n, x) => n + x.qty * x.p.price, 0);

  const badge = $('cart-count');
  badge.textContent = count > 99 ? '99+' : count;
  badge.hidden = count === 0;

  $('cart-list').innerHTML = items.map(({ key, p, qty, variant }) => `
    <li class="cart__item">
      <a class="cart__thumb" href="product.html?id=${p.id}" style="background:${tint(p.id)}" aria-hidden="true" tabindex="-1">${p.icon}</a>
      <span>
        <a class="cart__name" href="product.html?id=${p.id}">${esc(p.name)}</a>
        <span class="cart__meta">${variant ? `${esc(variant)} · ` : ''}<b>${money(p.price)}</b> × ${qty}</span>
      </span>
      <button class="cart__remove" type="button" data-remove="${esc(key)}" aria-label="Bỏ ${esc(p.name)} khỏi giỏ">Xóa</button>
    </li>`).join('');
  $('cart-empty').hidden = count > 0;
  $('cart-foot').hidden = count === 0;
  $('cart-total').textContent = money(total);
}

export function addToCart(id, qty = 1, variant = '') {
  const key = `${id}|${variant}`;
  cart[key] = { id, variant, qty: (cart[key]?.qty || 0) + qty };
  save(CART_KEY, cart);
  renderCart();
  const badge = $('cart-count');
  badge.classList.remove('is-bump');
  void badge.offsetWidth; // ép trình duyệt tính lại để hiệu ứng chạy lại từ đầu
  badge.classList.add('is-bump');
}

export function toggleCart(open) {
  const panel = $('cart-panel');
  const show = open ?? panel.hidden;
  panel.hidden = !show;
  $('cart-btn').setAttribute('aria-expanded', String(show));
}

// ---------- Yêu thích ----------
const LIKE_KEY = 'cho-nugort-liked';
const liked = new Set(load(LIKE_KEY, []));
export const isLiked = (id) => liked.has(id);
export function toggleLike(id) {
  if (liked.has(id)) liked.delete(id);
  else liked.add(id);
  save(LIKE_KEY, [...liked]);
  return liked.has(id);
}

// ---------- Thẻ sản phẩm (trang chủ và phần "Có thể bạn cũng thích" ở trang chi tiết) ----------
export function cardHTML(p) {
  const off = discount(p);
  const url = `product.html?id=${p.id}`;
  return `
    <li>
      <article class="card">
        <a class="card__img" href="${url}" style="background:${tint(p.id)}" tabindex="-1" aria-hidden="true">${p.icon}</a>
        ${p.fav ? '<span class="tag">Yêu thích</span>' : ''}
        ${off ? `<span class="sale">${off}%<br>GIẢM</span>` : ''}
        <div class="card__body">
          <h3 class="card__name"><a href="${url}">${esc(p.name)}</a></h3>
          <p class="card__price"><b>${money(p.price)}</b>${p.old ? `<s>${money(p.old)}</s>` : ''}</p>
          <p class="card__row">
            <span class="card__rating"><svg aria-hidden="true"><use href="#i-star"></use></svg>${p.rating.toFixed(1).replace('.', ',')}</span>
            <span>Đã bán ${sold(p.sold)}</span>
          </p>
          <p class="card__row"><span>${esc(p.from)}</span></p>
          <div class="card__actions">
            <button class="btn btn--primary card__add" type="button" data-add="${p.id}">Thêm vào giỏ</button>
            <button class="like" type="button" data-like="${p.id}" aria-pressed="${isLiked(p.id)}" aria-label="Yêu thích ${esc(p.name)}">
              <svg aria-hidden="true"><use href="#i-heart"></use></svg>
            </button>
          </div>
        </div>
      </article>
    </li>`;
}

/** Nút "Thêm vào giỏ" trên thẻ thêm phân loại đầu tiên; muốn chọn loại khác thì vào trang chi tiết */
export function bindCardButtons() {
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-add], [data-like]');
    if (!t) return;
    const id = Number(t.dataset.add || t.dataset.like);
    if (t.dataset.add) {
      const p = byId.get(id);
      const variant = variantsOf(p)[0];
      addToCart(id, 1, variant);
      toast(`Đã thêm "${p.name}" (${variant}) vào giỏ`);
    } else {
      t.setAttribute('aria-pressed', String(toggleLike(id)));
    }
  });
}

// ---------- Đăng nhập / đăng ký (chỉ là giao diện, không gửi dữ liệu đi đâu) ----------
let authMode = 'login';
let lastFocus = null;

function setAuthMode(mode) {
  authMode = mode;
  const isLogin = mode === 'login';
  $('auth-title').textContent = isLogin ? 'Đăng nhập' : 'Đăng ký';
  $('auth-switch').textContent = isLogin ? 'Đăng ký' : 'Đăng nhập';
  $('auth-submit').textContent = isLogin ? 'Đăng nhập' : 'Đăng ký';
  $('auth-repeat').hidden = isLogin;
  $('auth-msg').textContent = '';
}

function openAuth(mode) {
  lastFocus = document.activeElement;
  setAuthMode(mode);
  $('auth-form').reset();
  $('auth').hidden = false;
  $('auth-form').elements.email.focus();
}

function closeAuth() {
  $('auth').hidden = true;
  lastFocus?.focus();
}

// ---------- Sự kiện của khung trang ----------
function bindShell() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#cart')) toggleCart(false); // bấm ra ngoài thì đóng giỏ hàng
    const t = e.target.closest('button, [data-close]');
    if (!t) return;
    if (t.dataset.remove) {
      delete cart[t.dataset.remove];
      save(CART_KEY, cart);
      renderCart();
    } else if (t.id === 'cart-btn') {
      toggleCart();
    } else if (t.id === 'checkout') {
      toast('Trang demo thôi, chưa thanh toán thật được đâu nha');
    } else if (t.dataset.auth) {
      openAuth(t.dataset.auth);
    } else if (t.id === 'auth-switch') {
      setAuthMode(authMode === 'login' ? 'register' : 'login');
    } else if ('close' in t.dataset) {
      closeAuth();
    }
  });

  $('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target.elements;
    const msg = $('auth-msg');
    if (!/^\S+@\S+\.\S+$/.test(f.email.value)) msg.textContent = 'Email chưa đúng định dạng.';
    else if (f.password.value.length < 6) msg.textContent = 'Mật khẩu cần ít nhất 6 ký tự.';
    else if (authMode === 'register' && f.repeat.value !== f.password.value) msg.textContent = 'Hai mật khẩu chưa khớp nhau.';
    else {
      closeAuth();
      toast('Trang demo thôi, chưa có tài khoản thật đâu nha');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('auth').hidden) closeAuth();
    else toggleCart(false);
  });
}
