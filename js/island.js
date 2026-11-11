// island.js – Bối cảnh Trái Đất kiểu truyện cổ tích: căn phòng nằm trên một hòn đảo cỏ nhỏ lơ lửng giữa trời.
// Trên đảo có cây tròn xoe, nấm đỏ chấm trắng, hoa dại, ao nhỏ có thác nước đổ xuống khoảng không,
// lối đá, biển gỗ và đèn lồng. Ban ngày có bướm bay, ban đêm có đom đóm và nấm phát sáng.
// Lúc bấm "Vũ trụ", căn phòng cất cánh khỏi chính hòn đảo này (xem launchPose trong space.js).
//
// Mọi thứ ở đây đặt theo toạ độ của hòn đảo: gốc (0, 0, 0) là tâm mặt cỏ, ngay dưới tâm sàn nhà;
// trục x, z cùng hướng với căn phòng (x sang phải, z ra phía trước).
import * as THREE from 'three';
import { mat, cylinder, sphere, at, canvasTexture, decoration } from './helpers.js';
import { PAD, GROUND_SCALE, LAUNCH_H0, launchPose, newLaunchPose } from './space.js';

// Số ngẫu nhiên riêng của hòn đảo (có hạt giống, lần nào tải trang cũng giống nhau)
let seed = 4242;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
const between = (a, b) => a + rand() * (b - a);

// Bán kính mép đảo theo hướng góc a (đo từ trục x sang trục z), hơi gồ ghề cho tự nhiên
const edge = (a) => 10.4 + 0.5 * Math.sin(3 * a + 1) + 0.35 * Math.sin(5 * a + 2) + 0.25 * Math.sin(7 * a);
const polar = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];

// Lúc nằm yên, gốc toạ độ của đảo cao hơn tâm đáy sàn (PAD) 0,12; mặt cỏ thấp hơn gốc 0,14
const REST_LIFT = 0.12;
export const ISLAND_TOP = PAD.y + REST_LIFT - 0.14; // độ cao mặt cỏ (toạ độ thế giới)
// Hình dáng chân đảo: bán kính khối đá ở độ sâu f (0 = ngay dưới lớp đất, 1 = mũi nhọn dưới đáy)
const ROCK_TOP = -1.7;
const ROCK_DEPTH = 7;
const rockRadius = (f) => 9.6 * (1 - f) ** 0.75 + 0.2;

/** Một điểm (toạ độ thế giới) có nằm trong khối đảo lúc đảo đang nằm yên không. Dùng để chặn camera chui vào đảo. */
export function insideIsland(x, y, z) {
  const lx = x - PAD.x;
  const ly = y - PAD.y - REST_LIFT;
  const lz = z - PAD.z;
  if (ly > -0.1) return false;
  const r = Math.hypot(lx, lz);
  if (ly > ROCK_TOP - 0.05) return r < edge(Math.atan2(lz, lx)) + 0.15; // lớp cỏ và đất
  const f = (ROCK_TOP - ly) / ROCK_DEPTH;
  return f <= 1 && r < rockRadius(f) * 1.15; // khối đá (cộng thêm phần gồ ghề)
}

const FLOOR = 5.4; // nửa cạnh sàn nhà (cộng chút lề), tính từ tâm đảo
const POND = { a: 0.2, r: 7.6, size: 1.25 };
const [PX, PZ] = polar(POND.a, POND.r);
const LANTERN = [3.4, 7.0];
const SIGN = [-0.7, 7.5];
const STONES = [[1.3, 6.1], [1.9, 6.95], [1.35, 7.8], [1.95, 8.6]];

// Chỗ trống để trồng hoa: trong đảo, ngoài sàn nhà, không trùng ao, lối đá, đèn và biển gỗ
function freeSpot(x, z, margin = 0.6) {
  const r = Math.hypot(x, z);
  if (r > edge(Math.atan2(z, x)) - margin) return false;
  if (Math.abs(x) < FLOOR && Math.abs(z) < FLOOR) return false;
  if (Math.hypot(x - PX, z - PZ) < POND.size + 0.5) return false;
  if (Math.abs(x - 1.6) < 0.7 && z > FLOOR) return false;
  if (Math.hypot(x - LANTERN[0], z - LANTERN[1]) < 0.5 || Math.hypot(x - SIGN[0], z - SIGN[1]) < 0.8) return false;
  return true;
}

