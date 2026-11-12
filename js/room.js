// room.js – Dựng "cái vỏ" căn phòng: sàn, tường, cửa sổ, bầu trời, tia nắng,
// dây đèn trang trí, tranh treo tường và đồng hồ chạy theo giờ thật.
import * as THREE from 'three';
import { mat, box, cylinder, sphere, at, stick, canvasTexture, random, decoration } from './helpers.js';
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
  buildWalls(room, world);
  buildWindow(room, world);
  buildSunbeam(room, world);
  buildFairyLights(room, world);
  buildPoster(room, world);
  buildOxScroll(room, world);
  buildSolarPanels(room, world);
  buildThrusters(room, world);
  buildAirlock(room, world);
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
  // Bên dưới sàn là hòn đảo cỏ lơ lửng (xem island.js)
}

// ---------- Tường ----------
// Ô kính tròn trên cửa khoang ở tường trái: vị trí dọc tường (z), độ cao (y) và bán kính lỗ khoét
export const HATCH = { z: 4.13, y: 2.55, r: 0.37 };

function buildWalls(room, world) {
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

  // Tường trái: khoét sẵn một lỗ tròn cho ô kính cửa khoang nhìn xuyên được (xem buildAirlock)
  const outline = new THREE.Shape();
  outline.moveTo(-5, 0);
  outline.lineTo(5, 0);
  outline.lineTo(5, WALL_H);
  outline.lineTo(-5, WALL_H);
  outline.closePath();
  const hole = new THREE.Path();
  hole.absarc(HATCH.z, HATCH.y, HATCH.r, 0, Math.PI * 2, true);
  outline.holes.push(hole);
  let geo = new THREE.ExtrudeGeometry(outline, { depth: T, bevelEnabled: false, curveSegments: 48 });
  if (geo.index) geo = geo.toNonIndexed();
  geo.rotateY(-Math.PI / 2).translate(-5, 0, 0); // dựng tấm tường đứng dọc theo trục z, dày về phía ngoài
  // Tô màu mặt cắt cho đỉnh tường và đầu tường giống bản đặc: gom các tam giác thành nhóm theo vật liệu
  const p = geo.attributes.position;
  geo.clearGroups();
  let start = 0;
  let current = -1;
  for (let i = 0; i < p.count; i += 3) {
    const onTop = Math.min(p.getY(i), p.getY(i + 1), p.getY(i + 2)) > WALL_H - 0.001;
    const onEnd = Math.min(p.getZ(i), p.getZ(i + 1), p.getZ(i + 2)) > 5 - 0.001;
    const m = onTop || onEnd ? 1 : 0;
    if (m !== current) {
      if (current >= 0) geo.addGroup(start, i - start, current);
      start = i;
      current = m;
    }
  }
  geo.addGroup(start, p.count - start, current);
  room.add(new THREE.Mesh(geo, [paint, cut]));

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

  // Ô kính trong veo: nhìn xuyên ra đúng cảnh thật phía sau tường (mép đảo, bầu trời, ngoài vũ trụ là sao và Mặt Trời)
  const glass = new THREE.MeshStandardMaterial({
    color: '#dff1ff', transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide,
  });
  room.add(decoration(at(new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass), cx, cy, -5.2)));
  // Bức tranh trời đêm vẽ sau cửa sổ ngày trước từng dùng 560 số ngẫu nhiên. Bỏ qua đúng chừng ấy số,
  // để sách trên kệ, lá cây… (lấy số ngẫu nhiên tiếp theo trong cùng một chuỗi) vẫn y như cũ
  for (let i = 0; i < 560; i++) random();
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

// ---------- Tranh cuộn "Thập mục ngưu đồ" treo ở tường sau, giữa góc kệ sách và mấy tờ giấy ghi chú ----------
// Mười bức chăn trâu của Thiền tông, vẽ kiểu mực tàu trong mười vòng ensō, đọc từ trái qua phải, trên xuống dưới.
// Cho hợp với căn phòng: người chăn trâu là một chú mèo Sphynx tai to, bức thứ 9 "trở về nguồn cội"
// là Trái Đất nhìn từ ngoài vũ trụ, bức thứ 10 "thõng tay vào chợ" thì mèo xách túi hàng màu cam.
const OX_STAGES = ['Tìm trâu', 'Thấy dấu', 'Thấy trâu', 'Bắt trâu', 'Chăn trâu', 'Cưỡi trâu về', 'Quên trâu', 'Quên cả hai', 'Về nguồn', 'Vào chợ'];

