// main.js – "Bộ não" của căn phòng: dựng cảnh, camera, ánh sáng,
// xử lý chuột/chạm, chuyển ngày ↔ đêm, bay ra vũ trụ và vòng lặp vẽ hình.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildRoom, SUN_DIR, WALL_H, HATCH } from './room.js';
import { buildFurniture } from './furniture.js';
import { buildSpace } from './space.js';
import { buildIsland, insideIsland, ISLAND_TOP } from './island.js';
import { buildRealm } from './sky.js';
import {
  content, labels, spaceLabels, skyLabels, skyFacts, catLines, catSpaceLines, catPeekLines, plantLines, plantSpaceLines,
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
  panelCountdown: $('#panel-countdown'),
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
  Promise.all([
    document.fonts.load('800 40px "Be Vietnam Pro"'),
    document.fonts.load('40px "Patrick Hand"', 'Trâm Anh thuở ấy'), // chữ viết tay trên giấy note (cần cả bộ chữ có dấu tiếng Việt)
  ]),
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
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // kiểu bóng mềm nhất, viền bóng được làm nhoè cho khỏi răng cưa
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
// Xoay tự do 360° theo mọi hướng, cả ở Trái Đất lẫn ngoài vũ trụ: vòng ra sau tường, lên đỉnh đầu,
// hay chui xuống ngắm gầm hòn đảo đều được. Camera chỉ bị chặn không cho xuyên qua tường, sàn
// và khối đá dưới đảo (xem phần 15b).
// Riêng lúc hạ cánh mà camera đang ở dưới gầm thì bay vòng lên một góc dễ nhìn (xem backToRoomView).
const LANDING_VIEW = { maxPolar: 1.45, polar: 1.15 };

// ===== 5. Ánh sáng =====
const hemi = new THREE.HemisphereLight('#fff4ea', '#d8b89a', 2.2); // ánh sáng trời dịu, chiếu đều
const sun = new THREE.DirectionalLight('#fff0d4', 3.2);           // nắng chiếu qua cửa sổ
sun.position.copy(SUN_DIR).multiplyScalar(-25);
sun.castShadow = true;
// Bóng đổ được vẽ lên một tấm "bản đồ bóng". Tấm càng nhiều điểm ảnh và vùng phủ càng hẹp thì viền bóng càng mịn.
// Máy tính dùng tấm 4096 điểm ảnh; điện thoại (màn hẹp) dùng 2048 cho nhẹ máy.
const shadowSize = Math.min(window.innerWidth, window.innerHeight) < 700 ? 2048 : 4096;
sun.shadow.mapSize.set(shadowSize, shadowSize);
sun.shadow.radius = 2.5; // nhoè viền bóng thêm một chút
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 60 });
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
//  - sunDir: hướng Mặt Trời cố định ngoài vũ trụ; sunNow: hướng tia nắng (hay ánh trăng) đang chiếu lúc này (xem phần 7c)
const world = {
  scene, camera, sunDir: SUN_DIR, sunNow: SUN_DIR.clone(), golden: 0, rain: 0, updaters: [], nightFns: [], clickables: {}, floaters: [],
  night: 0, space: 0, spaceProgress: 0, spaceOn: false, reduceMotion,
};
buildRoom(world);
buildFurniture(world);
buildSpace(world);
buildIsland(world); // hòn đảo cổ tích dưới chân căn phòng (bối cảnh Trái Đất)
buildRealm(world);  // biển mây, đảo bay xa, Mặt Trời, trăng và sao quanh hòn đảo

// Bật đổ bóng cho mọi vật thể, và lập danh sách vật thể có thể "bắn tia" chuột trúng
const pickables = [];
scene.traverse((obj) => {
  if (!obj.isMesh) return;
  obj.castShadow = obj.receiveShadow = !obj.userData.noShadow;
  if (!obj.userData.noPick) pickables.push(obj);
});

// ===== 7. Ngày ↔ đêm =====
// Trời sáng tối theo giờ trên máy người xem (6 giờ sáng tới 6 giờ tối là ban ngày), để trang mở lâu thì tự chuyển.
// Người xem bấm nút "Buổi tối / Ban ngày" (hay bật tắt đèn bàn) thì thôi không tự chuyển nữa.
let clockOverride = null; // thử một giờ khác trong Console: room.setTime(17.5)
const hoursNow = () => {
  if (clockOverride !== null) return clockOverride;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};
