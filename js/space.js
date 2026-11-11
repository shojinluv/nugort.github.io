// space.js – Chế độ "Vũ trụ": cả căn phòng nhỏ bay ra ngoài quỹ đạo.
// File này dựng bầu trời sao, Trái Đất, Mặt Trăng và sao băng,
// đồng thời lo việc cho đồ đạc trôi lơ lửng (không trọng lực).
//
// Ba giá trị trong "world" do main.js cập nhật mỗi khung hình:
//  - world.spaceProgress: chạy đều từ 0 → 1 trong lúc cất cánh (và 1 → 0 lúc hạ cánh)
//  - world.space:         giống spaceProgress nhưng tăng giảm êm hơn, dùng để làm mờ dần
//  - world.spaceOn:       true nếu đang bay lên / đang ở ngoài vũ trụ
import * as THREE from 'three';
import { at, canvasTexture, decoration } from './helpers.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => x * x * (3 - 2 * x);

// Bộ số ngẫu nhiên riêng cho vũ trụ (cũng có "hạt giống" nên lần nào tải trang cũng giống nhau).
// Dùng riêng để không làm xáo trộn chuỗi random() đã dùng để dựng căn phòng.
let seed = 7;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

// Đổi một vị trí "trong khung hình" ra toạ độ 3D, tính theo góc nhìn mặc định lúc mở trang.
// x, y chạy từ -1 → 1 (trái → phải, dưới → trên), d là khoảng cách tính từ camera.
const HOME_TARGET = new THREE.Vector3(0.2, 1.5, 0.2);
const HOME_CAM = HOME_TARGET.clone().add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(23, 1.0, Math.PI / 4)));
// Ba hướng của camera lúc ở góc nhìn mặc định: nhìn tới, sang phải, lên trên
function homeBasis() {
  const forward = HOME_TARGET.clone().sub(HOME_CAM).normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward);
  return { forward, right, up };
}
function inView(x, y, d) {
  const { forward, right, up } = homeBasis();
  const tan = Math.tan(THREE.MathUtils.degToRad(35 / 2)); // nửa góc nhìn dọc của camera
  return HOME_CAM.clone()
    .addScaledVector(forward, d)
    .addScaledVector(right, x * tan * 1.6 * d)
    .addScaledVector(up, y * tan * d);
}

// ======================================================================
// Đồ đạc trôi lơ lửng
// ======================================================================

/**
 * Đăng ký một vật sẽ trôi lơ lửng khi căn phòng ra ngoài vũ trụ. Gọi lúc dựng đồ vật.
 *  lift:  trôi lệch khỏi chỗ cũ bao xa theo (x, y, z)
 *  tilt:  lắc nghiêng nhiều hay ít quanh 3 trục (radian)
 *  spin:  xoay tròn quanh trục đứng, radian mỗi giây (0 = không xoay)
 *  delay: bay lên trễ một chút (0 → 0.4) để đồ đạc không cất cánh cùng một lúc
 *  bob:   nhấp nhô lên xuống nhiều hay ít
 */
export function floaty(world, obj, { lift = [0, 0.5, 0], tilt = [0.2, 0.2, 0.2], spin = 0, delay = 0, bob = 0.06 } = {}) {
  const i = world.floaters.length;
  world.floaters.push({
    obj, tilt, spin, delay, bob,
    lift: new THREE.Vector3(...lift),
    phase: i * 1.7,                  // mỗi vật lắc lư lệch nhịp nhau một chút
    speed: 0.5 + (i % 5) * 0.09,
    spinAngle: 0,
    active: false,
    basePos: new THREE.Vector3(),
    baseQuat: new THREE.Quaternion(),
    center: new THREE.Vector3(),
  });
  return obj;
}

const box3 = new THREE.Box3();
const euler = new THREE.Euler();
const quat = new THREE.Quaternion();

