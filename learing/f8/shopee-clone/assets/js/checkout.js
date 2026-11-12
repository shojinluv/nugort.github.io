// checkout.js – Trang thanh toán của Chợ Nugỏrt: địa chỉ nhận, các món trong giỏ (tick món nào thì trả món đó),
// đơn vị vận chuyển, cách trả tiền, mã giảm giá và tổng tiền. Bấm Đặt hàng thì hiện màn "đơn hàng đang bay".
// Không có máy chủ nào phía sau: đơn hàng là bịa, thông tin nhập vào không gửi đi đâu và cũng không lưu lại.
// ?only=<mã món> (từ nút Mua ngay) thì chỉ tick sẵn món đó, các món khác trong giỏ vẫn hiện để tick thêm.
import { money, tint, esc, stockOf } from './data.js';
import { $, mountShell, cartItems, removeFromCart, toast } from './common.js';

mountShell();

const root = $('co');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PLACES = [
  { id: 'earth', name: 'Trái Đất', icon: '🏠' },
  { id: 'moon', name: 'Mặt Trăng', icon: '🌙' },
  { id: 'mars', name: 'Sao Hỏa', icon: '🔴' },
  { id: 'ship', name: 'Tàu SHOJINLUV-01', icon: '🛸' },
];
const SHIPPERS = [
  { id: 'bike', icon: '🛵', name: 'Xe máy', fee: 0, eta: 'Trong ngày', note: 'Chỉ chạy quanh hòn đảo' },
  { id: 'rocket', icon: '🚀', name: 'Tên lửa SHOJINLUV-01', fee: 25000, eta: '1–2 ngày', note: 'Xa 3 năm ánh sáng cũng giao' },
  { id: 'whale', icon: '🐋', name: 'Cá voi bay', fee: 15000, eta: '3–5 ngày', note: 'Ra mép đảo đứng đợi mẹ con cá voi bơi ngang' },
  { id: 'dolphin', icon: '🐬', name: 'Đàn cá heo', fee: 30000, eta: 'Vài tiếng', note: 'Siêu tốc, hàng tới nơi hơi ướt mây' },
  { id: 'cat', icon: '🐈', name: 'Mèo ngậm tha tới', fee: 5000, eta: 'Tùy hứng', note: 'Hay đánh rơi giữa đường để đuổi bướm' },
];
const PAYMENTS = [
  { id: 'cash', icon: '💵', name: 'Tiền mặt khi nhận' },
  { id: 'fish', icon: '🐟', name: 'Cá khô' },
  { id: 'pate', icon: '🥫', name: 'Pate mèo' },
  { id: 'sun', icon: '☀️', name: 'Năng lượng mặt trời' },
  { id: 'paw', icon: '🐾', name: 'Một cái vuốt mèo' },
];
const VOUCHERS = [
  { code: 'MEOMEO', title: 'Giảm 10%', note: 'Tối đa 50.000₫', calc: (sub) => Math.min(50000, Math.round(sub * 0.1)) },
  { code: 'CAKHO', title: 'Giảm 20.000₫', note: 'Cho đơn từ 100.000₫', min: 100000, calc: () => 20000 },
  { code: 'FREESHIP', title: 'Miễn phí vận chuyển', note: 'Đi tên lửa hay cá voi đều được', freeShip: true },
];
const byIdOf = (list, id) => list.find((x) => x.id === id);

// ---------- Trạng thái ----------
const only = new URLSearchParams(location.search).get('only');
const selected = new Set(); // các món được tick để trả tiền
const known = new Set(); // các món đã từng thấy (món mới xuất hiện thì tick sẵn)
let ship = 'rocket';
let pay = 'cash';
let voucher = null;
let placed = false;