export function buildIsland(world) {
  const island = new THREE.Group();
  island.name = 'đảo cổ tích';
  island.position.copy(PAD);
  world.scene.add(island);

  buildGround(island);
  buildTrees(island);
  buildFlowers(island);
  const glowShrooms = buildMushrooms(island);
  const water = buildPond(island);
  const lantern = buildPathAndLantern(island);
  const rocks = buildFloatingRocks(island);
  const clouds = buildClouds(island);
  const fireflies = buildFireflies(island);
  const butterflies = buildButterflies(island);
  island.traverse((o) => { o.userData.noPick = true; }); // cảnh trang trí, không bấm được

  // Cất cánh: hòn đảo nằm yên trên mặt đất, nên đi theo mặt đất lùi xa dần rồi thu nhỏ khuất hẳn
  const pose = newLaunchPose();
  world.updaters.push((t, dt) => {
    const calm = world.reduceMotion ? 0 : 1;
    const { lift, h, k, q, dir } = launchPose(world.spaceProgress, pose);
    const size = (k / GROUND_SCALE) * (1 - THREE.MathUtils.smoothstep(lift, 0.35, 0.65));
    island.visible = size > 0.002;
    if (!island.visible) return;
    // Mặt cỏ nằm thấp hơn gốc toạ độ 0,14; nhấc cả đảo lên 0,12 cho mặt cỏ sát ngay dưới đáy sàn nhà
    island.position.copy(PAD).addScaledVector(dir, h - LAUNCH_H0 - REST_LIFT);
    island.quaternion.copy(q);
    island.scale.setScalar(size);

    const n = world.night;
    water.update(t, dt, calm);
    lantern.update(n, t);
    glowShrooms.forEach((m, i) => { m.emissiveIntensity = n * (1.3 + 0.4 * Math.sin(t * 1.5 + i * 2)); });
    rocks.forEach((r, i) => { r.position.y = r.userData.y + Math.sin(t * 0.6 + i * 2.1) * 0.25 * calm; r.rotation.y = t * 0.1 * (i + 1) * calm; });
    clouds.forEach((c, i) => { c.position.y = c.userData.y + Math.sin(t * 0.3 + i * 1.7) * 0.35 * calm; });
    clouds[0].userData.material.emissiveIntensity = 0.35 * (1 - n) + 0.03; // ban đêm mây tối theo trời
    fireflies.update(t, n, calm);
    butterflies.update(t, n, calm);
  });
}

// ---------- Mặt cỏ, lớp đất và chân đảo bằng đá ----------
function buildGround(island) {
  const outline = (scale) => {
    const shape = new THREE.Shape();
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const [x, z] = polar(a, edge(a) * scale);
      // Shape vẽ trên mặt phẳng xy; sau khi xoay nằm xuống thì trục y của nó thành trục -z
      if (i === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    }
    return shape;
  };
  const slab = (scale, depth, top, color, bevel) => {
    const geo = new THREE.ExtrudeGeometry(outline(scale), {
      depth, curveSegments: 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3,
    });
    geo.rotateX(-Math.PI / 2).translate(0, top - depth - bevel, 0); // xoay nằm xuống, mặt trên ở độ cao "top"
    return new THREE.Mesh(geo, mat(color));
  };
  island.add(slab(1, 0.25, -0.14, '#8fd27a', 0.12));  // cỏ, mép bo tròn
  island.add(slab(0.985, 0.9, -0.3, '#b07a4f', 0));   // đất nâu
  island.add(slab(0.95, 0.55, -1.2, '#8f6040', 0));   // lớp đất sẫm hơn

  // Chân đảo: một khối đá nhọn dần xuống dưới, mặt vát góc cạnh như đá thật
  const profile = []; // đi từ mũi nhọn dưới đáy lên trên, để mặt ngoài quay ra ngoài
  for (let i = 10; i >= 0; i--) {
    const f = i / 10;
    profile.push(new THREE.Vector2(rockRadius(f), ROCK_TOP - f * ROCK_DEPTH));
  }
  const rockGeo = new THREE.LatheGeometry(profile, 28);
  const pos = rockGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const a = Math.atan2(v.z, v.x);
    const bump = 1 + 0.08 * Math.sin(a * 5 + v.y * 1.3) + 0.06 * Math.sin(a * 11 - v.y * 2.1);
    pos.setXYZ(i, v.x * bump, v.y, v.z * bump);
  }
  rockGeo.computeVertexNormals();
  const rockMat = new THREE.MeshStandardMaterial({ color: '#9b8577', roughness: 0.95, flatShading: true });
  island.add(new THREE.Mesh(rockGeo, rockMat));

  // Rễ cây thòng xuống từ mép đất
  const rootMat = mat('#7a5236');
  for (let i = 0; i < 9; i++) {
    const a = 0.3 + i * 0.68 + between(-0.15, 0.15);
    const r = edge(a) * 0.93;
    const [x, z] = polar(a, r);
    const len = between(1.2, 2.6);
    const pts = [0, 0.35, 0.7, 1].map((f) => new THREE.Vector3(
      x * (1 - 0.05 * f) + Math.sin(f * 4 + i) * 0.15, -1.1 - f * len, z * (1 - 0.05 * f) + Math.cos(f * 3 + i) * 0.15,
    ));
    island.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.05 - i * 0.002, 5), rootMat));
  }
}