const isNightHour = (h) => h >= 18 || h < 6;
let nightTarget = isNightHour(hoursNow()); // mở trang buổi tối thì phòng cũng tối
let night = nightTarget ? 1 : 0;
let manualNight = false;

function setNight(value, manual = false) {
  if (manual) manualNight = true;
  nightTarget = value;
  world.nightOn = value; // để đồ vật biết đang chọn ngày hay đêm (ví dụ đoạn code trên màn hình máy tính)
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
  updateSun(n);
  // Sáng sớm và chiều tà: nắng vàng cam, trời ửng hồng cam
  const g = world.golden;
  if (g > 0.001) {
    sun.color.lerp(GOLD_SUN, g * 0.75);
    hemi.color.lerp(GOLD_SKY, g * 0.35);
    sun.intensity *= 1 - 0.2 * g;
  }
  // Trời mưa: mây che bớt nắng, ánh sáng xám lại (xem buildWeather trong sky.js)
  const r = world.rain || 0;
  if (r > 0.001) {
    sun.intensity *= 1 - 0.65 * r;
    hemi.intensity *= 1 - 0.3 * r;
    hemi.color.lerp(RAIN_SKY, 0.45 * r);
  }
  tintSky(g, r);
  world.night = n;
  world.nightFns.forEach((fn) => fn(n));
}
setNight(nightTarget);
ui.nightBtn.addEventListener('click', () => setNight(!nightTarget, true));

// ===== 7c. Mặt Trời đi theo giờ thật =====
// Ở Trái Đất, Mặt Trời đi một vòng cung phía sau căn phòng theo giờ trên máy người xem: sáng sớm thấp bên trái,
// trưa lên cao nhất ngay sau cửa sổ, chiều tà xuống thấp bên phải. Lúc nào cũng ở sau bức tường có cửa sổ,
// nên nắng luôn rọi được vào phòng; vệt nắng trên sàn, bóng đổ, cầu vồng và biển mây cũng dịch theo.
// Ban đêm trăng đi một vòng cung y như vậy. Ra vũ trụ thì về đúng hướng Mặt Trời cố định ngoài đó (SUN_DIR).
const GOLD_SUN = new THREE.Color('#ffb46e');
const GOLD_SKY = new THREE.Color('#ffd2b0');
const RAIN_SKY = new THREE.Color('#b8b4c8');
const deg = THREE.MathUtils.degToRad;
// f: 0 lúc mọc (6 giờ), 1 lúc lặn (18 giờ) → hướng tia sáng đi tới
const arcDir = (f, out) => {
  const el = deg(22 + 40 * Math.sin(Math.PI * f));   // độ cao: 22° lúc mọc và lặn, 62° lúc trưa
  const az = deg(THREE.MathUtils.lerp(-60, 60, f));  // từ phía sau bên trái sang phía sau bên phải
  return out.set(-Math.cos(el) * Math.sin(az), -Math.sin(el), Math.cos(el) * Math.cos(az));
};
const dayDir = new THREE.Vector3();
const nightDir = new THREE.Vector3();
function updateSun(n) {
  const h = hoursNow();
  const nightHour = isNightHour(h);
  // Đêm mà người xem bật "Ban ngày" thì cho nắng buổi sáng; ngày mà bật "Buổi tối" thì trăng ở chỗ Mặt Trời
  arcDir(nightHour ? 0.3 : (h - 6) / 12, dayDir);
  if (nightHour) arcDir(((h - 18 + 24) % 24) / 12, nightDir);
  else nightDir.copy(dayDir);
  world.sunNow.copy(dayDir).lerp(nightDir, n).normalize().lerp(SUN_DIR, world.space).normalize();
  sun.position.copy(world.sunNow).multiplyScalar(-25);
  const elevation = Math.asin(-dayDir.y);
  world.golden = (1 - THREE.MathUtils.smoothstep(elevation, deg(22), deg(40))) * (1 - n) * (1 - world.space);
}