function syncSelection() {
  const items = cartItems();
  const firstTime = known.size === 0;
  const onlyOk = firstTime && only && items.some((x) => x.key === only);
  items.forEach(({ key }) => {
    if (known.has(key)) return;
    known.add(key);
    if (!onlyOk || key === only) selected.add(key);
  });
  [...selected].forEach((k) => { if (!items.some((x) => x.key === k)) selected.delete(k); });
  return items;
}

function totals(items = cartItems()) {
  const chosen = items.filter((x) => selected.has(x.key));
  const count = chosen.reduce((n, x) => n + x.qty, 0);
  const sub = chosen.reduce((n, x) => n + x.qty * x.p.price, 0);
  const fee = count ? byIdOf(SHIPPERS, ship).fee : 0;
  let off = 0;
  let shipOff = 0;
  let warn = '';
  if (voucher && count) {
    if (voucher.min && sub < voucher.min) warn = `Mã ${voucher.code} cần đơn từ ${money(voucher.min)}, thêm món nữa là dùng được`;
    else if (voucher.freeShip) shipOff = fee;
    else off = Math.min(sub, voucher.calc(sub));
  }
  return { chosen, count, sub, fee, shipOff, off, total: sub + fee - shipOff - off, warn };
}

// ---------- Khung trang ----------
const radio = (name, value, checked) => `<input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''}>`;

function renderPage() {
  root.innerHTML = `
    <nav class="crumbs" aria-label="Đường dẫn">
      <a href="./">Chợ Nugỏrt</a><span aria-hidden="true">›</span><span aria-current="page">Thanh toán</span>
    </nav>
    <h1 class="co__title">Thanh toán</h1>

    <div class="co__grid">
      <div class="co__main">
        <section class="co-box co-box--addr" aria-labelledby="addr-title">
          <div class="co-box__head">
            <h2 class="co-box__title" id="addr-title"><svg aria-hidden="true"><use href="#i-pin"></use></svg> Địa chỉ nhận hàng</h2>
            <button class="co-link" type="button" id="addr-demo">Điền thử</button>
          </div>
          <p class="co-box__note">Chỉ để cho có thôi: không gửi đi đâu, cũng không lưu lại.</p>
          <form class="addr" id="addr" novalidate>
            <div class="field">
              <label for="f-name">Họ tên người nhận</label>
              <input id="f-name" name="name" autocomplete="off" placeholder="Mèo Sphynx" aria-describedby="err-name">
              <small class="field__error" id="err-name"></small>
            </div>
            <div class="field">
              <label for="f-phone">Số điện thoại</label>
              <input id="f-phone" name="phone" inputmode="tel" autocomplete="off" placeholder="0912 345 678" aria-describedby="err-phone">
              <small class="field__error" id="err-phone"></small>
            </div>
            <div class="field field--wide">
              <label for="f-street">Địa chỉ</label>
              <input id="f-street" name="street" autocomplete="off" placeholder="Ghế lười cạnh cửa sổ, căn phòng nhỏ" aria-describedby="err-street">
              <small class="field__error" id="err-street"></small>
            </div>
            <fieldset class="field field--wide places">
              <legend>Nơi nhận</legend>
              <div class="places__list">
                ${PLACES.map((p, i) => `<label class="place">${radio('place', p.id, i === 0)}<span>${p.icon} ${p.name}</span></label>`).join('')}
              </div>
            </fieldset>
          </form>
        </section>

        <section class="co-box" aria-labelledby="items-title">
          <div class="co-box__head">
            <h2 class="co-box__title" id="items-title">Sản phẩm</h2>
            <label class="co-all"><input type="checkbox" class="check" id="check-all"> Chọn tất cả</label>
          </div>
          <ul class="co-items" id="co-items"></ul>
          <p class="co-empty" id="co-empty" hidden>Giỏ trống trơn rồi. <a href="./">Ghé chợ chọn thêm vài món</a> nha.</p>
        </section>

        <section class="co-box" aria-labelledby="ship-title">
          <h2 class="co-box__title" id="ship-title">Đơn vị vận chuyển</h2>
          <div class="opts" role="radiogroup" aria-labelledby="ship-title">
            ${SHIPPERS.map((s) => `
              <label class="opt" data-ship-opt="${s.id}">
                ${radio('ship', s.id, s.id === ship)}
                <span class="opt__icon" aria-hidden="true">${s.icon}</span>
                <span class="opt__body"><b>${s.name}</b><small class="opt__note">${s.note}</small></span>
                <span class="opt__side"><b>${s.fee ? money(s.fee) : 'Miễn phí'}</b><small>${s.eta}</small></span>
              </label>`).join('')}
          </div>
        </section>

        <section class="co-box" aria-labelledby="pay-title">
          <h2 class="co-box__title" id="pay-title">Phương thức thanh toán</h2>
          <div class="opts opts--pay" role="radiogroup" aria-labelledby="pay-title">
            ${PAYMENTS.map((m) => `
              <label class="opt opt--pay">
                ${radio('pay', m.id, m.id === pay)}
                <span class="opt__icon" aria-hidden="true">${m.icon}</span>
                <span class="opt__body"><b>${m.name}</b></span>
              </label>`).join('')}
          </div>
        </section>
      </div>

      <aside class="co-sum" aria-labelledby="sum-title">
        <section class="co-box">
          <h2 class="co-box__title" id="sum-title">Đơn hàng</h2>
          <form class="voucher" id="voucher-form" novalidate>
            <label class="sr-only" for="voucher-input">Mã giảm giá</label>
            <input id="voucher-input" placeholder="Nhập mã giảm giá" autocomplete="off" aria-describedby="voucher-msg">
            <button class="btn" type="submit">Áp dụng</button>
          </form>
          <p class="voucher__msg" id="voucher-msg" role="status"></p>
          <ul class="vouchers" id="vouchers" aria-label="Mã giảm giá có sẵn"></ul>
          <dl class="co-sum__rows" id="sum-rows"></dl>
          <button class="btn btn--primary btn--lg co-sum__order" type="button" data-place>Đặt hàng</button>
          <p class="co-sum__terms">Bấm Đặt hàng là đồng ý với điều khoản của chợ: mèo luôn đúng.</p>
        </section>
      </aside>
    </div>

    <div class="co-bar">
      <p class="co-bar__total"><span>Tổng thanh toán</span><b id="bar-total"></b></p>
      <button class="btn btn--primary" type="button" data-place>Đặt hàng</button>
    </div>`;
}