function updateFloaters(world, t, dt) {
  const motion = world.reduceMotion ? 0 : 1; // người dùng muốn ít chuyển động → chỉ bay lên, không lắc
  for (const f of world.floaters) {
    const e = smooth(clamp01((world.spaceProgress - f.delay) / 0.6)); // 0 = nằm yên, 1 = trôi hẳn
    if (e === 0 && !f.active) continue;
    const { obj } = f;

    if (!f.active) {
      // Vừa bắt đầu bay: ghi nhớ chỗ cũ, và tìm tâm của vật để xoay quanh tâm thay vì quanh chân
      f.active = true;
      f.basePos.copy(obj.position);
      f.baseQuat.copy(obj.quaternion);
      obj.updateWorldMatrix(true, true);
      obj.parent.worldToLocal(box3.setFromObject(obj).getCenter(f.center));
    }

    if (world.spaceOn) {
      f.spinAngle += f.spin * e * dt * motion;
    } else {
      // Đang hạ cánh: quay nốt cho tròn vòng để về đúng tư thế cũ
      const home = Math.round(f.spinAngle / (Math.PI * 2)) * Math.PI * 2;
      f.spinAngle += (home - f.spinAngle) * Math.min(1, dt * 4);
    }

    if (e === 0) {
      // Đã đáp xuống hẳn: trả về đúng vị trí ban đầu rồi thôi không đụng tới nữa
      obj.position.copy(f.basePos);
      obj.quaternion.copy(f.baseQuat);
      f.active = false;
      f.spinAngle = 0;
      continue;
    }

    const a = t * f.speed + f.phase;
    const w = e * motion;
    euler.set(
      f.tilt[0] * w * Math.sin(a),
      f.spinAngle + f.tilt[1] * w * Math.sin(a * 0.7 + 1),
      f.tilt[2] * w * Math.cos(a * 0.8),
    );
    quat.setFromEuler(euler);
    // Xoay quanh tâm: dời về tâm → xoay → dời ra lại, rồi cộng thêm quãng trôi
    obj.position.copy(f.basePos).sub(f.center).applyQuaternion(quat).add(f.center).addScaledVector(f.lift, e);
    obj.position.y += f.bob * w * Math.sin(a * 1.3);
    obj.quaternion.copy(quat).multiply(f.baseQuat);
  }
}

// ======================================================================
// Bầu trời sao, Dải Ngân Hà, Mặt Trời, các hành tinh, Trái Đất, Mặt Trăng, sao băng
// ======================================================================

export function buildSpace(world) {
  const group = new THREE.Group();
  group.name = 'vũ trụ';
  world.scene.add(group);

  const stars = buildStars(group);
  const milkyWay = buildMilkyWay(stars.group); // Ngân Hà quay cùng bầu trời sao
  const earth = buildEarth(group);
  const moon = buildMoon(group);
  const sun = buildSun(group, world.sunDir);
  const planets = buildPlanets(group, world.sunDir);
  const shootingStar = buildShootingStar(group, world);
  group.traverse(decoration); // không bấm được, không đổ bóng

  // Những thiên thể bấm được (xem skyFacts trong content.js): gắn thêm một quả cầu tàng hình
  // to hơn thiên thể một chút, để chấm sáng bé xíu cũng dễ rê chuột và bấm trúng
  skyTarget(earth.group, 'earth', 41);
  skyTarget(moon.moon, 'moon', 6);
  skyTarget(sun.group, 'sun', 7);
  planets.list.forEach((p) => skyTarget(p.group, p.id, 2.6));

  world.updaters.push((t, dt) => {
    const s = world.space;
    group.visible = s > 0.001;
    if (group.visible) {
      // Sao lấp lánh: mỗi lớp sao sáng tối lệch nhịp nhau
      stars.layers.forEach((m, i) => {
        m.opacity = s * (0.75 + 0.25 * Math.sin(t * (0.8 + i * 0.6) + i * 2));
      });
      stars.group.rotation.y = t * 0.003; // cả bầu trời trôi rất chậm, như đang bay quanh quỹ đạo
      milkyWay.material.opacity = s;
      milkyWay.starsMat.opacity = s * 0.9;
      sun.update(s, world.night, t);
      planets.update(s, t);

      earth.surface.rotation.y += dt * 0.012; // Trái Đất tự quay
      earth.clouds.rotation.y += dt * 0.018;  // mây trôi nhanh hơn mặt đất một chút
      earth.surfaceMat.opacity = s;
      earth.surfaceMat.emissiveIntensity = world.night * 1.4; // ban đêm thì đèn thành phố sáng lên
      earth.cloudMat.opacity = s * 0.9;
      earth.haloMat.opacity = s * (0.85 - 0.35 * world.night);
      moon.material.opacity = s;

      shootingStar(dt, s);
    }
    updateFloaters(world, t, dt);
  });
}

