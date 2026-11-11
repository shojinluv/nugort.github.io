// room.js – Dựng "cái vỏ" căn phòng: sàn, tường, cửa sổ, bầu trời, tia nắng,
// dây đèn trang trí, tranh treo tường và đồng hồ chạy theo giờ thật.
import * as THREE from 'three';
import { mat, box, cylinder, sphere, at, canvasTexture, random, decoration } from './helpers.js';
import { floaty } from './space.js';

// Quy ước: 1 đơn vị ≈ 30cm. Mặt sàn nằm ở y = 0, lòng phòng trải từ -5 đến 5 theo trục x và z.
// Tường sau nằm ở z = -5, tường trái nằm ở x = -5. Camera nhìn từ phía trước bên phải.
export const WALL_H = 6;
// Ô cửa sổ khoét trên tường sau
export const WIN = { x1: -0.3, x2: 2.7, y1: 2.4, y2: 4.6 };
// Hướng tia nắng chiếu vào phòng: từ sau-trái-trên chiếu xuống trước-phải-dưới
export const SUN_DIR = new THREE.Vector3(0.25, -0.62, 1).normalize();

export function buildRoom(world) {
  const room = new THREE.Group();
  room.name = 'vỏ phòng';
  world.scene.add(room);

  buildFloor(room, world);
  buildWalls(room);
  buildWindow(room, world);
  buildSunbeam(room, world);
  buildFairyLights(room, world);
  buildPoster(room, world);
  buildSolarPanels(room, world);
  buildStickyNotes(room);
  buildClock(room, world);
}

