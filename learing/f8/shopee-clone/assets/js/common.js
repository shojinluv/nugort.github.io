// common.js – Phần dùng chung cho mọi trang của Chợ Nugỏrt:
// thanh đầu trang (tìm kiếm có gợi ý, nút món đã thả tim, giỏ hàng), chân trang, hộp đăng nhập/đăng ký và thông báo nhỏ.
// Mỗi trang chỉ cần gọi mountShell() một lần, rồi dùng addToCart(), toast()… khi cần.
import { PRODUCTS, byId, money, sold, tint, discount, esc, plain, variantsOf, stockOf } from './data.js';

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
      <symbol id="i-filter" viewBox="0 0 24 24"><path d="M4 5h16l-6 7.5V19l-4-2v-4.5L4 5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
      <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5" fill="currentColor"/></symbol>
      <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v4l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
    </defs>
  </svg>`;

const HEADER = `
  <header class="header">
    <div class="wrap">
      <nav class="topbar" aria-label="Liên kết phụ">
        <ul>
          <li><a href="../../../index.html">← Về căn phòng nhỏ</a></li>
          <li class="hide-sm">Giao hàng bằng tên lửa, xa 3 năm ánh sáng cũng giao</li>
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
          <input id="search-input" name="q" type="search" placeholder="Tìm bàn phím, hạt cho mèo, vé lên Sao Hỏa…" autocomplete="off"
            role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="suggest-list">
          <button type="submit" aria-label="Tìm"><svg aria-hidden="true"><use href="#i-search"></use></svg></button>
          <div class="suggest" id="suggest" hidden>
            <div class="suggest__head" id="suggest-head" hidden>
              <span>Tìm gần đây</span>
              <button class="suggest__clear" type="button" data-suggest-clear>Xóa lịch sử</button>
            </div>
            <ul class="suggest__list" id="suggest-list" role="listbox" aria-label="Gợi ý tìm kiếm"></ul>
            <p class="suggest__none" id="suggest-none" hidden>Chưa có món nào khớp. Thử gõ ít chữ hơn, hoặc hỏi con mèo xem.</p>
          </div>
        </form>
        <div class="hdr-actions">
          <a class="hdr-like" id="like-link" href="./?fav=1">
            <svg aria-hidden="true"><use href="#i-heart"></use></svg>
            <span class="sr-only">Món đã thả tim</span>
            <span class="hdr-like__count" id="like-count" hidden>0</span>
          </a>
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
                <a class="btn btn--primary" id="checkout" href="checkout.html">Thanh toán</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>`;

// ---------- Chân trang ----------
// Chợ chỉ là trang bài tập nên các mục ở chân trang không dẫn đi đâu cả: bấm vào thì hiện một câu đùa (data-tip).
const tipLink = (text, joke) => `<li><button class="footer__link" type="button" data-tip="${esc(joke)}">${text}</button></li>`;
const tipChip = (icon, text, joke) => `
  <li><button class="footer__chip" type="button" data-tip="${esc(joke)}"><span aria-hidden="true">${icon}</span>${text}</button></li>`;

// Mã QR giả để trang trí (quét không ra gì): ba ô vuông định vị ở góc, còn lại rải ngẫu nhiên, chừa chỗ giữa cho mèo ngồi
function fakeQR() {
  const N = 21;
  let seed = 2022;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const finder = (x, y, cx, cy) => {
    const dx = x - cx;
    const dy = y - cy;
    if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
    const edge = dx === 0 || dy === 0 || dx === 6 || dy === 6;
    const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
    return edge || core;
  };
  let cells = '';
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const f = finder(x, y, 0, 0) ?? finder(x, y, N - 7, 0) ?? finder(x, y, 0, N - 7);
      const nearFinder = (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
      const middle = Math.abs(x - 10) <= 3 && Math.abs(y - 10) <= 3;
      const dark = f ?? (!nearFinder && !middle && rnd() < 0.5);
      if (dark) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  return `<svg viewBox="-1 -1 ${N + 2} ${N + 2}" shape-rendering="crispEdges" aria-hidden="true"><rect x="-1" y="-1" width="${N + 2}" height="${N + 2}" fill="#fff"/><g fill="#2b2420">${cells}</g></svg>`;
}

const FOOTER = `
  <footer class="footer">
    <div class="wrap footer__cols">
      <section class="footer__help">
        <h3>Chăm sóc khách hàng</h3>
        <ul class="footer__links">
          ${tipLink('Trung tâm trợ giúp', 'Trung tâm trợ giúp đang do mèo trực. Gọi to “meo ơi” là được.')}
          ${tipLink('Hướng dẫn mua hàng', 'Bước 1: bấm Thêm vào giỏ. Bước 2: ngắm giỏ hàng. Bước 3: không có bước 3, trang demo mà 😹')}
          ${tipLink('Đổi trả trong 7 ngày Trái Đất', '7 ngày Trái Đất thôi nhé, đừng tính theo ngày trên Sao Kim (một ngày ở đó dài 243 ngày).')}
          ${tipLink('Bảo hành 9 kiếp', 'Món nào cũng bảo hành 9 kiếp, y như mèo.')}
          ${tipLink('Liên hệ Chợ Nugỏrt', 'Gõ cửa khoang tàu SHOJINLUV-01. Nhớ đừng soi qua ô kính, mèo giận đó.')}
        </ul>
      </section>
      <section class="footer__about">
        <h3>Về Chợ Nugỏrt</h3>
        <ul class="footer__links">
          ${tipLink('Giới thiệu', 'Một góc chợ nhỏ trong căn phòng nhỏ, bán toàn đồ lặt vặt trong phòng.')}
          ${tipLink('Tuyển dụng (cần người dọn lông mèo)', 'Mèo nhà mình là Sphynx, không có lông… nên việc này nhàn lắm 😼')}
          ${tipLink('Điều khoản', 'Điều 1: Mèo luôn đúng. Điều 2: Nếu mèo sai, xem lại điều 1.')}
          ${tipLink('Chính sách bảo mật', 'Chợ không thu thập gì cả. Giỏ hàng chỉ nằm trong trình duyệt của bạn thôi.')}
          ${tipLink('Kênh người bán', 'Muốn bán gì ở đây thì hỏi mèo trước đã.')}
        </ul>
      </section>
      <section class="footer__pay">
        <h3>Thanh toán</h3>
        <ul class="footer__chips">
          ${tipChip('💵', 'Tiền mặt', 'Nhận cả tiền lẻ, miễn là tiền thật.')}
          ${tipChip('🏦', 'Chuyển khoản', 'Trang demo nên chưa có số tài khoản đâu, giữ tiền lại mua trà sữa nha.')}
          ${tipChip('🐟', 'Cá khô', 'Tỷ giá hôm nay: 1 con cá khô đổi được 1 lần mèo cho xoa đầu.')}
          ${tipChip('🥫', 'Pate mèo', 'Đồng tiền mạnh nhất trong căn phòng nhỏ.')}
          ${tipChip('☀️', 'Năng lượng mặt trời', 'Tàu có pin mặt trời, trả bằng nắng cũng được. Nhưng trong bóng Trái Đất thì nợ nha.')}
          ${tipChip('🐾', 'Một cái vuốt mèo', 'Thanh toán xong là có vết.')}
        </ul>
        <h3 class="footer__sub">Đơn vị vận chuyển</h3>
        <ul class="footer__chips">
          ${tipChip('🛵', 'Xe máy', 'Xe máy chỉ giao quanh hòn đảo, tức là trong vòng chục mét.')}
          ${tipChip('🚀', 'Tên lửa SHOJINLUV-01', 'Xa 3 năm ánh sáng vẫn giao, chỉ hơi lâu. Muốn nhanh hơn thì thêm phí cá khô.')}
          ${tipChip('🐋', 'Cá voi bay', 'Mẹ con cá voi bơi ngang biển mây chừng một hai phút một lần, ra mép đảo đứng đợi nhé.')}
          ${tipChip('🐬', 'Đàn cá heo', 'Giao siêu tốc, chỉ có điều hàng tới nơi hơi ướt mây.')}
          ${tipChip('🐈', 'Mèo ngậm tha tới', 'Mèo tha tận tay, nhưng hay đánh rơi giữa đường để đuổi bướm.')}
        </ul>
      </section>
      <section class="footer__app">
        <h3>Tải ứng dụng Chợ Nugỏrt</h3>
        <div class="footer__app-row">
          <button class="footer__qr" type="button" data-tip="App chưa ra đâu, mèo vẫn đang viết code 😹" aria-label="Mã QR tải ứng dụng (chỉ để trang trí)">
            ${fakeQR()}<span aria-hidden="true">🐱</span>
          </button>
          <ul class="footer__stores">
            ${tipChip('🔴', 'Sao Hỏa Store', 'Sắp lên kệ… khi nào mèo ngủ dậy.')}
            ${tipChip('🌙', 'Mặt Trăng Play', 'Sắp lên kệ… khi nào mèo ngủ dậy.')}
            ${tipChip('🛸', 'UFO Apps', 'Người ngoài hành tinh đặt trước 3 bản rồi đó.')}
          </ul>
        </div>
      </section>
    </div>

    <div class="wrap footer__bottom">
      <p>© ${new Date().getFullYear()} Chợ Nugỏrt. Một góc chợ trong căn phòng nhỏ của Shojinluv.</p>
      <p class="footer__regions">Quốc gia &amp; khu vực:
        <span>Việt Nam</span> <span>Sao Hỏa</span> <span>Mặt Trăng</span> <span>Tàu SHOJINLUV-01</span> <span>Chiều không gian khác</span>
      </p>
    </div>

    <div class="footer__legal">
      <ul class="footer__policies">
        ${tipLink('Chính sách bảo mật', 'Chợ không thu thập gì cả. Giỏ hàng chỉ nằm trong trình duyệt của bạn thôi.')}
        ${tipLink('Quy chế hoạt động', 'Mở cửa 24/7, trừ lúc mèo ngủ (tức là gần như cả ngày).')}
        ${tipLink('Chính sách vận chuyển', 'Giao tới mọi nơi trong hệ Mặt Trời. Sao Diêm Vương thì tính phí hành tinh lùn.')}
        ${tipLink('Chính sách trả hàng và hoàn tiền', 'Hoàn tiền bằng cá khô, mèo duyệt trong 3 đến 5 giấc ngủ.')}
      </ul>
      <p class="footer__company">
        Chợ Nugỏrt · Địa chỉ: ghế lười cạnh cửa sổ, căn phòng nhỏ trên hòn đảo bay, chiều không gian khác ·
        Chịu trách nhiệm nội dung: mèo Sphynx (đang ngủ)
      </p>
      <p class="footer__note">Đây là trang bài tập giao diện của Shojinluv. Sản phẩm, giá cả, đánh giá và đơn hàng đều là bịa, không mua bán thật.</p>
    </div>
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
  bindSearch();
  renderCart();
  renderLikes();
}

