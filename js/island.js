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
// Bán kính khối đá theo hướng góc a: miệng trên ôm theo đúng đường viền đảo, thụt vào trong lớp đất sẫm
// (lớp này rộng 0,95 lần mép đảo), để không chỗ nào mép đá chìa ra ngoài lớp đất
const ROCK_RIM = 0.93;
const rockShape = (a, f) => (edge(a) * ROCK_RIM * rockRadius(f)) / rockRadius(0);
// Độ gồ ghề của mặt đá: bằng 0 ở miệng trên rồi tăng dần, xuống sâu chừng 1/5 thân đá thì đủ mức
const rockBump = (a, y, f) => 1 + Math.min(1, f * 5) * (0.08 * Math.sin(a * 5 + y * 1.3) + 0.06 * Math.sin(a * 11 - y * 2.1));

/** Một điểm (toạ độ thế giới) có nằm trong khối đảo lúc đảo đang nằm yên không. Dùng để chặn camera chui vào đảo. */
export function insideIsland(x, y, z) {
  const lx = x - PAD.x;
  const ly = y - PAD.y - REST_LIFT;
  const lz = z - PAD.z;
  if (ly > -0.1) return false;
  const r = Math.hypot(lx, lz);
  if (ly > ROCK_TOP - 0.05) return r < edge(Math.atan2(lz, lx)) + 0.15; // lớp cỏ và đất
  const f = (ROCK_TOP - ly) / ROCK_DEPTH;
  return f <= 1 && r < rockShape(Math.atan2(lz, lx), f) * 1.15; // khối đá (cộng thêm phần gồ ghề)
}

const FLOOR = 5.4; // nửa cạnh sàn nhà (cộng chút lề), tính từ tâm đảo
const POND = { a: 0.2, r: 7.6, size: 1.25 };
const [PX, PZ] = polar(POND.a, POND.r);
const POND_Y = -0.05;  // mặt nước ao (cao hơn mặt cỏ một chút, để cá có chỗ bơi bên dưới)
const CAT_SPOT = 1.75; // mèo ra nằm chơi ở mép ao phía căn phòng (phía -x), cách tâm ao chừng này
const LANTERN = [3.4, 7.0];
const SIGN = [-0.7, 7.5];
const STONES = [[1.3, 6.1], [1.9, 6.95], [1.35, 7.8], [1.95, 8.6]];