// ---------- Sàn gỗ ----------
function buildFloor(room, world) {
  // Vẽ các tấm ván gỗ lên canvas rồi dán lên mặt sàn
  const planks = canvasTexture(1024, 1024, (ctx, w, h) => {
    const rows = 14;
    const rh = h / rows;
    for (let i = 0; i < rows; i++) {
      const y = i * rh;
      let x = -random() * 300;
      while (x < w) {
        const len = 260 + random() * 260;
        ctx.fillStyle = `hsl(${26 + random() * 6}, ${48 + random() * 10}%, ${66 + random() * 8}%)`;
        ctx.fillRect(x, y, len, rh);
        ctx.fillStyle = 'rgba(110, 60, 25, 0.35)';
        ctx.fillRect(x, y, 3, rh); // khe nối giữa hai tấm ván
        x += len;
      }
      ctx.fillStyle = 'rgba(110, 60, 25, 0.4)';
      ctx.fillRect(0, y, w, 3); // khe giữa hai hàng ván
    }
  });

  // BoxGeometry có 6 mặt theo thứ tự: +x, -x, +y (trên), -y (dưới), +z, -z
  const side = mat('#b98053');
  const top = new THREE.MeshStandardMaterial({ map: planks, roughness: 0.7 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(10.3, 0.5, 10.3), [side, side, top, side, side, side]);
  floor.position.set(-0.15, -0.25, -0.15);
  room.add(floor);

  // Vệt bóng mờ bên dưới, cho cảm giác căn phòng đang lơ lửng như một hòn đảo nhỏ
  const blob = canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(60, 30, 20, 0.35)');
    g.addColorStop(1, 'rgba(60, 30, 20, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const shadowMat = new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), shadowMat);
  room.add(decoration(at(shadow, 0, -0.9, 0, -Math.PI / 2)));
  // Ngoài vũ trụ không có mặt đất nào để đổ bóng xuống, nên vệt bóng mờ đi
  world.updaters.push(() => {
    shadowMat.opacity = 1 - world.space;
    shadow.visible = world.space < 0.999;
  });
}

// ---------- Tường ----------
function buildWalls(room) {
  const paint = mat('#f7dfcf'); // màu sơn tường
  const cut = mat('#e0ae94');   // màu mặt cắt trên đỉnh tường (kiểu mô hình sa bàn)
  const T = 0.3;                // độ dày tường

  // Chỉ tô màu mặt cắt cho đỉnh tường và đầu tường lộ ra ngoài.
  // Các mặt bên nằm sát nhau giữa các mảnh mà tô màu khác sẽ lộ thành đường kẻ mờ.
  const backWall = (w, h, x, y, endCut = false) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, T), [endCut ? cut : paint, paint, cut, paint, paint, paint]);
    room.add(at(m, x, y, -5 - T / 2));
  };
  // Tường sau ghép từ 4 mảnh bao quanh ô cửa sổ.
  // Mảnh trái/phải lấn vào nhau 1cm để không lộ khe hở giữa các mảnh.
  const o = 0.01;
  backWall(WIN.x1 + 5.3 + o, WALL_H, (-5.3 + WIN.x1 + o) / 2, WALL_H / 2);       // mảnh trái
  backWall(5 - WIN.x2 + o, WALL_H, (WIN.x2 - o + 5) / 2, WALL_H / 2, true);       // mảnh phải
  backWall(WIN.x2 - WIN.x1, WIN.y1, (WIN.x1 + WIN.x2) / 2, WIN.y1 / 2);          // dưới cửa sổ
  backWall(WIN.x2 - WIN.x1, WALL_H - WIN.y2, (WIN.x1 + WIN.x2) / 2, (WIN.y2 + WALL_H) / 2); // trên cửa sổ

  // Tường trái
  const left = new THREE.Mesh(new THREE.BoxGeometry(T, WALL_H, 10), [paint, paint, cut, paint, cut, paint]);
  room.add(at(left, -5 - T / 2, WALL_H / 2, 0));

  // "Trần nhà tàng hình": không vẽ lên màn hình nhưng vẫn chặn nắng,
  // nên nắng chỉ lọt vào phòng qua ô cửa sổ
  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(10.6, 0.1, 10.6),
    new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
  );
  ceiling.userData.noPick = true;
  room.add(at(ceiling, -0.15, WALL_H + 0.05, -0.15));

  // Ốp tường màu bạc hà ở nửa dưới, nẹp trắng và len chân tường
  const panel = mat('#bfe0d4');
  const trim = mat('#fffaf4');
  room.add(at(box(10, 1.7, 0.04, panel, 0), 0, 0.85, -4.98));
  room.add(at(box(10, 0.1, 0.08, trim, 0.02), 0, 1.72, -4.96));
  room.add(at(box(10, 0.22, 0.06, trim, 0.02), 0, 0.11, -4.97));
  room.add(at(box(0.04, 1.7, 10, panel, 0), -4.98, 0.85, 0));
  room.add(at(box(0.08, 0.1, 10, trim, 0.02), -4.96, 1.72, 0));
  room.add(at(box(0.06, 0.22, 10, trim, 0.02), -4.97, 0.11, 0));
}

