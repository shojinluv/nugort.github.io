// main.js – "Bộ não" của căn phòng: dựng cảnh, camera, ánh sáng,
// xử lý chuột/chạm, chuyển ngày ↔ đêm, bay ra vũ trụ và vòng lặp vẽ hình.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildRoom, SUN_DIR, WALL_H } from './room.js';
import { buildFurniture } from './furniture.js';
import { buildSpace } from './space.js';
import {
  content, labels, spaceLabels, skyLabels, skyFacts, catLines, catSpaceLines, plantLines, plantSpaceLines,
} from './content.js';

const $ = (selector) => document.querySelector(selector);
const ui = {
  canvas: $('#scene'),
  tooltip: $('#tooltip'),
  panel: $('#panel'),
  panelTag: $('#panel-tag'),
  panelTitle: $('#panel-title'),
  panelImg: $('#panel-img'),
  panelBody: $('#panel-body'),
  panelLinks: $('#panel-links'),
  panelClose: $('#panel-close'),
  nightBtn: $('#btn-night'),
  spaceBtn: $('#btn-space'),
  progress: $('#progress'),
  fx: $('#fx'),
  loader: $('#loader'),
};
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Chờ font tải xong (tối đa 1,5 giây) để chữ vẽ trên tranh và màn hình máy tính đẹp hơn
await Promise.race([
  document.fonts.load('800 40px "Be Vietnam Pro"'),
  new Promise((resolve) => setTimeout(resolve, 1500)),
]).catch(() => {});

// ===== 1. Renderer: "máy chiếu" vẽ cảnh 3D lên thẻ <canvas> =====
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, alpha: true });
} catch (err) {
  document.body.classList.add('no-webgl');
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;               // bật đổ bóng
renderer.shadowMap.type = THREE.PCFShadowMap;     // kiểu bóng mềm, viền không bị răng cưa
renderer.toneMapping = THREE.NeutralToneMapping;  // giữ màu pastel tươi, không bị cháy sáng

// ===== 2. Scene: "sân khấu" chứa mọi thứ =====
const scene = new THREE.Scene();

// ===== 3. Camera: "con mắt" nhìn vào sân khấu =====
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 300);

// ===== 4. Controls: kéo chuột để xoay, cuộn để phóng to =====
const controls = new OrbitControls(camera, ui.canvas);
controls.enableDamping = true; // xoay có quán tính, mượt hơn
controls.enablePan = false;    // không cho kéo lệch khỏi căn phòng
controls.minDistance = 4;
// Giới hạn góc xoay khi ở trong nhà: không nhìn thẳng từ trên xuống, không chui xuống dưới sàn,
// và chỉ xoay trong góc phía trước để tường không che mất phòng.
// Ra ngoài vũ trụ thì bỏ hết giới hạn, xoay 360° tuỳ thích (xem phần 7b).
const ROOM_VIEW = { minPolar: 0.35, maxPolar: 1.38, minAzimuth: -0.1, maxAzimuth: Math.PI / 2 + 0.1 };
function setFreeCamera(free) {
  controls.minPolarAngle = free ? 0 : ROOM_VIEW.minPolar;
  controls.maxPolarAngle = free ? Math.PI : ROOM_VIEW.maxPolar;
  controls.minAzimuthAngle = free ? -Infinity : ROOM_VIEW.minAzimuth;
  controls.maxAzimuthAngle = free ? Infinity : ROOM_VIEW.maxAzimuth;
}
setFreeCamera(false);