// ---------- Cây: cây tán tròn và cây thông, trồng sau tường để làm khung cho căn phòng ----------
// Chừa trống khoảng sau cửa sổ để cây không che mất vệt nắng rọi vào phòng.
function buildTrees(island) {
  const trunk = mat('#8a5a3c');
  const greens = ['#5fb36a', '#6fc27a', '#4f9e5c', '#7fcf84'];
  const roundTree = (x, z, height, size) => {
    const g = at(new THREE.Group(), x, -0.1, z);
    g.add(at(cylinder(0.16 * size, 0.24 * size, height, trunk, 10), 0, height / 2, 0));
    const puffs = [[0, 0, 0, 1], [0.6, -0.25, 0.2, 0.75], [-0.55, -0.2, -0.15, 0.78], [0.1, 0.55, -0.1, 0.72], [-0.15, -0.3, 0.6, 0.7]];
    puffs.forEach(([px, py, pz, r], i) => {
      g.add(at(sphere(r * size, greens[i % greens.length], 16, 12), px * size, height + py * size, pz * size));
    });
    island.add(g);
  };
  const pine = (x, z, height, size) => {
    const g = at(new THREE.Group(), x, -0.1, z);
    g.add(at(cylinder(0.12 * size, 0.18 * size, height * 0.3, trunk, 8), 0, height * 0.15, 0));
    for (let i = 0; i < 3; i++) {
      const tier = new THREE.Mesh(new THREE.ConeGeometry((1.1 - i * 0.28) * size, height * 0.42, 12), mat(i % 2 ? '#3f8f5a' : '#4a9c63'));
      g.add(at(tier, 0, height * (0.38 + i * 0.22), 0));
    }
    island.add(g);
  };
  // Sau tường sau (tránh khoảng x từ -2 tới 4 là chỗ nắng rọi qua cửa sổ)
  roundTree(-7.6, -7.0, 4.6, 1.5);
  pine(-4.6, -8.2, 7.5, 1.1);
  roundTree(-2.8, -7.4, 3.2, 1.1);
  pine(5.2, -7.8, 6.8, 1.0);
  roundTree(7.6, -5.6, 3.8, 1.3);
  // Sau tường trái
  pine(-8.4, -3.6, 8, 1.15);
  roundTree(-8.0, 0.4, 5.0, 1.45);
  pine(-8.6, 3.8, 6.4, 1.0);
  // Góc trước bên trái: một cây nhỏ cho cân khung hình
  roundTree(-7.4, 6.6, 2.4, 1.0);

  // Bụi cây tròn ở mép đảo
  [[6.1, 5.6, 0.55], [7.6, 4.6, 0.42], [-6.2, 8.2, 0.5], [4.4, 8.6, 0.45], [8.9, -2.4, 0.5], [6.4, -3.6, 0.38]].forEach(([x, z, r], i) => {
    const g = at(new THREE.Group(), x, -0.1, z);
    g.add(at(sphere(r, greens[i % 4], 14, 10), 0, r * 0.6, 0));
    g.add(at(sphere(r * 0.75, greens[(i + 1) % 4], 12, 9), r * 0.7, r * 0.4, r * 0.2));
    g.add(at(sphere(r * 0.7, greens[(i + 2) % 4], 12, 9), -r * 0.6, r * 0.35, -r * 0.15));
    island.add(g);
  });
}

