// app.js – Trang chủ Chợ Nugỏrt: danh mục, lọc, sắp xếp, phân trang.
// Phần dùng chung (đầu trang, giỏ hàng, đăng nhập) nằm trong common.js, dữ liệu nằm trong data.js.
import { CATS, PRODUCTS, plain } from './data.js';
import { $, mountShell, cardHTML, bindCardButtons } from './common.js';

const PAGE_SIZE = 10;

mountShell();

// Mở trang từ link có sẵn bộ lọc, ví dụ ?cat=coffee (từ trang chi tiết) hay ?q=meo (tìm từ trang khác)
const params = new URLSearchParams(location.search);
const state = {
  cat: CATS.some((c) => c.id === params.get('cat')) ? params.get('cat') : 'all',
  sort: 'popular',
  query: params.get('q') || '',
  page: 1,
};

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

// ---------- Sự kiện ----------
document.addEventListener('click', (e) => {
  const t = e.target.closest('button');
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
  } else if (t.id === 'cats-toggle') {
    toggleCats(t);
  }
});

// Màn rộng: bấm tiêu đề "Danh mục" để thu gọn hay mở lại danh sách (điện thoại không có tiêu đề này).
// Danh sách từ từ co lại (hay trải ra) và mờ dần, không biến mất cái rụp
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let catsAnim = null;
function toggleCats(button) {
  const open = button.getAttribute('aria-expanded') !== 'true';
  const list = $('cats');
  const sidebar = document.querySelector('.sidebar');
  button.setAttribute('aria-expanded', String(open));
  catsAnim?.cancel();
  if (reduceMotion) {
    sidebar.classList.toggle('is-collapsed', !open);
    return;
  }
  sidebar.classList.remove('is-collapsed'); // hiện ra trước để đo chiều cao thật
  const full = `${list.scrollHeight}px`;
  const shown = { height: full, opacity: 1 };
  const hidden = { height: '0px', opacity: 0 };
  list.style.overflow = 'hidden';
  catsAnim = list.animate(open ? [hidden, shown] : [shown, hidden], { duration: 380, easing: 'cubic-bezier(.25, .8, .25, 1)' });
  catsAnim.onfinish = () => {
    list.style.overflow = '';
    sidebar.classList.toggle('is-collapsed', !open);
    catsAnim = null;
  };
}
bindCardButtons(); // nút "Thêm vào giỏ" và nút tim trên từng thẻ

$('price-sort').addEventListener('change', (e) => {
  state.sort = e.target.value || 'popular';
  state.page = 1;
  document.querySelectorAll('[data-sort]').forEach((b) => b.classList.toggle('is-active', !e.target.value && b.dataset.sort === 'popular'));
  renderGrid();
});

// Ở trang chủ thì tìm ngay khi gõ, không cần tải lại trang
$('search-input').addEventListener('input', (e) => {
  state.query = e.target.value;
  state.page = 1;
  renderGrid();
});
$('search').addEventListener('submit', (e) => e.preventDefault());

renderCats();
renderGrid();