// Màu nền trời ban ngày ngả hồng cam lúc sáng sớm, chiều tà, ngả xám lúc mưa (đổi biến màu CSS, chỉ khi đổi đủ nhiều)
const SKY_1 = [new THREE.Color('#fff4ea'), new THREE.Color('#ffe4cc'), new THREE.Color('#e6e3ea')];
const SKY_2 = [new THREE.Color('#f7d3c1'), new THREE.Color('#f3a989'), new THREE.Color('#bdb8c8')];
const skyTmp = new THREE.Color();
let skyTint = [-1, -1];
function tintSky(g, r) {
  if (Math.abs(g - skyTint[0]) < 0.01 && Math.abs(r - skyTint[1]) < 0.01) return;
  skyTint = [g, r];
  const root = document.documentElement.style;
  const mix = (stops) => skyTmp.lerpColors(stops[0], stops[1], g).lerp(stops[2], r * 0.85).getStyle();
  root.setProperty('--day-1', mix(SKY_1));
  root.setProperty('--day-2', mix(SKY_2));
}

// Trang mở lâu: tới 6 giờ sáng hay 6 giờ tối thì tự chuyển ngày đêm (trừ khi người xem đã tự bấm chọn)
setInterval(() => {
  const want = isNightHour(hoursNow());
  if (!manualNight && want !== nightTarget) setNight(want);
}, 1000);
function setTime(h) {
  clockOverride = h;
}

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
  if (!value) backToRoomView();
}

// Hạ cánh: nếu camera đang ở dưới gầm sàn thì hòn đảo trồi lên sẽ che mất (hoặc kẹp camera vào trong đá),
// nên bay vòng lên một góc nhìn từ trên xuống, giữ nguyên hướng xoay và độ xa gần
function backToRoomView() {
  const offset = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
  if (offset.phi <= LANDING_VIEW.maxPolar) return; // đang nhìn từ trên xuống, không cần bay
  if (openId) { savedView = null; closePanel(); }
  offset.phi = LANDING_VIEW.polar;
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
  ui.panel.classList.toggle('is-locked', Boolean(c.locked)); // vùng cấm: nền mây mù và ổ khoá (xem room.css)
  ui.panelLinks.replaceChildren(...(c.links || []).map((link) => Object.assign(document.createElement('a'), {
    href: link.href, textContent: link.text, className: 'btn', target: '_blank', rel: 'noopener',
  })));
  startCountdown(c.unlock);
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
  startCountdown(null);
  ui.panel.classList.remove('is-open');
  ui.panel.setAttribute('aria-hidden', 'true');
  if (savedView) flyTo(savedView.target, savedView.position, 1);
  savedView = null;
}
ui.panelClose.addEventListener('click', closePanel);