// ---------- Sao: 3 lớp điểm sáng to nhỏ khác nhau, rải đều trên một mặt cầu lớn ----------
function buildStars(group) {
  const dot = canvasTexture(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.35, 'rgba(255, 255, 255, 0.8)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  const palette = ['#ffffff', '#ffffff', '#d6e4ff', '#fff0c8', '#ffd9ec'].map((c) => new THREE.Color(c));

  const starGroup = new THREE.Group();
  group.add(starGroup);
  const layers = [[900, 2], [320, 3.2], [80, 5]].map(([count, size]) => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = rand() * 2 - 1;          // điểm ngẫu nhiên phân bố đều trên mặt cầu
      const a = rand() * Math.PI * 2;
      const r = 140 + rand() * 50;
      const k = Math.sqrt(1 - u * u);
      pos.set([Math.cos(a) * k * r, u * r, Math.sin(a) * k * r], i * 3);
      palette[Math.floor(rand() * palette.length)].toArray(col, i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const material = new THREE.PointsMaterial({
      size, map: dot, vertexColors: true, sizeAttenuation: false, // size tính bằng pixel, xa gần như nhau
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    starGroup.add(new THREE.Points(geometry, material));
    return material;
  });
  return { group: starGroup, layers };
}

// ---------- Trái Đất: quả cầu lớn ở phía dưới, có mây, quầng khí quyển và đèn thành phố ----------
function buildEarth(group) {
  const R = 40;
  const earth = new THREE.Group();
  earth.position.copy(inView(-0.6, -1.25, 135));
  earth.rotation.set(0.3, 0, 0.35); // trục Trái Đất hơi nghiêng
  group.add(earth);

  const land = makeLand();
  const surfaceMat = new THREE.MeshStandardMaterial({
    map: canvasTexture(1024, 512, (ctx, w, h) => drawEarth(ctx, w, h, land)),
    emissiveMap: canvasTexture(1024, 512, (ctx, w, h) => drawCityLights(ctx, w, h, land)),
    emissive: '#ffffff',
    emissiveIntensity: 0,
    roughness: 0.9,
    transparent: true,
  });
  const surface = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), surfaceMat);

  const cloudMat = new THREE.MeshStandardMaterial({
    map: canvasTexture(1024, 512, drawClouds), transparent: true, depthWrite: false, roughness: 1,
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 64, 48), cloudMat);

  // Quầng khí quyển: một tấm hình luôn quay mặt về camera, vẽ sẵn một vòng sáng xanh.
  // Phần giữa bị chính Trái Đất che mất, nên chỉ còn viền sáng lộ ra quanh mép.
  const haloMat = new THREE.SpriteMaterial({
    map: canvasTexture(256, 256, drawHalo), transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.setScalar(R * 2.5);

  // Vẽ những thứ ở rất xa này trước mọi vật trong suốt trong phòng (tia nắng, bụi, mũ bong bóng…)
  surface.renderOrder = -3;
  clouds.renderOrder = -2;
  halo.renderOrder = -1;
  earth.add(surface, clouds, halo);
  return { group: earth, surface, clouds, surfaceMat, cloudMat, haloMat };
}

// Lục địa: mỗi lục địa là một chuỗi hình tròn chồng lên nhau, nối đuôi nhau theo kiểu "bước ngẫu nhiên"
function makeLand() {
  const blobs = [];
  for (let c = 0; c < 7; c++) {
    let x = rand() * 1024;
    let y = 130 + rand() * 250;
    const steps = 18 + Math.floor(rand() * 22);
    const tone = Math.floor(rand() * 3);
    for (let i = 0; i < steps; i++) {
      blobs.push({ x, y, r: 14 + rand() * 30, tone: rand() < 0.75 ? tone : (tone + 1) % 3 });
      x += (rand() - 0.5) * 60;
      y = Math.min(420, Math.max(90, y + (rand() - 0.5) * 44));
    }
  }
  return blobs;
}

// Vẽ hình tròn/elip; nếu tràn qua mép trái hay phải thì vẽ thêm ở mép bên kia,
// để khi bọc tấm hình quanh quả cầu thì chỗ nối không bị đứt
function wrapEllipse(ctx, w, x, y, rx, ry = rx) {
  for (const dx of [-w, 0, w]) {
    if (x + dx + rx < 0 || x + dx - rx > w) continue;
    ctx.beginPath();
    ctx.ellipse(x + dx, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEarth(ctx, w, h, land) {
  const sea = ctx.createLinearGradient(0, 0, 0, h);
  sea.addColorStop(0, '#2d5fae');
  sea.addColorStop(0.5, '#2f86d6');
  sea.addColorStop(1, '#2d5fae');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(120, 205, 240, 0.45)'; // vùng nước nông quanh bờ
  land.forEach((b) => wrapEllipse(ctx, w, b.x, b.y, b.r + 10));
  const tones = ['#69b86a', '#8cc463', '#d9c27f']; // rừng, đồng cỏ, sa mạc
  land.forEach((b) => {
    ctx.fillStyle = tones[b.tone];
    wrapEllipse(ctx, w, b.x, b.y, b.r);
  });

  // Hai chỏm băng ở hai cực
  ctx.fillStyle = '#f4fbff';
  for (const top of [true, false]) {
    ctx.beginPath();
    ctx.moveTo(0, top ? 0 : h);
    for (let x = 0; x <= w; x += 16) {
      ctx.lineTo(x, top ? 34 + Math.sin(x * 0.03) * 8 : h - 30 - Math.sin(x * 0.025 + 1) * 8);
    }
    ctx.lineTo(w, top ? 0 : h);
    ctx.fill();
  }
}

// Đèn thành phố: chấm vàng li ti trên đất liền, nền đen (chỗ đen sẽ không phát sáng)
function drawCityLights(ctx, w, h, land) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffcf6e';
  land.forEach((b) => {
    for (let i = 0; i < 6; i++) {
      const a = rand() * Math.PI * 2;
      const d = rand() * b.r * 0.9;
      ctx.globalAlpha = 0.5 + rand() * 0.5;
      wrapEllipse(ctx, w, b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 0.8 + rand() * 1.6);
    }
  });
  ctx.globalAlpha = 1;
}

function drawClouds(ctx, w, h) {
  for (let i = 0; i < 60; i++) {
    const x = rand() * w;
    const y = 60 + rand() * (h - 120);
    const puffs = 3 + Math.floor(rand() * 6);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + rand() * 0.4})`;
    for (let k = 0; k < puffs; k++) {
      wrapEllipse(ctx, w, x + k * 14, y + Math.sin(k * 1.3) * 5, 16 + rand() * 14, 6 + rand() * 4);
    }
  }
}

function drawHalo(ctx, w) {
  const c = w / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, 'rgba(110, 180, 255, 0)');
  g.addColorStop(0.78, 'rgba(110, 180, 255, 0)');
  g.addColorStop(0.85, 'rgba(150, 210, 255, 0.85)');
  g.addColorStop(1, 'rgba(110, 180, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, w);
}

// ---------- Mặt Trăng nhỏ ở bên trái căn phòng ----------
function buildMoon(group) {
  const texture = canvasTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#d9d6e3';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(120, 116, 140, ${0.15 + rand() * 0.25})`; // miệng núi lửa
      wrapEllipse(ctx, w, rand() * w, 10 + rand() * (h - 20), 2 + rand() * 9);
    }
  });
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 1, transparent: true });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(4.5, 32, 24), material);
  moon.position.copy(inView(-0.78, 0.35, 170));
  moon.renderOrder = -3;
  group.add(moon);
  return { moon, material };
}