// ===== 5. Ánh sáng =====
const hemi = new THREE.HemisphereLight('#fff4ea', '#d8b89a', 2.2); // ánh sáng trời dịu, chiếu đều
const sun = new THREE.DirectionalLight('#fff0d4', 3.2);           // nắng chiếu qua cửa sổ
sun.position.copy(SUN_DIR).multiplyScalar(-25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 60 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
const fill = new THREE.DirectionalLight('#ffe6d6', 1.3); // đèn phụ phía trước cho đồ vật có khối
fill.position.set(10, 8, 12);
scene.add(hemi, sun, sun.target, fill);

// Giá trị ánh sáng ban ngày và ban đêm. Ở giữa thì trộn dần hai bên.
const C = (hex) => new THREE.Color(hex);
const DAY = { sky: C('#fff4ea'), ground: C('#d8b89a'), hemi: 2.2, sun: C('#fff0d4'), sunI: 3.2, fill: C('#ffe6d6'), fillI: 1.3 };
const NIGHT = { sky: C('#6a72c9'), ground: C('#2b2346'), hemi: 0.45, sun: C('#a9bcff'), sunI: 1.1, fill: C('#7f8cff'), fillI: 0.18 };
// Ngoài vũ trụ: không còn bầu trời xanh hắt sáng vào phòng, nắng trắng và gắt hơn, chỗ tối thì tối hơn
const SPACE_DAY = { sky: C('#dfe5ff'), ground: C('#2f2a55'), hemi: 1.5, sun: C('#ffffff'), sunI: 3.8, fill: C('#cdd6ff'), fillI: 1.0 };
const SPACE_NIGHT = { sky: C('#5c62b0'), ground: C('#15132b'), hemi: 0.4, sun: C('#9fb4ff'), sunI: 0.9, fill: C('#6f7cff'), fillI: 0.15 };

// ===== 6. Dựng căn phòng =====
// "world" là chiếc túi chung để các file khác gửi vào:
//  - updaters: hàm chạy mỗi khung hình (để làm chuyển động)
//  - nightFns: hàm chạy khi trời chuyển ngày/đêm (n = 0 là ngày, 1 là đêm)
//  - clickables: các đồ vật bấm được
//  - floaters: các vật sẽ trôi lơ lửng khi ra ngoài vũ trụ (xem space.js)
//  - space, spaceProgress, spaceOn: trạng thái bay ra vũ trụ (xem phần 7b)
const world = {
  scene, camera, sunDir: SUN_DIR, updaters: [], nightFns: [], clickables: {}, floaters: [],
  night: 0, space: 0, spaceProgress: 0, spaceOn: false, reduceMotion,
};
buildRoom(world);
buildFurniture(world);
buildSpace(world);

// Bật đổ bóng cho mọi vật thể, và lập danh sách vật thể có thể "bắn tia" chuột trúng
const pickables = [];
scene.traverse((obj) => {
  if (!obj.isMesh) return;
  obj.castShadow = obj.receiveShadow = !obj.userData.noShadow;
  if (!obj.userData.noPick) pickables.push(obj);
});

// ===== 7. Ngày ↔ đêm =====
const hour = new Date().getHours();
let nightTarget = hour >= 18 || hour < 6; // mở trang buổi tối thì phòng cũng tối
let night = nightTarget ? 1 : 0;

function setNight(value) {
  nightTarget = value;
  document.body.classList.toggle('is-night', value);
  ui.nightBtn.setAttribute('aria-pressed', String(value));
  ui.nightBtn.querySelector('span').textContent = value ? 'Ban ngày' : 'Buổi tối';
}

// Trộn 4 bộ ánh sáng: ngày ↔ đêm (theo n) và trong nhà ↔ ngoài vũ trụ (theo world.space)
const colorA = new THREE.Color();
const colorB = new THREE.Color();
function applyNight(n) {
  const s = world.space;
  const lerp = THREE.MathUtils.lerp;
  const color = (target, key) => target.lerpColors(
    colorA.lerpColors(DAY[key], NIGHT[key], n),
    colorB.lerpColors(SPACE_DAY[key], SPACE_NIGHT[key], n),
    s,
  );
  const value = (key) => lerp(lerp(DAY[key], NIGHT[key], n), lerp(SPACE_DAY[key], SPACE_NIGHT[key], n), s);
  color(hemi.color, 'sky');
  color(hemi.groundColor, 'ground');
  hemi.intensity = value('hemi');
  color(sun.color, 'sun');
  sun.intensity = value('sunI');
  color(fill.color, 'fill');
  fill.intensity = value('fillI');
  world.night = n;
  world.nightFns.forEach((fn) => fn(n));
}
setNight(nightTarget);
ui.nightBtn.addEventListener('click', () => setNight(!nightTarget));

// ===== 7b. Bay ra vũ trụ =====
// spaceTarget là điều người dùng muốn (đang ở ngoài vũ trụ hay không).
// world.spaceProgress thì chạy dần tới đó trong vòng lặp vẽ (phần 16), để mọi thứ chuyển mượt.
let spaceTarget = false;
const ROOM_TOP = new THREE.Vector3(0, WALL_H + 0.6, 0);

function setSpace(value) {
  spaceTarget = value;
  world.spaceOn = value;
  document.body.classList.toggle('is-space', value);
  ui.spaceBtn.setAttribute('aria-pressed', String(value));
  ui.spaceBtn.querySelector('span').textContent = value ? 'Hạ cánh' : 'Vũ trụ';
  setFreeCamera(value);
  if (!value) backToRoomView();
}

// Hạ cánh: nếu camera đang ở góc mà trong nhà không cho (sau tường, dưới sàn, trên đỉnh đầu),
// thì bay vòng về góc gần nhất được phép, giữ nguyên độ xa gần
function backToRoomView() {
  const offset = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
  const mid = (ROOM_VIEW.minAzimuth + ROOM_VIEW.maxAzimuth) / 2;
  const half = (ROOM_VIEW.maxAzimuth - ROOM_VIEW.minAzimuth) / 2;
  const turn = Math.atan2(Math.sin(offset.theta - mid), Math.cos(offset.theta - mid)); // lệch khỏi giữa bao nhiêu
  const theta = mid + THREE.MathUtils.clamp(turn, -half, half);
  const phi = THREE.MathUtils.clamp(offset.phi, ROOM_VIEW.minPolar, ROOM_VIEW.maxPolar);
  if (Math.abs(theta - mid - turn) < 1e-3 && Math.abs(phi - offset.phi) < 1e-3) return; // vẫn trong góc cho phép
  if (openId) { savedView = null; closePanel(); }
  offset.theta = theta;
  offset.phi = phi;
  flyTo(HOME_TARGET, HOME_TARGET.clone().add(new THREE.Vector3().setFromSpherical(offset)), 1.4, easeInOut, true);
}
ui.spaceBtn.addEventListener('click', () => {
  setSpace(!spaceTarget);
  popAt(ROOM_TOP, spaceTarget ? '3… 2… 1… Cất cánh! 🚀' : 'Hạ cánh an toàn 🏡');
});

// ===== 8. Camera bay mượt từ chỗ này sang chỗ khác =====
const HOME_TARGET = new THREE.Vector3(0.2, 1.5, 0.2);
const homeRadius = () => 23 * Math.max(1, 1.12 / camera.aspect); // màn hình dọc thì lùi xa hơn
const homePosition = () =>
  HOME_TARGET.clone().add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(homeRadius(), 1.0, Math.PI / 4)));