// ---------- Thông báo nhỏ ----------
let toastTimer;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function toast(text) {
  const el = $('toast');
  const wasShown = el.classList.contains('is-show');
  el.textContent = text;
  el.classList.add('is-show');
  // Đang hiện mà đổi câu: khẽ nhún một cái, chữ mới hiện dần, thay vì nhảy chữ cái rụp
  if (wasShown && !reduceMotion) {
    el.animate([
      { opacity: 0.35, transform: 'translate(-50%, 4px) scale(0.97)' },
      { opacity: 1, transform: 'translate(-50%, 0) scale(1)' },
    ], { duration: 320, easing: 'cubic-bezier(.25, .8, .25, 1)' });
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-show'), Math.max(2400, text.length * 55)); // câu dài thì hiện lâu hơn cho kịp đọc
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

/** Các món trong giỏ: { key, id, variant, qty, p } với p là sản phẩm trong data.js */
export function cartItems() {
  return Object.entries(cart).map(([key, x]) => ({ key, ...x, p: byId.get(x.id) })).filter((x) => x.p);
}

export function removeFromCart(keys) {
  keys.forEach((k) => delete cart[k]);
  save(CART_KEY, cart);
  renderCart();
}

// Giỏ vẽ lại xong thì báo cho trang đang mở (trang thanh toán nghe sự kiện này để cập nhật theo)
export function renderCart() {
  const items = cartItems();
  const count = items.reduce((n, x) => n + x.qty, 0);
  const total = items.reduce((n, x) => n + x.qty * x.p.price, 0);

  const badge = $('cart-count');
  badge.textContent = count > 99 ? '99+' : count;
  badge.hidden = count === 0;

  // Mỗi món: tên, phân loại và đơn giá; bên dưới là ô chỉnh số lượng (− số +), thành tiền và nút Xóa
  $('cart-list').innerHTML = items.map(({ key, p, qty, variant }) => {
    const max = stockOf(p);
    const k = esc(key);
    return `
    <li class="cart__item">
      <a class="cart__thumb" href="product.html?id=${p.id}" style="background:${tint(p.id)}" aria-hidden="true" tabindex="-1">${p.icon}</a>
      <div class="cart__info">
        <a class="cart__name" href="product.html?id=${p.id}">${esc(p.name)}</a>
        <span class="cart__meta">${variant ? `${esc(variant)} · ` : ''}<b>${money(p.price)}</b></span>
        <div class="cart__controls">
          <div class="qty qty--sm" role="group" aria-label="Số lượng ${esc(p.name)}">
            <button type="button" data-cart-step="-1" data-key="${k}" aria-label="Bớt một" ${qty <= 1 ? 'disabled' : ''}>−</button>
            <input type="number" inputmode="numeric" min="1" max="${max}" value="${qty}" data-cart-qty="${k}" aria-label="Số lượng">
            <button type="button" data-cart-step="1" data-key="${k}" aria-label="Thêm một" ${qty >= max ? 'disabled' : ''}>+</button>
          </div>
          <b class="cart__line">${money(p.price * qty)}</b>
          <button class="cart__remove" type="button" data-remove="${k}" aria-label="Bỏ ${esc(p.name)} khỏi giỏ">Xóa</button>
        </div>
      </div>
    </li>`;
  }).join('');
  $('cart-empty').hidden = count > 0;
  $('cart-foot').hidden = count === 0;
  $('cart-total').textContent = money(total);
  document.dispatchEvent(new CustomEvent('cart-change'));
}

function bumpBadge(badge = $('cart-count')) {
  badge.classList.remove('is-bump');
  void badge.offsetWidth; // ép trình duyệt tính lại để hiệu ứng chạy lại từ đầu
  badge.classList.add('is-bump');
}

export function addToCart(id, qty = 1, variant = '') {
  const key = `${id}|${variant}`;
  const max = stockOf(byId.get(id));
  cart[key] = { id, variant, qty: Math.min(max, (cart[key]?.qty || 0) + qty) }; // không thêm quá số hàng còn trong kho
  save(CART_KEY, cart);
  renderCart();
  bumpBadge();
}

// Chỉnh số lượng một món ngay trong giỏ: từ 1 tới số hàng còn trong kho (muốn bỏ hẳn thì bấm Xóa)
function setCartQty(key, value, focusStep) {
  const item = cart[key];
  if (!item) return;
  const max = stockOf(byId.get(item.id));
  const qty = Math.min(max, Math.max(1, Math.round(Number(value) || 1)));
  const changed = qty !== item.qty;
  item.qty = qty;
  save(CART_KEY, cart);
  renderCart();
  if (changed) bumpBadge();
  // Giỏ được vẽ lại, nên đặt con trỏ bàn phím về đúng nút vừa bấm (nếu nút đó còn bấm được).
  // Trang thanh toán cũng có ô số lượng y hệt, nên chọn nút đang hiện trên màn hình (giỏ trên đầu trang có thể đang đóng)
  if (focusStep) {
    const again = [...document.querySelectorAll('[data-cart-step]')]
      .find((b) => b.dataset.key === key && b.dataset.cartStep === focusStep && b.offsetParent !== null);
    if (again && !again.disabled) again.focus();
  }
}

export function toggleCart(open) {
  const panel = $('cart-panel');
  const show = open ?? panel.hidden;
  panel.hidden = !show;
  $('cart-btn').setAttribute('aria-expanded', String(show));
}

// ---------- Yêu thích ----------
// Nút trái tim trên đầu trang dẫn tới ./?fav=1: trang chủ chỉ hiện các món đã thả tim
const LIKE_KEY = 'cho-nugort-liked';
const liked = new Set([].concat(load(LIKE_KEY, [])).filter((id) => byId.has(id)));
export const isLiked = (id) => liked.has(id);
export const likedCount = () => liked.size;

function renderLikes() {
  const badge = $('like-count');
  badge.textContent = liked.size > 99 ? '99+' : liked.size;
  badge.hidden = liked.size === 0;
}

export function toggleLike(id) {
  if (liked.has(id)) liked.delete(id);
  else liked.add(id);
  save(LIKE_KEY, [...liked]);
  const on = liked.has(id);
  // Một món có thể hiện ở vài chỗ cùng lúc (thẻ gợi ý, món vừa xem…): tim nào của món đó cũng đổi theo
  document.querySelectorAll(`[data-like="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', String(on)));
  renderLikes();
  if (on) bumpBadge($('like-count'));
  document.dispatchEvent(new CustomEvent('likes-change', { detail: { id, on } }));
  return on;
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
      removeFromCart([t.dataset.remove]);
    } else if (t.dataset.cartStep) {
      setCartQty(t.dataset.key, cart[t.dataset.key].qty + Number(t.dataset.cartStep), t.dataset.cartStep);
    } else if (t.id === 'cart-btn') {
      toggleCart();
    } else if (t.dataset.tip) {
      toast(t.dataset.tip); // các mục ở chân trang
    } else if (t.dataset.auth) {
      openAuth(t.dataset.auth);
    } else if (t.id === 'auth-switch') {
      setAuthMode(authMode === 'login' ? 'register' : 'login');
    } else if ('close' in t.dataset) {
      closeAuth();
    }
  });

  // Gõ số lượng thẳng vào ô trong giỏ (Enter hoặc bấm ra ngoài thì áp dụng)
  document.addEventListener('change', (e) => {
    const input = e.target.closest('[data-cart-qty]');
    if (input) setCartQty(input.dataset.cartQty, input.value);
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

// ---------- Gợi ý khi gõ tìm kiếm ----------
// Ô trống: hiện vài từ vừa tìm gần đây. Đang gõ: dòng đầu là "Tìm …", bên dưới là các món khớp tên (có tô đậm chỗ khớp).
// Dùng phím mũi tên lên xuống để chọn, Enter để mở, Esc để đóng. Từ khóa đã tìm chỉ lưu trong trình duyệt này.
const SEARCH_KEY = 'cho-nugort-searches';
let recent = [].concat(load(SEARCH_KEY, [])).filter((s) => typeof s === 'string' && s.trim()).slice(0, 6);
let options = []; // mỗi dòng gợi ý: { type: 'search' | 'product' | 'recent', value }
let activeOpt = -1;

function remember(q) {
  const text = q.trim();
  if (!text) return;
  recent = [text, ...recent.filter((r) => plain(r) !== plain(text))].slice(0, 6);
  save(SEARCH_KEY, recent);
}

// Tô đậm phần khớp trong tên món. plain() bỏ dấu từng chữ một nên vị trí chữ trước và sau khi bỏ dấu vẫn trùng nhau
function highlight(name, q) {
  const pn = plain(name);
  const pq = plain(q);
  const i = pn.indexOf(pq);
  if (!pq || i < 0 || pn.length !== name.length) return esc(name);
  const j = i + pq.length;
  return `${esc(name.slice(0, i))}<mark>${esc(name.slice(i, j))}</mark>${esc(name.slice(j))}`;
}

function renderSuggest() {
  const q = $('search-input').value.trim();
  options = [];
  let hits = [];
  if (!q) {
    recent.forEach((r) => options.push({ type: 'recent', value: r }));
  } else {
    const pq = plain(q);
    hits = PRODUCTS.filter((p) => plain(p.name).includes(pq)).sort((a, b) => b.sold - a.sold).slice(0, 6);
    options.push({ type: 'search', value: q });
    hits.forEach((p) => options.push({ type: 'product', value: p.id }));
  }
  $('suggest-list').innerHTML = options.map((o, i) => {
    const attrs = `id="sg-${i}" class="suggest__opt" role="option" data-i="${i}" aria-selected="${i === activeOpt}"`;
    if (o.type === 'recent') {
      return `<li ${attrs}><svg class="suggest__ico" aria-hidden="true"><use href="#i-clock"></use></svg><span class="suggest__text">${esc(o.value)}</span></li>`;
    }
    if (o.type === 'search') {
      return `<li ${attrs}><svg class="suggest__ico" aria-hidden="true"><use href="#i-search"></use></svg><span class="suggest__text">Tìm “<b>${esc(o.value)}</b>”</span></li>`;
    }
    const p = byId.get(o.value);
    return `<li ${attrs}>
      <span class="suggest__thumb" style="background:${tint(p.id)}" aria-hidden="true">${p.icon}</span>
      <span class="suggest__text">${highlight(p.name, q)}</span>
      <b class="suggest__price">${money(p.price)}</b>
    </li>`;
  }).join('');
  $('suggest-head').hidden = Boolean(q) || !recent.length;
  $('suggest-none').hidden = !q || hits.length > 0;
}

function openSuggest() {
  renderSuggest();
  const show = options.length > 0;
  $('suggest').hidden = !show;
  $('search-input').setAttribute('aria-expanded', String(show));
}

function closeSuggest() {
  $('suggest').hidden = true;
  activeOpt = -1;
  $('search-input').setAttribute('aria-expanded', 'false');
  $('search-input').removeAttribute('aria-activedescendant');
}

function paintActive() {
  document.querySelectorAll('.suggest__opt').forEach((li) => li.setAttribute('aria-selected', String(Number(li.dataset.i) === activeOpt)));
  const el = $(`sg-${activeOpt}`);
  if (el) {
    $('search-input').setAttribute('aria-activedescendant', el.id);
    el.scrollIntoView({ block: 'nearest' });
  } else {
    $('search-input').removeAttribute('aria-activedescendant');
  }
}

function pick(opt) {
  const input = $('search-input');
  if (opt.type === 'product') {
    remember(input.value);
    closeSuggest();
    location.href = `product.html?id=${opt.value}`;
    return;
  }
  // Tìm theo chữ: điền vào ô rồi gửi form. Trang chủ lọc ngay tại chỗ, trang khác thì chuyển về trang chủ với ?q=
  input.value = opt.value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  $('search').requestSubmit();
}

function bindSearch() {
  const form = $('search');
  const input = $('search-input');
  const box = $('suggest');

  input.addEventListener('focus', openSuggest);
  input.addEventListener('click', () => { if (box.hidden) openSuggest(); });
  input.addEventListener('input', () => {
    activeOpt = -1;
    openSuggest();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (box.hidden) openSuggest();
      if (!options.length) return;
      e.preventDefault();
      const n = options.length;
      if (e.key === 'ArrowDown') activeOpt = (activeOpt + 1) % n;
      else activeOpt = activeOpt <= 0 ? n - 1 : activeOpt - 1;
      paintActive();
    } else if (e.key === 'Enter' && !box.hidden && activeOpt >= 0) {
      e.preventDefault();
      pick(options[activeOpt]);
    } else if (e.key === 'Escape' && !box.hidden) {
      e.preventDefault(); // lần Esc đầu chỉ đóng hộp gợi ý, chưa xóa chữ trong ô
      closeSuggest();
    }
  });

  // Bấm vào gợi ý thì ô tìm kiếm vẫn giữ con trỏ (không bị mất focus rồi đóng hộp gợi ý trước khi kịp chọn)
  box.addEventListener('pointerdown', (e) => e.preventDefault());
  box.addEventListener('click', (e) => {
    if (e.target.closest('[data-suggest-clear]')) {
      recent = [];
      save(SEARCH_KEY, recent);
      openSuggest();
      return;
    }
    const li = e.target.closest('[data-i]');
    if (li) pick(options[Number(li.dataset.i)]);
  });
  form.addEventListener('focusout', (e) => { if (!form.contains(e.relatedTarget)) closeSuggest(); });
  form.addEventListener('submit', () => {
    remember(input.value);
    closeSuggest();
  });
}