// ---------- Sao băng: thỉnh thoảng một vệt sáng vụt qua nửa trên khung hình ----------
function buildShootingStar(group, world) {
  // Vệt sáng: đuôi mờ dần bên trái, đầu sáng tròn bên phải
  const texture = canvasTexture(256, 16, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255, 255, 255, 0)');
    g.addColorStop(0.85, 'rgba(220, 235, 255, 0.7)');
    g.addColorStop(1, 'rgba(255, 255, 255, 1)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w - h / 2, 0);
    ctx.arc(w - h / 2, h / 2, h / 2, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fill();
  });
  const material = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.scale.set(16, 0.5, 1);
  mesh.visible = false;
  group.add(mesh);

  const LIFE = 1.1;
  const velocity = new THREE.Vector3();
  const dir = new THREE.Vector3();
  let life = 0;
  let wait = 3;
  return (dt, s) => {
    if (life > 0) {
      life -= dt;
      mesh.position.addScaledVector(velocity, dt);
      material.opacity = Math.sin(clamp01(life / LIFE) * Math.PI) * s;
      mesh.visible = life > 0;
      return;
    }
    wait -= dt;
    const camera = world.camera;
    if (wait > 0 || s < 0.95 || world.reduceMotion || !camera) return;
    wait = 4 + rand() * 6;
    life = LIFE;
    // Xuất phát từ một điểm ngẫu nhiên ở nửa trên khung hình, cách camera 120 đơn vị
    dir.set(rand() * 1.6 - 0.8, 0.15 + rand() * 0.7, 0.5).unproject(camera).sub(camera.position).normalize();
    mesh.position.copy(camera.position).addScaledVector(dir, 120);
    // Quay mặt về phía camera, rồi nghiêng chéo xuống bên phải hoặc bên trái
    mesh.quaternion.copy(camera.quaternion);
    mesh.rotateZ(rand() < 0.5 ? -0.45 : Math.PI + 0.45);
    velocity.set(1, 0, 0).applyQuaternion(mesh.quaternion).multiplyScalar(70);
    mesh.visible = true;
  };
}