function buildOxScroll(room, world) {
  const INK = '#2b2420';
  const tex = canvasTexture(512, 1100, (ctx, w, h) => {
    // Nền lụa viền quanh và tờ giấy dó ở giữa
    ctx.fillStyle = '#3f5a63';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    for (let y = 8; y < h; y += 26) for (let x = (y / 26) % 2 ? 8 : 21; x < w; x += 26) ctx.fillRect(x, y, 5, 5); // hoa văn gấm
    ctx.fillStyle = '#c9a15f';
    ctx.fillRect(22, 58, w - 44, h - 116);
    const paper = ctx.createLinearGradient(0, 0, w, h);
    paper.addColorStop(0, '#f6ecd6');
    paper.addColorStop(1, '#efe0c2');
    ctx.fillStyle = paper;
    ctx.fillRect(28, 64, w - 56, h - 128);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const ink = (alpha = 0.92) => `rgba(43, 36, 32, ${alpha})`;

    // Vòng ensō: một nét bút tròn, chỗ đậm chỗ nhạt, hở một khe nhỏ
    const enso = (start) => {
      for (let i = 0; i < 90; i++) {
        const a = start + (i / 90) * 5.95;
        const b = start + ((i + 1.2) / 90) * 5.95;
        ctx.beginPath();
        ctx.arc(0, 0, 72, a, b);
        ctx.lineWidth = 3 + 6 * Math.sin((i / 90) * Math.PI) ** 0.6;
        ctx.strokeStyle = ink(0.55 + 0.4 * Math.sin((i / 90) * Math.PI));
        ctx.stroke();
      }
    };
    const ground = (y = 42) => {
      ctx.beginPath();
      ctx.moveTo(-62, y);
      ctx.quadraticCurveTo(0, y - 5, 62, y + 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = ink(0.45);
      ctx.stroke();
    };
    // Mèo Sphynx ngồi: thân, đầu, hai tai to như tai dơi và cái đuôi cong
    const cat = (x, y, s = 1, face = 1) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s * face, s);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(3, -17, 7.5, 0, Math.PI * 2);
      ctx.fill();
      for (const dx of [-3, 8]) {
        ctx.beginPath();
        ctx.moveTo(dx - 4, -21);
        ctx.lineTo(dx + (dx < 0 ? -5 : 5), -36);
        ctx.lineTo(dx + 4, -22);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(-7, 9);
      ctx.quadraticCurveTo(-24, 10, -19, -8);
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.restore();
    };
    // Con trâu: thân, đầu, cặp sừng cong, bốn chân và đuôi
    const ox = (x, y, s = 1, face = 1, tilt = 0) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.scale(s * face, s);
      ctx.fillStyle = INK;
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.ellipse(0, 0, 25, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(26, -7, 10, 8, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      for (const d of [-1, 1]) { // sừng
        ctx.beginPath();
        ctx.moveTo(24 + d * 4, -13);
        ctx.quadraticCurveTo(24 + d * 15, -20, 24 + d * 11, -30);
        ctx.stroke();
      }
      ctx.lineWidth = 4.5;
      for (const lx of [-17, -8, 9, 17]) { // chân
        ctx.beginPath();
        ctx.moveTo(lx, 8);
        ctx.lineTo(lx, 24);
        ctx.stroke();
      }
      ctx.lineWidth = 2.4;
      ctx.beginPath(); // đuôi
      ctx.moveTo(-24, -4);
      ctx.quadraticCurveTo(-36, 0, -33, 15);
      ctx.stroke();
      ctx.restore();
    };
    const rope = (x1, y1, x2, y2, sag) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag, x2, y2);
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#b3401f';
      ctx.stroke();
    };
    const dots = (list, r = 1.6, color = ink(0.7)) => {
      ctx.fillStyle = color;
      for (const [x, y] of list) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const scenes = [
      () => { // 1. Tìm trâu: mèo ngơ ngác giữa núi rừng, chưa thấy trâu đâu
        ctx.beginPath();
        ctx.moveTo(-60, 10);
        ctx.lineTo(-28, -30);
        ctx.lineTo(-6, -4);
        ctx.lineTo(22, -42);
        ctx.lineTo(60, 8);
        ctx.lineWidth = 2;
        ctx.strokeStyle = ink(0.3);
        ctx.stroke();
        ground();
        cat(-18, 28);
      },
      () => { // 2. Thấy dấu: những vết chân trâu dẫn đi xa
        ground();
        cat(-42, 28);
        ctx.fillStyle = ink(0.75);
        [[-12, 34], [4, 26], [20, 20], [34, 10], [46, 2]].forEach(([x, y], i) => {
          for (const d of [-2.6, 2.6]) {
            ctx.beginPath();
            ctx.ellipse(x + d, y, 2.2 - i * 0.2, 3.6 - i * 0.3, 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      },
      () => { // 3. Thấy trâu: trâu thò nửa mình ra sau bụi cây
        ground();
        ox(44, 22, 0.95, -1);
        ctx.fillStyle = '#5d7a5f';
        for (const [x, y, r] of [[52, 18, 20], [38, 4, 15], [60, -2, 14]]) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        cat(-42, 28);
      },
      () => { // 4. Bắt trâu: dây căng, trâu còn giằng lại
        ground();
        ox(28, 18, 0.95, 1, -0.2);
        cat(-46, 28);
        rope(-38, 16, 10, 8, 0);
      },
      () => { // 5. Chăn trâu: trâu đã thuần, dây chùng
        ground();
        ox(26, 20, 0.95, -1);
        cat(-46, 28);
        rope(-38, 16, 2, 12, 16);
      },
      () => { // 6. Cưỡi trâu về nhà: ngồi trên lưng trâu thổi sáo
        ground();
        ox(0, 20, 1.05, 1);
        cat(-4, -4, 0.8);
        ctx.beginPath();
        ctx.moveTo(4, -17);
        ctx.lineTo(24, -24);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#b3401f';
        ctx.stroke();
        ctx.fillStyle = ink(0.6);
        ctx.font = '20px serif';
        ctx.fillText('♪', 32, -36);
        ctx.fillText('♫', 46, -18);
      },
      () => { // 7. Quên trâu còn người: một mình ngồi ngắm trăng
        ground();
        cat(-14, 28);
        ctx.beginPath();
        ctx.arc(30, -28, 13, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 197, 66, 0.55)';
        ctx.fill();
      },
      () => {}, // 8. Người trâu đều quên: vòng tròn trống không
      () => { // 9. Trở về nguồn cội: Trái Đất nhìn từ căn phòng ngoài vũ trụ
        ctx.beginPath();
        ctx.arc(0, 6, 30, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(79, 147, 179, 0.75)';
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = 'rgba(93, 158, 111, 0.9)';
        for (const [x, y, rx, ry, r] of [[-12, -4, 13, 9, 0.4], [14, 14, 11, 15, -0.3], [-18, 26, 9, 6, 0]]) {
          ctx.beginPath();
          ctx.ellipse(x, y, rx, ry, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        dots([[-46, -30], [40, -40], [52, 4], [-52, 20], [-20, -50], [14, -56], [44, 38], [-36, 46]]);
      },
      () => { // 10. Thõng tay vào chợ: mèo xách túi hàng đi giữa đời thường
        ground();
        cat(-14, 28);
        ctx.fillStyle = '#ee5a36';
        ctx.fillRect(10, 20, 20, 22);
        ctx.beginPath();
        ctx.arc(20, 20, 6, Math.PI, 0);
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#d94a28';
        ctx.stroke();
        dots([[-44, -26], [36, -34], [48, -6], [-28, -46]], 1.5, 'rgba(179, 64, 31, 0.6)');
      },
    ];

    scenes.forEach((draw, i) => {
      const cx = i % 2 ? 372 : 140;
      const cy = 160 + Math.floor(i / 2) * 186;
      ctx.save();
      ctx.translate(cx, cy);
      enso(-1.3 + i * 0.7);
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 67, 0, Math.PI * 2);
      ctx.clip(); // cảnh vẽ không tràn ra ngoài vòng tròn
      draw();
      ctx.restore();
      ctx.fillStyle = ink(0.7);
      ctx.font = '24px "Patrick Hand", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1} · ${OX_STAGES[i]}`, 0, 101);
      ctx.restore();
    });

    // Con dấu đỏ ở góc dưới
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(w - 78, h - 112, 30, 30);
    ctx.fillStyle = '#f6ecd6';
    ctx.font = '800 20px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('牛', w - 63, h - 90);
  });

  // Gom tranh, hai trục gỗ và dây treo vào một nhóm có id, để rê chuột và bấm vào được như bức tranh ở tường trái.
  // Các phần bên trong dựng theo mặt tranh quay về +x, rồi xoay cả nhóm -90° cho tranh quay ra giữa phòng từ tường sau.
  const W = 1.3;
  const H = (W * 1100) / 512;
  const g = at(new THREE.Group(), -3.55, 3.55, -4.975, 0, -Math.PI / 2, 0);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  g.add(at(sheet, 0.012, 0, 0, 0, Math.PI / 2, 0));
  const wood = '#6b4630';
  for (const y of [H / 2, -H / 2]) {
    g.add(at(cylinder(0.035, 0.035, W + 0.16, wood, 12), 0.03, y, 0, Math.PI / 2)); // trục gỗ trên và dưới
    for (const z of [-1, 1]) g.add(at(cylinder(0.05, 0.05, 0.05, '#3a2a22', 12), 0.03, y, z * (W / 2 + 0.1), Math.PI / 2));
  }
  const nail = new THREE.Vector3(0.01, H / 2 + 0.22, 0); // đinh treo
  g.add(stick(new THREE.Vector3(0.02, H / 2, -0.4), nail, 0.008, '#3a2a22'));
  g.add(stick(new THREE.Vector3(0.02, H / 2, 0.4), nail, 0.008, '#3a2a22'));
  g.add(at(sphere(0.03, '#c9a15f', 10, 8), 0.015, H / 2 + 0.22, 0));
  g.userData.id = 'scroll';
  world.clickables.scroll = g;
  room.add(g);
}

// ---------- Dàn pin mặt trời ở mặt ngoài tường sau (mặt đón nắng) ----------
// Ở Trái Đất các tấm pin nằm áp sát tường. Bay ra vũ trụ thì bung ra: mỗi tấm treo bằng bản lề ở mép trên,
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
    hinges.forEach((hinge) => { hinge.rotation.x = 0.5 * s; }); // bung ra, ngửa mặt về phía Mặt Trời
    // Có nắng thì các vạch sạc sáng lần lượt như đang nạp điện; buổi tối (hay vào bóng Trái Đất) thì chỉ còn một vạch
    const sun = 1 - world.night;
    bars.forEach((m, i) => {
      const charging = (Math.sin(t * 2.5 - i * 0.9) * 0.5 + 0.5) * sun;
      m.emissiveIntensity = i === 0 ? 1.6 : 0.2 + 1.6 * charging;
    });
  });
}

// ---------- Động cơ đẩy dưới gầm sàn ----------
// Chỉ thò ra khi căn phòng bay ra vũ trụ: một tấm vỏ kim loại ốp đáy sàn và bốn ống phụt ở bốn góc.
// Đúng như tàu thật: chỉ đốt mạnh lúc cất cánh và hạ cánh. Lên tới quỹ đạo thì tàu trôi theo quán tính,
// động cơ tắt hẳn, thỉnh thoảng một hai ống phụt một nhịp ngắn để chỉnh hướng.
// Loa phụt còn nóng sau mỗi lần đốt nên vẫn ửng sáng rồi nguội dần.
function buildThrusters(room, world) {
  const hull = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#596275';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(20, 26, 40, 0.55)'; // đường ghép giữa các tấm vỏ
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      ctx.strokeRect((i * w) / 4, 0, 0, h);
      ctx.strokeRect(0, (i * h) / 4, w, 0);
    }
    ctx.fillStyle = 'rgba(215, 225, 245, 0.6)'; // đinh tán ở các góc tấm
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (const [dx, dy] of [[14, 14], [114, 14], [14, 114], [114, 114]]) {
          ctx.beginPath();
          ctx.arc((i * w) / 4 + dx, (j * h) / 4 + dy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  });
  const hullMat = new THREE.MeshStandardMaterial({ map: hull, metalness: 0.5, roughness: 0.55, emissive: '#93a4c8', emissiveMap: hull, emissiveIntensity: 0 });
  const bellMat = new THREE.MeshStandardMaterial({ color: '#3b4252', metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide, emissive: '#5a6f96', emissiveIntensity: 0 });
  const glowMat = new THREE.MeshBasicMaterial({ color: '#bfe4ff', transparent: true, depthWrite: false });
  const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };
  const outerMat = new THREE.MeshBasicMaterial({ color: '#3f9bff', ...additive });
  const coreMat = new THREE.MeshBasicMaterial({ color: '#d9f1ff', ...additive });

  // Ngọn lửa: hình nón gốc ở y = 0, mũi chĩa xuống, kéo dài bằng scale.y
  const flameGeo = (r, h) => new THREE.ConeGeometry(r, h, 20, 1, true).rotateX(Math.PI).translate(0, -h / 2, 0);
  const outerGeo = flameGeo(0.4, 1.7);
  const coreGeo = flameGeo(0.2, 1.1);

  const rig = at(new THREE.Group(), -0.15, -0.5, -0.15); // gốc ở ngay mặt đáy sàn
  rig.add(at(box(9.7, 0.12, 9.7, hullMat, 0), 0, -0.06, 0));
  const flames = [];
  [[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]].forEach(([x, z], i) => {
    const engine = at(new THREE.Group(), x, 0, z);
    engine.add(at(cylinder(0.36, 0.36, 0.16, '#8a93a8'), 0, -0.18, 0)); // đế gắn động cơ
    // Mỗi ống một loa phụt và họng lửa riêng, để ống nào đang phụt (hay còn nóng) thì chỉ ống đó sáng
    const bell = bellMat.clone();
    engine.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.52, 0.7, 28, 1, true), bell), 0, -0.6, 0)); // loa phụt
    const throat = glowMat.clone();
    engine.add(decoration(at(new THREE.Mesh(new THREE.CircleGeometry(0.27, 24), throat), 0, -0.27, 0, Math.PI / 2))); // họng lửa sáng
    const outer = decoration(at(new THREE.Mesh(outerGeo, outerMat), 0, -0.4, 0));
    const core = decoration(at(new THREE.Mesh(coreGeo, coreMat), 0, -0.4, 0));
    engine.add(outer, core);
    rig.add(engine);
    flames.push({ outer, core, throat, bell, heat: 0, phase: i * 1.7 });
  });
  // Gầm sàn không được Mặt Trời chiếu tới, nên lửa động cơ tự hắt ánh xanh lên vỏ tàu
  const glow = new THREE.PointLight('#6fb4ff', 0, 11, 1.4);
  rig.add(at(glow, 0, -2.4, 0));
  rig.traverse((o) => { o.userData.noPick = true; });
  room.add(rig);

  // Lịch phụt chỉnh hướng khi đang trôi trên quỹ đạo: cứ mỗi PULSE_GAP giây có một lượt.
  // Lượt nào cũng có một ống phụt, cách một lượt thì thêm ống chéo đối diện phụt cùng (để xoay tàu),
  // và cách hai lượt thì phụt hai nhịp liền nhau.
  const PULSE_GAP = 7;
  const PUFF = 0.4; // một nhịp phụt dài bao nhiêu giây
  const puff = (u) => (u > 0 && u < PUFF ? Math.sin((Math.PI * u) / PUFF) : 0);
  const pulseOf = (i, t) => {
    const k = Math.floor(t / PULSE_GAP);
    const u = t - k * PULSE_GAP;
    const first = (k * 3) % 4;
    const fires = i === first || (k % 2 === 1 && i === 3 - first);
    if (!fires) return 0;
    return Math.max(puff(u), k % 3 === 0 ? puff(u - 0.6) : 0);
  };
  world.updaters.push((t, dt) => {
    const s = world.space;
    rig.visible = s > 0.02;
    if (!rig.visible) return;
    rig.scale.y = Math.max(s, 0.001); // thò dần ra từ gầm sàn

    // Đốt chính: chỉ trong lúc cất cánh/hạ cánh, mạnh gần hết hành trình rồi tắt dần khi tới nơi
    const p = world.spaceProgress;
    const main = p > 0 && p < 1 ? Math.min(1, 2.5 * Math.sin(Math.PI * p)) : 0;
    // Phụt chỉnh hướng: chỉ khi đã nằm yên trên quỹ đạo
    const coasting = p >= 1 && !world.reduceMotion;
    let pulseMax = 0;

    flames.forEach((f, i) => {
      const { outer, core, throat, bell, phase } = f;
      const pulse = coasting ? pulseOf(i, t) : 0;
      pulseMax = Math.max(pulseMax, pulse);
      // Độ nóng của loa phụt: bừng lên khi đốt, nguội dần trong khoảng 5 giây
      f.heat = Math.max(Math.max(main, 0.6 * pulse), f.heat - dt * 0.2);
      bell.emissiveIntensity = s * 0.9 * f.heat;
      const len = Math.max(1.85 * main, 0.5 * pulse); // lửa đốt chính dài, nhịp chỉnh hướng ngắn và mảnh
      const thin = main > pulse ? 1 : 0.6;
      const on = len > 0.01;
      outer.visible = core.visible = on;
      throat.opacity = s * Math.min(1, Math.max(main, pulse) * 1.3);
      if (!on) return;
      const flicker = world.reduceMotion ? 1 : 1 + 0.12 * Math.sin(t * 23 + phase) + 0.06 * Math.sin(t * 41 + phase * 2);
      outer.scale.set(thin, len * flicker, thin);
      core.scale.set(thin, len * (2 - flicker), thin);
    });

    outerMat.opacity = 0.5 * s;
    coreMat.opacity = 0.85 * s;
    // Gầm sàn: chỉ còn le lói khi động cơ tắt, sáng bừng lên khi đốt chính, nhịp chỉnh hướng thì chỉ hắt nhẹ
    hullMat.emissiveIntensity = s * (0.17 + 0.28 * main + 0.05 * pulseMax);
    glow.intensity = s * (44 * main + 5 * pulseMax);
  });
}