// ---------- Cửa sổ, rèm và bầu trời bên ngoài ----------
function buildWindow(room, world) {
  const frame = mat('#fffaf4');
  const cx = (WIN.x1 + WIN.x2) / 2;
  const cy = (WIN.y1 + WIN.y2) / 2;
  const w = WIN.x2 - WIN.x1;
  const h = WIN.y2 - WIN.y1;
  const z = -5.15;

  room.add(at(box(w + 0.24, 0.12, 0.42, frame, 0.03), cx, WIN.y2 + 0.06, z)); // khung trên
  room.add(at(box(0.12, h, 0.42, frame, 0.03), WIN.x1 - 0.06, cy, z));        // khung trái
  room.add(at(box(0.12, h, 0.42, frame, 0.03), WIN.x2 + 0.06, cy, z));        // khung phải
  // Bậu cửa nhô vào trong. Đặt cao hơn mép tường bên dưới 6mm, vì hai mặt trùng khít nhau thì hình bị nhấp nháy.
  // Tương tự, mặt sau bậu cửa thò ra khỏi lưng tường 4cm thay vì nằm trùng với lưng tường.
  room.add(at(box(w + 0.5, 0.12, 0.74, frame, 0.03), cx, WIN.y1 - 0.06 + 0.006, -4.97));
  room.add(at(box(0.06, h, 0.06, frame, 0), cx, cy, z));                      // song cửa dọc
  room.add(at(box(w, 0.06, 0.06, frame, 0), cx, cy, z));                      // song cửa ngang

  // Chậu xương rồng nhỏ trên bậu cửa
  const cactus = at(new THREE.Group(), WIN.x2 - 0.35, WIN.y1, -4.85);
  cactus.add(at(cylinder(0.11, 0.08, 0.16, '#e88a5e', 14), 0, 0.08, 0));
  cactus.add(at(new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.14, 4, 10), mat('#5d9e6f')), 0, 0.27, 0));
  room.add(cactus);
  floaty(world, cactus, { lift: [0, 0.3, 0.35], tilt: [0.25, 0.3, 0.25], spin: 0.3, delay: 0.1 });

  // Rèm cửa: mỗi bên 4 nếp vải (hình trụ ép dẹt)
  const curtain = mat('#f6a7a0');
  for (const baseX of [WIN.x1 - 0.45, WIN.x2 + 0.45]) {
    for (let i = 0; i < 4; i++) {
      const fold = cylinder(0.13, 0.15, 2.9, curtain, 12);
      fold.scale.z = 0.55;
      room.add(at(fold, baseX + (i - 1.5) * 0.17, 3.45, -4.82 + (i % 2) * 0.06));
    }
  }
  room.add(at(cylinder(0.035, 0.035, w + 2, '#c98f5a', 12), cx, 4.95, -4.8, 0, 0, Math.PI / 2)); // thanh treo rèm

  // Bầu trời: hai tấm hình phẳng đặt sau bức tường. Ban đêm thì tấm "trời đêm" hiện dần lên.
  // Khi bay ra vũ trụ thì cả hai tan đi, nhìn qua cửa sổ sẽ thấy sao và Trái Đất thật (xem space.js).
  const geometry = new THREE.PlaneGeometry(6, 3.75);
  const dayMat = new THREE.MeshBasicMaterial({ map: canvasTexture(640, 400, drawDaySky), toneMapped: false, transparent: true });
  const nightMat = new THREE.MeshBasicMaterial({ map: canvasTexture(640, 400, drawNightSky), toneMapped: false, transparent: true, opacity: 0 });
  const day = new THREE.Mesh(geometry, dayMat);
  const night = new THREE.Mesh(geometry, nightMat);
  // Đặt sát ngay sau lưng tường (mặt sau tường ở z = -5.3). Để xa hơn thì khi xoay camera sang ngang,
  // mép tấm bầu trời sẽ thò ra khỏi cạnh tường thành một dải xanh lơ lửng.
  room.add(decoration(at(day, cx, cy, -5.31)), decoration(at(night, cx, cy, -5.305)));
  world.nightFns.push((n) => {
    const keep = 1 - world.space;
    dayMat.opacity = keep;
    nightMat.opacity = n * keep;
    day.visible = keep > 0.001;
    night.visible = n * keep > 0.001;
  });
}