// ---------- Các món ----------
function renderItems() {
  const items = syncSelection();
  $('co-items').innerHTML = items.map(({ key, p, qty, variant }) => {
    const k = esc(key);
    const max = stockOf(p);
    return `
      <li class="co-item">
        <input type="checkbox" class="check" data-pick="${k}" ${selected.has(key) ? 'checked' : ''} aria-label="Chọn ${esc(p.name)}">
        <a class="co-item__thumb" href="product.html?id=${p.id}" style="background:${tint(p.id)}" tabindex="-1" aria-hidden="true">${p.icon}</a>
        <div class="co-item__info">
          <a class="co-item__name" href="product.html?id=${p.id}">${esc(p.name)}</a>
          <span class="co-item__meta">${variant ? `${esc(variant)} · ` : ''}${money(p.price)}</span>
          <div class="co-item__controls">
            <div class="qty qty--sm" role="group" aria-label="Số lượng ${esc(p.name)}">
              <button type="button" data-cart-step="-1" data-key="${k}" aria-label="Bớt một" ${qty <= 1 ? 'disabled' : ''}>−</button>
              <input type="number" inputmode="numeric" min="1" max="${max}" value="${qty}" data-cart-qty="${k}" aria-label="Số lượng">
              <button type="button" data-cart-step="1" data-key="${k}" aria-label="Thêm một" ${qty >= max ? 'disabled' : ''}>+</button>
            </div>
            <b class="co-item__line">${money(p.price * qty)}</b>
            <button class="cart__remove" type="button" data-remove="${k}" aria-label="Bỏ ${esc(p.name)} khỏi giỏ">Xóa</button>
          </div>
        </div>
      </li>`;
  }).join('');
  $('co-empty').hidden = items.length > 0;
  renderTotals(items);
}