// ---------- Hoa dại và những túm cỏ ----------
function buildFlowers(island) {
  const palette = ['#ff9ec4', '#ffe066', '#fff7f0', '#c7a6ff', '#ff8a7a'].map((c) => new THREE.Color(c));
  const spots = [];
  for (let tries = 0; spots.length < 90 && tries < 2000; tries++) {
    const a = rand() * Math.PI * 2;
    const [x, z] = polar(a, between(5, 11));
    if (freeSpot(x, z)) spots.push([x, z]);
  }
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 5), mat('#4f9e5c'), spots.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.095, 8, 6), new THREE.MeshStandardMaterial({ roughness: 0.7 }), spots.length);
  const m = new THREE.Matrix4();
  spots.forEach(([x, z], i) => {
    const hgt = between(0.2, 0.42);
    m.makeTranslation(x, -0.14 + hgt / 2, z).multiply(new THREE.Matrix4().makeScale(1, hgt / 0.32, 1));
    stems.setMatrixAt(i, m);
    m.makeTranslation(x, -0.14 + hgt, z);
    heads.setMatrixAt(i, m);
    heads.setColorAt(i, palette[i % palette.length]);
  });
  island.add(stems, heads);

  // Túm cỏ nhọn rải khắp mặt đảo cho đỡ trơn
  const tufts = [];
  for (let tries = 0; tufts.length < 160 && tries < 3000; tries++) {
    const [x, z] = polar(rand() * Math.PI * 2, between(5, 11));
    if (freeSpot(x, z, 0.3)) tufts.push([x, z]);
  }
  const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(0.07, 0.3, 4), mat('#6cbf62'), tufts.length * 3);
  let n = 0;
  tufts.forEach(([x, z]) => {
    for (let j = 0; j < 3; j++) {
      m.makeRotationFromEuler(new THREE.Euler(between(-0.3, 0.3), 0, between(-0.3, 0.3)));
      m.setPosition(x + between(-0.08, 0.08), -0.02, z + between(-0.08, 0.08));
      grass.setMatrixAt(n++, m);
    }
  });
  island.add(grass);
}

// ---------- Nấm: nấm đỏ chấm trắng, và vài cây nấm xanh phát sáng khi trời tối ----------
function buildMushrooms(island) {
  const stem = mat('#fff3e2');
  const dot = mat('#ffffff');
  const mushroom = (x, z, size, capMat, dots) => {
    const g = at(new THREE.Group(), x, -0.12, z, 0, between(0, 6), between(-0.12, 0.12));
    g.add(at(cylinder(0.11 * size, 0.15 * size, 0.42 * size, stem, 12), 0, 0.21 * size, 0));
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.34 * size, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    cap.scale.y = 0.72;
    g.add(at(cap, 0, 0.4 * size, 0));
    if (dots) {
      for (let i = 0; i < 6; i++) {
        const a = i * 1.1 + 0.3;
        const tilt = i === 0 ? 0 : 0.75;
        const p = new THREE.Vector3(Math.sin(tilt) * Math.cos(a), Math.cos(tilt) * 0.72, Math.sin(tilt) * Math.sin(a)).multiplyScalar(0.34 * size);
        g.add(at(sphere(0.045 * size, dot, 8, 6), p.x, 0.4 * size + p.y, p.z));
      }
    }
    island.add(g);
  };
  const red = new THREE.MeshStandardMaterial({ color: '#e8524a', roughness: 0.6 });
  [[6.2, 6.6, 1.5], [6.9, 6.0, 0.9], [-6.4, 5.4, 1.2], [8.8, -1.0, 1.0], [-5.9, -6.6, 1.3], [3.0, 9.1, 0.8]]
    .forEach(([x, z, s]) => mushroom(x, z, s, red, true));

  // Nấm phát sáng mọc quanh ao
  const glows = [];
  [[PX - 1.5, PZ + 1.1, 0.7], [PX - 1.2, PZ + 1.6, 0.5], [PX + 0.4, PZ - 1.7, 0.6]].forEach(([x, z, s]) => {
    const m = new THREE.MeshStandardMaterial({ color: '#a6e6ff', emissive: '#5fd6ff', emissiveIntensity: 0, roughness: 0.5 });
    glows.push(m);
    mushroom(x, z, s, m, false);
  });
  return glows;
}