// Chỗ trống để trồng hoa: trong đảo, ngoài sàn nhà, không trùng ao, lối đá, đèn và biển gỗ
function freeSpot(x, z, margin = 0.6) {
  const r = Math.hypot(x, z);
  if (r > edge(Math.atan2(z, x)) - margin) return false;
  if (Math.abs(x) < FLOOR && Math.abs(z) < FLOOR) return false;
  if (Math.hypot(x - PX, z - PZ) < POND.size + 0.5) return false;
  if (Math.hypot(x - (PX - CAT_SPOT - 0.1), z - PZ) < 0.8) return false; // chỗ mèo ra nằm chơi bên ao
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
  buildVines(island);
  buildTrees(island);
  buildFlowers(island);
  const glowShrooms = buildMushrooms(island);
  const water = buildPond(island);
  // Cho con mèo trong phòng thỉnh thoảng ra ao chơi với cá (xem buildCat trong furniture.js).
  // Các điểm ở đây tính theo toạ độ thế giới; mèo chỉ ra ao lúc hòn đảo đang nằm yên.
  const fishPos = new THREE.Vector3();
  const toWorld = (x, y, z) => {
    island.updateWorldMatrix(true, false); // vị trí đảo vừa được cập nhật trong khung hình này
    return island.localToWorld(new THREE.Vector3(x, y, z));
  };
  world.pond = {
    spot: () => toWorld(PX - CAT_SPOT, -0.14, PZ), // mặt cỏ chỗ mèo nằm
    center: () => toWorld(PX, POND_Y, PZ),
    nearestFish(point, out) {
      let best = Infinity;
      for (const f of water.fishes) {
        f.getWorldPosition(fishPos);
        const d = fishPos.distanceToSquared(point);
        if (d < best) {
          best = d;
          out.copy(fishPos);
        }
      }
      return out;
    },
    splash: (point) => water.splash(island.worldToLocal(point.clone())),
  };
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
  // Đi từ mũi nhọn dưới đáy lên trên, để mặt ngoài quay ra ngoài.
  // Điểm đầu tiên nằm ngay trên trục: khép kín mũi đá, không chừa lỗ nhỏ nhìn xuyên lên trên.
  const profile = [new THREE.Vector2(0, ROCK_TOP - ROCK_DEPTH - 0.3)];
  for (let i = 10; i >= 0; i--) {
    const f = i / 10;
    profile.push(new THREE.Vector2(rockRadius(f), ROCK_TOP - f * ROCK_DEPTH));
  }
  // Đậy kín miệng trên: khối đá để hở thì nhìn chéo qua mép sẽ thấy xuyên vào lòng đá rỗng ra tận bầu trời
  profile.push(new THREE.Vector2(0, ROCK_TOP));
  const rockGeo = new THREE.LatheGeometry(profile, 28);
  const pos = rockGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.z);
    if (r < 1e-6) continue; // tâm nắp và mũi nhọn nằm trên trục, giữ nguyên
    const a = Math.atan2(v.z, v.x);
    const f = Math.min(1, (ROCK_TOP - v.y) / ROCK_DEPTH);
    const s = (rockShape(a, f) * rockBump(a, v.y, f)) / rockRadius(f);
    pos.setXYZ(i, v.x * s, v.y, v.z * s);
  }
  rockGeo.computeVertexNormals();
  const rockMat = new THREE.MeshStandardMaterial({ color: '#9b8577', roughness: 0.95, flatShading: true });
  island.add(new THREE.Mesh(rockGeo, rockMat));

  buildRoots(island, rockGeo);
}

// Ống tròn chạy theo các điểm, to r0 ở đầu rồi thuôn dần còn r1 ở cuối (như rễ cây, dây leo)
function taperedTube(points, r0, r1, radial = 6) {
  const curve = new THREE.CatmullRomCurve3(points);
  const segs = Math.max(8, points.length * 3);
  const geo = new THREE.TubeGeometry(curve, segs, 1, radial, false); // dựng ống bán kính 1 rồi co lại từng khúc
  const pos = geo.attributes.position;
  const P = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(t, P);
    const r = r1 + (r0 - r1) * (1 - t) ** 1.1;
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, k).sub(P).multiplyScalar(r).add(P);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
  }
  return geo;
}