// Phần trời nhìn thấy qua cửa sổ nằm khoảng x: 160–480, y: 80–320 trên tấm canvas 640×400
function drawDaySky(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#6cc0f2');
  sky.addColorStop(1, '#dff4ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Mặt trời có quầng sáng
  const glow = ctx.createRadialGradient(400, 130, 10, 400, 130, 110);
  glow.addColorStop(0, 'rgba(255, 244, 190, 0.95)');
  glow.addColorStop(1, 'rgba(255, 244, 190, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff6cc';
  ctx.beginPath();
  ctx.arc(400, 130, 30, 0, Math.PI * 2);
  ctx.fill();

  // Mây
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  cloud(ctx, 235, 150, 1);
  cloud(ctx, 330, 100, 0.65);

  // Đồi xa và đồi gần
  hills(ctx, w, h, 255, 22, 0.018, '#a9dca2');
  hills(ctx, w, h, 285, 16, 0.025, '#7cc48a');
  ctx.fillStyle = '#5ca46e';
  for (const [x, y] of [[200, 262], [222, 266], [430, 270], [455, 266]]) {
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNightSky(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0b1240');
  sky.addColorStop(1, '#2c3477');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sao
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = `rgba(255, 255, 240, ${0.4 + random() * 0.6})`;
    ctx.beginPath();
    ctx.arc(random() * w, random() * h * 0.7, random() * 1.6 + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Trăng lưỡi liềm: vẽ trên một canvas riêng rồi "khoét" bớt một hình tròn
  const moon = document.createElement('canvas');
  moon.width = moon.height = 80;
  const m = moon.getContext('2d');
  m.fillStyle = '#fff6d6';
  m.shadowColor = 'rgba(255, 246, 214, 0.8)';
  m.shadowBlur = 16;
  m.beginPath();
  m.arc(40, 40, 24, 0, Math.PI * 2);
  m.fill();
  m.globalCompositeOperation = 'destination-out';
  m.beginPath();
  m.arc(52, 32, 22, 0, Math.PI * 2);
  m.fill();
  ctx.drawImage(moon, 230, 90);

  // Đồi tối và vài ô cửa sổ nhà ai còn sáng đèn
  hills(ctx, w, h, 255, 22, 0.018, '#232c5c');
  hills(ctx, w, h, 285, 16, 0.025, '#171e45');
  ctx.fillStyle = '#ffd77a';
  for (const [x, y] of [[205, 258], [214, 258], [420, 266], [452, 262], [461, 262]]) ctx.fillRect(x, y, 5, 6);
}

function cloud(ctx, x, y, s) {
  for (const [dx, dy, r] of [[0, 0, 26], [28, -12, 30], [58, 0, 24], [30, 8, 26]]) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function hills(ctx, w, h, base, amp, freq, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 8) ctx.lineTo(x, base - Math.sin(x * freq + base) * amp);
  ctx.lineTo(w, h);
  ctx.fill();
}

// ---------- Tia nắng xuyên qua cửa sổ + bụi lấp lánh ----------
function buildSunbeam(room, world) {
  // 4 góc cửa sổ, và 4 điểm tương ứng nơi tia nắng chạm sàn
  const corners = [[WIN.x1, WIN.y1], [WIN.x2, WIN.y1], [WIN.x2, WIN.y2], [WIN.x1, WIN.y2]]
    .map(([x, y]) => new THREE.Vector3(x, y, -5));
  const onFloor = corners.map((c) => c.clone().addScaledVector(SUN_DIR, c.y / -SUN_DIR.y));

  // Tự tạo hình khối từ 8 đỉnh: đầu ở cửa sổ sáng rõ, đầu ở sàn mờ dần
  const positions = [...corners, ...onFloor].flatMap((v) => [v.x, v.y, v.z]);
  const colors = [...corners.map(() => [1, 1, 1, 0.32]), ...onFloor.map(() => [1, 1, 1, 0.02])].flat();
  const index = [];
  for (let i = 0; i < 4; i++) {
    const a = i, b = (i + 1) % 4, c = b + 4, d = a + 4;
    index.push(a, b, c, a, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
  geometry.setIndex(index);

  const beamMat = new THREE.MeshBasicMaterial({
    color: '#ffe2a6', vertexColors: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
  });
  const beam = decoration(new THREE.Mesh(geometry, beamMat));
  room.add(beam);

  // Bụi li ti bay lơ lửng trong vệt nắng
  const N = 140;
  const seeds = [];
  for (let i = 0; i < N; i++) {
    const y = THREE.MathUtils.lerp(WIN.y1, WIN.y2, random());
    const base = new THREE.Vector3(THREE.MathUtils.lerp(WIN.x1, WIN.x2, random()), y, -5)
      .addScaledVector(SUN_DIR, random() * 0.85 * (y / -SUN_DIR.y));
    seeds.push({ base, phase: random() * Math.PI * 2, speed: 0.2 + random() * 0.3 });
  }
  const dustGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = canvasTexture(32, 32, (ctx) => {
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
  });
  const dustMat = new THREE.PointsMaterial({
    size: 0.07, map: dot, color: '#fff2c9', transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false,
  });
  room.add(decoration(new THREE.Points(dustGeo, dustMat)));

  world.updaters.push((t) => {
    seeds.forEach((s, i) => {
      pos[i * 3] = s.base.x + Math.sin(t * s.speed + s.phase) * 0.15;
      pos[i * 3 + 1] = s.base.y + Math.sin(t * s.speed * 0.7 + s.phase * 2) * 0.2;
      pos[i * 3 + 2] = s.base.z + Math.cos(t * s.speed + s.phase) * 0.15;
    });
    dustGeo.attributes.position.needsUpdate = true;
  });

  // Ban đêm: nắng vàng chuyển thành ánh trăng xanh nhạt.
  // Ngoài vũ trụ là chân không: không có không khí để ánh sáng hắt ra thành vệt, nên vệt nắng tan đi.
  // Chỉ còn mảng nắng rọi trên sàn và mấy hạt bụi lấp lánh nằm trong vùng có nắng.
  const dayColor = new THREE.Color('#ffe2a6');
  const nightColor = new THREE.Color('#8fa8ff');
  world.nightFns.push((n) => {
    const air = 1 - world.space;
    beamMat.color.lerpColors(dayColor, nightColor, n);
    beamMat.opacity = (1 - 0.45 * n) * air;
    beam.visible = air > 0.001;
    dustMat.opacity = (0.9 - 0.6 * n) * (0.5 + 0.5 * air);
  });
}

// ---------- Dây đèn trang trí trên tường trái ----------
function buildFairyLights(room, world) {
  const points = [];
  for (let i = 0; i <= 60; i++) {
    const f = i / 60;
    const y = 5.55 - 0.4 * Math.sin(Math.PI * f * 3) ** 2; // võng xuống 3 đoạn
    points.push(new THREE.Vector3(-4.9, y, -4.7 + f * 9.4));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  room.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.012, 5), mat('#5b4a42')));

  const colors = ['#ffd27a', '#ffb4a2', '#bde6ff', '#c8f5c0'];
  const bulbs = [];
  for (let i = 0; i < 18; i++) {
    const c = colors[i % colors.length];
    const bulbMat = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.5, roughness: 0.4 });
    const bulb = sphere(0.075, bulbMat, 12, 8);
    bulb.position.copy(curve.getPointAt((i + 0.5) / 18));
    bulb.position.y -= 0.07;
    room.add(decoration(bulb));
    bulbs.push(bulbMat);
  }
  // Một nguồn sáng ấm hắt lên tường khi trời tối
  const glow = new THREE.PointLight('#ffc98a', 0, 9, 2);
  glow.position.set(-4.2, 4.6, 0);
  room.add(glow);

  world.updaters.push((t) => {
    const n = world.night;
    bulbs.forEach((m, i) => {
      m.emissiveIntensity = (0.4 + n * 2.6) * (1 + 0.18 * Math.sin(t * 2.3 + i * 1.7)); // nhấp nháy nhẹ
    });
    glow.intensity = n * 6;
  });
}

// ---------- Tranh treo trên đầu giường ----------
function buildPoster(room, world) {
  const tex = canvasTexture(800, 560, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#ffd3a1');
    sky.addColorStop(1, '#ff8f8a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Phần hình bên dưới được vẽ trong khung cao 414 (mặt đất ở y = 414), rồi phóng to 1,2 lần
    // và dời đi cho mặt đất chạm đúng mép dưới, để bức tranh phủ kín cả khung
    const bandH = h - 414;
    ctx.save();
    ctx.translate(-80, h - 414 * 1.2);
    ctx.scale(1.2, 1.2);

    // Mặt trời sọc kiểu retro
    ctx.save();
    ctx.beginPath();
    ctx.arc(w * 0.64, 190, 130, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#fff1c1';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff9f8c';
    for (let i = 0; i < 5; i++) ctx.fillRect(0, 210 + i * 26, w, 6 + i * 3);
    ctx.restore();

    // Tranh "khát khao tự do": chiếc lồng mở cửa trên đồi, đàn chim bay vút về phía mặt trời
    const ground = h - bandH;
    const ink = '#4a2c40';

    // Đồi xa và đồi gần
    ctx.fillStyle = '#e8677a';
    ctx.beginPath();
    ctx.moveTo(0, ground);
    ctx.lineTo(0, ground - 60);
    ctx.quadraticCurveTo(260, ground - 150, 520, ground - 50);
    ctx.quadraticCurveTo(680, ground - 5, w, ground - 70);
    ctx.lineTo(w, ground);
    ctx.fill();
    ctx.fillStyle = '#c94f6d';
    ctx.beginPath();
    ctx.moveTo(0, ground);
    ctx.lineTo(0, ground - 30);
    ctx.quadraticCurveTo(170, ground - 95, 400, ground - 25);
    ctx.quadraticCurveTo(600, ground + 20, w, ground - 30);
    ctx.lineTo(w, ground);
    ctx.fill();

    // Chiếc lồng: đáy, vòm nan và móc treo
    const [cx, base, cw, ch] = [150, ground - 52, 62, 150]; // tâm, đáy, nửa bề ngang, chiều cao
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;
    for (let i = -3; i <= 3; i++) {
      // mỗi nan cong từ đáy lên chụm ở đỉnh; chừa trống chỗ cửa (hai nan bên phải)
      if (i === 1 || i === 2) continue;
      const x = cx + (i / 3) * cw;
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.bezierCurveTo(x, base - ch * 0.75, cx + (i / 3) * cw * 0.5, base - ch, cx, base - ch);
      ctx.stroke();
    }
    ctx.fillRect(cx - cw - 6, base - 4, cw * 2 + 12, 10); // đáy lồng
    ctx.beginPath();
    ctx.arc(cx, base - ch - 10, 9, 0, Math.PI * 2);      // móc treo
    ctx.stroke();
    // Cánh cửa lồng bật mở ra bên phải
    ctx.save();
    ctx.translate(cx + cw, base - 6);
    ctx.rotate(0.5);
    ctx.lineWidth = 4;
    ctx.strokeRect(0, -86, 44, 86);
    for (const dx of [15, 30]) {
      ctx.beginPath();
      ctx.moveTo(dx, -86);
      ctx.lineTo(dx, 0);
      ctx.stroke();
    }
    ctx.restore();

    // Đàn chim: bay theo một đường cong từ cửa lồng lên mặt trời, càng xa càng nhỏ
    const bird = (x, y, s, tilt) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.lineWidth = Math.max(2.5, s * 0.2);
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.quadraticCurveTo(-s * 0.5, -s * 0.75, 0, 0);
      ctx.quadraticCurveTo(s * 0.5, -s * 0.75, s, 0);
      ctx.stroke();
      ctx.restore();
    };
    [[262, 300, 30, -0.5], [330, 236, 25, -0.35], [392, 262, 21, -0.6], [430, 180, 19, -0.3],
      [498, 150, 15, -0.45], [470, 108, 13, -0.2], [556, 100, 11, -0.4], [600, 62, 9, -0.3]]
      .forEach(([x, y, s, tilt]) => bird(x, y, s, tilt));
    ctx.restore();
  });
  // Tranh và khung gom vào một nhóm có id, để rê chuột và bấm vào được như các đồ vật khác
  // (bấm vào → mở khung "Di sản của Trâm Anh" đang bị khoá, xem content.js)
  const g = at(new THREE.Group(), -4.975, 3.5, 1.0);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.54), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  g.add(at(poster, 0.045, 0, 0, 0, Math.PI / 2, 0));
  g.add(box(0.05, 1.66, 2.32, '#8a5a3c', 0.02)); // khung tranh (nằm sau tranh)
  g.userData.id = 'poster';
  world.clickables.poster = g;
  room.add(g);
}

// ---------- Dàn pin mặt trời ở mặt ngoài tường sau (mặt đón nắng) ----------
// Chỉ bung ra khi căn phòng bay ra vũ trụ: mỗi tấm pin treo bằng bản lề ở mép trên,
// mép dưới chống ra ngoài cho mặt pin ngửa lên đón nắng. Bên dưới cửa sổ có hộp ắc quy báo mức sạc.
function buildSolarPanels(room, world) {
  const cells = canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#22388f');
    g.addColorStop(0.5, '#16245c');
    g.addColorStop(1, '#1d3180');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(150, 180, 255, 0.55)'; // đường kẻ chia ô pin
    ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo((i * w) / 4, 0);
      ctx.lineTo((i * w) / 4, h);
      ctx.stroke();
    }
    for (let j = 0; j <= 6; j++) {
      ctx.beginPath();
      ctx.moveTo(0, (j * h) / 6);
      ctx.lineTo(w, (j * h) / 6);
      ctx.stroke();
    }
  });
  const cellMat = new THREE.MeshStandardMaterial({ map: cells, metalness: 0.55, roughness: 0.3 });
  const frameMat = new THREE.MeshStandardMaterial({ color: '#c9d2e3', metalness: 0.6, roughness: 0.4 });

  const array = new THREE.Group();
  room.add(array);
  const hinges = [];
  const H = 1.35; // chiều cao một tấm pin
  // Ba cột bên trái cửa sổ và một cột bên phải, mỗi cột ba tấm
  for (const [x, w] of [[-4.3, 1.25], [-2.9, 1.25], [-1.5, 1.25], [3.95, 1.5]]) {
    for (const top of [5.3, 3.75, 2.2]) {
      const hinge = at(new THREE.Group(), x, top, -5.34); // bản lề ở mép trên, sát mặt ngoài tường
      hinge.add(at(box(w, H, 0.06, frameMat, 0.02), 0, -H / 2, 0)); // khung nhôm
      hinge.add(at(new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, H - 0.1), cellMat), 0, -H / 2, -0.032, 0, Math.PI, 0)); // mặt pin quay ra ngoài
      array.add(hinge);
      hinges.push(hinge);
    }
  }

  // Hộp ắc quy dưới cửa sổ, có bốn vạch báo mức sạc
  const battery = at(new THREE.Group(), (WIN.x1 + WIN.x2) / 2, 1.3, -5.42);
  battery.add(box(1.7, 0.75, 0.24, '#5d6577', 0.04));
  const bars = [0, 1, 2, 3].map((i) => {
    const m = new THREE.MeshStandardMaterial({ color: '#1c2a22', emissive: '#3dff9a', emissiveIntensity: 0 });
    battery.add(at(box(0.26, 0.42, 0.03, m, 0.01), 0.54 - i * 0.36, 0, -0.125));
    return m;
  });
  array.add(battery);
  array.traverse((o) => { o.userData.noPick = true; });

  world.updaters.push((t) => {
    const s = world.space;
    array.visible = s > 0.02;
    if (!array.visible) return;
    hinges.forEach((hinge) => { hinge.rotation.x = 0.5 * s; }); // bung ra, ngửa mặt về phía Mặt Trời
    // Có nắng thì các vạch sạc sáng lần lượt như đang nạp điện; vào bóng Trái Đất (buổi tối) thì chỉ còn một vạch
    const sun = 1 - world.night;
    bars.forEach((m, i) => {
      const charging = (Math.sin(t * 2.5 - i * 0.9) * 0.5 + 0.5) * sun;
      m.emissiveIntensity = s * (i === 0 ? 1.6 : 0.2 + 1.6 * charging);
    });
  });
}