const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const easeOut = (k) => 1 - (1 - k) ** 3;
let tween = null;

// orbit = true: bay theo đường vòng quanh tâm thay vì đường thẳng (để không xuyên qua tường)
function flyTo(target, position, duration = 1, ease = easeInOut, orbit = false) {
  if (reduceMotion) duration = 0.01;
  tween = {
    t: 0, duration, ease,
    fromTarget: controls.target.clone(), toTarget: target.clone(),
    fromPos: camera.position.clone(), toPos: position.clone(),
  };
  if (orbit) {
    tween.from = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    tween.to = new THREE.Spherical().setFromVector3(position.clone().sub(target));
    const turn = tween.to.theta - tween.from.theta;
    tween.to.theta = tween.from.theta + Math.atan2(Math.sin(turn), Math.cos(turn)); // quay theo chiều ngắn hơn
  }
  controls.enabled = false;
}

const orbitPos = new THREE.Spherical();
const tmpOrbit = new THREE.Vector3();
function updateTween(dt) {
  tween.t = Math.min(1, tween.t + dt / tween.duration);
  const k = tween.ease(tween.t);
  const lerp = THREE.MathUtils.lerp;
  controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k);
  if (tween.from) {
    const { from, to } = tween;
    orbitPos.set(lerp(from.radius, to.radius, k), lerp(from.phi, to.phi, k), lerp(from.theta, to.theta, k));
    camera.position.copy(controls.target).add(tmpOrbit.setFromSpherical(orbitPos));
  } else {
    camera.position.lerpVectors(tween.fromPos, tween.toPos, k);
  }
  camera.lookAt(controls.target);
  if (tween.t >= 1) {
    tween = null;
    controls.enabled = true;
  }
}

// Bay lại gần một đồ vật nhưng vẫn giữ hướng nhìn hiện tại
const box3 = new THREE.Box3();
function focusOn(obj) {
  box3.setFromObject(obj);
  const center = box3.getCenter(new THREE.Vector3());
  const size = box3.getSize(new THREE.Vector3()).length();
  const offset = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
  const portrait = Math.max(1, 1 / camera.aspect) ** 0.8; // màn hình dọc (điện thoại) thì lùi ra xa hơn
  offset.radius = THREE.MathUtils.clamp(size * 2.2 + 2.5, 5, 10) * portrait;
  offset.phi = THREE.MathUtils.clamp(offset.phi, 0.75, 1.25);
  offset.theta = THREE.MathUtils.clamp(offset.theta, 0.1, Math.PI / 2 - 0.1);
  flyTo(center, center.clone().add(new THREE.Vector3().setFromSpherical(offset)), 1.1);
}

