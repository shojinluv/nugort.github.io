// furniture.js – Đồ đạc trong phòng.
// Đồ vật nào bấm được thì được gom vào một Group có userData.id (xem hàm clickable).
import * as THREE from 'three';
import { mat, box, cylinder, sphere, at, stick, canvasTexture, random, decoration } from './helpers.js';
import { floaty } from './space.js'; // floaty(world, vật, {...}): cho vật trôi lơ lửng khi ra ngoài vũ trụ

export function buildFurniture(world) {
  buildDesk(world);
  buildComputer(world);
  buildLamp(world);
  buildMug(world);
  buildChair(world);
  buildBed(world);
  buildRug(world);
  buildShelf(world);
  buildBeanBag(world);
  buildPlant(world);
  buildGuitar(world);
  buildBag(world);
  buildCat(world);
}

// Đăng ký một đồ vật bấm được. Gốc toạ độ của group nên đặt ở chân đồ vật,
// để khi rê chuột vào, đồ vật phóng to từ dưới lên trông tự nhiên.
function clickable(world, id, group) {
  group.userData.id = id;
  world.clickables[id] = group;
  world.scene.add(group);
  return group;
}

// ---------- Bàn học ----------
function buildDesk({ scene }) {
  const wood = '#d9a066';
  scene.add(at(box(3.6, 0.12, 1.4, wood, 0.04), 1.2, 1.5, -4.28)); // mặt bàn
  for (const z of [-4.85, -3.7]) scene.add(at(box(0.12, 1.44, 0.12, wood, 0.03), -0.45, 0.72, z)); // chân bàn
  scene.add(at(box(0.95, 1.44, 1.3, '#ecc9a0', 0.04), 2.45, 0.72, -4.3)); // tủ ngăn kéo
  for (const y of [0.3, 0.75, 1.2]) {
    scene.add(at(box(0.85, 0.4, 0.04, '#f5dcbc', 0.02), 2.45, y, -3.64)); // mặt ngăn kéo
    scene.add(at(sphere(0.045, '#8a5a3c', 12, 8), 2.45, y, -3.6));       // núm
  }
}

// ---------- Máy tính (bấm vào → "Về mình") ----------
function buildComputer(world) {
  const g = at(new THREE.Group(), 0.5, 1.56, -4.45);
  g.add(at(box(0.55, 0.04, 0.32, '#3d3f4b', 0.02), 0, 0.02, 0));  // đế
  g.add(at(box(0.08, 0.5, 0.06, '#3d3f4b', 0.02), 0, 0.27, -0.06)); // cổ
  g.add(at(box(1.6, 1.0, 0.08, '#2b2d38', 0.03), 0, 0.85, 0));      // viền màn hình

  // Màn hình: MeshBasicMaterial không bị ánh sáng ảnh hưởng nên trông như đang tự phát sáng
  // Đoạn code trên màn hình đổi theo chế độ đang chọn (ngày/đêm, Trái Đất/vũ trụ):
  // mỗi khi chế độ đổi thì vẽ lại tấm canvas rồi báo cho texture cập nhật
  const screenTex = canvasTexture(640, 380, (ctx, w, h) => drawCode(ctx, w, h, false, false));
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 0.88), screenMat);
  g.add(at(screen, 0, 0.85, 0.042));
  // Logo phát sáng sau lưng màn hình (chỉ thấy khi ra vũ trụ rồi xoay camera ra sau tường):
  // quả táo há miệng kiểu Pac-Man đang đuổi theo mấy hạt đậu
  const logoMat = new THREE.MeshBasicMaterial({ map: canvasTexture(256, 256, drawAppleMan), transparent: true, toneMapped: false });
  g.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), logoMat), 0, 0.87, -0.042, 0, Math.PI, 0));

  let shown = 'false,false';
  world.updaters.push(() => {
    const mode = `${Boolean(world.nightOn)},${world.spaceOn}`;
    if (mode === shown) return;
    shown = mode;
    drawCode(screenTex.image.getContext('2d'), 640, 380, Boolean(world.nightOn), world.spaceOn);
    screenTex.needsUpdate = true;
  });

  // Bàn phím và chuột
  const keyboard = at(new THREE.Group(), 0.05, 0, 0.62);
  keyboard.add(at(box(0.95, 0.05, 0.32, '#f4f1ea', 0.02), 0, 0.025, 0));
  keyboard.add(at(box(0.86, 0.012, 0.24, '#dcd6cc', 0.004), 0, 0.055, 0));
  g.add(keyboard);
  const mouse = sphere(0.07, '#f4f1ea', 16, 10);
  mouse.scale.set(0.8, 0.45, 1.2);
  g.add(at(mouse, 0.75, 0.03, 0.62));
  floaty(world, keyboard, { lift: [0, 0.25, 0.12], tilt: [0.12, 0.1, 0.08], delay: 0.2, bob: 0.03 });
  floaty(world, mouse, { lift: [0.05, 0.4, 0.1], tilt: [0.4, 0.3, 0.4], spin: 0.7, delay: 0.1 });

  // Ánh xanh nhẹ hắt ra từ màn hình, chỉ thấy rõ khi trời tối
  const glow = new THREE.PointLight('#8fb8ff', 0, 4, 2);
  glow.position.set(0, 0.85, 0.5);
  g.add(glow);
  world.nightFns.push((n) => {
    glow.intensity = n * 1.5;
    screenMat.color.setScalar(0.85 + 0.15 * n);
  });

  clickable(world, 'computer', g);
}

// Logo "táo Pac-Man": thân tròn há miệng hình nêm (Pac-Man), có lõm trên dưới và chiếc lá (quả táo)
function drawAppleMan(ctx) {
  const dot = (x, y, r) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.fillStyle = '#f4f1ea';
  // Thân: hình tròn khuyết một miếng nêm ở bên phải làm cái miệng
  ctx.beginPath();
  ctx.moveTo(108, 150);
  ctx.arc(108, 150, 72, 0.6, Math.PI * 2 - 0.6);
  ctx.closePath();
  ctx.fill();
  // Chiếc lá nghiêng phía trên
  ctx.save();
  ctx.translate(128, 56);
  ctx.rotate(-0.7);
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Mấy hạt đậu trước miệng, càng xa càng nhỏ
  dot(196, 150, 10);
  dot(232, 150, 7);
  // Khoét bớt: lõm trên, lõm dưới của quả táo và con mắt
  ctx.globalCompositeOperation = 'destination-out';
  dot(108, 76, 15);
  dot(108, 226, 11);
  dot(122, 112, 9);
  ctx.globalCompositeOperation = 'source-over';
}

