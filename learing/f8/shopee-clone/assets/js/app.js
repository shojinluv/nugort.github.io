// Chợ Nugỏrt – toàn bộ phần "động" của trang: danh sách sản phẩm, lọc, sắp xếp, phân trang, giỏ hàng.
// Không có máy chủ nào phía sau: dữ liệu nằm ngay trong file này, giỏ hàng lưu trong trình duyệt.

const CATS = [
  { id: 'all', name: 'Tất cả' },
  { id: 'cat', name: 'Đồ cho mèo' },
  { id: 'desk', name: 'Bàn làm việc' },
  { id: 'plant', name: 'Cây cảnh' },
  { id: 'coffee', name: 'Cà phê & trà' },
  { id: 'space', name: 'Đồ vũ trụ' },
  { id: 'book', name: 'Sách & nhạc' },
];

// price/old tính bằng đồng, sold là số đã bán, added càng lớn thì càng mới
const PRODUCTS = [
  { id: 1, cat: 'cat', icon: '🐟', name: 'Cá khô thượng hạng, mèo ăn xong tự rửa bát', price: 45000, old: 60000, sold: 12400, rating: 4.9, from: 'Phan Thiết', fav: true, added: 3 },
  { id: 2, cat: 'cat', icon: '🧶', name: 'Cuộn len cho mèo Sphynx tự đan áo', price: 32000, old: 40000, sold: 3100, rating: 4.7, from: 'Hà Nội', added: 14 },
  { id: 3, cat: 'cat', icon: '🛏️', name: 'Ổ nằm sưởi nắng, kèm vệt nắng dùng thử 7 ngày', price: 289000, old: 420000, sold: 860, rating: 4.8, from: 'Đà Lạt', fav: true, added: 20 },
  { id: 4, cat: 'cat', icon: '🧴', name: 'Kem dưỡng da cho mèo không lông, hương cá hồi', price: 119000, sold: 540, rating: 4.5, from: 'TP. Hồ Chí Minh', added: 22 },
  { id: 5, cat: 'desk', icon: '⌨️', name: 'Bàn phím cơ gõ lách cách, hàng xóm đánh giá 1 sao', price: 890000, old: 1290000, sold: 2300, rating: 4.8, from: 'Hà Nội', fav: true, added: 9 },
  { id: 6, cat: 'desk', icon: '🖱️', name: 'Chuột không dây, thỉnh thoảng bị mèo vồ', price: 259000, old: 320000, sold: 4700, rating: 4.6, from: 'Đà Nẵng', added: 11 },
  { id: 7, cat: 'desk', icon: '💡', name: 'Đèn bàn ánh vàng, bật lên là thấy mình chăm chỉ', price: 345000, sold: 1500, rating: 4.7, from: 'Hà Nội', added: 6 },
  { id: 8, cat: 'desk', icon: '🪑', name: 'Ghế xoay công thái học, xoay ba vòng là quên deadline', price: 2190000, old: 2900000, sold: 310, rating: 4.4, from: 'Bình Dương', added: 17 },
  { id: 9, cat: 'desk', icon: '🗒️', name: 'Giấy note ba màu để chép thơ dán tường', price: 18000, sold: 9800, rating: 4.9, from: 'Hà Nội', added: 2 },
  { id: 10, cat: 'plant', icon: '🪴', name: 'Trầu bà leo kệ, lớn nhanh hơn lương', price: 75000, old: 95000, sold: 6200, rating: 4.8, from: 'Sa Đéc', fav: true, added: 8 },
  { id: 11, cat: 'plant', icon: '🌵', name: 'Xương rồng mini, quên tưới ba tháng vẫn sống', price: 39000, sold: 15300, rating: 4.9, from: 'Đà Lạt', added: 1 },
  { id: 12, cat: 'plant', icon: '🚿', name: 'Bình tưới cây phun sương, mèo ghét', price: 54000, old: 70000, sold: 2100, rating: 4.3, from: 'TP. Hồ Chí Minh', added: 13 },
  { id: 13, cat: 'coffee', icon: '☕', name: 'Cà phê rang xay, một ngụm là code tới sáng', price: 135000, old: 160000, sold: 8700, rating: 4.9, from: 'Buôn Ma Thuột', fav: true, added: 5 },
  { id: 14, cat: 'coffee', icon: '🍵', name: 'Trà sen ướp tay, uống xong thấy đời chậm lại', price: 210000, sold: 1900, rating: 4.8, from: 'Hà Nội', added: 15 },
  { id: 15, cat: 'coffee', icon: '🥛', name: 'Cốc sứ có nắp, chống đổ khi mất trọng lực', price: 99000, old: 149000, sold: 3400, rating: 4.6, from: 'Bát Tràng', added: 19 },
  { id: 16, cat: 'coffee', icon: '🧋', name: 'Trà sữa trân châu, ống hút dài 1 đơn vị thiên văn', price: 42000, sold: 22000, rating: 4.7, from: 'TP. Hồ Chí Minh', added: 4 },
  { id: 17, cat: 'space', icon: '🚀', name: 'Vé một chiều lên Sao Hỏa, không hoàn không hủy', price: 99000000, old: 150000000, sold: 3, rating: 5.0, from: 'Quỹ đạo thấp', added: 24 },
  { id: 18, cat: 'space', icon: '🧑‍🚀', name: 'Mũ phi hành gia có tai mèo, size S cho mèo', price: 1450000, old: 1800000, sold: 120, rating: 4.9, from: 'Trạm SHOJINLUV-01', fav: true, added: 23 },
  { id: 19, cat: 'space', icon: '🔋', name: 'Tấm pin mặt trời gắn tường, sạc bằng nắng thật', price: 3200000, sold: 450, rating: 4.5, from: 'Ninh Thuận', added: 21 },
  { id: 20, cat: 'space', icon: '🔭', name: 'Kính thiên văn ngắm Sao Thổ, nhìn rõ cả vành đai', price: 4750000, old: 5600000, sold: 280, rating: 4.7, from: 'Hà Nội', added: 16 },
  { id: 21, cat: 'space', icon: '🌙', name: 'Đèn ngủ Mặt Trăng, tỉ lệ 1 trên rất nhiều', price: 185000, old: 250000, sold: 5100, rating: 4.6, from: 'Đà Nẵng', added: 10 },
  { id: 22, cat: 'book', icon: '📚', name: 'Combo sách lập trình, mua về để đó cho yên tâm', price: 399000, old: 560000, sold: 2700, rating: 4.8, from: 'Hà Nội', added: 7 },
  { id: 23, cat: 'book', icon: '🎸', name: 'Đàn guitar gỗ, chủ cũ chỉ biết đánh đúng một bài', price: 1250000, sold: 190, rating: 4.4, from: 'TP. Hồ Chí Minh', added: 12 },
  { id: 24, cat: 'book', icon: '📖', name: 'Tập thơ sáu dòng, đọc xong muốn thở dài', price: 68000, old: 80000, sold: 740, rating: 4.9, from: 'Huế', added: 18 },
];