// ---------- Biến một thiên thể thành thứ bấm được ----------
// Gắn id vào nó, kèm một quả cầu tàng hình (vẫn bắt được tia chuột) to hơn thiên thể một chút
function skyTarget(obj, id, radius) {
  const hit = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noShadow = true;
  obj.add(hit);
  obj.userData.id = id;
}

// ---------- Dải Ngân Hà: một dải sáng mờ vắt ngang bầu trời ----------
// Vẽ dải sáng nằm ngang giữa một tấm hình chữ nhật, dán lên mặt trong của một quả cầu lớn,
// rồi xoay quả cầu cho dải sáng vắt chéo qua bầu trời phía sau căn phòng.
const gauss = () => (rand() + rand() + rand() + rand() - 2) / 2;   // số ngẫu nhiên dồn về giữa
const coreness = (u) => Math.exp(-(((u - 0.5) / 0.14) ** 2));     // 1 ở lõi Ngân Hà, 0 ở xa
const bandWidth = (u) => 0.1 + 0.08 * coreness(u);                // gần lõi thì dải sáng phình to hơn

function buildMilkyWay(parent) {
  const material = new THREE.MeshBasicMaterial({
    map: canvasTexture(2048, 1024, drawMilkyWay), side: THREE.BackSide, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(200, 64, 32), material);

  // Sao li ti dày đặc trong dải sáng: dùng điểm sáng thật cho sắc nét
  // (vẽ lên tấm hình thì bị phóng to, trông lấm tấm như tuyết)
  const count = 3500;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const cool = new THREE.Color('#cdd7ff');
  const warm = new THREE.Color('#ffe6c4');
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // Cùng cách quy đổi toạ độ với tấm hình bọc quanh quả cầu: u chạy vòng quanh, v từ đỉnh xuống đáy
    const u = rand();
    const v = 0.5 + gauss() * bandWidth(u);
    const phi = u * Math.PI * 2;
    const theta = v * Math.PI;
    const r = 195;
    pos.set([-r * Math.cos(phi) * Math.sin(theta), r * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta)], i * 3);
    color.copy(cool).lerp(warm, coreness(u) * rand()).toArray(col, i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const starsMat = new THREE.PointsMaterial({
    size: 1.6, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  mesh.add(new THREE.Points(geometry, starsMat));
  // Giữa tấm hình (lõi Ngân Hà, chỗ sáng nhất) nằm ở hướng +x của quả cầu, dải sáng nằm trên mặt phẳng ngang.
  // Ta chọn: dải sáng chạy chéo từ dưới trái lên trên phải, lõi nằm ở phía trên bên phải khung hình.
  const { forward, right, up } = homeBasis();
  const normal = right.clone().sub(up).normalize(); // hướng vuông góc với dải sáng
  const core = forward.clone().addScaledVector(right.clone().add(up).normalize(), 0.5).projectOnPlane(normal).normalize();
  const side = new THREE.Vector3().crossVectors(core, normal);
  mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(core, normal, side));
  mesh.renderOrder = -4;
  parent.add(mesh);
  return { material, starsMat };
}

function drawMilkyWay(ctx, w, h) {
  const puff = (x, y, r, color) => {
    for (const dx of [-w, 0, w]) {                                   // vẽ lặp qua mép để chỗ nối liền mạch
      if (x + dx + r < 0 || x + dx - r > w) continue;
      const g = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x + dx - r, y - r, r * 2, r * 2);
    }
  };

  // 1. Hàng nghìn đám mây sáng mờ cộng dồn lại thành dải: lõi ấm màu vàng, hai đầu xanh tím
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 1800; i++) {
    const u = rand();
    const c = coreness(u);
    const a = (0.025 + 0.04 * c).toFixed(3);
    const warm = rand() < c * 0.9;
    puff(u * w, h / 2 + gauss() * h * (bandWidth(u) - 0.01), 10 + rand() * 40 * (0.6 + c),
      warm ? `rgba(255, 224, 186, ${a})` : `rgba(168, 184, 255, ${a})`);
  }

  // 2. Những dải bụi tối uốn lượn chạy dọc giữa dải sáng (xoá bớt ánh sáng đi)
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 520; i++) {
    const u = 0.2 + rand() * 0.6;
    puff(u * w, h / 2 + Math.sin(u * 40) * 7 + gauss() * 10, 6 + rand() * 18, 'rgba(0, 0, 0, 0.35)');
  }
  ctx.globalCompositeOperation = 'source-over';

  // 3. Làm mịn: các đám mây rất mờ cộng dồn lại để lộ ra vân ô lưới (do màu chỉ có 256 mức).
  // Thu nhỏ tấm hình còn 1/4 rồi phóng to lại, các điểm ảnh được trộn vào nhau nên vân lưới tan đi.
  const small = document.createElement('canvas');
  small.width = w / 4;
  small.height = h / 4;
  const sctx = small.getContext('2d');
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(ctx.canvas, 0, 0, small.width, small.height);
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(small, 0, 0, w, h);
}