function drawCode(ctx, w, h, night, space) {
  ctx.fillStyle = '#1f2336';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2a2f47';
  ctx.fillRect(0, 0, w, 34);
  ['#ff6b6b', '#ffd166', '#06d6a0'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(22 + i * 22, 17, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  // Mỗi dòng code là một danh sách [chữ, màu]
  const P = '#c792ea', S = '#c3e88d', F = '#82aaff', T = '#a6accd', C = '#676e95', Y = '#ffcb6b';
  const lines = [
    [['// căn phòng nhỏ của Shojinluv', C]],
    [['const ', P], ['phong', T], [' = ', T], ['new ', P], ['Phong', Y], ['(', T], ["'ấm cúng'", S], [');', T]],
    [['phong', T], ['.', T], ['them', F], ['([', T], ["'đàn'", S], [', ', T], ["'mèo'", S], [', ', T], ["'cây'", S], [']);', T]],
    [],
    [['phong', T], ['.', T], ['anhSang', F], [' = ', T], [night ? "'buổi tối'" : "'ban ngày'", S], [';', T]],
    [['phong', T], ['.', T], ['viTri', F], [' = ', T], [space ? "'vũ trụ'" : "'Trái Đất'", S], [';', T]],
    [['phong', T], ['.', T], ['trongLuc', F], [' = ', T], [space ? 'false' : 'true', Y], [';', T]],
    [],
    [['phong', T], ['.', T], ['chay', F], ['();', T], [` // ${space ? '🚀' : night ? '🌙' : '☀️'}`, C]],
  ];
  ctx.font = '22px "SFMono-Regular", Menlo, Consolas, monospace';
  ctx.textBaseline = 'middle';
  let x = 58;
  lines.forEach((tokens, i) => {
    const y = 64 + i * 34;
    ctx.fillStyle = '#4b5170';
    ctx.textAlign = 'right';
    ctx.fillText(String(i + 1), 40, y);
    ctx.textAlign = 'left';
    x = 58;
    for (const [text, color] of tokens) {
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      x += ctx.measureText(text).width;
    }
  });
  ctx.fillStyle = '#ffcb6b';
  ctx.fillRect(x + 6, 64 + (lines.length - 1) * 34 - 13, 12, 26); // con trỏ, nằm sau dòng cuối
}

// ---------- Đèn bàn (bấm vào → đổi ngày/đêm) ----------
function buildLamp(world) {
  const g = at(new THREE.Group(), 2.55, 1.56, -4.45);
  const yellow = '#f2b84b';
  g.add(at(cylinder(0.2, 0.24, 0.06, yellow, 24), 0, 0.03, 0)); // đế
  const p0 = new THREE.Vector3(0, 0.06, 0);
  const p1 = new THREE.Vector3(-0.05, 0.8, 0.1);
  const p2 = new THREE.Vector3(-0.38, 1.0, 0.4);
  g.add(stick(p0, p1, 0.028, yellow), stick(p1, p2, 0.028, yellow));
  g.add(at(sphere(0.05, '#d99a2b', 12, 8), p1.x, p1.y, p1.z)); // khớp nối

  // Chao đèn hình nón, nghiêng về phía bàn phím
  const head = at(new THREE.Group(), p2.x, p2.y, p2.z, 0, 0, -0.45);
  const shadeMat = new THREE.MeshStandardMaterial({ color: yellow, roughness: 0.6, side: THREE.DoubleSide });
  head.add(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 24, 1, true), shadeMat));
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff6dc', emissive: '#ffd27a', emissiveIntensity: 0 });
  head.add(at(sphere(0.075, bulbMat, 16, 10), 0, -0.1, 0));
  const light = new THREE.PointLight('#ffc477', 0, 8, 2);
  light.position.set(0, -0.3, 0);
  head.add(light);
  g.add(head);

  world.nightFns.push((n) => {
    bulbMat.emissiveIntensity = n * 4;
    light.intensity = n * 9;
  });
  clickable(world, 'lamp', g);
}

// ---------- Cốc cà phê còn bốc hơi ----------
function buildMug(world) {
  const g = at(new THREE.Group(), 1.75, 1.56, -3.95);
  g.add(at(cylinder(0.12, 0.11, 0.26, '#ff8a7a', 20), 0, 0.13, 0));
  g.add(at(cylinder(0.105, 0.105, 0.02, '#5a3420', 20), 0, 0.25, 0));
  g.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 8, 16), mat('#ff8a7a')), 0.13, 0.13, 0));

  const steam = [0, 1, 2].map(() => {
    const s = sphere(0.035, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), 10, 8);
    g.add(decoration(s));
    return s;
  });
  world.updaters.push((t) => {
    steam.forEach((s, i) => {
      const p = (t * 0.4 + i / 3) % 1; // p chạy từ 0 → 1 rồi lặp lại
      s.position.set(Math.sin(p * 6 + i) * 0.03, 0.3 + p * 0.45, 0);
      s.scale.setScalar(0.5 + p);
      s.material.opacity = Math.sin(p * Math.PI) * 0.5 * (1 - world.space); // chân không thì chẳng có hơi nước bay lên
    });
  });
  world.scene.add(g);
  floaty(world, g, { lift: [0, 0.75, 0.2], tilt: [0.5, 0.3, 0.4], spin: 0.5, delay: 0.05 });
}

// ---------- Ghế xoay ----------
function buildChair(world) {
  const g = at(new THREE.Group(), 0.55, 0, -2.85, 0, 0.3, 0);
  const teal = '#4fb3a9';
  const grey = '#5d5f6e';
  g.add(at(box(1.1, 0.16, 1.0, teal, 0.07), 0, 1.0, 0));            // mặt ghế
  g.add(at(box(1.1, 1.1, 0.14, teal, 0.07), 0, 1.65, 0.45, 0.12));  // lưng ghế
  g.add(at(cylinder(0.06, 0.06, 0.75, grey, 12), 0, 0.55, 0));      // trụ
  const hub = new THREE.Vector3(0, 0.2, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const end = new THREE.Vector3(Math.cos(a) * 0.5, 0.12, Math.sin(a) * 0.5);
    g.add(stick(hub, end, 0.035, grey));
    g.add(at(sphere(0.065, '#2f3038', 10, 8), end.x, 0.065, end.z)); // bánh xe
  }
  world.scene.add(g);
  floaty(world, g, { lift: [0, 0.35, 0.35], tilt: [0.1, 0.05, 0.12], spin: 0.25, delay: 0.25 }); // ghế xoay vòng chầm chậm
}