// ---------- Giấy note dán tường ----------
// Ba tờ giấy chép một bài thơ sáu dòng, mỗi tờ hai dòng, đọc từ trái qua phải, trên xuống dưới.
// Mỗi dòng thơ ngắt làm hai nửa ở dấu phẩy cho vừa bề ngang tờ giấy.
// Màu mực chọn cùng tông với màu giấy nhưng đậm hơn hẳn để dễ đọc.
const POEM_NOTES = [
  { paper: '#fff07a', ink: '#6b4a12', x: -2.1, y: 3.45, tilt: 0.08,
    lines: [['Trâm Anh thuở ấy,', 'vớt thân tàn,'], ['Anh bỗng sa cơ,', 'hận ngút ngàn.']] },
  { paper: '#ffb7c9', ink: '#8a2f52', x: -1.55, y: 3.3, tilt: -0.1,
    lines: [['Tha phương áo níu,', 'chân chùng bước,'], ['em kẹt trùng vây,', 'ở cũng nan.']] },
  { paper: '#b9f0d3', ink: '#1f6b55', x: -1.85, y: 2.85, tilt: 0.05,
    lines: [['Đi chẳng thành đường,', 'lưu chẳng đặng,'], ['Mà thôi phó mặc,', 'cảnh ly tan']] },
];