// ---------- Mặt Trời: đặt đúng hướng nắng đang chiếu vào cửa sổ ----------
function buildSun(group, sunDir) {
  const sun = new THREE.Group();
  sun.position.copy(sunDir).multiplyScalar(-170); // sunDir là hướng ánh nắng đi tới, nên Mặt Trời ở phía ngược lại
  group.add(sun);

  const coreMat = new THREE.MeshBasicMaterial({ color: '#fffaf0', transparent: true, toneMapped: false });
  const core = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 16), coreMat);
  const sprite = (draw, scale) => {
    const material = new THREE.SpriteMaterial({
      map: canvasTexture(256, 256, draw), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, toneMapped: false,
    });
    const s = new THREE.Sprite(material);
    s.scale.setScalar(scale);
    s.renderOrder = -1;
    sun.add(s);
    return material;
  };
  const glowMat = sprite(drawSunGlow, 36);
  const raysMat = sprite(drawSunRays, 64); // tia chói hình chữ thập, kiểu ảnh chụp ngoài vũ trụ
  core.renderOrder = -3;
  sun.add(core);

  return {
    group: sun,
    update(s, night, t) {
      // Bấm "Buổi tối" khi đang ở ngoài vũ trụ = căn phòng bay vào vùng bóng của Trái Đất, Mặt Trời khuất mất
      const k = s * (1 - night);
      sun.visible = k > 0.01;
      coreMat.opacity = k;
      glowMat.opacity = k;
      raysMat.opacity = k * 0.55;
      raysMat.rotation = t * 0.015;
    },
  };
}