// Gộp nhiều ống thành một hình duy nhất, để cả bộ rễ chỉ tốn một lần vẽ
function mergeTubes(geos) {
  let vertices = 0;
  let indices = 0;
  for (const g of geos) {
    vertices += g.attributes.position.count;
    indices += g.index.count;
  }
  const position = new Float32Array(vertices * 3);
  const normal = new Float32Array(vertices * 3);
  const index = new Uint32Array(indices);
  let v = 0;
  let k = 0;
  for (const g of geos) {
    position.set(g.attributes.position.array, v * 3);
    normal.set(g.attributes.normal.array, v * 3);
    for (const i of g.index.array) index[k++] = i + v;
    v += g.attributes.position.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(position, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  out.setIndex(new THREE.BufferAttribute(index, 1));
  return out;
}

// ---------- Rễ cây chui ra từ dưới lớp đất ----------
// Mỗi rễ chính to ở gốc, bò sát theo mặt đá một đoạn rồi buông thõng xuống, thuôn dần thành sợi mảnh,
// đầu ngọn hơi hất ra ngoài. Dọc đường tách ra một hai rễ con xoè sang bên.
function buildRoots(island, rockGeo) {
  // Dò mặt đá: bắn một tia nằm ngang từ ngoài xa vào trục đảo, chỗ tia chạm đá là mặt đá ở hướng đó
  const probe = new THREE.Mesh(rockGeo);
  probe.updateMatrixWorld();
  const ray = new THREE.Raycaster();
  const from = new THREE.Vector3();
  const toAxis = new THREE.Vector3();
  const rockAt = (a, y) => {
    from.set(Math.cos(a) * 30, y, Math.sin(a) * 30);
    toAxis.set(-Math.cos(a), 0, -Math.sin(a));
    ray.set(from, toAxis);
    const hit = ray.intersectObject(probe, false)[0];
    return hit ? 30 - hit.distance : 0;
  };
  const TIP = 0.012; // độ to ở đầu ngọn rễ
  const thick = (r0, t) => TIP + (r0 - TIP) * (1 - t) ** 1.1;

  // Đường đi của một rễ: xuất phát ở góc a, độ cao y, cách trục đảo r, dài len.
  // Còn cao hơn hugTo thì bò sát mặt đá; thấp hơn thì buông thõng, rễ con thì xoè dần ra ngoài (splay).
  const grow = (a, y, r, len, hugTo, drift, splay, r0) => {
    const n = Math.max(5, Math.round(len / 0.22));
    const phase = rand() * 6;
    const out = { pts: [], a: [], r: [] };
    let freeR = null;
    let freeT = 0;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      let yy = y - t * len;
      const aa = a + drift * t + 0.012 * Math.sin(t * 7 + phase);
      let rr = r;
      if (i > 0) {
        const rock = rockAt(aa, yy);
        const clear = rock + thick(r0, t) + 0.03; // ôm sát nhưng không chìm vào đá
        if (yy > hugTo) rr = clear;
        else {
          if (freeR === null) { freeR = out.r[i - 1]; freeT = t; }
          rr = Math.max(freeR + splay * (t - freeT), clear);
        }
        const curl = Math.max(0, (t - 0.8) / 0.2); // đầu ngọn cong hất ra ngoài
        rr += 0.3 * curl * curl;
        yy += 0.22 * curl * curl;
      }
      out.pts.push(new THREE.Vector3(Math.cos(aa) * rr, yy, Math.sin(aa) * rr));
      out.a.push(aa);
      out.r.push(rr);
    }
    return out;
  };

  const tubes = [];
  const COUNT = 14;
  for (let i = 0; i < COUNT; i++) {
    const a = 0.5 + (i / COUNT) * Math.PI * 2 + between(-0.15, 0.15);
    if (Math.abs(Math.atan2(Math.sin(a - POND.a), Math.cos(a - POND.a))) < 0.25) continue; // chừa chỗ thác nước
    const r0 = between(0.08, 0.12);
    const len = between(1.6, 4.2);
    const hugTo = -1.75 - between(0.5, 2.6); // có rễ bò sát đá tới cuối, có rễ sớm buông thõng
    // Gốc rễ nằm khuất trong lớp đất sẫm (rộng 0,95 lần mép đảo), chui ra từ mặt dưới lớp đất
    const root = grow(a, -1.55, edge(a) * 0.94, len, hugTo, between(-0.06, 0.06), 0, r0);
    tubes.push(taperedTube(root.pts, r0, TIP));

    const branches = 1 + Math.round(rand());
    for (let b = 0; b < branches; b++) {
      const tb = between(0.2, 0.6);
      const j = Math.round(tb * (root.pts.length - 1));
      const side = b % 2 ? 1 : -1;
      const rb = thick(r0, tb) * 0.7;
      const twig = grow(root.a[j], root.pts[j].y, root.r[j], between(0.5, 1.3), hugTo, side * between(0.06, 0.14), between(0.1, 0.35), rb);
      tubes.push(taperedTube(twig.pts, rb, TIP));
    }
  }
  island.add(new THREE.Mesh(mergeTubes(tubes), mat('#7a5236')));
}

// ---------- Dây leo vắt qua mép cỏ, buông thõng xuống, lấm tấm lá và vài bông hoa nhỏ ----------
// Các góc đặt dây leo đã chừa ra thác nước, gốc cây và bụi cây sát mép đảo.
const VINES = [0.45, 0.95, 1.5, 1.95, 2.6, -1.3, -2.95];
function buildVines(island) {
  const tubes = [];
  const leaves = []; // [vị trí, hướng ra ngoài, nghiêng về bên nào, cỡ]
  const blossoms = [];
  for (const a of VINES) {
    const e = edge(a);
    const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const side = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
    const hang = between(0.9, 2.6); // đoạn buông thõng dưới đáy lớp đất
    const sway = between(-0.25, 0.25);
    // Bò trên mặt cỏ, vắt qua mép bo tròn, rủ dọc thành lớp đất rồi buông xuống khoảng không
    const profile = [[-0.35, -0.11, 0], [0.05, -0.08, 0], [0.24, -0.3, 0], [0.22, -0.8, 0.1], [0.17, -1.35, 0.2]];
    const n = Math.round(hang / 0.35);
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      profile.push([0.17 + 0.1 * t, -1.35 - hang * t, 0.2 + sway * t + 0.08 * Math.sin(t * 5 + a)]);
    }
    const pts = profile.map(([dr, y, s]) => out.clone().multiplyScalar(e + dr).addScaledVector(side, s).setY(y));
    tubes.push(taperedTube(pts, 0.03, 0.012, 5));

    // Lá mọc so le hai bên, bắt đầu từ chỗ dây vắt qua mép cỏ
    const curve = new THREE.CatmullRomCurve3(pts);
    const length = curve.getLength();
    let k = 0;
    for (let s = 0.4; s < length - 0.1; s += between(0.16, 0.26), k++) {
      const p = curve.getPointAt(s / length);
      const lr = k % 2 ? 1 : -1;
      leaves.push([p.clone().addScaledVector(side, lr * 0.07), out, lr, between(0.8, 1.25)]);
      if (k % 5 === 3) blossoms.push(p.clone().addScaledVector(side, -lr * 0.05).addScaledVector(out, 0.04));
    }
  }
  island.add(new THREE.Mesh(mergeTubes(tubes), mat('#4f9a52')));

  // Lá: hình cầu ép dẹt thành chiếc lá thon, mặt lá quay ra ngoài, chĩa chéo xuống về một bên
  const leafGeo = new THREE.SphereGeometry(0.1, 8, 6);
  leafGeo.scale(0.6, 1, 0.2);
  const leafMesh = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ roughness: 0.7 }), leaves.length);
  const greens = ['#5fb36a', '#7fcf84', '#4f9e5c'].map((c) => new THREE.Color(c));
  const dummy = new THREE.Object3D();
  leaves.forEach(([p, out, lr, size], i) => {
    dummy.position.copy(p);
    dummy.lookAt(p.clone().add(out));
    dummy.rotateZ(lr * 0.75);
    dummy.scale.setScalar(size);
    dummy.updateMatrix();
    leafMesh.setMatrixAt(i, dummy.matrix);
    leafMesh.setColorAt(i, greens[i % greens.length]);
  });
  island.add(leafMesh);

  const flowerMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), mat('#ff9ec4'), blossoms.length);
  blossoms.forEach((p, i) => {
    dummy.position.copy(p);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    flowerMesh.setMatrixAt(i, dummy.matrix);
  });
  island.add(flowerMesh);
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

  // Ao trong veo: đáy ao màu sẫm, mặt nước trong suốt phủ lên trên, nhìn thấy cá bơi giữa hai lớp
  island.add(at(new THREE.Mesh(new THREE.CircleGeometry(POND.size, 32), mat('#3f8fae')), PX, -0.13, PZ, -Math.PI / 2, 0, 0));
  const pondMat = new THREE.MeshStandardMaterial({
    color: '#8fd6ee', roughness: 0.1, metalness: 0.1, emissive: '#2a6f9a', emissiveIntensity: 0.15, transparent: true, opacity: 0.55,
  });
  island.add(at(new THREE.Mesh(new THREE.CircleGeometry(POND.size, 32), pondMat), PX, POND_Y, PZ, -Math.PI / 2, 0, 0));
  // Viền đá quanh ao: chừa một khe cho nước chảy ra suối, một khe phía căn phòng cho mèo ra nằm chơi
  for (let i = 0; i < 11; i++) {
    const a = Math.PI + (i / 11) * Math.PI * 2;
    const off = (b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    if (off(POND.a) < 0.4 || off(Math.PI) < 0.3) continue;
    const s = sphere(between(0.2, 0.3), '#c9c1b8', 8, 6);
    s.scale.y = 0.5;
    island.add(at(s, PX + Math.cos(a) * (POND.size + 0.05), -0.1, PZ + Math.sin(a) * (POND.size + 0.05)));
  }
  const pad = new THREE.Mesh(new THREE.CircleGeometry(0.32, 20, 0.4, Math.PI * 2 - 0.5), mat('#5fb36a'));
  island.add(at(pad, PX - 0.35, POND_Y + 0.01, PZ - 0.3, -Math.PI / 2, 0, 0));
  island.add(at(sphere(0.09, '#ff9ec4', 10, 8), PX - 0.35, POND_Y + 0.07, PZ - 0.3));

  // Cá chép Koi bơi lượn vòng quanh ao. Mèo vỗ nước gần con nào thì con đó giật mình bơi vụt đi
  const FISH_Y = -0.09;
  const finGeo = new THREE.CircleGeometry(0.09, 10, Math.PI - 0.75, 1.5).rotateX(-Math.PI / 2); // vây đuôi xoè hình quạt
  const sideFinGeo = new THREE.CircleGeometry(0.045, 8, Math.PI * 0.55, 0.9).rotateX(-Math.PI / 2);
  const fishes = [
    { body: '#ff7a3a', fin: '#ffb38a', r: 0.55, v: 0.32, phase: 0 },
    { body: '#fff3e8', fin: '#ffffff', spot: '#ff6a3a', r: 0.78, v: -0.26, phase: 2.1 },
    { body: '#ffb347', fin: '#ffe0a8', r: 0.38, v: 0.28, phase: 4.0 },
    { body: '#ff5a4a', fin: '#ff9f8f', spot: '#fff3e8', r: 0.8, v: 0.22, phase: 1.2 },
    { body: '#3a3333', fin: '#6a5f5f', spot: '#ff7a3a', r: 0.66, v: -0.34, phase: 5.2 },
  ].map((f) => {
    const g = new THREE.Group();
    const body = sphere(0.1, f.body, 14, 10);
    body.scale.set(1.6, 0.3, 0.62);
    g.add(body);
    if (f.spot) {
      const spot = sphere(0.055, f.spot, 10, 8);
      spot.scale.set(1.2, 0.35, 0.9);
      g.add(at(spot, 0.03, 0.012, 0));
    }
    for (const s of [-1, 1]) g.add(at(sphere(0.012, '#1d1d1d', 6, 4), 0.115, 0.01, s * 0.035)); // mắt
    const finMat = new THREE.MeshStandardMaterial({ color: f.fin, transparent: true, opacity: 0.85, side: THREE.DoubleSide, roughness: 0.6 });
    const tail = at(new THREE.Group(), -0.14, 0, 0);
    tail.add(new THREE.Mesh(finGeo, finMat));
    g.add(tail);
    for (const s of [-1, 1]) {
      const side = new THREE.Mesh(sideFinGeo, finMat);
      side.scale.z = s;
      g.add(at(side, 0.05, -0.005, s * 0.04));
    }
    g.position.set(PX + Math.cos(f.phase) * f.r, FISH_Y, PZ + Math.sin(f.phase) * f.r);
    g.scale.set(1.2, 1, 1.2); // to ra cho dễ nhìn từ xa, giữ nguyên bề dày để không nhô lên khỏi mặt nước
    island.add(g);
    return { ...f, g, tail, angle: f.phase, heading: 0, boost: 0 };
  });

  // Gợn sóng và mấy giọt nước bắn lên mỗi lần mèo vỗ nước
  const rippleMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false });
  const ripples = [0, 1, 2].map(() => {
    const m = decoration(new THREE.Mesh(new THREE.RingGeometry(0.06, 0.085, 28).rotateX(-Math.PI / 2), rippleMat.clone()));
    m.visible = false;
    island.add(m);
    return { m, life: 0 };
  });
  const dropMat = new THREE.MeshStandardMaterial({ color: '#d6f3ff', emissive: '#7fcbe8', emissiveIntensity: 0.4, roughness: 0.2 });
  const drops = Array.from({ length: 8 }, () => {
    const m = decoration(sphere(0.022, dropMat, 8, 6));
    m.visible = false;
    island.add(m);
    return { m, v: new THREE.Vector3(), life: 0 };
  });
  let nextRipple = 0;
  const splash = (p) => {
    const r = ripples[nextRipple++ % ripples.length];
    r.life = 1;
    r.m.position.set(p.x, POND_Y + 0.004, p.z);
    drops.forEach((d) => {
      const a = Math.random() * Math.PI * 2;
      const s = 0.25 + Math.random() * 0.45;
      d.m.position.set(p.x, POND_Y + 0.02, p.z);
      d.v.set(Math.cos(a) * s, 1.1 + Math.random() * 0.8, Math.sin(a) * s);
      d.life = 1;
    });
    for (const f of fishes) {
      const dx = p.x - f.g.position.x;
      const dz = p.z - f.g.position.z;
      if (dx * dx + dz * dz > 0.8 * 0.8) continue;
      f.boost = 1;
      // Đang bơi về phía chỗ vỗ nước thì quay đầu bơi ngược lại
      if (Math.cos(f.heading) * dx - Math.sin(f.heading) * dz > 0) f.v = -f.v;
    }
  };

  // Suối và thác nước: một dải nước liền mạch chảy từ ao ra mép đảo, vọt qua mép rồi cong dần xuống
  // theo đường parabol như nước thật. Càng rơi càng nhanh (vệt nước kéo dài ra), loe rộng và tan dần thành hơi nước.
  const u = new THREE.Vector3(Math.cos(POND.a), 0, Math.sin(POND.a));  // hướng nước chảy, từ ao ra ngoài
  const w = new THREE.Vector3(-Math.sin(POND.a), 0, Math.cos(POND.a)); // hướng ngang qua dòng nước
  const start = POND.r + POND.size * 0.8;
  const lip = edge(POND.a) + 0.2; // chỗ nước rời mép đảo (vượt qua mép cỏ bo tròn một chút)
  const SPEED = 0.8; // tốc độ nước chảy trên mặt đảo
  const G = 4;       // "trọng lực", nhẹ hơn thật cho thác rơi thong thả, dễ ngắm
  const FALL = 7;    // rơi sâu chừng này thì tan hết thành hơi nước
  const Y0 = -0.09;  // mặt nước suối
  const T = Math.sqrt((2 * FALL) / G);
  // Đường giữa dòng nước: [khoảng cách từ tâm đảo, độ cao, tốc độ chảy]
  const line = [];
  for (let i = 0; i <= 6; i++) line.push([start + ((lip - start) * i) / 6, Y0, SPEED]);
  for (let i = 1; i <= 40; i++) {
    const t = T * (i / 40) ** 1.5; // lấy mẫu dày ở chỗ uốn cong qua mép
    line.push([lip + SPEED * t, Y0 - 0.5 * G * t * t, Math.hypot(SPEED, G * t)]);
  }
  const fallAt = (drop) => lip + SPEED * Math.sqrt((2 * drop) / G); // nước đã rơi "drop" thì cách tâm đảo bao xa

  // Dựng dải nước theo đường giữa. Mỗi lát cắt ngang có 7 điểm: lúc chảy trên mặt đảo thì phẳng,
  // lúc rơi thì cong phồng ra ngoài như một dòng nước có độ dày. Hai mép và phía dưới mờ dần (độ trong lưu ở màu đỉnh).
  const ribbon = (widthScale, lift, alpha) => {
    const M = 7;
    const pos = [];
    const uv = [];
    const col = [];
    const idx = [];
    const C = new THREE.Vector3();
    const prev = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const n = new THREE.Vector3();
    const p = new THREE.Vector3();
    let v = 0; // toạ độ texture dọc dòng nước, tính theo thời gian chảy: chỗ nước nhanh thì vệt nước kéo dài ra
    line.forEach(([d, y, speed], i) => {
      C.copy(u).multiplyScalar(d).setY(y);
      if (i > 0) v += C.distanceTo(prev) / ((speed + line[i - 1][2]) / 2);
      prev.copy(C);
      const next = line[Math.min(i + 1, line.length - 1)];
      const back = line[Math.max(i - 1, 0)];
      dir.copy(u).multiplyScalar(next[0] - back[0]).setY(next[1] - back[1]).normalize();
      n.crossVectors(w, dir); // hướng lên khi nước chảy ngang, hướng ra ngoài khi nước rơi
      const drop = Y0 - y;
      const width = 0.9 * widthScale * (1 + 0.03 * drop);
      const bulge = Math.min(1, drop / 0.6) * 0.3;
      const fade = 1 - THREE.MathUtils.smoothstep(drop, FALL * 0.45, FALL);
      for (let j = 0; j < M; j++) {
        const k = (j / (M - 1)) * 2 - 1; // -1 … 1: từ mép này sang mép kia
        p.copy(C).addScaledVector(w, (k * width) / 2).addScaledVector(n, (1 - k * k) * width * bulge + lift);
        pos.push(p.x, p.y, p.z);
        uv.push(j / (M - 1), -v * 0.6);
        col.push(1, 1, 1, alpha * fade * (1 - Math.abs(k) ** 3));
      }
    });
    for (let i = 0; i < line.length - 1; i++) {
      for (let j = 0; j < M - 1; j++) {
        const a = i * M + j;
        idx.push(a, a + M, a + 1, a + 1, a + M, a + M + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  };
  const waterMat = (map, glow) => new THREE.MeshStandardMaterial({
    map, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    roughness: 0.15, emissive: '#3a86b8', emissiveIntensity: glow,
  });
  // Lớp ngoài là thân dòng nước; lớp lõi hẹp hơn, sáng hơn, chảy nhanh hơn một chút cho nước có chiều sâu, lấp lánh
  const bodyTex = streaks(64, 256, true);
  const coreTex = streaks(64, 256, true);
  const body = decoration(new THREE.Mesh(ribbon(1, 0, 0.92), waterMat(bodyTex, 0.2)));
  const core = decoration(new THREE.Mesh(ribbon(0.5, 0.035, 0.55), waterMat(coreTex, 0.45)));
  core.renderOrder = 1;
  island.add(body, core);

  // Bọt trắng chỗ nước vắt qua mép đảo
  const foamMat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.35, transparent: true, opacity: 0.85, roughness: 0.6 });
  const foams = [-0.26, -0.05, 0.2].map((k, i) => {
    const f = decoration(new THREE.Mesh(new THREE.SphereGeometry(0.11 - i * 0.015, 10, 8), foamMat));
    f.position.copy(u).multiplyScalar(lip - 0.05 + i * 0.04).addScaledVector(w, k);
    f.position.y = Y0 + 0.01;
    f.scale.y = 0.45;
    island.add(f);
    return f;
  });

  const mistTex = canvasTexture(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  const mists = [0, 1, 2].map((i) => {
    const s = decoration(new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, transparent: true, depthWrite: false, opacity: 0.5 })));
    const drop = FALL * 0.72 + i * 0.4; // hơi nước bốc lên quanh chỗ thác bắt đầu tan
    s.position.copy(u).multiplyScalar(fallAt(drop) + (i - 1) * 0.15);
    s.position.y = Y0 - drop;
    island.add(s);
    return s;
  });

  return {
    update(t, dt, calm) {
      bodyTex.offset.y += dt * 0.6 * calm;
      coreTex.offset.y += dt * 0.75 * calm;
      foams.forEach((f, i) => {
        const k = 1 + 0.12 * Math.sin(t * 6 + i * 2.1) * calm;
        f.scale.set(k, 0.45 * k, k);
      });
      mists.forEach((s, i) => {
        const k = (t * 0.5 + i / 3) % 1;
        s.scale.setScalar(0.9 + k * 1.4);
        s.material.opacity = 0.5 * Math.sin(k * Math.PI);
      });

      // Cá bơi vòng quanh ao, lúc gần lúc xa tâm ao; giật mình thì bơi nhanh gấp mấy lần rồi chậm dần lại
      for (const f of fishes) {
        f.boost = Math.max(0, f.boost - dt * 0.8);
        const r = f.r + 0.12 * Math.sin(t * 0.37 + f.phase);
        f.angle += (f.v / r) * (1 + 3 * f.boost) * dt * calm;
        const x = PX + Math.cos(f.angle) * r;
        const z = PZ + Math.sin(f.angle) * r;
        const dx = x - f.g.position.x;
        const dz = z - f.g.position.z;
        if (dx * dx + dz * dz > 1e-10) {
          const want = Math.atan2(-dz, dx);
          f.heading += Math.atan2(Math.sin(want - f.heading), Math.cos(want - f.heading)) * Math.min(1, dt * 10);
        }
        f.g.position.set(x, FISH_Y, z);
        f.g.rotation.y = f.heading + Math.sin(t * 5 + f.phase) * 0.06 * calm; // thân uốn nhẹ theo nhịp bơi
        f.tail.rotation.y = Math.sin(t * (6 + 12 * f.boost) + f.phase) * 0.45 * calm;
      }
      for (const r of ripples) {
        r.life = Math.max(0, r.life - dt);
        r.m.visible = r.life > 0;
        r.m.scale.setScalar(1 + (1 - r.life) * 6);
        r.m.material.opacity = 0.8 * r.life;
      }
      for (const d of drops) {
        if (d.life <= 0) continue;
        d.v.y -= 6 * dt;
        d.m.position.addScaledVector(d.v, dt);
        d.life -= dt;
        d.m.visible = d.life > 0 && d.m.position.y > POND_Y;
        if (!d.m.visible) d.life = 0;
      }
    },
    splash,
    fishes: fishes.map((f) => f.g),
  };
}