// ---------- Giường ----------
function buildBed(world) {
  const { scene } = world;
  const cx = -3.75;
  const cz = 1.0;
  scene.add(at(box(2.5, 0.45, 4.5, '#c98f5a', 0.05), cx, 0.32, cz)); // khung
  for (const dx of [-1.1, 1.1]) {
    for (const dz of [-2.1, 2.1]) scene.add(at(cylinder(0.07, 0.07, 0.1, '#8a5a3c', 10), cx + dx, 0.05, cz + dz));
  }
  scene.add(at(box(2.4, 0.4, 4.4, '#fffaf3', 0.14), cx, 0.74, cz));               // nệm
  scene.add(at(box(2.52, 0.14, 3.0, '#f2b84b', 0.06), cx, 0.98, cz + 0.75));       // chăn
  scene.add(at(box(2.54, 0.16, 0.35, '#ffd98a', 0.07), cx, 1.0, cz - 0.62));       // mép chăn gấp
  const pillow = at(box(1.5, 0.28, 0.75, '#ffffff', 0.13), cx, 1.08, cz - 1.55, -0.12); // gối
  const cushion = at(box(0.75, 0.22, 0.55, '#ffb7c9', 0.1), cx + 0.55, 1.12, cz - 1.0, -0.1, 0.4, 0.15); // gối nhỏ
  scene.add(pillow, cushion);
  scene.add(at(box(2.5, 1.7, 0.18, '#b97c4c', 0.06), cx, 0.85, cz - 2.32));        // đầu giường
  floaty(world, pillow, { lift: [0, 0.35, 0.05], tilt: [0.25, 0.3, 0.2], delay: 0.3 });
  floaty(world, cushion, { lift: [0.15, 0.7, 0.2], tilt: [0.4, 0.5, 0.4], spin: 0.35, delay: 0.15 });
}

// ---------- Thảm tròn ----------
function buildRug({ scene }) {
  const rings = [[2.3, '#f4a29a', 0.02], [1.95, '#fff1e0', 0.024], [1.55, '#9fd8cb', 0.028]];
  for (const [r, color, h] of rings) scene.add(at(cylinder(r, r, h, color, 64), 0.7, h / 2, 1.0));
}

// ---------- Kệ sách treo tường ----------
// Kệ treo ngay phía trên cây Monstera, nên phải treo đủ cao để cây lớn hết cỡ (tưới nhiều lần) vẫn không chạm kệ
const SHELF_Y = 3.75; // độ cao mặt kệ
function buildShelf(world) {
  const { scene } = world;
  scene.add(at(box(0.7, 0.08, 2.3, '#c98f5a', 0.02), -4.65, SHELF_Y, -3.15));
  for (const z of [-4.0, -2.3]) scene.add(at(box(0.5, 0.3, 0.06, '#a8724a', 0.02), -4.75, SHELF_Y - 0.18, z)); // giá đỡ

  const colors = ['#ef6f5c', '#4fb3a9', '#f2b84b', '#7b8cde', '#f6a7a0', '#5d9e6f', '#e8d5b5'];
  let z = -4.2;
  colors.forEach((color, i) => {
    const t = 0.13 + random() * 0.08; // độ dày cuốn sách
    const h = 0.45 + random() * 0.22; // chiều cao cuốn sách
    const book = box(0.48, h, t, color, 0.015);
    const base = SHELF_Y + 0.04; // đáy sách nằm trên mặt kệ
    if (i === colors.length - 1) at(book, -4.68, base + h / 2 - 0.04, z + 0.2, -0.38); // cuốn cuối nằm nghiêng
    else at(book, -4.68, base + h / 2, z + t / 2);
    scene.add(book);
    // Ngoài vũ trụ, sách trôi dần ra khỏi kệ, mỗi cuốn ra xa một khác
    floaty(world, book, { lift: [0.25 + (i % 3) * 0.15, 0.08 + (i % 2) * 0.1, 0], tilt: [0.1, 0.1, 0.1], delay: 0.05 * i, bob: 0.04 });
    z += t + 0.015;
  });
  const cactus = at(new THREE.Group(), -4.65, SHELF_Y + 0.04, -2.4);
  cactus.add(at(cylinder(0.12, 0.09, 0.18, '#e88a5e', 14), 0, 0.09, 0));
  cactus.add(at(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.16, 4, 10), mat('#5d9e6f')), 0, 0.31, 0));
  scene.add(cactus);
  floaty(world, cactus, { lift: [0.3, 0.35, 0.1], tilt: [0.3, 0.2, 0.3], spin: 0.4, delay: 0.2 });
}

// ---------- Ghế lười và chồng sách ----------
function buildBeanBag(world) {
  const { scene } = world;
  const bag = sphere(0.95, '#8fc9e8', 32, 20);
  bag.scale.set(1, 0.55, 1);
  scene.add(at(bag, 3.5, 0.48, 2.6));
  const book = at(box(0.55, 0.07, 0.4, '#ef6f5c', 0.015), 3.35, 1.0, 2.5, 0.12, 0.6, -0.08);
  scene.add(book);
  floaty(world, bag, { lift: [0, 0.3, 0], tilt: [0.06, 0.1, 0.06], delay: 0.35, bob: 0.05 });
  floaty(world, book, { lift: [0, 0.9, 0.1], tilt: [0.5, 0.4, 0.5], spin: 0.45, delay: 0.1 });

  // Chồng sách: ngoài vũ trụ thì tách ra, mỗi cuốn bay một độ cao và xoay một chiều
  const drift = [[[-0.1, 0.45, 0.1], 0.3], [[0.12, 0.8, -0.1], -0.4], [[0, 1.15, 0.08], 0.5]];
  let y = 0;
  [['#7b8cde', 0.7, 0.5], ['#f2b84b', 0.62, 0.46], ['#4fb3a9', 0.55, 0.42]].forEach(([color, w, d], i) => {
    const b = at(box(w, 0.12, d, color, 0.015), 4.35, y + 0.06, 1.0, 0, i * 0.3 - 0.2, 0);
    scene.add(b);
    floaty(world, b, { lift: drift[i][0], tilt: [0.3, 0.2, 0.3], spin: drift[i][1], delay: 0.05 + i * 0.07 });
    y += 0.12;
  });
}