// ---------- Ao nhỏ và thác nước đổ ra khỏi mép đảo ----------
function buildPond(island) {
  const streaks = (w, h, vertical) => {
    const tex = canvasTexture(w, h, (ctx) => {
      ctx.fillStyle = '#7fcbe8';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${between(0.25, 0.7)})`;
        const len = between(0.15, 0.45) * (vertical ? h : w);
        if (vertical) ctx.fillRect(rand() * w, rand() * h, between(1.5, 3.5), len);
        else ctx.fillRect(rand() * w, rand() * h, len, between(1.5, 3.5));
      }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  };

  // Mặt ao, viền đá và lá sen
  const pondMat = new THREE.MeshStandardMaterial({ color: '#79c9e6', roughness: 0.15, metalness: 0.1, emissive: '#2a6f9a', emissiveIntensity: 0.15 });
  island.add(at(new THREE.Mesh(new THREE.CircleGeometry(POND.size, 32), pondMat), PX, -0.12, PZ, -Math.PI / 2, 0, 0));
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(a - POND.a), Math.cos(a - POND.a))) < 0.4) continue; // chừa chỗ cho nước chảy ra
    const s = sphere(between(0.2, 0.3), '#c9c1b8', 8, 6);
    s.scale.y = 0.5;
    island.add(at(s, PX + Math.cos(a) * (POND.size + 0.05), -0.1, PZ + Math.sin(a) * (POND.size + 0.05)));
  }
  const pad = new THREE.Mesh(new THREE.CircleGeometry(0.32, 20, 0.4, Math.PI * 2 - 0.5), mat('#5fb36a'));
  island.add(at(pad, PX - 0.35, -0.1, PZ - 0.3, -Math.PI / 2, 0, 0));
  island.add(at(sphere(0.09, '#ff9ec4', 10, 8), PX - 0.35, -0.04, PZ - 0.3));

  // Dòng suối từ ao chảy ra mép đảo
  const u = new THREE.Vector3(Math.cos(POND.a), 0, Math.sin(POND.a));
  const lip = edge(POND.a) + 0.2;
  const runLen = lip - (POND.r + POND.size * 0.8);
  const streamTex = streaks(256, 64, false);
  streamTex.repeat.set(runLen / 2, 0.5);
  const streamMat = new THREE.MeshStandardMaterial({ map: streamTex, roughness: 0.15, transparent: true, opacity: 0.92, emissive: '#2a6f9a', emissiveIntensity: 0.15 });
  const run = at(new THREE.Group(), 0, 0, 0, 0, -POND.a, 0);
  run.add(at(new THREE.Mesh(new THREE.PlaneGeometry(runLen, 0.75), streamMat), POND.r + POND.size * 0.8 + runLen / 2, -0.09, 0, -Math.PI / 2, 0, 0));
  island.add(run);

  // Thác nước: một tấm màn nước rơi thẳng xuống, mờ dần ở phía dưới, có hơi nước bốc lên
  const fallTex = streaks(64, 256, true);
  fallTex.repeat.set(1, 2.5);
  const fade = canvasTexture(4, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.6, '#bbbbbb');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const fallMat = new THREE.MeshStandardMaterial({
    map: fallTex, alphaMap: fade, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    roughness: 0.2, emissive: '#3a86b8', emissiveIntensity: 0.2,
  });
  const FALL = 7;
  const fall = decoration(new THREE.Mesh(new THREE.PlaneGeometry(0.75, FALL), fallMat));
  fall.position.copy(u).multiplyScalar(lip + 0.02);
  fall.position.y = -0.1 - FALL / 2;
  fall.rotation.y = Math.atan2(u.x, u.z);
  island.add(fall);

  const mistTex = canvasTexture(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  const mists = [0, 1, 2].map((i) => {
    const s = decoration(new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, transparent: true, depthWrite: false, opacity: 0.5 })));
    s.position.copy(u).multiplyScalar(lip + 0.1 + i * 0.2);
    s.position.y = -FALL * 0.75 - i * 0.4;
    island.add(s);
    return s;
  });

  return {
    update(t, dt, calm) {
      streamTex.offset.x -= dt * 0.7 * calm;
      fallTex.offset.y += dt * 1.4 * calm;
      mists.forEach((s, i) => {
        const k = (t * 0.5 + i / 3) % 1;
        s.scale.setScalar(0.9 + k * 1.4);
        s.material.opacity = 0.5 * Math.sin(k * Math.PI);
      });
    },
  };
}

// ---------- Lối đá, biển gỗ và đèn lồng ----------
function buildPathAndLantern(island) {
  STONES.forEach(([x, z], i) => {
    const s = cylinder(0.36 - i * 0.02, 0.4 - i * 0.02, 0.08, '#d8d0c6', 12);
    s.scale.z = 0.75;
    island.add(at(s, x, -0.12, z, 0, i * 0.7, 0));
  });

  // Biển gỗ chỉ đường
  const wood = mat('#a8724a');
  const sign = at(new THREE.Group(), SIGN[0], -0.12, SIGN[1], 0, 0.55, 0);
  sign.add(at(cylinder(0.06, 0.07, 1.4, wood, 8), 0, 0.7, 0));
  const text = canvasTexture(512, 160, (ctx, w, h) => {
    ctx.fillStyle = '#c98f5a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(120, 70, 40, 0.25)'; // vân gỗ
    for (let y = 12; y < h; y += 22) ctx.fillRect(0, y + Math.sin(y) * 3, w, 3);
    ctx.fillStyle = '#5b3420';
    ctx.font = '64px "Patrick Hand", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Nhà của Shojinluv', w / 2, h / 2 + 4);
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.46, 0.06), [wood, wood, wood, wood, new THREE.MeshStandardMaterial({ map: text, roughness: 0.9 }), wood]);
  sign.add(at(board, 0, 1.2, 0.05, 0, 0, -0.04));
  island.add(sign);

  // Đèn lồng: tối thì sáng ấm lên
  const iron = mat('#4a3a32');
  const g = at(new THREE.Group(), LANTERN[0], -0.12, LANTERN[1]);
  g.add(at(cylinder(0.05, 0.07, 1.9, iron, 8), 0, 0.95, 0));
  g.add(at(cylinder(0.025, 0.025, 0.4, iron, 6), 0.18, 1.85, 0, 0, 0, Math.PI / 2));
  const glass = new THREE.MeshStandardMaterial({ color: '#fff1c9', emissive: '#ffbe5c', emissiveIntensity: 0.2, roughness: 0.3 });
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), glass), 0.36, 1.6, 0));
  g.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.16, 4), iron), 0.36, 1.83, 0, 0, Math.PI / 4, 0));
  g.add(at(cylinder(0.008, 0.008, 0.08, iron, 4), 0.36, 1.78, 0));
  const halo = decoration(new THREE.Sprite(new THREE.SpriteMaterial({
    map: canvasTexture(64, 64, (ctx) => {
      const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, 'rgba(255, 210, 140, 0.9)');
      grd.addColorStop(1, 'rgba(255, 180, 90, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 64, 64);
    }),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0,
  })));
  halo.scale.setScalar(1.6);
  g.add(at(halo, 0.36, 1.6, 0));
  island.add(g);

  return {
    update(n, t) {
      const flicker = 1 + 0.06 * Math.sin(t * 7.3) + 0.04 * Math.sin(t * 13.1);
      glass.emissiveIntensity = 0.2 + n * 2.4 * flicker;
      halo.material.opacity = n * 0.85 * flicker;
    },
  };
}

// ---------- Mấy hòn đá nhỏ lơ lửng quanh chân đảo ----------
function buildFloatingRocks(island) {
  const rockMat = new THREE.MeshStandardMaterial({ color: '#9b8577', roughness: 0.95, flatShading: true });
  const grassMat = mat('#8fd27a');
  return [[-10.5, -3.2, 6.5, 0.8], [11.8, -4.6, -3.0, 1.0], [7.0, -6.4, 9.5, 0.6]].map(([x, y, z, s]) => {
    const g = at(new THREE.Group(), x, y, z);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
    rock.scale.y = 0.8;
    g.add(rock);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.75, s * 0.7, 0.12, 9), grassMat);
    g.add(at(top, 0, s * 0.62, 0));
    g.userData.y = y;
    island.add(g);
    return g;
  });
}

// ---------- Mây bông lơ lửng quanh đảo ----------
function buildClouds(island) {
  const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 1 });
  return [[13.5, -3.0, 8.0, 1.2], [-6.0, -5.0, 13.5, 1.0], [15.0, -6.0, -6.0, 1.4], [-13.0, -4.0, -3.0, 1.1]].map(([x, y, z, s]) => {
    const g = at(new THREE.Group(), x, y, z);
    [[0, 0, 0, 1], [1.1, -0.2, 0.1, 0.75], [-1.0, -0.25, 0, 0.7], [0.4, 0.45, -0.2, 0.65], [-0.3, -0.3, 0.6, 0.6]].forEach(([px, py, pz, r]) => {
      g.add(decoration(at(sphere(r * s, cloudMat, 14, 10), px * s, py * s, pz * s)));
    });
    g.userData.y = y;
    g.userData.material = cloudMat;
    island.add(g);
    return g;
  });
}

// ---------- Đom đóm (ban đêm) ----------
function buildFireflies(island) {
  const count = 40;
  const base = [];
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const [x, z] = polar(a, between(6, edge(a) + 1));
    base.push([x, between(0.3, 2.6), z, rand() * 10]);
  }
  const positions = new Float32Array(count * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    size: 7, sizeAttenuation: false, color: '#e9ff9a', transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0,
    map: canvasTexture(32, 32, (ctx) => {
      const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, 'rgba(255, 255, 255, 1)');
      g.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 32, 32);
    }),
  });
  const points = decoration(new THREE.Points(geo, material));
  island.add(points);
  return {
    update(t, n, calm) {
      points.visible = n > 0.02;
      if (!points.visible) return;
      material.opacity = n * (0.75 + 0.25 * Math.sin(t * 2.7));
      const tt = t * calm;
      base.forEach(([x, y, z, ph], i) => {
        positions[i * 3] = x + Math.sin(tt * 0.5 + ph) * 0.6;
        positions[i * 3 + 1] = y + Math.sin(tt * 0.9 + ph * 1.3) * 0.35;
        positions[i * 3 + 2] = z + Math.cos(tt * 0.4 + ph) * 0.6;
      });
      geo.attributes.position.needsUpdate = true;
    },
  };
}

// ---------- Bướm (ban ngày) ----------
function buildButterflies(island) {
  const wingTex = (c1, c2) => canvasTexture(64, 64, (ctx) => {
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.ellipse(30, 22, 26, 18, -0.3, 0, Math.PI * 2); // cánh trên
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(24, 46, 18, 14, 0.4, 0, Math.PI * 2);  // cánh dưới
    ctx.fill();
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.arc(34, 20, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  const list = [
    { c: ['#ffb3d1', '#ffffff'], center: [3.2, 7.6], r: [1.6, 1.1], y: 1.0, speed: 0.6 },
    { c: ['#ffe066', '#ff9a3c'], center: [PX - 0.2, PZ + 0.4], r: [1.8, 1.4], y: 1.3, speed: -0.5 },
    { c: ['#a8d8ff', '#5a7cff'], center: [-6.6, 6.8], r: [1.3, 1.6], y: 1.6, speed: 0.7 },
  ].map((b, i) => {
    const material = new THREE.MeshStandardMaterial({ map: wingTex(...b.c), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 });
    const g = new THREE.Group();
    g.add(at(new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.12, 3, 6), mat('#3a2a22')), 0, 0, 0, Math.PI / 2, 0, 0));
    const wings = [1, -1].map((side) => {
      const hinge = new THREE.Group();
      const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), material);
      wing.scale.x = side;
      hinge.add(at(wing, side * 0.13, 0, 0, -Math.PI / 2, 0, 0));
      g.add(hinge);
      return { hinge, side };
    });
    island.add(g);
    return { ...b, g, wings, phase: i * 2.1 };
  });
  return {
    update(t, n, calm) {
      list.forEach((b) => {
        b.g.visible = n < 0.6;
        if (!b.g.visible) return;
        const w = t * b.speed * calm + b.phase;
        const x = b.center[0] + Math.cos(w) * b.r[0];
        const z = b.center[1] + Math.sin(w) * b.r[1];
        b.g.position.set(x, b.y + Math.sin(t * 2.3 + b.phase) * 0.25 * calm, z);
        // Quay đầu theo hướng bay (đạo hàm của đường bay)
        const dx = -Math.sin(w) * b.r[0] * Math.sign(b.speed);
        const dz = Math.cos(w) * b.r[1] * Math.sign(b.speed);
        b.g.rotation.y = Math.atan2(dx, dz);
        const flap = 0.15 + 1.0 * Math.abs(Math.sin(t * 16 + b.phase));
        b.wings.forEach(({ hinge, side }) => { hinge.rotation.z = side * flap; });
      });
    },
  };
}