const PAGE_SIZE = 10;
const $ = (id) => document.getElementById(id);
const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

// ---------- Tiện ích nhỏ ----------
const money = (n) => n.toLocaleString('vi-VN') + '₫';
const sold = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '').replace('.', ',') + 'k' : String(n));
const tint = (id, light = 92) => `hsl(${(id * 47) % 360} 70% ${light}%)`; // mỗi món một màu nền riêng
// Bỏ dấu tiếng Việt để gõ "ca kho" vẫn tìm ra "Cá khô"
const plain = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

// Trình duyệt có thể chặn localStorage (chế độ ẩn danh…), nên đọc/ghi đều phải bọc try/catch
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* không lưu được thì thôi */ }
}

let toastTimer;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-show'), 2200);
}

// ---------- Trạng thái của trang ----------
const state = { cat: 'all', sort: 'popular', query: '', page: 1 };
const cart = load('cho-nugort-cart', {});            // { [id sản phẩm]: số lượng }
const liked = new Set(load('cho-nugort-liked', []));

// ---------- Danh mục ----------
function renderCats() {
  $('cats').innerHTML = CATS.map((c) => (
    `<li><button type="button" data-cat="${c.id}" class="${c.id === state.cat ? 'is-active' : ''}" aria-pressed="${c.id === state.cat}">${c.name}</button></li>`
  )).join('');
}

// ---------- Lọc và sắp xếp ----------
function visibleProducts() {
  const q = plain(state.query.trim());
  const list = PRODUCTS.filter((p) => (state.cat === 'all' || p.cat === state.cat) && (!q || plain(p.name).includes(q)));
  const sorters = {
    popular: (a, b) => b.rating * Math.log10(b.sold + 10) - a.rating * Math.log10(a.sold + 10),
    newest: (a, b) => b.added - a.added,
    sold: (a, b) => b.sold - a.sold,
    asc: (a, b) => a.price - b.price,
    desc: (a, b) => b.price - a.price,
  };
  return list.sort(sorters[state.sort]);
}