// ===== 9a. Đếm ngược tới ngày mây tan (khung "vùng cấm") =====
// Mọi mốc thời gian đều dời sang giờ Việt Nam (UTC+7) rồi đọc bằng các hàm UTC, để ai ở múi giờ nào
// mở trang cũng đếm về cùng một thời khắc, và năm, tháng, ngày được cộng đúng theo lịch
const VN = 7 * 3600e3;
const UNITS = ['năm', 'tháng', 'ngày', 'giờ', 'phút', 'giây'];
let countdownTimer = 0;
const later = (d, field, n) => {
  const x = new Date(d);
  x[`setUTC${field}`](x[`getUTC${field}`]() + n);
  return x;
};
function timeLeft(end) {
  let cursor = new Date(Date.now() + VN);
  const goal = new Date(end.getTime() + VN);
  if (cursor >= goal) return null;
  const count = (field) => {
    let n = 0;
    while (later(cursor, field, 1) <= goal) {
      cursor = later(cursor, field, 1);
      n++;
    }
    return n;
  };
  const years = count('FullYear');
  const months = count('Month');
  const days = count('Date');
  const s = Math.floor((goal - cursor) / 1000);
  return [years, months, days, Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60];
}
function startCountdown(unlock) {
  clearInterval(countdownTimer);
  ui.panelCountdown.hidden = !unlock;
  if (!unlock) return;
  const end = new Date(unlock.at);
  const label = Object.assign(document.createElement('p'), { className: 'countdown__label' });
  const grid = Object.assign(document.createElement('div'), { className: 'countdown__grid' });
  const cells = UNITS.map((unit) => {
    const cell = Object.assign(document.createElement('span'), { className: 'countdown__unit' });
    const num = document.createElement('b');
    cell.append(num, unit);
    grid.append(cell);
    return num;
  });
  ui.panelCountdown.replaceChildren(label, grid);
  const tick = () => {
    const left = timeLeft(end);
    label.textContent = left ? 'Mây sẽ tan sau' : 'Đã tới ngày hẹn ☀️';
    grid.hidden = !left;
    if (!left) return clearInterval(countdownTimer);
    left.forEach((n, i) => { cells[i].textContent = i < 3 ? n : String(n).padStart(2, '0'); });
    grid.setAttribute('aria-label', left.map((n, i) => `${n} ${UNITS[i]}`).join(' '));
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}
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

// ===== 10b. Mèo bắt quả tang ai soi qua ô kính cửa khoang =====
// Camera đứng ngoài tường trái, và đường nhìn từ camera tới mèo chui lọt qua lỗ ô kính
// thì coi như đang soi. Soi quá nửa giây là mèo quay mặt ra cửa và lên tiếng.
// Ở Trái Đất hay ngoài vũ trụ đều vậy, vì cửa khoang lúc nào cũng có.
const peekPoint = new THREE.Vector3();
let peekTime = 0;
let peekCooldown = 0;
world.updaters.push((t, dt) => {
  peekCooldown = Math.max(0, peekCooldown - dt);
  const cat = world.clickables.cat;
  const eye = camera.position;
  let peeking = false;
  if (eye.x < -5.6) {
    peekPoint.set(cat.position.x, cat.position.y + 0.3, cat.position.z);
    const k = (-5.15 - eye.x) / (peekPoint.x - eye.x); // chỗ đường nhìn cắt qua giữa bề dày tường
    const y = eye.y + (peekPoint.y - eye.y) * k;
    const z = eye.z + (peekPoint.z - eye.z) * k;
    const throughHatch = Math.hypot(y - HATCH.y, z - HATCH.z) < HATCH.r * 0.9;
    peekPoint.project(camera); // mèo có đang nằm trong khung hình không
    peeking = throughHatch && Math.abs(peekPoint.x) < 1 && Math.abs(peekPoint.y) < 1 && peekPoint.z < 1;
  }
  peekTime = peeking ? peekTime + dt : 0;
  const caught = peekTime > 0.5;
  world.cat.stare(caught ? { x: -5.15, z: HATCH.z } : null);
  if (caught && peekCooldown === 0) {
    popText(cat, pickOne(catPeekLines));
    peekCooldown = 5;
  }
});

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
      setNight(!nightTarget, true);
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
  controls.maxDistance = homeRadius() * 1.75; // lùi xa được đủ để ngắm trọn hòn đảo lơ lửng
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

// ===== 15b. Không cho camera zoom xuyên qua tường hay sàn từ bên ngoài =====
// Căn phòng chỉ có tường sau (z = -5.3), tường trái (x = -5.3) và sàn (y = -0.5); ba phía còn lại để hở.
// Nhìn từ tâm ra phía camera: nếu tia này đâm vào tường/sàn trước khi ra tới phía hở, và camera đang ở
// bên ngoài bức tường đó, thì chặn không cho zoom vào gần hơn mặt tường (cộng thêm một khoảng lùi).
const guardDir = new THREE.Vector3();
function guardWalls() {
  const T = controls.target;
  const dist = guardDir.copy(camera.position).sub(T).length();
  const d = guardDir.divideScalar(dist);
  let wall = Infinity; // quãng đường từ tâm tới tường/sàn theo hướng camera
  let open = Infinity; // quãng đường từ tâm tới phía để hở
  if (d.x < 0) wall = Math.min(wall, (-5.3 - T.x) / d.x); else if (d.x > 0) open = Math.min(open, (5 - T.x) / d.x);
  if (d.z < 0) wall = Math.min(wall, (-5.3 - T.z) / d.z); else if (d.z > 0) open = Math.min(open, (5 - T.z) / d.z);
  if (d.y < 0) wall = Math.min(wall, (-0.5 - 0.9 * world.space - T.y) / d.y); else if (d.y > 0) open = Math.min(open, (WALL_H - T.y) / d.y);
  const outside = wall < open && dist > wall;
  controls.minDistance = Math.max(4, outside ? wall + 1.6 : 0, islandExit(T, d));
}

// Nhìn từ dưới lên ở Trái Đất: tia từ tâm ra camera chui qua mặt cỏ, xuyên qua đất đá rồi mới ló ra ngoài.
// Camera phải đứng ngoài chỗ ló ra đó (cộng một khoảng lùi), không thì chui tọt vào trong lòng đảo.
// Đi dần dọc theo tia từng bước nhỏ cho tới khi ra khỏi khối đảo. Lúc đang cất cánh thì đảo đã rời đi nên bỏ qua.
function islandExit(T, d) {
  if (d.y > -0.02 || world.spaceProgress > 0.1) return 0;
  let s = (ISLAND_TOP - T.y) / d.y; // chỗ tia chạm mặt cỏ
  if (!insideIsland(T.x + d.x * s, ISLAND_TOP - 0.05, T.z + d.z * s)) return 0; // tia đi ra ngoài mép đảo
  for (let i = 0; i < 200 && insideIsland(T.x + d.x * s, T.y + d.y * s, T.z + d.z * s); i++) s += 0.25;
  return s + 1.2;
}

// ===== 15c. Nền trang theo độ cao của căn phòng =====
// Vừa rời mặt đất: nền chuyển sang trời xanh của bầu khí quyển. Lên cao dần: trời tối lại thành vũ trụ.
// Chỉ ghi vào CSS khi giá trị đổi, để trình duyệt khỏi phải vẽ lại nền mỗi khung hình.
const skyVars = { bg: -1, atmo: -1 };
function updateSkyBackground(p) {
  const ss = THREE.MathUtils.smoothstep;
  const bg = Math.round(ss(p, 0.04, 0.3) * 1000) / 1000;
  const atmo = Math.round(ss(p, 0.04, 0.25) * (1 - ss(p, 0.35, 0.8)) * 1000) / 1000;
  if (bg !== skyVars.bg) document.body.style.setProperty('--space-bg', String((skyVars.bg = bg)));
  if (atmo !== skyVars.atmo) document.body.style.setProperty('--atmo', String((skyVars.atmo = atmo)));
}

// ===== 16. Vòng lặp: mỗi khung hình cập nhật mọi thứ một chút rồi vẽ lại =====
let last = performance.now();
let firstFrame = true;
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const t = now / 1000;

  // Cất cánh / hạ cánh mất khoảng 4,5 giây (nếu máy đang bật "giảm chuyển động" thì gần như tức thì)
  const step = dt / (reduceMotion ? 0.3 : 4.5);
  world.spaceProgress = THREE.MathUtils.clamp(world.spaceProgress + (spaceTarget ? step : -step), 0, 1);
  world.space = THREE.MathUtils.smoothstep(world.spaceProgress, 0, 1);
  updateSkyBackground(world.spaceProgress);

  night += (Number(nightTarget) - night) * Math.min(1, dt * 2.2);
  applyNight(night);
  world.updaters.forEach((fn) => fn(t, dt));
  updateHover(dt);
  updateViewShift(dt);
  if (tween) updateTween(dt);
  else {
    guardWalls();
    controls.update(dt);
  }

  renderer.render(scene, camera);
  if (firstFrame) {
    firstFrame = false;
    ui.loader.classList.add('is-hidden');
  }
});

// Mở Console của trình duyệt (F12) và gõ "room" để nghịch thử, ví dụ:
//   room.setNight(true)
//   room.setSpace(true)
//   room.setTime(17.5)   (xem trời lúc 5 rưỡi chiều; room.setTime(null) để về giờ thật)
//   room.world.clickables.cat.position.x = 3
window.room = { THREE, scene, camera, renderer, controls, world, setNight, setSpace, setTime, pickAt };
