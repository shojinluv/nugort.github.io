// furniture.js – Đồ đạc trong phòng.
// Đồ vật nào bấm được thì được gom vào một Group có userData.id (xem hàm clickable).
import * as THREE from 'three';
import { mat, box, cylinder, sphere, at, stick, canvasTexture, random, decoration } from './helpers.js';

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
  const screenMat = new THREE.MeshBasicMaterial({ map: canvasTexture(640, 380, drawCode), toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 0.88), screenMat);
  g.add(at(screen, 0, 0.85, 0.042));

  // Bàn phím và chuột
  g.add(at(box(0.95, 0.05, 0.32, '#f4f1ea', 0.02), 0.05, 0.025, 0.62));
  g.add(at(box(0.86, 0.012, 0.24, '#dcd6cc', 0.004), 0.05, 0.055, 0.62));
  const mouse = sphere(0.07, '#f4f1ea', 16, 10);
  mouse.scale.set(0.8, 0.45, 1.2);
  g.add(at(mouse, 0.75, 0.03, 0.62));

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

function drawCode(ctx, w, h) {
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
    [['function ', P], ['batDen', F], ['() {', T]],
    [['  phong', T], ['.', T], ['sang', F], [' = ', T], ['true', Y], [';', T]],
    [['}', T]],
    [],
    [['batDen', F], ['();', T], [' // ✨', C]],
  ];
  ctx.font = '22px "SFMono-Regular", Menlo, Consolas, monospace';
  ctx.textBaseline = 'middle';
  lines.forEach((tokens, i) => {
    const y = 64 + i * 34;
    ctx.fillStyle = '#4b5170';
    ctx.textAlign = 'right';
    ctx.fillText(String(i + 1), 40, y);
    ctx.textAlign = 'left';
    let x = 58;
    for (const [text, color] of tokens) {
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      x += ctx.measureText(text).width;
    }
  });
  ctx.fillStyle = '#ffcb6b';
  ctx.fillRect(58 + ctx.measureText('batDen(); // ✨').width + 6, 64 + 8 * 34 - 13, 12, 26); // con trỏ
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
      s.material.opacity = Math.sin(p * Math.PI) * 0.5;
    });
  });
  world.scene.add(g);
}

// ---------- Ghế xoay ----------
function buildChair({ scene }) {
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
  scene.add(g);
}

// ---------- Giường ----------
function buildBed({ scene }) {
  const cx = -3.75;
  const cz = 1.0;
  scene.add(at(box(2.5, 0.45, 4.5, '#c98f5a', 0.05), cx, 0.32, cz)); // khung
  for (const dx of [-1.1, 1.1]) {
    for (const dz of [-2.1, 2.1]) scene.add(at(cylinder(0.07, 0.07, 0.1, '#8a5a3c', 10), cx + dx, 0.05, cz + dz));
  }
  scene.add(at(box(2.4, 0.4, 4.4, '#fffaf3', 0.14), cx, 0.74, cz));               // nệm
  scene.add(at(box(2.52, 0.14, 3.0, '#f2b84b', 0.06), cx, 0.98, cz + 0.75));       // chăn
  scene.add(at(box(2.54, 0.16, 0.35, '#ffd98a', 0.07), cx, 1.0, cz - 0.62));       // mép chăn gấp
  scene.add(at(box(1.5, 0.28, 0.75, '#ffffff', 0.13), cx, 1.08, cz - 1.55, -0.12)); // gối
  scene.add(at(box(0.75, 0.22, 0.55, '#ffb7c9', 0.1), cx + 0.55, 1.12, cz - 1.0, -0.1, 0.4, 0.15)); // gối nhỏ
  scene.add(at(box(2.5, 1.7, 0.18, '#b97c4c', 0.06), cx, 0.85, cz - 2.32));        // đầu giường
}

// ---------- Thảm tròn ----------
function buildRug({ scene }) {
  const rings = [[2.3, '#f4a29a', 0.02], [1.95, '#fff1e0', 0.024], [1.55, '#9fd8cb', 0.028]];
  for (const [r, color, h] of rings) scene.add(at(cylinder(r, r, h, color, 64), 0.7, h / 2, 1.0));
}

// ---------- Kệ sách treo tường ----------
function buildShelf({ scene }) {
  scene.add(at(box(0.7, 0.08, 2.3, '#c98f5a', 0.02), -4.65, 3.0, -3.15));
  for (const z of [-4.0, -2.3]) scene.add(at(box(0.5, 0.3, 0.06, '#a8724a', 0.02), -4.75, 2.82, z));

  const colors = ['#ef6f5c', '#4fb3a9', '#f2b84b', '#7b8cde', '#f6a7a0', '#5d9e6f', '#e8d5b5'];
  let z = -4.2;
  colors.forEach((color, i) => {
    const t = 0.13 + random() * 0.08; // độ dày cuốn sách
    const h = 0.45 + random() * 0.22; // chiều cao cuốn sách
    const book = box(0.48, h, t, color, 0.015);
    if (i === colors.length - 1) at(book, -4.68, 3.04 + h / 2 - 0.04, z + 0.2, -0.38); // cuốn cuối nằm nghiêng
    else at(book, -4.68, 3.04 + h / 2, z + t / 2);
    scene.add(book);
    z += t + 0.015;
  });
  scene.add(at(cylinder(0.12, 0.09, 0.18, '#e88a5e', 14), -4.65, 3.13, -2.4));
  scene.add(at(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.16, 4, 10), mat('#5d9e6f')), -4.65, 3.35, -2.4));
}