// ---------- Cửa khoang và tên tàu ở mặt ngoài tường trái ----------
// Lúc nào cũng có, ở Trái Đất thì là cửa bước ra hòn đảo. Đèn báo nháy đỏ lúc đang bay lên/đáp xuống,
// xanh khi đã đậu yên trên đảo hay đã lên tới quỹ đạo; tay quay trên cửa xoay một vòng rồi khoá lại.
function buildAirlock(room, world) {
  const metal = new THREE.MeshStandardMaterial({ color: '#c9d2e3', metalness: 0.6, roughness: 0.4 });
  const dark = new THREE.MeshStandardMaterial({ color: '#5d6577', metalness: 0.5, roughness: 0.5 });
  const coral = mat('#f08a7b');

  // Nhóm này quay mặt ra ngoài: trục z của nhóm chĩa ra khỏi tường, trục x chạy dọc tường về phía trước phòng
  const out = at(new THREE.Group(), -5.3, 0, 0, 0, -Math.PI / 2, 0);
  room.add(out);

  // Cửa đặt ở cuối tường, phía trước chân giường: đó là khoảng tường duy nhất còn trống ở mặt trong,
  // nên cửa mở được cả hai phía mà không vướng giường, kệ sách hay chậu cây.
  const DOOR_Z = HATCH.z;
  const stripes = canvasTexture(256, 32, (ctx, w, h) => {
    ctx.fillStyle = '#f4c542';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2b2f3a';
    for (let x = -h; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 20, h);
      ctx.lineTo(x + 20 + h, 0);
      ctx.lineTo(x + h, 0);
      ctx.fill();
    }
  });
  const stripeMat = new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.6 });
  const lampMat = new THREE.MeshStandardMaterial({ color: '#2a2f38', emissive: '#ff4d4d', emissiveIntensity: 0 });
  // Ô quét dấu chân mèo để mở cửa: mặt kính tối, dấu chân và chữ phát sáng theo màu đèn báo
  const scanFace = canvasTexture(256, 384, (ctx, w) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, 384);
    ctx.fillStyle = '#1e1e1e'; // lưới chấm mờ trên mặt kính
    for (let y = 40; y < 260; y += 16) for (let x = 44; x < 220; x += 16) ctx.fillRect(x, y, 3, 3);
    ctx.strokeStyle = '#6a6a6a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(28, 24, w - 56, 240, 26);
    ctx.stroke();
    // Dấu chân: một nệm lớn hình tam giác bo tròn và bốn ngón
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.ellipse(128, 182, 50, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const [x, y, r] of [[70, 128, 19], [104, 92, 21], [152, 92, 21], [186, 128, 19]]) {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.85, r, (x - 128) / 160, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#9a9a9a';
    ctx.textAlign = 'center';
    ctx.font = '800 25px "Be Vietnam Pro", sans-serif';
    ctx.fillText('QUÉT CHÂN MÈO', 128, 318);
    ctx.font = '600 18px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = '#5a5a5a';
    ctx.fillText('đặt cả bàn chân lên', 128, 350);
  });
  const keyMat = new THREE.MeshStandardMaterial({ color: '#141b1e', roughness: 0.25, emissive: '#3dff9a', emissiveMap: scanFace, emissiveIntensity: 1.2 });
  const scanLineMat = new THREE.MeshBasicMaterial({ color: '#3dff9a', transparent: true, opacity: 0.75, depthWrite: false });
  let scanLine = null; // vệt sáng quét lên quét xuống trên ô kính
  // Ô kính tròn trong suốt: tường, khung và cánh cửa đều khoét lỗ nên nhìn xuyên được từ cả hai phía
  const glass = new THREE.MeshStandardMaterial({ color: '#bfe0ff', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2, depthWrite: false });
  // Tấm phẳng bo góc có khoét một lỗ tròn (holeY: độ cao tâm lỗ so với tâm tấm), dày dần từ z = 0
  const plate = (w, h, depth, radius, holeY, material) => {
    const sh = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    sh.moveTo(x + radius, y);
    sh.lineTo(x + w - radius, y);
    sh.absarc(x + w - radius, y + radius, radius, -Math.PI / 2, 0);
    sh.lineTo(x + w, y + h - radius);
    sh.absarc(x + w - radius, y + h - radius, radius, 0, Math.PI / 2);
    sh.lineTo(x + radius, y + h);
    sh.absarc(x + radius, y + h - radius, radius, Math.PI / 2, Math.PI);
    sh.lineTo(x, y + radius);
    sh.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5);
    const cut = new THREE.Path();
    cut.absarc(0, holeY, HATCH.r, 0, Math.PI * 2, true);
    sh.holes.push(cut);
    return new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 40 }), material);
  };
  const wheels = [];

  // Một mặt cửa: khung, cánh, ô kính, tay quay và đèn báo. Mặt ngoài còn rộng chỗ nên có thêm
  // bảng phím và tay vịn; mặt trong thì cửa đã vừa khít giữa chân giường và đầu tường.
  const makeDoorFace = (outside) => {
    const door = new THREE.Group();
    door.add(at(plate(1.7, 3.6, 0.14, 0.05, HATCH.y - 1.9, metal), 0, 1.9, 0));              // khung cửa
    door.add(at(plate(1.3, 3.1, 0.1, 0.08, HATCH.y - 1.85, mat('#eef1f7')), 0, 1.85, 0.1));  // cánh cửa
    door.add(at(box(1.3, 0.08, 0.02, dark, 0), 0, 1.25, 0.203));         // gân ngang trên cánh cửa
    door.add(at(new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.3), stripeMat), 0, 0.33, 0.143)); // vạch cảnh báo ở ngưỡng cửa
    door.add(decoration(at(new THREE.Mesh(new THREE.CircleGeometry(HATCH.r, 32), glass), 0, HATCH.y, 0.17))); // kính không đổ bóng
    door.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.055, 12, 40), coral), 0, HATCH.y, 0.205));

    const wheel = at(new THREE.Group(), 0, 1.25, 0.3); // tay quay khoá cửa
    wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 10, 32), dark));
    for (let i = 0; i < 3; i++) wheel.add(at(box(0.5, 0.05, 0.04, dark, 0.01), 0, 0, 0, 0, 0, (i * Math.PI) / 3));
    door.add(wheel);
    wheels.push(wheel);
    door.add(at(cylinder(0.06, 0.06, 0.12, dark, 12), 0, 1.25, 0.24, Math.PI / 2)); // trục tay quay

    // Đèn báo bắt vít lên một đế kim loại áp sát tường, có mái che nhỏ phía trên (không lơ lửng trước tường)
    door.add(at(box(0.66, 0.3, 0.06, dark, 0.02), 0, 3.86, 0.03));          // đế đèn
    door.add(at(box(0.5, 0.16, 0.08, lampMat, 0.03), 0, 3.86, 0.1));        // đèn báo
    door.add(at(box(0.6, 0.035, 0.13, dark, 0.012), 0, 3.97, 0.105));       // mái che
    for (const x of [-0.29, 0.29]) door.add(at(cylinder(0.018, 0.018, 0.02, metal, 8), x, 3.86, 0.065, Math.PI / 2)); // đinh vít
    if (outside) {
      door.add(at(box(0.36, 0.52, 0.06, dark, 0.025), -1.65, 1.6, 0.03));   // vỏ ô quét chân mèo
      door.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.45), keyMat), -1.65, 1.6, 0.0605));
      scanLine = decoration(at(new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.01), scanLineMat), -1.65, 1.656, 0.063));
      door.add(scanLine);
      door.add(at(cylinder(0.035, 0.035, 1.5, metal, 10), -1.1, 1.75, 0.16)); // tay vịn
      door.add(at(box(0.07, 0.07, 0.16, metal, 0.01), -1.1, 2.45, 0.08));
      door.add(at(box(0.07, 0.07, 0.16, metal, 0.01), -1.1, 1.05, 0.08));
    }
    return door;
  };

  const door = at(makeDoorFace(true), DOOR_Z, 0, 0); // mặt ngoài
  out.add(door);

  // Mặt trong: nhóm quay ngược lại, trục z chĩa vào phòng
  const inner = at(new THREE.Group(), -5, 0, DOOR_Z, 0, Math.PI / 2, 0);
  const doorIn = makeDoorFace(false);
  inner.add(doorIn);
  inner.traverse((o) => { o.userData.noPick = true; });
  room.add(inner);

  // Ống kim loại lót lòng lỗ, nối hai mặt cửa xuyên qua bề dày tường
  const linerMat = new THREE.MeshStandardMaterial({ color: '#5d6577', metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide });
  const liner = new THREE.Mesh(new THREE.CylinderGeometry(HATCH.r - 0.004, HATCH.r - 0.004, 1, 40, 1, true), linerMat);
  liner.userData.noPick = true;
  room.add(at(liner, -5.15, HATCH.y, HATCH.z, 0, 0, Math.PI / 2));

  // Tên tàu sơn thẳng lên tường, kèm dấu chân mèo
  const name = canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#e8695a';
    const paw = (x, y, r) => {
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.35, r * 0.62, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      for (const [dx, dy] of [[-0.62, -0.3], [-0.22, -0.68], [0.22, -0.68], [0.62, -0.3]]) {
        ctx.beginPath();
        ctx.ellipse(x + dx * r, y + dy * r, r * 0.2, r * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    paw(84, 104, 72);
    ctx.textBaseline = 'middle';
    let size = 118;
    do {
      size -= 2;
      ctx.font = `800 ${size}px "Be Vietnam Pro", sans-serif`;
    } while (ctx.measureText('SHOJINLUV-01').width > w - 190);
    ctx.fillText('SHOJINLUV-01', 172, 100);
    ctx.fillStyle = '#9a7f76';
    ctx.font = '600 38px "Be Vietnam Pro", sans-serif';
    ctx.fillText('TÀU VŨ TRỤ · CĂN PHÒNG NHỎ', 176, 196);
  });
  const nameMat = new THREE.MeshStandardMaterial({ map: name, transparent: true, roughness: 0.8 });
  out.add(decoration(at(new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.3), nameMat), -1.2, 3.9, 0.006)));

  out.traverse((o) => { o.userData.noPick = true; });

  liner.scale.y = 0.64; // dài vừa tới mặt kính ở hai mặt cửa

  world.updaters.push((t) => {
    const s = world.space;
    wheels.forEach((w) => { w.rotation.z = -s * Math.PI * 2; }); // cất cánh thì tay quay xoay một vòng khoá cửa
    // Đèn báo xanh khi đang đậu trên đảo hay đã lên tới quỹ đạo, nháy đỏ trong lúc bay
    const settled = s > 0.995 || s < 0.005;
    lampMat.emissive.set(settled ? '#3dff9a' : '#ff4d4d');
    lampMat.emissiveIntensity = settled ? 1.4 : (Math.sin(t * 9) > 0 ? 1.8 : 0.15);
    // Ô quét chân mèo cùng màu đèn báo: xanh là mở được, đỏ là cửa đang khoá vì tàu đang bay
    keyMat.emissive.set(settled ? '#3dff9a' : '#ff4d4d');
    keyMat.emissiveIntensity = 1 + 0.35 * Math.sin(t * 2);
    scanLineMat.color.copy(keyMat.emissive);
    scanLine.position.y = 1.656 + Math.sin(t * 1.6) * 0.115;
    scanLineMat.opacity = settled ? 0.75 : 0;
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