// ---------- Lưới sản phẩm ----------
function cardHTML(p) {
  const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
  const isLiked = liked.has(p.id);
  return `
    <li>
      <article class="card">
        <div class="card__img" style="background:${tint(p.id)}" aria-hidden="true">${p.icon}</div>
        ${p.fav ? '<span class="tag">Yêu thích</span>' : ''}
        ${off ? `<span class="sale">${off}%<br>GIẢM</span>` : ''}
        <div class="card__body">
          <h3 class="card__name">${p.name}</h3>
          <p class="card__price"><b>${money(p.price)}</b>${p.old ? `<s>${money(p.old)}</s>` : ''}</p>
          <p class="card__row">
            <span class="card__rating"><svg aria-hidden="true"><use href="#i-star"></use></svg>${p.rating.toFixed(1).replace('.', ',')}</span>
            <span>Đã bán ${sold(p.sold)}</span>
          </p>
          <p class="card__row"><span>${p.from}</span></p>
          <div class="card__actions">
            <button class="btn btn--primary card__add" type="button" data-add="${p.id}">Thêm vào giỏ</button>
            <button class="like" type="button" data-like="${p.id}" aria-pressed="${isLiked}" aria-label="Yêu thích ${p.name}">
              <svg aria-hidden="true"><use href="#i-heart"></use></svg>
            </button>
          </div>
        </div>
      </article>
    </li>`;
}

function renderGrid() {
  const list = visibleProducts();
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  state.page = Math.min(state.page, pages);
  const shown = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

  $('grid').innerHTML = shown.map(cardHTML).join('');
  $('none').hidden = list.length > 0;
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

// ---------- Giỏ hàng ----------
function renderCart() {
  const items = Object.entries(cart).map(([id, qty]) => ({ p: byId.get(Number(id)), qty })).filter((x) => x.p);
  const count = items.reduce((n, x) => n + x.qty, 0);
  const total = items.reduce((n, x) => n + x.qty * x.p.price, 0);

  const badge = $('cart-count');
  badge.textContent = count > 99 ? '99+' : count;
  badge.hidden = count === 0;

  $('cart-list').innerHTML = items.map(({ p, qty }) => `
    <li class="cart__item">
      <span class="cart__thumb" style="background:${tint(p.id)}" aria-hidden="true">${p.icon}</span>
      <span>
        <span class="cart__name">${p.name}</span>
        <span class="cart__meta"><b>${money(p.price)}</b> × ${qty}</span>
      </span>
      <button class="cart__remove" type="button" data-remove="${p.id}" aria-label="Bỏ ${p.name} khỏi giỏ">Xóa</button>
    </li>`).join('');
  $('cart-empty').hidden = count > 0;
  $('cart-foot').hidden = count === 0;
  $('cart-total').textContent = money(total);
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  save('cho-nugort-cart', cart);
  renderCart();
  const badge = $('cart-count');
  badge.classList.remove('is-bump');
  void badge.offsetWidth; // ép trình duyệt tính lại để hiệu ứng chạy lại từ đầu
  badge.classList.add('is-bump');
  toast(`Đã thêm "${byId.get(id).name}" vào giỏ`);
}

function toggleCart(open) {
  const panel = $('cart-panel');
  const show = open ?? panel.hidden;
  panel.hidden = !show;
  $('cart-btn').setAttribute('aria-expanded', String(show));
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

// ---------- Gắn sự kiện ----------
document.addEventListener('click', (e) => {
  const t = e.target.closest('button, [data-close]');

  // Bấm ra ngoài thì đóng giỏ hàng
  if (!e.target.closest('#cart')) toggleCart(false);
  if (!t) return;

  if (t.dataset.cat) {
    state.cat = t.dataset.cat;
    state.page = 1;
    renderCats();
    renderGrid();
  } else if (t.dataset.sort) {
    state.sort = t.dataset.sort;
    state.page = 1;
    $('price-sort').value = '';
    document.querySelectorAll('[data-sort]').forEach((b) => b.classList.toggle('is-active', b === t));
    renderGrid();
  } else if (t.dataset.page) {
    state.page = Number(t.dataset.page);
    renderGrid();
    document.querySelector('.toolbar').scrollIntoView({ block: 'center' });
  } else if (t.dataset.add) {
    addToCart(Number(t.dataset.add));
  } else if (t.dataset.like) {
    const id = Number(t.dataset.like);
    liked.has(id) ? liked.delete(id) : liked.add(id);
    save('cho-nugort-liked', [...liked]);
    t.setAttribute('aria-pressed', String(liked.has(id)));
  } else if (t.dataset.remove) {
    delete cart[t.dataset.remove];
    save('cho-nugort-cart', cart);
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

$('price-sort').addEventListener('change', (e) => {
  state.sort = e.target.value || 'popular';
  state.page = 1;
  document.querySelectorAll('[data-sort]').forEach((b) => b.classList.toggle('is-active', !e.target.value && b.dataset.sort === 'popular'));
  renderGrid();
});

$('search-input').addEventListener('input', (e) => {
  state.query = e.target.value;
  state.page = 1;
  renderGrid();
});
$('search').addEventListener('submit', (e) => e.preventDefault());

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

// ---------- Khởi động ----------
renderCats();
renderGrid();
renderCart();