// ===== 9. Khung thông tin =====
let openId = null;
let savedView = null;

function openPanel(id, obj) {
  const c = content[id];
  ui.panelTag.textContent = c.tag;
  ui.panelTitle.textContent = c.title;
  ui.panelImg.hidden = !c.image;
  if (c.image) {
    ui.panelImg.src = c.image;
    ui.panelImg.alt = `Ảnh chụp trang ${c.title}`;
  }
  ui.panelBody.replaceChildren(...c.body.map((text) => Object.assign(document.createElement('p'), { textContent: text })));
  ui.panelLinks.replaceChildren(...(c.links || []).map((link) => Object.assign(document.createElement('a'), {
    href: link.href, textContent: link.text, className: 'btn', target: '_blank', rel: 'noopener',
  })));
  ui.panel.classList.add('is-open');
  ui.panel.setAttribute('aria-hidden', 'false');
  ui.panel.scrollTop = 0;
  if (!savedView) savedView = { target: controls.target.clone(), position: camera.position.clone() };
  openId = id;
  focusOn(obj);
  ui.panelClose.focus({ preventScroll: true });
}

function closePanel() {
  if (!openId) return;
  openId = null;
  ui.panel.classList.remove('is-open');
  ui.panel.setAttribute('aria-hidden', 'true');
  if (savedView) flyTo(savedView.target, savedView.position, 1);
  savedView = null;
}
ui.panelClose.addEventListener('click', closePanel);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

// Khi khung thông tin mở, dịch khung hình 3D sang trái (máy tính) hoặc lên trên (điện thoại)
// để đồ vật không bị khung che mất
const shift = { x: 0, y: 0 };
function updateViewShift(dt) {
  let tx = 0;
  let ty = 0;
  if (openId) {
    if (window.innerWidth > 760) tx = (ui.panel.offsetWidth + 24) / 2;
    else ty = ui.panel.offsetHeight / 2;
  }
  const k = Math.min(1, dt * 5);
  shift.x += (tx - shift.x) * k;
  shift.y += (ty - shift.y) * k;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (Math.abs(shift.x) < 0.5 && Math.abs(shift.y) < 0.5) {
    if (camera.view?.enabled) camera.clearViewOffset();
  } else {
    camera.setViewOffset(w, h, shift.x, shift.y, w, h);
  }
}

// ===== 10. Chữ bay lên trên đồ vật =====
const tmp = new THREE.Vector3();
function popText(obj, text) {
  box3.setFromObject(obj);
  popAt(tmp.set((box3.min.x + box3.max.x) / 2, box3.max.y + 0.15, (box3.min.z + box3.max.z) / 2), text);
}
// Hiện chữ tại một điểm trong không gian 3D
function popAt(point, text) {
  tmp.copy(point).project(camera);
  const el = document.createElement('div');
  el.className = 'pop';
  el.textContent = text;
  el.style.left = `${(tmp.x * 0.5 + 0.5) * window.innerWidth}px`;
  el.style.top = `${(-tmp.y * 0.5 + 0.5) * window.innerHeight}px`;
  ui.fx.append(el);
  el.addEventListener('animationend', () => el.remove());
}
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

// ===== 11. Đếm số đồ vật đã khám phá =====
const allIds = Object.keys(world.clickables);
const found = new Set();
function showProgress() {
  ui.progress.textContent = found.size === allIds.length
    ? '🎉 Bạn đã khám phá hết căn phòng!'
    : `Đã khám phá ${found.size}/${allIds.length} đồ vật`;
}
function discover(id) {
  if (found.has(id)) return;
  found.add(id);
  showProgress();
  ui.progress.classList.toggle('is-done', found.size === allIds.length);
  ui.progress.classList.remove('is-bump');
  void ui.progress.offsetWidth; // mẹo nhỏ để chạy lại animation CSS
  ui.progress.classList.add('is-bump');
}
showProgress();

// ===== 12. Bấm vào đồ vật thì làm gì =====
function activate(id, obj) {
  // Mặt Trời, Mặt Trăng, các hành tinh: chỉ hiện một câu giới thiệu, không tính vào bộ đếm khám phá
  if (skyFacts[id]) {
    popText(obj, skyFacts[id]);
    return;
  }
  discover(id);
  switch (id) {
    case 'lamp':
      setNight(!nightTarget);
      popText(obj, nightTarget ? 'Tách! Chúc ngủ ngon 🌙' : 'Tách! Chào buổi sáng ☀️');
      break;
    case 'cat':
      world.cat.poke();
      popText(obj, pickOne(spaceTarget ? catSpaceLines : catLines));
      break;
    case 'plant':
      world.plant.water();
      popText(obj, pickOne(spaceTarget ? plantSpaceLines : plantLines));
      break;
    case 'guitar':
      popText(obj, '♪ ♫ ♪');
      openPanel(id, obj);
      break;
    default:
      openPanel(id, obj);
  }
}