// ---------- Cây Monstera (bấm vào → tưới cây) ----------
function buildPlant(world) {
  const g = at(new THREE.Group(), -4.15, 0, -4.15);
  const inner = new THREE.Group(); // phần sẽ rung rinh khi được tưới
  g.add(inner);
  inner.add(at(cylinder(0.45, 0.34, 0.8, '#d9774b', 24), 0, 0.4, 0));  // chậu
  inner.add(at(cylinder(0.5, 0.5, 0.12, '#e88a5e', 24), 0, 0.8, 0));   // miệng chậu
  inner.add(at(cylinder(0.43, 0.43, 0.04, '#5b3b2a', 24), 0, 0.84, 0)); // đất

  const leafMats = [mat('#4caf6e'), mat('#3d9a5d')];
  const count = 8;
  for (let i = 0; i < count; i++) {
    // Chỉ cho lá xoè về phía trong phòng, không đâm vào tường
    const a = -0.5 + (i / (count - 1)) * 2.6 + (random() - 0.5) * 0.2;
    const height = 1.4 + random() * 1.1;
    const reach = 0.4 + random() * 0.45;
    const tip = new THREE.Vector3(Math.cos(a) * reach, height - 0.02, Math.sin(a) * reach);
    inner.add(stick(new THREE.Vector3(0, 0.84, 0), tip, 0.022, '#3f8a52'));
    const leaf = sphere(0.42, leafMats[i % 2], 16, 10);
    leaf.scale.set(1, 0.09, 0.6); // ép dẹt hình cầu thành chiếc lá
    // Lá nghiêng chúc xuống 0.35 rad. Đặt tâm lá sao cho đầu trong của lá trùm lên đầu cuống,
    // kẻo lá lơ lửng tách rời khỏi cuống
    const out = 0.36 * Math.cos(0.35); // từ đầu cuống ra tới tâm lá, theo chiều ngang
    const drop = 0.36 * Math.sin(0.35); // và theo chiều dọc
    inner.add(at(leaf, Math.cos(a) * (reach + out), height - 0.02 - drop, Math.sin(a) * (reach + out), 0, -a, -0.35));
  }

  // Ngoài vũ trụ, nước tưới không chảy xuống đất mà tụ thành những giọt tròn trôi lơ lửng
  const dropMat = new THREE.MeshStandardMaterial({ color: '#8fd6ff', roughness: 0.1, transparent: true, opacity: 0, depthWrite: false });
  const drops = Array.from({ length: 8 }, () => {
    const mesh = decoration(sphere(0.07, dropMat, 12, 8));
    mesh.visible = false;
    g.add(mesh);
    return { mesh, velocity: new THREE.Vector3() };
  });
  let dropLife = 0;

  let wiggle = 0;
  let grow = 1;
  let growTarget = 1;
  world.plant = {
    water() {
      wiggle = 1;
      growTarget = Math.min(1.3, growTarget + 0.06);
      if (world.space < 0.5) return;
      dropLife = 4;
      drops.forEach((d) => {
        d.mesh.position.set(0.2 + Math.random() * 0.4, 1.6 + Math.random() * 0.8, 0.2 + Math.random() * 0.4);
        d.velocity.set(0.1 + Math.random() * 0.25, (Math.random() - 0.4) * 0.2, 0.1 + Math.random() * 0.25); // trôi ra giữa phòng
        d.mesh.scale.setScalar(0.5 + Math.random() * 0.9);
      });
    },
  };
  world.updaters.push((t, dt) => {
    wiggle = Math.max(0, wiggle - dt * 0.8);
    inner.rotation.z = Math.sin(t * 16) * 0.08 * wiggle + Math.sin(t * 0.8) * 0.01; // + gió thoảng
    inner.rotation.x = Math.cos(t * 13) * 0.05 * wiggle;
    grow += (growTarget - grow) * Math.min(1, dt * 3);
    inner.scale.setScalar(grow);

    dropLife = Math.max(0, dropLife - dt);
    dropMat.opacity = Math.min(1, dropLife) * 0.8; // giây cuối thì mờ dần rồi biến mất
    drops.forEach((d, i) => {
      d.mesh.visible = dropLife > 0;
      if (dropLife === 0) return;
      d.mesh.position.addScaledVector(d.velocity, dt);
      d.mesh.scale.y = d.mesh.scale.x * (1 + Math.sin(t * 6 + i) * 0.12); // giọt nước rung rinh
    });
  });
  clickable(world, 'plant', g);
  floaty(world, g, { lift: [0, 0.12, 0], tilt: [0.03, 0.05, 0.03], delay: 0.4, bob: 0.03 }); // chậu nặng nên chỉ nhấc lên một chút
}

// ---------- Đàn guitar dựa tường (bấm vào → dự án The Band) ----------
function buildGuitar(world) {
  const g = at(new THREE.Group(), -2.2, 0, -4.35, 0, 0.15, 0);
  const lean = at(new THREE.Group(), 0, 0, 0, -0.2); // nghiêng đầu đàn dựa vào tường
  g.add(lean);

  const body = '#e08a4a';
  const edge = '#8a4a24';
  const dark = '#4a2c1c';
  const up = Math.PI / 2; // xoay hình trụ cho mặt tròn quay ra phía trước
  lean.add(at(cylinder(0.46, 0.46, 0.2, body, 36), 0, 0.56, 0, up));
  lean.add(at(cylinder(0.36, 0.36, 0.2, body, 36), 0, 1.06, 0, up));
  lean.add(at(cylinder(0.47, 0.47, 0.17, edge, 36), 0, 0.56, 0, up)); // viền thân đàn
  lean.add(at(cylinder(0.37, 0.37, 0.17, edge, 36), 0, 1.06, 0, up));
  lean.add(at(cylinder(0.13, 0.13, 0.02, '#2e1a10', 24), 0, 0.9, 0.1, up)); // lỗ thoát âm
  lean.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 6, 32), mat('#f6e3c4')), 0, 0.9, 0.105));
  lean.add(at(box(0.36, 0.07, 0.03, dark, 0.01), 0, 0.42, 0.11)); // ngựa đàn
  lean.add(at(box(0.13, 1.25, 0.07, '#8a5530', 0.02), 0, 1.93, 0.035)); // cần đàn
  lean.add(at(box(0.11, 1.25, 0.01, '#3a2418', 0), 0, 1.93, 0.075));    // phím đàn
  for (let i = 0; i < 9; i++) lean.add(at(box(0.11, 0.008, 0.012, '#d8d8d8', 0), 0, 1.42 + i * 0.12, 0.08));
  lean.add(at(box(0.2, 0.34, 0.06, dark, 0.02), 0, 2.72, 0.03)); // đầu đàn
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) lean.add(at(sphere(0.03, '#e8e2d6', 8, 6), side * 0.13, 2.62 + k * 0.1, 0.03));
  }
  for (let s = 0; s < 6; s++) lean.add(at(box(0.005, 2.14, 0.005, '#f4efe6', 0), -0.045 + s * 0.018, 1.49, 0.1)); // dây đàn

  clickable(world, 'guitar', g);
  floaty(world, g, { lift: [0.1, 0.5, 0.65], tilt: [0.12, 0.25, 0.15], delay: 0.15, bob: 0.08 }); // rời tường trôi ra
}