function buildStickyNotes(room) {
  for (const n of POEM_NOTES) {
    const texture = canvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = n.paper;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = n.ink;
      ctx.textBaseline = 'middle';
      // Chữ viết tay "Patrick Hand" (tải trong index.html); nếu chưa tải kịp thì dùng chữ viết tay có sẵn trên máy
      const font = (size) => `${size}px "Patrick Hand", "Segoe Print", "Comic Sans MS", cursive`;
      n.lines.forEach(([first, second], i) => {
        const top = 92 + i * 216; // mỗi dòng thơ chiếm hai hàng chữ, hai dòng thơ cách nhau một quãng
        [first, second].forEach((text, row) => {
          const indent = 36 + row * 56; // nửa sau thụt vào một chút
          let size = 66;
          ctx.font = font(size);
          while (ctx.measureText(text).width > w - indent - 28 && size > 30) ctx.font = font(--size); // co chữ cho vừa tờ giấy
          ctx.fillText(text, indent, top + row * 84);
        });
      });
    });
    const note = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }));
    room.add(at(note, n.x, n.y, -4.97, 0, 0, n.tilt));
  }
}

// ---------- Đồng hồ treo tường (chạy theo giờ thật trên máy bạn) ----------
function buildClock(room, world) {
  const clock = new THREE.Group();
  at(clock, 4.2, 4.3, -4.97);
  room.add(clock);

  const rim = cylinder(0.5, 0.5, 0.08, '#ef6f5c', 40);
  rim.rotation.x = Math.PI / 2; // hình trụ đang dựng đứng → xoay cho mặt tròn quay ra trước
  rim.position.z = 0.04;
  const face = cylinder(0.43, 0.43, 0.02, '#fffaf2', 40);
  face.rotation.x = Math.PI / 2;
  face.position.z = 0.085;
  clock.add(rim, face);

  for (let i = 0; i < 12; i++) {
    const big = i % 3 === 0;
    const a = (i / 12) * Math.PI * 2;
    const tick = box(big ? 0.04 : 0.025, big ? 0.1 : 0.06, 0.01, '#4a3a35', 0);
    clock.add(at(tick, Math.sin(a) * 0.35, Math.cos(a) * 0.35, 0.1, 0, 0, -a));
  }

  // Kim đồng hồ: dời hình hộp lên để điểm xoay nằm ở đuôi kim
  const hand = (len, width, color, z) => {
    const g = new THREE.BoxGeometry(width, len, 0.012);
    g.translate(0, len / 2 - 0.04, 0);
    const m = new THREE.Mesh(g, mat(color));
    m.position.z = z;
    clock.add(m);
    return m;
  };
  const hourHand = hand(0.24, 0.045, '#4a3a35', 0.105);
  const minuteHand = hand(0.34, 0.03, '#4a3a35', 0.115);
  const secondHand = hand(0.37, 0.012, '#ef6f5c', 0.125);
  clock.add(at(sphere(0.03, '#ef6f5c', 12, 8), 0, 0, 0.13));

  world.updaters.push(() => {
    const d = new Date();
    const s = d.getSeconds() + d.getMilliseconds() / 1000;
    const m = d.getMinutes() + s / 60;
    const h = (d.getHours() % 12) + m / 60;
    secondHand.rotation.z = -(s / 60) * Math.PI * 2;
    minuteHand.rotation.z = -(m / 60) * Math.PI * 2;
    hourHand.rotation.z = -(h / 12) * Math.PI * 2;
  });
}