// ===== 13. Chuột và cảm ứng =====
// Raycaster "bắn" một tia từ camera qua vị trí con trỏ để xem trúng vật nào
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
// Tia chuột vẫn trúng cả vật đang ẩn (ví dụ các hành tinh lúc còn ở trong nhà), nên phải lọc ra
const isShown = (obj) => {
  for (; obj; obj = obj.parent) if (!obj.visible) return false;
  return true;
};
function pickAt(x, y) {
  pointer.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(pickables, false).find((h) => isShown(h.object));
  let obj = hit?.object;
  while (obj && !obj.userData.id) obj = obj.parent; // leo lên tới group có id
  return obj || null;
}

let mouse = null;
let down = null;
let hovered = null;
ui.canvas.addEventListener('pointermove', (e) => {
  mouse = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY } : null;
});
ui.canvas.addEventListener('pointerleave', () => { mouse = null; });
ui.canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY, time: performance.now() };
});
ui.canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  const held = performance.now() - down.time;
  down = null;
  if (moved > 6 || held > 600) return; // đó là kéo xoay chứ không phải bấm
  const obj = pickAt(e.clientX, e.clientY);
  if (obj) activate(obj.userData.id, obj);
  else closePanel();
});

function updateHover(dt) {
  hovered = mouse && !down ? pickAt(mouse.x, mouse.y) : null;
  ui.canvas.style.cursor = hovered ? 'pointer' : '';
  const id = hovered && hovered.userData.id !== openId ? hovered.userData.id : null;
  const label = id ? (spaceTarget && spaceLabels[id]) || labels[id] || skyLabels[id] : '';
  ui.tooltip.classList.toggle('is-visible', Boolean(label));
  if (label) {
    ui.tooltip.textContent = label;
    ui.tooltip.style.setProperty('--x', `${mouse.x + 16}px`);
    ui.tooltip.style.setProperty('--y', `${mouse.y + 18}px`);
  }
  // Đồ vật đang được rê chuột vào thì phóng to nhẹ
  for (const obj of Object.values(world.clickables)) {
    const target = obj === hovered ? 1.07 : 1;
    obj.scale.setScalar(obj.scale.x + (target - obj.scale.x) * Math.min(1, dt * 12));
  }
}

// ===== 14. Co giãn theo kích thước cửa sổ =====
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  controls.maxDistance = homeRadius() * 1.35;
}
window.addEventListener('resize', resize);
resize();

// ===== 15. Màn mở đầu: camera bay từ xa vào =====
controls.target.copy(HOME_TARGET);
camera.position.copy(HOME_TARGET).add(
  new THREE.Vector3().setFromSpherical(new THREE.Spherical(homeRadius() * 2.2, 0.6, Math.PI / 4 - 0.6)),
);
camera.lookAt(controls.target);
flyTo(HOME_TARGET, homePosition(), 2.4, easeOut);

// ===== 16. Vòng lặp: mỗi khung hình cập nhật mọi thứ một chút rồi vẽ lại =====
let last = performance.now();
let firstFrame = true;
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const t = now / 1000;

  // Cất cánh / hạ cánh mất khoảng 2,6 giây (nếu máy đang bật "giảm chuyển động" thì gần như tức thì)
  const step = dt / (reduceMotion ? 0.3 : 2.6);
  world.spaceProgress = THREE.MathUtils.clamp(world.spaceProgress + (spaceTarget ? step : -step), 0, 1);
  world.space = THREE.MathUtils.smoothstep(world.spaceProgress, 0, 1);

  night += (Number(nightTarget) - night) * Math.min(1, dt * 2.2);
  applyNight(night);
  world.updaters.forEach((fn) => fn(t, dt));
  updateHover(dt);
  updateViewShift(dt);
  if (tween) updateTween(dt);
  else controls.update(dt);

  renderer.render(scene, camera);
  if (firstFrame) {
    firstFrame = false;
    ui.loader.classList.add('is-hidden');
  }
});

// Mở Console của trình duyệt (F12) và gõ "room" để nghịch thử, ví dụ:
//   room.setNight(true)
//   room.setSpace(true)
//   room.world.clickables.cat.position.x = 3
window.room = { THREE, scene, camera, renderer, controls, world, setNight, setSpace, pickAt };