// ---------- Túi hàng và hộp hàng (bấm vào → dự án Shopee clone) ----------
function buildBag(world) {
  const g = at(new THREE.Group(), 4.0, 0, -3.4, 0, -0.35, 0);
  const orange = '#ee5a36';
  const deep = '#d94a28';
  g.add(at(box(0.75, 0.9, 0.38, orange, 0.03), 0, 0.45, 0));
  g.add(at(box(0.77, 0.08, 0.4, deep, 0.02), 0, 0.86, 0)); // viền miệng túi
  const handle = new THREE.TorusGeometry(0.19, 0.025, 8, 24, Math.PI); // nửa vòng tròn
  for (const z of [-0.1, 0.1]) g.add(at(new THREE.Mesh(handle, mat(deep)), 0, 0.9, z));
  g.add(at(cylinder(0.16, 0.16, 0.01, '#ffffff', 24), 0, 0.45, 0.195, Math.PI / 2)); // nhãn dán
  g.add(at(box(0.14, 0.12, 0.012, orange, 0.02), 0, 0.43, 0.203));

  g.add(at(box(0.7, 0.5, 0.6, '#d8b083', 0.02), 0.15, 0.25, -0.8, 0, 0.3, 0));  // hộp hàng
  g.add(at(box(0.72, 0.012, 0.14, '#c49564', 0), 0.15, 0.505, -0.8, 0, 0.3, 0)); // băng keo
  clickable(world, 'bag', g);
  floaty(world, g, { lift: [-0.25, 0.55, 0.45], tilt: [0.15, 0.3, 0.15], spin: 0.12, delay: 0.25 });
}

// ---------- Mèo Sphynx ngủ trong vệt nắng (bấm vào → mèo giật mình) ----------
// Sphynx là giống mèo không lông: da trần màu hồng đào, tai to như tai dơi,
// trán nhiều nếp nhăn, mắt to hình quả chanh và cái đuôi dài thon như roi.

// Vài số đo dùng chung giữa con mèo và bộ đồ phi hành gia của nó
const EAR = { x: -0.03, y: 0.31, z: 0.227, tilt: 0.5, turn: 0.35 }; // vị trí, góc chĩa của tai (trong hệ toạ độ của đầu)
const FORELEGS = [0.01, 0.23];                                   // hai chân trước, theo trục z
const legStart = (z) => new THREE.Vector3(0.2, 0.13, z * 0.75);    // đầu chân nằm trong ngực
const legEnd = (z) => new THREE.Vector3(0.72, 0.05, z);            // cổ chân, ngay sau bàn chân