function renderTotals(items = cartItems()) {
  const all = $('check-all');
  all.disabled = items.length === 0;
  all.checked = items.length > 0 && items.every((x) => selected.has(x.key));
  all.indeterminate = !all.checked && items.some((x) => selected.has(x.key));

  const t = totals(items);
  $('sum-rows').innerHTML = `
    <div><dt>Tạm tính (${t.count} món)</dt><dd>${money(t.sub)}</dd></div>
    <div><dt>Phí vận chuyển</dt><dd>${money(t.fee)}</dd></div>
    ${t.shipOff ? `<div class="is-off"><dt>Mã ${voucher.code}</dt><dd>−${money(t.shipOff)}</dd></div>` : ''}
    ${t.off ? `<div class="is-off"><dt>Mã ${voucher.code}</dt><dd>−${money(t.off)}</dd></div>` : ''}
    <div class="co-sum__total"><dt>Tổng thanh toán</dt><dd>${money(t.total)}</dd></div>`;
  $('bar-total').textContent = money(t.total);
  if (t.warn) setVoucherMsg(t.warn, true);
  else if ($('voucher-msg').classList.contains('is-warn')) setVoucherMsg(voucher ? `Đang dùng mã ${voucher.code}` : '');
}

// ---------- Mã giảm giá ----------
function setVoucherMsg(text, warn = false) {
  $('voucher-msg').textContent = text;
  $('voucher-msg').classList.toggle('is-warn', warn);
}

function renderVouchers() {
  $('vouchers').innerHTML = VOUCHERS.map((v) => `
    <li><button type="button" class="ticket" data-voucher="${v.code}" aria-pressed="${voucher === v}">
      <b>${v.code}</b><span>${v.title}</span><small>${v.note}</small>
    </button></li>`).join('');
}

function applyVoucher(v) {
  voucher = v;
  $('voucher-input').value = v ? v.code : '';
  renderVouchers();
  setVoucherMsg(v ? `Đã dùng mã ${v.code}: ${v.title.toLowerCase()}` : 'Đã bỏ mã giảm giá');
  renderTotals();
}

// ---------- Địa chỉ ----------
const RULES = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Cho mèo biết tên người nhận với'),
  phone: (v) => (/^0\d{9}$/.test(v.replace(/[\s.-]/g, '')) ? '' : 'Số điện thoại gồm 10 chữ số, bắt đầu bằng số 0'),
  street: (v) => (v.trim().length >= 5 ? '' : 'Địa chỉ ngắn quá, mèo tìm không ra'),
};

function checkField(input) {
  const err = RULES[input.name](input.value);
  input.setAttribute('aria-invalid', String(Boolean(err)));
  $(`err-${input.name}`).textContent = err;
  return !err;
}

/** Kiểm tra cả ba ô (ô nào sai cũng hiện lời nhắc, không dừng ở ô sai đầu tiên), trả về ô sai đầu tiên nếu có */
function validateAll() {
  const form = $('addr');
  const inputs = Object.keys(RULES).map((name) => form.elements[name]);
  const bad = inputs.filter((input) => !checkField(input));
  return bad[0] ?? null;
}

// Đi nơi khác Trái Đất thì xe máy chịu thua
function updatePlace() {
  const ground = $('addr').elements.place.value === 'earth';
  const bike = root.querySelector('input[name="ship"][value="bike"]');
  bike.disabled = !ground;
  root.querySelector('[data-ship-opt="bike"] .opt__note').textContent = ground ? SHIPPERS[0].note : 'Xe máy không bay lên trời được đâu';
  if (!ground && ship === 'bike') {
    ship = 'rocket';
    root.querySelector('input[name="ship"][value="rocket"]').checked = true;
    toast('Xe máy không bay được, mèo đổi sang tên lửa cho bạn rồi nha');
  }
  renderTotals();
}