// ---------- Lối đá, biển gỗ và đèn lồng ----------
function buildPathAndLantern(island) {
  STONES.forEach(([x, z], i) => {
    const s = cylinder(0.36 - i * 0.02, 0.4 - i * 0.02, 0.08, '#d8d0c6', 12);
    s.scale.z = 0.75;
    island.add(at(s, x, -0.12, z, 0, i * 0.7, 0));
  });

  // Biển gỗ: hòn đảo này vẫn là Trái Đất, nhưng ở một chiều không gian khác
  const wood = mat('#a8724a');
  const sign = at(new THREE.Group(), SIGN[0], -0.12, SIGN[1], 0, 0.55, 0);
  sign.add(at(cylinder(0.06, 0.07, 1.4, wood, 8), 0, 0.7, 0));
  const text = canvasTexture(640, 220, (ctx, w, h) => {
    ctx.fillStyle = '#c98f5a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(120, 70, 40, 0.25)'; // vân gỗ
    for (let y = 12; y < h; y += 22) ctx.fillRect(0, y + Math.sin(y) * 3, w, 3);
    ctx.fillStyle = '#5b3420';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Mỗi dòng bắt đầu ở cỡ chữ cho sẵn rồi co dần cho vừa bề ngang tấm biển
    const line = (str, size, y) => {
      do ctx.font = `${size--}px "Patrick Hand", sans-serif`;
      while (ctx.measureText(str).width > w - 48 && size > 20);
      ctx.fillText(str, w / 2, y);
    };
    line('Vẫn là Trái Đất,', 74, 76);
    line('nhưng ở một chiều không gian khác', 50, 156);
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.65, 0.06), [wood, wood, wood, wood, new THREE.MeshStandardMaterial({ map: text, roughness: 0.9 }), wood]);
  sign.add(at(board, 0, 1.25, 0.05, 0, 0, -0.04));
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