function buildCat(world) {
  const g = at(new THREE.Group(), 1.2, 0.03, 1.5, 0, -0.5, 0);
  // Da trần hơi bóng hơn lông, nên dùng material riêng với roughness thấp hơn mặc định
  const skin = new THREE.MeshStandardMaterial({ color: '#f3c1aa', roughness: 0.6 });
  const crease = mat('#d8968a'); // nếp nhăn: da sẫm hơn một chút
  const earPink = mat('#f4a3a3'); // lòng tai
  const ink = mat('#3a2a22');
  const pink = mat('#ff9eaa');

  const body = new THREE.Group(); // thân, sẽ phồng xẹp theo nhịp thở
  g.add(body);
  const torso = sphere(0.5, skin, 28, 18);
  torso.scale.set(1, 0.52, 0.66); // Sphynx thon hơn mèo ta
  body.add(at(torso, 0, 0.26, 0));
  const haunch = sphere(0.24, skin, 20, 14); // đùi sau nhô lên, lộ cơ vì không có lông che
  haunch.scale.set(1.1, 0.85, 0.7);
  body.add(at(haunch, -0.22, 0.24, 0.2));

  // Hai chân trước duỗi ra từ ngực, luồn dưới cằm (mèo gối đầu lên chân mà ngủ).
  // Phần đầu que nằm lọt trong thân, nên nhìn từ ngoài chỉ thấy cẳng chân và bàn chân.
  // Mỗi chân là một nhóm xoay quanh vai: ra ngoài vũ trụ thì chân buông thõng xuống dưới ngực,
  // để không chọc xuyên qua mũ phi hành gia.
  const forelegs = FORELEGS.map((z) => {
    const shoulder = legStart(z);
    const leg = at(new THREE.Group(), shoulder.x, shoulder.y, shoulder.z);
    leg.add(stick(new THREE.Vector3(), legEnd(z).sub(shoulder), 0.05, skin));
    const paw = sphere(0.065, skin, 14, 10);
    paw.scale.set(1.4, 0.6, 1);
    leg.add(at(paw, 0.76 - shoulder.x, 0.04 - shoulder.y, z - shoulder.z));
    g.add(leg);
    return leg;
  });

  const head = at(new THREE.Group(), 0.5, 0.24, 0.12, 0, 0, -0.12);
  g.add(head);
  const [rx, ry, rz] = [0.27 * 1.05, 0.27 * 0.86, 0.27 * 0.92]; // bán kính đầu theo 3 trục
  const skull = sphere(0.27, skin, 24, 16);
  skull.scale.set(rx / 0.27, ry / 0.27, rz / 0.27); // đầu hơi dài, hình nêm
  head.add(skull);

  const earGeo = new THREE.ConeGeometry(0.125, 0.32, 16);
  const earInnerGeo = new THREE.ConeGeometry(0.085, 0.24, 16);
  for (const s of [-1, 1]) {
    // Tai to như tai dơi: hình nón dẹt chĩa chếch ra ngoài, lòng tai màu hồng
    const ear = at(new THREE.Group(), EAR.x, EAR.y, s * EAR.z, s * EAR.tilt, -s * EAR.turn, 0);
    const outer = new THREE.Mesh(earGeo, skin);
    outer.scale.x = 0.38;
    const inner = at(new THREE.Mesh(earInnerGeo, earPink), 0.028, -0.03, 0);
    inner.scale.x = 0.3;
    ear.add(outer, inner);
    head.add(ear);

    const cheek = sphere(0.1, skin, 14, 10); // gò má cao
    cheek.scale.set(0.9, 0.75, 0.8);
    head.add(at(cheek, 0.1, -0.06, s * 0.17));
    const pad = sphere(0.062, skin, 14, 10); // đệm ria hai bên mõm
    pad.scale.set(0.8, 0.72, 0.9);
    head.add(at(pad, 0.235, -0.085, s * 0.048));
    head.add(at(sphere(0.042, pink, 10, 8), 0.185, -0.06, s * 0.16)); // má hồng
  }
  const nose = sphere(0.03, pink, 10, 8);
  nose.scale.set(0.8, 0.7, 1.1);
  head.add(at(nose, 0.29, -0.035, 0)); // mũi

  // Nếp nhăn trên trán, nét đặc trưng nhất của mèo Sphynx.
  // Mỗi nếp là một ống mảnh chạy sát mặt da (toạ độ tính từ hình elip của đầu).
  for (const [y0, w] of [[0.115, 0.08], [0.15, 0.065], [0.185, 0.045]]) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const z = w * (i / 4 - 1);
      const y = y0 + 0.012 * Math.cos((z / w) * (Math.PI / 2)); // hơi cong lên ở giữa
      const x = rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2 - (z / rz) ** 2)) + 0.003;
      pts.push(new THREE.Vector3(x, y, z));
    }
    head.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.009, 6), crease));
  }

  // Mắt nhắm (lúc ngủ) và mắt mở to hình quả chanh (lúc bị chọc)
  const eyesClosed = new THREE.Group();
  const eyesOpen = new THREE.Group();
  const eyeGeo = new THREE.SphereGeometry(0.06, 16, 12);
  const lidGeo = new THREE.TorusGeometry(0.05, 0.011, 6, 16, Math.PI);
  const iris = mat('#a6d66b');
  for (const s of [-1, 1]) {
    const pose = [0.238, 0.045, s * 0.105, 0, -s * 0.5, 0]; // quay mỗi mắt ra ngoài một chút cho ôm theo mặt
    const open = at(new THREE.Group(), ...pose);
    const eye = new THREE.Mesh(eyeGeo, iris);
    eye.scale.set(0.5, 0.72, 1);
    eye.rotation.x = -s * 0.3; // đuôi mắt xếch lên
    const pupil = sphere(0.032, ink, 12, 8); // con ngươi giãn to vì giật mình
    pupil.scale.set(0.4, 1, 0.8);
    open.add(eye, at(pupil, 0.022, 0, 0), at(sphere(0.011, '#ffffff', 8, 6), 0.033, 0.016, 0.012));
    eyesOpen.add(open);

    const closed = at(new THREE.Group(), ...pose);
    closed.add(at(new THREE.Mesh(lidGeo, ink), 0.014, 0.012, 0, -s * 0.3, Math.PI / 2, Math.PI));
    eyesClosed.add(closed);
  }
  eyesOpen.visible = false;
  head.add(eyesClosed, eyesOpen);

  // Đuôi dài, thon dần về chóp như cái roi
  const tailPivot = at(new THREE.Group(), -0.42, 0.12, 0);
  g.add(tailPivot);
  const tailCurve = new THREE.CatmullRomCurve3(
    [[0.12, 0.04, -0.02], [0, 0, 0], [-0.14, -0.06, 0.22], [0, -0.095, 0.47], [0.36, -0.11, 0.57], [0.7, -0.115, 0.47], [0.84, -0.11, 0.3]]
      .map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  );
  // TubeGeometry luôn to đều, nên kéo từng vòng đỉnh lại gần trục để đuôi nhỏ dần:
  // gốc đuôi giữ nguyên, chóp chỉ còn 1/10. "scale" và "extra" để làm ống áo bọc ngoài đuôi (to hơn một chút).
  const R_TAIL = 0.05;
  const makeTail = (scale = 1, extra = 0) => {
    const [segs, sides] = [48, 10];
    const geometry = new THREE.TubeGeometry(tailCurve, segs, R_TAIL, sides);
    const pos = geometry.attributes.position;
    const axis = new THREE.Vector3();
    const v = new THREE.Vector3();
    for (let i = 0; i <= segs; i++) {
      tailCurve.getPointAt(i / segs, axis);
      const k = (1 - 0.9 * (i / segs)) * scale + extra / R_TAIL;
      for (let j = 0; j <= sides; j++) {
        const n = i * (sides + 1) + j;
        v.fromBufferAttribute(pos, n).sub(axis).multiplyScalar(k).add(axis);
        pos.setXYZ(n, v.x, v.y, v.z);
      }
    }
    geometry.computeBoundingSphere();
    return geometry;
  };
  tailPivot.add(new THREE.Mesh(makeTail(), skin));

  // Chữ "z" bay lên khi mèo ngủ
  const zTexture = canvasTexture(64, 64, (ctx) => {
    ctx.font = '800 48px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = '#7b6cf6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('z', 32, 30);
  });
  const zs = [0, 1, 2].map(() => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTexture, transparent: true, depthWrite: false }));
    g.add(decoration(sprite));
    return sprite;
  });

  // Bộ đồ phi hành gia, chỉ hiện ra khi căn phòng bay ra ngoài vũ trụ (xem buildSpacesuit bên dưới)
  const updateSuit = buildSpacesuit({
    body, head, forelegs,
    tail: { pivot: tailPivot, geometry: makeTail(1.22, 0.006), tip: tailCurve.getPointAt(1) },
  });

  let jump = 0;
  let awake = 0;
  let flip = 0;
  world.cat = {
    poke() {
      awake = 2.2;
      if (world.space > 0.5) flip = 1; // ngoài vũ trụ không nhảy được, nên lộn nhào một vòng
      else jump = 1;
    },
  };
  const yaw = g.rotation.y;
  const pivot = new THREE.Vector3(0.15, 0.28, 0); // tâm thân mèo: lộn nhào quanh điểm này
  let shiftX = 0;
  let shiftZ = 0;
  world.updaters.push((t, dt) => {
    const calm = world.reduceMotion ? 0 : 1;
    body.scale.y = 1 + Math.sin(t * 2.2) * 0.035;      // thở

    // Ngoài vũ trụ: mặc đồ phi hành gia, bay lơ lửng và lắc lư chầm chậm
    const e = THREE.MathUtils.smoothstep(world.spaceProgress, 0.1, 0.7);
    // Vẫy đuôi. Ngoài vũ trụ thì đuôi duỗi ra phía sau, để chóp đuôi không chui vào trong mũ
    tailPivot.rotation.y = -0.55 * e + Math.sin(t * 1.4) * (0.12 + 0.1 * e);
    updateSuit(e, t);
    // Chân trước buông thõng xuống dưới ngực và khẽ đung đưa như đang bơi trong không trung
    forelegs.forEach((leg, i) => {
      leg.rotation.z = -e * (1.2 + Math.sin(t * 1.3 + i * 1.5) * 0.12 * calm);
      leg.scale.x = 1 - 0.4 * e; // co chân lại cho ngắn bớt (chân duỗi thẳng xuống trông dài quá)
    });

    jump = Math.max(0, jump - dt * 1.6);
    flip = Math.max(0, flip - dt * 0.8);
    g.position.y = 0.03
      + Math.sin((1 - jump) * Math.PI) * 0.55          // nảy lên rồi rơi xuống
      + e * (1.05 + Math.sin(t * 0.9) * 0.12 * calm);  // bay lơ lửng

    // Lộn nhào: xoay quanh trục z của mèo, rồi dời vị trí bù lại để tâm thân mèo (pivot) đứng yên
    const somersault = flip > 0 ? -Math.PI * 2 * THREE.MathUtils.smootherstep(1 - flip, 0, 1) : 0;
    const roll = e * Math.sin(t * 0.5) * 0.2 * calm + somersault;
    g.rotation.z = roll;
    g.rotation.x = e * Math.sin(t * 0.37) * 0.12 * calm;
    const c = Math.cos(roll);
    const s = Math.sin(roll);
    const ox = pivot.x - (pivot.x * c - pivot.y * s);
    g.position.y += pivot.y - (pivot.x * s + pivot.y * c);
    // Phần dời ngang phải xoay theo hướng mèo nằm (yaw). Chỉ cộng phần chênh lệch,
    // để lệnh nghịch trong Console như room.world.clickables.cat.position.x = 3 vẫn dùng được
    const dx = ox * Math.cos(yaw);
    const dz = -ox * Math.sin(yaw);
    g.position.x += dx - shiftX;
    g.position.z += dz - shiftZ;
    shiftX = dx;
    shiftZ = dz;

    awake = Math.max(0, awake - dt);
    eyesOpen.visible = awake > 0;
    eyesClosed.visible = awake <= 0;
    head.rotation.z += ((awake > 0 ? 0.12 : -0.12) - head.rotation.z) * Math.min(1, dt * 8);

    zs.forEach((s, i) => {
      const p = (t * 0.32 + i / 3) % 1;
      // Đội mũ thì chữ "z" bay ra từ trên đỉnh mũ, cao hơn một chút
      s.position.set(0.55 + p * 0.25 + e * 0.05, 0.55 + p * 0.9 + e * 0.25, 0.12 + p * 0.15);
      s.scale.setScalar(0.16 + p * 0.18);
      s.material.opacity = awake > 0 ? 0 : Math.sin(p * Math.PI) * 0.9;
    });
  });
  clickable(world, 'cat', g);
}