// ---------- Đặt hàng ----------
function placeOrder() {
  const t = totals();
  if (!t.count) {
    toast(cartItems().length ? 'Tick chọn ít nhất một món để thanh toán nha' : 'Giỏ đang trống, đi chợ thêm chút đã');
    return;
  }
  const bad = validateAll();
  if (bad) {
    bad.focus({ preventScroll: true });
    bad.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    toast('Điền nốt địa chỉ nhận hàng đã nha');
    return;
  }
  const form = $('addr');
  const order = {
    ...t,
    code: `NUG${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    name: form.elements.name.value.trim(),
    place: byIdOf(PLACES, form.elements.place.value),
    shipper: byIdOf(SHIPPERS, ship),
    payment: byIdOf(PAYMENTS, pay),
  };
  placed = true;
  removeFromCart(t.chosen.map((x) => x.key));
  renderDone(order);
}

// Màn "đặt hàng thành công": món hàng bay theo đường vòng từ chợ tới nơi nhận, các bước theo dõi lần lượt sáng lên
function renderDone(o) {
  document.body.classList.add('is-ordered');
  root.innerHTML = `
    <section class="done" aria-labelledby="done-title">
      <div class="flight" aria-hidden="true">
        <svg class="flight__path" viewBox="0 0 100 150" preserveAspectRatio="none"><path d="M8 120 Q50 -40 92 120"/></svg>
        <span class="flight__end flight__end--from">🏪</span>
        <span class="flight__end flight__end--to">${o.place.icon}</span>
        <span class="flight__carrier"><span>${o.shipper.icon}</span></span>
      </div>
      <h1 class="done__title" id="done-title" tabindex="-1">Đặt hàng thành công!</h1>
      <p class="done__lead">Mã đơn <b>${o.code}</b>. ${o.shipper.name} đang mang hàng tới ${o.place.name} cho ${esc(o.name)}.</p>

      <ol class="track" id="track">
        <li class="is-done"><span class="track__dot" aria-hidden="true">✓</span><b>Đã đặt hàng</b><small>Vừa xong</small></li>
        <li class="is-current"><span class="track__dot" aria-hidden="true">📦</span><b>Mèo đóng gói</b><small>Đang kiểm từng món</small></li>
        <li><span class="track__dot" aria-hidden="true">${o.shipper.icon}</span><b>Đang trên đường</b><small>${o.shipper.name}</small></li>
        <li><span class="track__dot" aria-hidden="true">${o.place.icon}</span><b>Đã giao</b><small>Dự kiến: ${o.shipper.eta.toLowerCase()}</small></li>
      </ol>

      <div class="done__bill">
        <ul class="done__items">
          ${o.chosen.map(({ p, qty, variant }) => `
            <li><span aria-hidden="true">${p.icon}</span><span class="done__name">${esc(p.name)}${variant ? ` <small>(${esc(variant)})</small>` : ''} × ${qty}</span><b>${money(p.price * qty)}</b></li>`).join('')}
        </ul>
        <dl class="done__sum">
          <div><dt>Phí vận chuyển</dt><dd>${money(o.fee - o.shipOff)}</dd></div>
          ${o.off ? `<div><dt>Giảm giá</dt><dd>−${money(o.off)}</dd></div>` : ''}
          <div class="done__total"><dt>Tổng thanh toán</dt><dd>${money(o.total)}</dd></div>
          <div><dt>Trả bằng</dt><dd>${o.payment.icon} ${o.payment.name}</dd></div>
        </dl>
      </div>

      <p class="done__note">Đơn này bịa thôi nha, không có ai giao thật đâu. Nhưng mèo vẫn cảm ơn bạn đã ghé chợ 🐾</p>
      <div class="done__actions">
        <a class="btn btn--primary btn--lg" href="./">Tiếp tục mua sắm</a>
        <a class="btn btn--lg" href="../../../index.html">Về căn phòng nhỏ</a>
      </div>
    </section>`;
  window.scrollTo({ top: 0 });
  $('done-title').focus({ preventScroll: true });

  // Đóng gói xong thì chuyển sang "Đang trên đường", rồi cứ thế bay mãi (đơn bịa mà, không bao giờ tới)
  const steps = [...document.querySelectorAll('#track li')];
  setTimeout(() => {
    steps[1].classList.replace('is-current', 'is-done');
    steps[1].querySelector('small').textContent = 'Xong rồi';
    steps[2].classList.add('is-current');
  }, reduceMotion ? 0 : 1800);
}

// ---------- Sự kiện ----------
function bind() {
  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.pick) {
      if (t.checked) selected.add(t.dataset.pick);
      else selected.delete(t.dataset.pick);
      renderTotals();
    } else if (t.id === 'check-all') {
      cartItems().forEach(({ key }) => (t.checked ? selected.add(key) : selected.delete(key)));
      root.querySelectorAll('[data-pick]').forEach((c) => { c.checked = t.checked; });
      renderTotals();
    } else if (t.name === 'ship') {
      ship = t.value;
      renderTotals();
    } else if (t.name === 'pay') {
      pay = t.value;
    } else if (t.name === 'place') {
      updatePlace();
    }
  });

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if ('place' in t.dataset) {
      placeOrder();
    } else if (t.dataset.voucher) {
      const v = VOUCHERS.find((x) => x.code === t.dataset.voucher);
      applyVoucher(voucher === v ? null : v);
      root.querySelector(`[data-voucher="${v.code}"]`).focus(); // danh sách mã vừa vẽ lại, giữ con trỏ ở mã vừa bấm
    } else if (t.id === 'addr-demo') {
      const f = $('addr').elements;
      f.name.value = 'Mèo Sphynx';
      f.phone.value = '0912 345 678';
      f.street.value = 'Ghế lười cạnh cửa sổ, căn phòng nhỏ trên hòn đảo bay';
      Object.keys(RULES).forEach((name) => checkField(f[name]));
    }
  });

  $('voucher-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = $('voucher-input').value.trim().toUpperCase();
    if (!code) {
      setVoucherMsg('Nhập mã trước đã nha, hoặc bấm chọn một mã bên dưới', true);
      return;
    }
    const v = VOUCHERS.find((x) => x.code === code);
    if (!v) setVoucherMsg(`Mã “${code}” mèo chưa phát hành. Thử mấy mã bên dưới xem.`, true);
    else applyVoucher(v);
  });

  // Ô nào đã báo sai thì gõ tới đâu kiểm tra lại tới đó, sửa đúng là lời nhắc tự tắt
  $('addr').addEventListener('input', (e) => {
    if (RULES[e.target.name] && e.target.getAttribute('aria-invalid') === 'true') checkField(e.target);
  });
  $('addr').addEventListener('submit', (e) => e.preventDefault());

  // Đổi số lượng hay xóa món (ở đây hoặc trong giỏ trên đầu trang) thì vẽ lại danh sách và tổng tiền
  document.addEventListener('cart-change', () => { if (!placed) renderItems(); });
}

// ---------- Vẽ trang ----------
if (cartItems().length === 0) {
  root.innerHTML = `
    <div class="pd-missing">
      <p class="pd-missing__icon" aria-hidden="true">🛒</p>
      <h1>Giỏ hàng đang trống</h1>
      <p>Mèo nhìn bạn với ánh mắt thất vọng. Ghé chợ chọn vài món đã nha.</p>
      <a class="btn btn--primary" href="./">Về trang chủ Chợ Nugỏrt</a>
    </div>`;
} else {
  renderPage();
  renderVouchers();
  bind();
  renderItems();
}