// ---------- Ghế lười và chồng sách ----------
function buildBeanBag({ scene }) {
  const bag = sphere(0.95, '#8fc9e8', 32, 20);
  bag.scale.set(1, 0.55, 1);
  scene.add(at(bag, 3.5, 0.48, 2.6));
  scene.add(at(box(0.55, 0.07, 0.4, '#ef6f5c', 0.015), 3.35, 1.0, 2.5, 0.12, 0.6, -0.08));

  let y = 0;
  [['#7b8cde', 0.7, 0.5], ['#f2b84b', 0.62, 0.46], ['#4fb3a9', 0.55, 0.42]].forEach(([color, w, d], i) => {
    scene.add(at(box(w, 0.12, d, color, 0.015), 4.35, y + 0.06, 1.0, 0, i * 0.3 - 0.2, 0));
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
    inner.add(at(leaf, Math.cos(a) * (reach + 0.3), height + 0.02, Math.sin(a) * (reach + 0.3), 0, -a, -0.35));
  }

  let wiggle = 0;
  let grow = 1;
  let growTarget = 1;
  world.plant = {
    water() {
      wiggle = 1;
      growTarget = Math.min(1.3, growTarget + 0.06);
    },
  };
  world.updaters.push((t, dt) => {
    wiggle = Math.max(0, wiggle - dt * 0.8);
    inner.rotation.z = Math.sin(t * 16) * 0.08 * wiggle + Math.sin(t * 0.8) * 0.01; // + gió thoảng
    inner.rotation.x = Math.cos(t * 13) * 0.05 * wiggle;
    grow += (growTarget - grow) * Math.min(1, dt * 3);
    inner.scale.setScalar(grow);
  });
  clickable(world, 'plant', g);
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
}

// ---------- Mèo Mướp ngủ trong vệt nắng (bấm vào → mèo giật mình) ----------
function buildCat(world) {
  const g = at(new THREE.Group(), 1.2, 0.03, 1.5, 0, -0.5, 0);
  const fur = mat('#f2a65a');
  const furDark = mat('#d9803a');
  const white = mat('#fff6ea');
  const ink = mat('#3a2a22');
  const pink = mat('#ff9eaa');

  const body = new THREE.Group(); // thân, sẽ phồng xẹp theo nhịp thở
  g.add(body);
  const torso = sphere(0.5, fur, 28, 18);
  torso.scale.set(1, 0.55, 0.78);
  body.add(at(torso, 0, 0.27, 0));
  const patch = sphere(0.43, furDark, 24, 14);
  patch.scale.set(0.72, 0.55, 0.6);
  body.add(at(patch, -0.12, 0.33, 0));

  const head = at(new THREE.Group(), 0.5, 0.24, 0.12, 0, 0, -0.12);
  g.add(head);
  const skull = sphere(0.27, fur, 24, 16);
  skull.scale.set(1, 0.88, 1.02);
  head.add(skull);
  for (const s of [-1, 1]) {
    head.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 4), fur), -0.02, 0.21, s * 0.13, s * 0.35, Math.PI / 4, 0)); // tai
    head.add(at(sphere(0.045, pink, 10, 8), 0.2, -0.07, s * 0.15)); // má hồng
  }
  const muzzle = sphere(0.1, white, 14, 10);
  muzzle.scale.set(0.7, 0.6, 1.2);
  head.add(at(muzzle, 0.22, -0.08, 0));
  head.add(at(sphere(0.03, pink, 10, 8), 0.29, -0.03, 0)); // mũi

  // Mắt nhắm (lúc ngủ) và mắt mở (lúc bị chọc)
  const eyesClosed = new THREE.Group();
  const eyesOpen = new THREE.Group();
  for (const s of [-1, 1]) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 14, Math.PI), ink);
    eyesClosed.add(at(arc, 0.25, 0.05, s * 0.1, 0, Math.PI / 2, Math.PI));
    eyesOpen.add(at(sphere(0.04, ink, 12, 8), 0.235, 0.04, s * 0.1));
  }
  eyesOpen.visible = false;
  head.add(eyesClosed, eyesOpen);

  // Đuôi: một ống cong uốn theo đường cong qua 5 điểm
  const tailPivot = at(new THREE.Group(), -0.42, 0.12, 0);
  g.add(tailPivot);
  const pts = [[0, 0, 0], [-0.12, -0.03, 0.25], [0.05, -0.06, 0.52], [0.4, -0.07, 0.6], [0.7, -0.07, 0.48]]
    .map(([x, y, z]) => new THREE.Vector3(x, y, z));
  tailPivot.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.065, 10), fur));
  tailPivot.add(at(sphere(0.068, furDark, 12, 8), pts[4].x, pts[4].y, pts[4].z));

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

  let jump = 0;
  let awake = 0;
  world.cat = {
    poke() {
      jump = 1;
      awake = 2.2;
    },
  };
  world.updaters.push((t, dt) => {
    body.scale.y = 1 + Math.sin(t * 2.2) * 0.035;      // thở
    tailPivot.rotation.y = Math.sin(t * 1.4) * 0.12;  // vẫy đuôi

    jump = Math.max(0, jump - dt * 1.6);
    g.position.y = 0.03 + Math.sin((1 - jump) * Math.PI) * 0.55; // nảy lên rồi rơi xuống

    awake = Math.max(0, awake - dt);
    eyesOpen.visible = awake > 0;
    eyesClosed.visible = awake <= 0;
    head.rotation.z += ((awake > 0 ? 0.12 : -0.12) - head.rotation.z) * Math.min(1, dt * 8);

    zs.forEach((s, i) => {
      const p = (t * 0.32 + i / 3) % 1;
      s.position.set(0.55 + p * 0.25, 0.55 + p * 0.9, 0.12 + p * 0.15);
      s.scale.setScalar(0.16 + p * 0.18);
      s.material.opacity = awake > 0 ? 0 : Math.sin(p * Math.PI) * 0.9;
    });
  });
  clickable(world, 'cat', g);
}