// ---------- Bộ đồ phi hành gia của mèo ----------
// Mũ trắng có hai "tai mèo" để đựng đôi tai to của Sphynx, ô kính xanh viền cam ở phía trước,
// vòng cổ kim loại và cần ăng-ten có đèn đỏ nhấp nháy. Thêm áo có huy hiệu, ống tay áo và ba lô dưỡng khí.
// Trả về hàm update(e, t): e chạy từ 0 (cởi đồ, giấu đi) đến 1 (mặc đồ xong).
function buildSpacesuit({ body, head, forelegs, tail }) {
  // Vỏ mũ hở phía trước, nên tô cả mặt trong (DoubleSide) để nhìn qua ô kính không bị thủng ra ngoài
  const white = new THREE.MeshStandardMaterial({ color: '#f3f5fa', roughness: 0.45, side: THREE.DoubleSide });
  const coral = mat('#ef6f5c');
  const metal = new THREE.MeshStandardMaterial({ color: '#aab4c8', metalness: 0.6, roughness: 0.35 });

  // --- Mũ: một quả cầu trắng khoét ô kính phía trước ---
  const helmet = at(new THREE.Group(), 0.02, 0, 0);
  head.add(helmet);
  const R = 0.36;
  // SphereGeometry cho phép chỉ vẽ một phần quả cầu: phi là góc quay quanh trục đứng
  // (phi = π là phía trước mặt mèo, hướng +x), theta là góc tính từ đỉnh đầu xuống
  const piece = (r, phi0, phiLen, th0, thLen, material) =>
    new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32, phi0, phiLen, th0, thLen), material);
  const W = 1.05;               // nửa bề ngang ô kính (radian)
  const [T0, T1] = [0.75, 2.35]; // mép trên và mép dưới ô kính
  const front = Math.PI - W;    // góc phi bắt đầu ô kính
  helmet.add(
    piece(R, 0, Math.PI * 2, 0, T0, white),                         // chỏm mũ
    piece(R, Math.PI + W, Math.PI * 2 - 2 * W, T0, T1 - T0, white), // phía sau và hai bên
    piece(R, 0, Math.PI * 2, T1, Math.PI - T1, white),              // phần dưới cằm
  );
  const b = 0.07; // bề rộng viền cam quanh ô kính
  helmet.add(
    piece(R + 0.006, front - b / 2, 2 * W + b, T0 - b / 2, b, coral), // viền trên
    piece(R + 0.006, front - b / 2, 2 * W + b, T1 - b / 2, b, coral), // viền dưới
    piece(R + 0.006, front - b / 2, b, T0, T1 - T0, coral),           // viền bên
    piece(R + 0.006, Math.PI + W - b / 2, b, T0, T1 - T0, coral),     // viền bên kia
  );

  // Kính màu xanh trong, có hai vệt phản chiếu mềm nằm sát mặt kính
  const visorMat = new THREE.MeshStandardMaterial({
    color: '#a8d4ff', transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.3, depthWrite: false,
  });
  const shineMat = new THREE.MeshBasicMaterial({
    map: canvasTexture(128, 64, drawSoftShine), transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false,
  });
  const glass = [
    piece(R - 0.003, front, 2 * W, T0, T1 - T0, visorMat),
    piece(R + 0.001, front + 0.25, 0.45, T0 + 0.18, 0.16, shineMat),
    piece(R + 0.001, front + 0.8, 0.12, T0 + 0.18, 0.1, shineMat),
  ];
  glass.forEach((m) => { m.userData.noShadow = true; });
  helmet.add(...glass);

  // Hai "tai mèo" trên mũ, đặt đúng chỗ tai thật nhưng to và dày hơn để trùm kín tai
  const coverGeo = new THREE.ConeGeometry(0.15, 0.37, 20);
  for (const s of [-1, 1]) {
    const cover = new THREE.Mesh(coverGeo, white);
    cover.scale.x = 0.6;
    helmet.add(at(cover, EAR.x - 0.02, EAR.y, s * EAR.z, s * EAR.tilt, -s * EAR.turn, 0));
  }

  // Vòng cổ kim loại: nằm trên mặt mũ, phía sau gáy (hướng từ đầu xuống cổ)
  const neck = new THREE.Vector3(-0.75, -0.66, 0).normalize();
  const ringR = 0.27;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.045, 12, 40), metal);
  collar.position.copy(neck).multiplyScalar(Math.sqrt(R * R - ringR * ringR));
  collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), neck);
  helmet.add(collar);

  // Ăng-ten có đèn đỏ nhấp nháy, cắm ở đỉnh sau của mũ (giữa hai tai)
  const base = new THREE.Vector3(-0.55, 0.83, 0).normalize().multiplyScalar(R - 0.01);
  const tip = base.clone().add(new THREE.Vector3(-0.08, 0.2, 0));
  const beaconMat = new THREE.MeshStandardMaterial({ color: '#ff5a4f', emissive: '#ff3b30', emissiveIntensity: 1 });
  helmet.add(stick(base, tip, 0.012, metal), at(sphere(0.032, beaconMat, 12, 8), tip.x, tip.y, tip.z));

  // --- Áo: lớp vỏ trắng hơi to hơn thân mèo một chút, nằm trong nhóm "body" nên cũng phồng xẹp theo nhịp thở ---
  const suit = new THREE.Group();
  body.add(suit);
  const torso = sphere(0.5, white, 28, 18);
  torso.scale.set(1.05, 0.52 * 1.07, 0.66 * 1.06);
  suit.add(at(torso, 0, 0.26, 0));
  const haunch = sphere(0.24, white, 20, 14);
  haunch.scale.set(1.1 * 1.08, 0.85 * 1.08, 0.7 * 1.08);
  suit.add(at(haunch, -0.22, 0.24, 0.2));

  // Sọc cam vòng quanh thân: vòng xuyến (torus) kéo dẹt thành hình elip cho ôm theo thân
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.026, 8, 48), coral);
  belt.scale.set(0.341 / 0.3, 0.27 / 0.3, 1);
  suit.add(at(belt, 0.12, 0.26, 0, 0, Math.PI / 2, 0));

  // Huy hiệu dấu chân mèo dán bên hông (hình trụ thật mỏng, mặt trên dán hình vẽ)
  const badgeFace = new THREE.MeshStandardMaterial({ map: canvasTexture(128, 128, drawPawBadge), roughness: 0.6 });
  const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 32), [white, badgeFace, badgeFace]);
  suit.add(at(badge, 0, 0.332, 0.344, 1.25, 0, 0));

  // Ba lô dưỡng khí trên lưng: hộp trắng có sọc cam, hai bình khí và một đèn xanh
  const pack = at(new THREE.Group(), -0.15, 0.575, 0);
  pack.add(box(0.34, 0.14, 0.3, white, 0.05), box(0.35, 0.045, 0.31, coral, 0.02));
  for (const z of [-0.075, 0.075]) pack.add(at(cylinder(0.045, 0.045, 0.3, metal, 16), 0, 0.1, z, 0, 0, Math.PI / 2));
  const ledMat = new THREE.MeshStandardMaterial({ color: '#6dffb0', emissive: '#2bff8a', emissiveIntensity: 1 });
  pack.add(at(sphere(0.022, ledMat, 10, 8), -0.175, 0.02, 0.09));
  suit.add(pack);

  // --- Ống tay áo bọc hai chân trước, chừa bàn chân hồng ló ra, có cổ tay cam ---
  // Gắn vào nhóm của từng chân (gốc toạ độ ở vai), nên chân buông xuống thì tay áo đi theo
  const sleeves = forelegs.map((leg, i) => {
    const sleeve = new THREE.Group();
    leg.add(sleeve);
    const z = FORELEGS[i];
    // Ống tay áo kéo dài hết cẳng chân, chui vào trong găng, để không hở chút da nào
    const end = legEnd(z).sub(legStart(z));
    const dir = end.clone().normalize();
    const cuff = end.clone().multiplyScalar(0.8);
    sleeve.add(
      stick(new THREE.Vector3(), end, 0.062, white),
      stick(cuff.clone().addScaledVector(dir, -0.02), cuff.clone().addScaledVector(dir, 0.02), 0.07, coral),
    );
    // Găng trắng bọc kín bàn chân (to hơn bàn chân một chút, đặt đúng chỗ bàn chân)
    const shoulder = legStart(z);
    const glove = sphere(0.073, white, 14, 10);
    glove.scale.set(1.45, 0.75, 1.05);
    sleeve.add(at(glove, 0.76 - shoulder.x, 0.04 - shoulder.y, z - shoulder.z));
    return sleeve;
  });

  // --- Hai chân sau: lúc nằm thì giấu dưới bụng nên không dựng, ra vũ trụ mới buông thõng xuống ---
  // Vì chỉ hiện khi mặc đồ nên dựng luôn bằng ống quần trắng, cổ chân cam và giày trắng
  const hindLegs = [-0.08, 0.22].map((z) => {
    const leg = at(new THREE.Group(), -0.24, 0.1, z); // gốc ở hông, nằm lọt trong thân
    const end = new THREE.Vector3(0.05, -0.3, 0);
    const dir = end.clone().normalize();
    const cuff = end.clone().multiplyScalar(0.8);
    const boot = sphere(0.073, white, 14, 10);
    boot.scale.set(1.45, 0.75, 1.05);
    leg.add(
      stick(new THREE.Vector3(), end, 0.066, white),
      stick(cuff.clone().addScaledVector(dir, -0.02), cuff.clone().addScaledVector(dir, 0.02), 0.074, coral),
      at(boot, end.x + 0.04, end.y - 0.02, 0),
    );
    forelegs[0].parent.add(leg); // gắn vào nhóm con mèo
    return leg;
  });

  // --- Ống áo bọc đuôi, chóp đuôi có cục bông màu cam ---
  const tailSleeve = new THREE.Group();
  tail.pivot.add(tailSleeve);
  tailSleeve.add(new THREE.Mesh(tail.geometry, white), at(sphere(0.035, coral, 12, 8), tail.tip.x, tail.tip.y, tail.tip.z));

  // Bấm vào bộ đồ thì tia chuột xuyên qua, trúng con mèo bên trong
  for (const part of [helmet, suit, tailSleeve, ...sleeves, ...hindLegs]) {
    part.traverse((o) => { o.userData.noPick = true; });
    part.visible = false;
  }
  // Mũ không đổ bóng, kẻo vỏ mũ che nắng làm mặt mèo bên trong tối thui
  helmet.traverse((o) => { o.userData.noShadow = true; });

  return (e, t) => {
    const k = THREE.MathUtils.smoothstep(e, 0, 0.6); // mặc đồ nhanh hơn lúc bay lên một chút
    helmet.visible = suit.visible = k > 0.01;
    tailSleeve.visible = k > 0.6;
    sleeves.forEach((s) => { s.visible = k > 0.6; });
    hindLegs.forEach((leg, i) => {
      leg.visible = k > 0.6;
      leg.rotation.z = Math.sin(t * 1.3 + 2 + i * 1.5) * 0.14; // khẽ đung đưa
    });
    helmet.scale.setScalar(Math.max(0.01, k)); // mũ to dần ra từ giữa đầu
    suit.scale.setScalar(0.9 + 0.1 * k);       // áo từ trong da "phồng" ra
    beaconMat.emissiveIntensity = Math.sin(t * 4) > 0.3 ? 2.2 : 0.3; // đèn ăng-ten nhấp nháy
    ledMat.emissiveIntensity = 0.6 + 0.6 * Math.sin(t * 2);
  };
}

// Vệt phản chiếu mềm: hình elip trắng mờ dần ra mép
function drawSoftShine(ctx, w, h) {
  ctx.translate(w / 2, h / 2);
  ctx.scale(w / h, 1);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, h / 2);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  g.addColorStop(0.6, 'rgba(255, 255, 255, 0.45)');
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, h / 2, 0, Math.PI * 2);
  ctx.fill();
}

// Huy hiệu tròn: viền xanh, nền trắng, dấu chân mèo màu cam
function drawPawBadge(ctx, w) {
  const c = w / 2;
  const dot = (x, y, rx, ry = rx) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.fillStyle = '#2f4fa8';
  dot(c, c, c);
  ctx.fillStyle = '#ffffff';
  dot(c, c, c * 0.8);
  ctx.fillStyle = '#ef6f5c';
  dot(c, c + 12, 22, 18);                                                   // đệm chân
  for (const [x, y, r] of [[38, 50, 9], [55, 36, 10], [73, 36, 10], [90, 50, 9]]) dot(x, y, r); // bốn ngón
}
