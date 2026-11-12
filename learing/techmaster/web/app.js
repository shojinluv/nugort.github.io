// app.js – Dựng trang "Vở bài tập Java": danh sách bài theo buổi, cửa sổ chạy thử (terminal giả) và xem code gốc.
import { days } from './programs.js';
import { highlight } from './highlight.js';
import { makeSystem, JavaExit, JavaException, Stopped, OutputLimit } from './jvm.js';

const GITHUB = 'https://github.com/shojinluv/nugort.github.io/blob/main/learing/techmaster/java/';
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

const lessons = days.flatMap((day) => day.lessons.map((lesson) => ({ ...lesson, day })));
const byId = new Map(lessons.map((l) => [l.id, l]));

// ---------- Số liệu nhỏ ở đầu trang ----------
$('stat-days').textContent = days.length;
$('stat-lessons').textContent = lessons.length;
$('stat-files').textContent = new Set(lessons.flatMap((l) => l.files)).size;

// ---------- Thanh chọn buổi + các thẻ bài ----------
const nav = $('days');
const main = $('lessons');
for (const day of days) {
  const link = el('a', 'chip', day.label);
  link.href = `#${day.id}`;
  link.style.setProperty('--hue', day.hue);
  nav.append(link);

  const section = el('section', 'day');
  section.id = day.id;
  section.style.setProperty('--hue', day.hue);
  const head = el('header', 'day__head');
  head.append(el('h2', 'day__label', day.label), el('p', 'day__summary', day.summary), el('code', 'day__folder', `java/${day.folder}`));
  const grid = el('div', 'grid');
  for (const lesson of day.lessons) grid.append(card(lesson));
  section.append(head, grid);
  main.append(section);
}

function card(lesson) {
  const button = el('button', 'card');
  button.type = 'button';
  button.dataset.id = lesson.id;
  const icon = el('span', 'card__icon', lesson.icon);
  icon.setAttribute('aria-hidden', 'true');
  const tags = el('span', 'card__tags');
  lesson.tags.forEach((t) => tags.append(el('span', 'tag', t)));
  const status = lesson.fx ? '👀 Xem giao diện' : lesson.unfinished ? '✎ Làm dở' : '▶ Chạy thử';
  const foot = el('span', 'card__foot');
  foot.append(tags, el('span', `card__status${lesson.unfinished ? ' is-draft' : ''}`, status));
  button.append(icon, el('span', 'card__title', lesson.title), el('span', 'card__desc', lesson.desc), foot);
  button.addEventListener('click', () => openLab(lesson.id));
  return button;
}

// ======================================================================
// Terminal giả: in chữ, và chờ người xem gõ rồi nhấn Enter (giống ô Run của IntelliJ)
// ======================================================================
class Terminal {
  constructor(screen) {
    this.screen = screen;
    this.pending = null;
    screen.addEventListener('click', () => {
      if (!window.getSelection().toString()) this.screen.querySelector('input')?.focus();
    });
  }

  clear() {
    this.cancel();
    this.screen.textContent = '';
  }

  cancel() {
    if (this.pending) this.pending(new Stopped());
    this.pending = null;
  }

  write(text, kind = '') {
    if (!text) return;
    const last = this.screen.lastChild;
    if (last && last.nodeName === 'SPAN' && last.dataset.kind === kind) last.textContent += text;
    else {
      const span = el('span', kind ? `out-${kind}` : '', text);
      span.dataset.kind = kind;
      this.screen.append(span);
    }
    this.scroll();
  }

  // Dòng đang in dở (chưa xuống dòng) thì lỗi phải bắt đầu ở dòng mới
  newline() {
    if (!/\n$|^$/.test(this.screen.textContent)) this.write('\n');
  }

  readLine() {
    return new Promise((resolve, reject) => {
      const input = el('input', 'term__input');
      Object.assign(input, { type: 'text', autocomplete: 'off', spellcheck: false, enterKeyHint: 'send' });
      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('aria-label', 'Gõ vào đây rồi nhấn Enter');
      const fit = () => { input.style.width = `${Math.max(2, input.value.length + 1)}ch`; };
      input.addEventListener('input', fit);
      fit();
      input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || event.isComposing) return;
        event.preventDefault();
        const value = input.value;
        input.remove();
        this.pending = null;
        this.write(`${value}\n`, 'in'); // chữ người xem gõ hiện màu xanh lá, như IntelliJ
        resolve(value);
      });
      this.pending = (error) => { input.remove(); reject(error); };
      this.screen.append(input);
      this.scroll();
      if (labIsOpen()) input.focus({ preventScroll: true });
    });
  }

  scroll() { this.screen.scrollTop = this.screen.scrollHeight; }
}

const term = new Terminal($('term-screen'));
let runCount = 0;
let current = null;

async function run(lesson) {
  const id = ++runCount;
  term.clear();
  $('term-stop').disabled = false;
  term.write(`> ${lesson.entry}\n`, 'meta');
  let code = 0;
  try {
    await lesson.run(makeSystem(term));
  } catch (error) {
    if (error instanceof Stopped) return; // đã bị Chạy lại hoặc Dừng, lần chạy mới lo phần còn lại
    if (error instanceof JavaExit) code = error.code;
    else if (error instanceof JavaException) {
      term.newline();
      term.write(`Exception in thread "main" ${error.name}${error.message ? `: ${error.message}` : ''}\n`, 'err');
      code = 1;
    } else if (error instanceof OutputLimit) {
      term.newline();
      term.write('… in nhiều quá, mình dừng bớt cho trình duyệt đỡ mệt 😵\n', 'meta');
      code = 130;
    } else {
      throw error;
    }
  }
  if (id !== runCount) return;
  term.newline();
  term.write(`\nProcess finished with exit code ${code}\n`, 'meta');
  $('term-stop').disabled = true;
}