function drawSunGlow(ctx, w) {
  const c = w / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.12, 'rgba(255, 248, 225, 0.9)');
  g.addColorStop(0.35, 'rgba(255, 214, 150, 0.25)');
  g.addColorStop(1, 'rgba(255, 190, 120, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, w);
}

function drawSunRays(ctx, w) {
  const c = w / 2;
  ctx.translate(c, c);
  for (let i = 0; i < 6; i++) {
    const long = i % 3 === 0; // hai tia dài nằm ngang và dọc, bốn tia ngắn nằm chéo
    const len = long ? c : c * 0.55;
    const g = ctx.createLinearGradient(-len, 0, len, 0);
    g.addColorStop(0, 'rgba(255, 245, 220, 0)');
    g.addColorStop(0.5, `rgba(255, 245, 220, ${long ? 0.9 : 0.5})`);
    g.addColorStop(1, 'rgba(255, 245, 220, 0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.rotate((i * Math.PI) / 3 + (long ? 0 : Math.PI / 6));
    ctx.fillRect(-len, -1.5, len * 2, 3);
    ctx.restore();
  }
}

// ---------- Tám hành tinh ----------
// Nhìn từ quỹ đạo Trái Đất, các hành tinh chỉ là những chấm sáng nằm dọc "hoàng đạo": một vòng tròn lớn
// trên bầu trời đi qua Mặt Trời. Sao Thuỷ và sao Kim ở phía trong nên luôn quanh quẩn gần Mặt Trời,
// các hành tinh phía ngoài thì trôi dần dọc theo hoàng đạo.
//  at:    vị trí lúc mở trang (độ, tính từ Mặt Trời dọc theo hoàng đạo)
//  speed: trôi bao nhiêu độ mỗi giây (đã tua nhanh cho vui; thật ra chậm hơn rất rất nhiều)
//  swing: với sao Thuỷ, sao Kim: chỉ đung đưa qua lại quanh Mặt Trời, xa nhất bấy nhiêu độ
//  size:  bán kính (đã phóng to lên nhiều lần để nhìn ra được hình tròn)
const PLANETS = [
  { id: 'mercury', swing: 26, speed: 0.05, size: 0.28, glow: '#e6ddcc', draw: (c, w, h) => paintSpots(c, w, h, '#a9a39b', '#7f7a73') },
  { id: 'venus', swing: 44, speed: 0.02, size: 0.45, glow: '#fff1c4', draw: (c, w, h) => paintBands(c, w, h, ['#f3e2b6', '#e9d29b', '#f7ecc9']) },
  { id: 'mars', at: 64, speed: 0.25, size: 0.35, glow: '#ff9a6b', draw: paintMars },
  { id: 'jupiter', at: 47, speed: 0.08, size: 0.8, glow: '#ffe2b8', draw: paintJupiter },
  { id: 'saturn', at: 76, speed: 0.05, size: 0.65, glow: '#ffe9b0', ring: true, draw: (c, w, h) => paintBands(c, w, h, ['#ecdcaa', '#dcc48d', '#f1e4bd', '#cfb57c']) },
  { id: 'uranus', at: 104, speed: 0.03, size: 0.42, glow: '#b6f0f5', draw: (c, w, h) => paintBands(c, w, h, ['#a8e4ea', '#9dd9e2']) },
  { id: 'neptune', at: 128, speed: 0.02, size: 0.42, glow: '#8fb0ff', draw: (c, w, h) => paintBands(c, w, h, ['#4774dd', '#3c63c9', '#5a86ea']) },
];
const PLANET_DISTANCE = 160;

function buildPlanets(group, sunDir) {
  // Hoàng đạo = vòng tròn đi qua hướng Mặt Trời (S) và một hướng thứ hai (P) vuông góc với nó.
  // Chọn P sao cho vòng tròn này lướt qua phía bên phải căn phòng ở góc nhìn mặc định, để mở trang ra là thấy vài hành tinh.
  const S = sunDir.clone().negate().normalize();
  const { forward, right } = homeBasis();
  const P = forward.clone().addScaledVector(right, 0.5).normalize();
  P.addScaledVector(S, -P.dot(S)).normalize();

  const dot = canvasTexture(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });

  const list = PLANETS.map((p, i) => {
    const planet = new THREE.Group();
    group.add(planet);
    // Mặt hành tinh được nắng chiếu từ phía Mặt Trời, nên sao Kim ở gần Mặt Trời trông như trăng khuyết
    const material = new THREE.MeshStandardMaterial({ map: canvasTexture(256, 128, p.draw), roughness: 1, transparent: true });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.size, 24, 16), material);
    mesh.rotation.z = 0.2;
    planet.add(mesh);
    const materials = [material];
    if (p.ring) {
      const ringMat = new THREE.MeshStandardMaterial({ color: '#e3cf9b', side: THREE.DoubleSide, roughness: 1, transparent: true });
      planet.add(at(new THREE.Mesh(new THREE.RingGeometry(p.size * 1.35, p.size * 2.3, 48), ringMat), 0, 0, 0, -1.15, 0, 0.3));
      materials.push(ringMat);
    }
    // Quầng sáng mờ quanh hành tinh: nhìn từ xa trông như một ngôi sao sáng
    const glowMat = new THREE.SpriteMaterial({
      map: dot, color: p.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.setScalar(p.size * 7);
    planet.add(glow);
    planet.children.forEach((c) => { c.renderOrder = -2; });
    return { ...p, group: planet, mesh, materials, glowMat, phase: i * 1.9 };
  });

  const deg = THREE.MathUtils.degToRad;
  return {
    list,
    update(s, t) {
      for (const p of list) {
        const angle = p.swing ? p.swing * Math.sin(t * p.speed + p.phase) : p.at + p.speed * t;
        p.group.position.copy(S).multiplyScalar(Math.cos(deg(angle)))
          .addScaledVector(P, Math.sin(deg(angle))).multiplyScalar(PLANET_DISTANCE);
        p.mesh.rotation.y = t * 0.3; // tự quay
        p.materials.forEach((m) => { m.opacity = s; });
        p.glowMat.opacity = s * 0.5;
      }
    },
  };
}

// Mấy kiểu tô bề mặt hành tinh (vẽ trên tấm hình 256×128 rồi bọc quanh quả cầu)
function paintBands(ctx, w, h, colors) {
  const band = h / 12;
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = colors[(i + Math.floor(rand() * 2)) % colors.length];
    ctx.fillRect(0, i * band, w, band + 1);
  }
}

function paintSpots(ctx, w, h, base, spot) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = spot;
  for (let i = 0; i < 30; i++) wrapEllipse(ctx, w, rand() * w, rand() * h, 3 + rand() * 9);
}

function paintMars(ctx, w, h) {
  paintSpots(ctx, w, h, '#d3693d', '#a8492a');
  ctx.fillStyle = '#fbf3ee'; // hai chỏm băng ở cực
  ctx.fillRect(0, 0, w, 10);
  ctx.fillRect(0, h - 8, w, 8);
}

function paintJupiter(ctx, w, h) {
  paintBands(ctx, w, h, ['#ead3b1', '#c99c6c', '#f4e6cf', '#b97f54']);
  ctx.fillStyle = '#c2553a'; // Vết Đỏ Lớn: cơn bão to hơn cả Trái Đất
  wrapEllipse(ctx, w, w * 0.62, h * 0.64, 14, 7);
}