$('term-rerun').addEventListener('click', () => current && !current.fx && run(current));
$('term-stop').addEventListener('click', () => {
  runCount++;
  term.cancel();
  term.newline();
  term.write('\nProcess finished with exit code 130 (bạn đã bấm Dừng)\n', 'meta');
  $('term-stop').disabled = true;
});

// ======================================================================
// Xem code gốc
// ======================================================================
const fileCache = new Map();
function loadFile(path) {
  if (!fileCache.has(path)) {
    fileCache.set(path, fetch(`java/${path}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status);
        return res.text();
      })
      .then((text) => text.replace(/\r\n?/g, '\n')));
  }
  return fileCache.get(path);
}

let codeToken = 0;
async function showFile(path) {
  const token = ++codeToken;
  $('files').querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.path === path)));
  $('gh').href = GITHUB + path;
  const code = $('code');
  code.setAttribute('aria-busy', 'true');
  try {
    const text = await loadFile(path);
    if (token !== codeToken) return;
    code.innerHTML = highlight(text, path).map((line) => `<span class="line">${line}</span>`).join('\n');
  } catch {
    if (token !== codeToken) return;
    code.textContent = 'Không tải được file này 😿';
  }
  code.removeAttribute('aria-busy');
  $('code-wrap').scrollTo(0, 0);
}

// ======================================================================
// Cửa sổ bài tập
// ======================================================================
const lab = $('lab');
const labIsOpen = () => lab.open;

function openLab(id, { push = true } = {}) {
  const lesson = byId.get(id);
  if (!lesson) return;
  current = lesson;
  lab.style.setProperty('--hue', lesson.day.hue);
  $('lab-icon').textContent = lesson.icon;
  $('lab-title').textContent = lesson.title;
  $('lab-path').textContent = `${lesson.day.label} · java/${lesson.files[0]}`;
  $('lab-note').hidden = !lesson.note;
  $('lab-note').textContent = lesson.note ? `📌 ${lesson.note}` : '';

  const files = $('files');
  files.textContent = '';
  for (const path of lesson.files) {
    const b = el('button', 'file', path.split('/').pop());
    b.type = 'button';
    b.dataset.path = path;
    b.setAttribute('role', 'tab');
    b.title = path;
    b.addEventListener('click', () => showFile(path));
    files.append(b);
  }
  showFile(lesson.files[0]);

  $('fx').hidden = !lesson.fx;
  $('term').hidden = !!lesson.fx;
  $('tab-run').textContent = lesson.fx ? '👀 Giao diện' : '▶ Chạy thử';
  setTab('run');
  if (!lab.open) lab.showModal();
  if (lesson.fx) {
    runCount++;
    term.clear();
    $('fx-status').textContent = '';
    $('fx-user').value = '';
    $('fx-pass').value = '';
  } else {
    run(lesson);
  }
  if (push) history.replaceState(null, '', `#bai-${id}`);
}

function closeLab() {
  runCount++;
  term.clear();
  if (lab.open) lab.close();
}
lab.addEventListener('close', () => {
  runCount++;
  term.cancel();
  history.replaceState(null, '', location.pathname + location.search);
  document.querySelector(`.card[data-id="${current?.id}"]`)?.focus({ preventScroll: true });
});
$('lab-close').addEventListener('click', closeLab);
// Bấm ra ngoài khung (vùng tối) thì đóng
lab.addEventListener('click', (event) => {
  if (event.target === lab) closeLab();
});

// Màn hình hẹp: chỉ hiện một bên, chuyển qua lại bằng hai nút "Chạy thử" và "Code"
function setTab(name) {
  lab.dataset.tab = name;
  for (const b of lab.querySelectorAll('[data-pane]')) b.setAttribute('aria-selected', String(b.dataset.pane === name));
}
for (const b of lab.querySelectorAll('[data-pane]')) b.addEventListener('click', () => setTab(b.dataset.pane));

// Cửa sổ JavaFX dựng lại: mỗi nút làm đúng như hàm cùng tên trong HelloController.java.
// Chỉ so với tài khoản mẫu ngay trên trang, không lưu hay gửi gì đi đâu
const fxHandlers = {
  onSignInClick() {
    const username = $('fx-user').value.trim();
    const password = $('fx-pass').value;
    if (!username || !password) return 'Hãy nhập tên đăng nhập và mật khẩu';
    if (username === 'admin' && password === '123456') return `Chào mừng ${username} quay lại 🌟`;
    return 'Sai tên đăng nhập hoặc mật khẩu';
  },
  onSignUpClick: () => 'Tính năng đăng ký sắp có 🚧',
  onForgotPasswordClick: () => 'Gợi ý: thử admin / 123456 😉',
};
for (const b of document.querySelectorAll('[data-handler]')) {
  b.addEventListener('click', () => {
    $('fx-status').textContent = fxHandlers[b.dataset.handler]();
  });
}

// Mở thẳng một bài nếu đường link có #bai-…
function openFromHash() {
  const m = /^#bai-(.+)$/.exec(location.hash);
  if (m && byId.has(m[1])) openLab(m[1], { push: false });
}
openFromHash();
window.addEventListener('hashchange', openFromHash);
