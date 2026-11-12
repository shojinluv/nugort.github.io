// sky.js – Thế giới quanh hòn đảo ở "chiều không gian khác" (bối cảnh Trái Đất):
// biển mây cuộn sóng trải tới tận chân trời, mấy hòn đảo bay xa xa trong sương, Mặt Trời ban ngày, trăng ban đêm,
// thỉnh thoảng có cá voi mẹ con bơi ngang hay một đàn cá heo nhảy vồng qua mây.
// Mặt Trời và trăng nằm đúng hướng nắng (hay ánh trăng) đang rọi vào phòng.
// Sao và Dải Ngân Hà ban đêm dùng chung bầu trời sao với ngoài vũ trụ (xem starSky trong space.js).
// Lúc bấm "Vũ trụ", cả thế giới này mờ đi trong nửa giây đầu, nhường chỗ cho Trái Đất thật hiện ra bên dưới
// (như bay ngược về chiều không gian thường); hạ cánh thì hiện lại.
import * as THREE from 'three';
import { at, canvasTexture, decoration } from './helpers.js';

// Số ngẫu nhiên riêng (có hạt giống, lần nào tải trang cũng giống nhau, không xáo trộn chuỗi số của căn phòng và hòn đảo)
let seed = 777;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
const between = (a, b) => a + rand() * (b - a);

const SEA_Y = -18; // mặt biển mây, thấp hơn đáy hòn đảo một quãng
const HAZE = new THREE.Color('#f6dccf'); // màu sương xa, gần với màu trời ban ngày

export function buildRealm(world) {
  const realm = new THREE.Group();
  realm.name = 'chiều không gian khác';
  world.scene.add(realm);

  const sea = buildCloudSea(realm, world);
  const isles = buildFarIslands(realm);
  const sky = buildSunMoonStars(realm, world);
  const whale = buildWhale(realm);
  world.whale = whale.now; // gọi cá voi ra ngay, không phải đợi tới lượt (thử trong Console: room.world.whale())
  const weather = buildWeather(realm, world);
  world.rainNow = weather.now; // gọi mưa ngay (thử trong Console: room.world.rainNow())
  const dolphins = buildDolphins(realm);
  world.dolphins = dolphins.now; // gọi đàn cá heo ra ngay (thử trong Console: room.world.dolphins())
  realm.traverse(decoration); // cảnh nền: không bấm được, không đổ bóng

  world.updaters.push((t, dt) => {
    // Cất cánh thì mờ dần trong lúc Trái Đất thật hiện ra (p từ 0 tới 0,1), hạ cánh thì ngược lại
    const keep = 1 - THREE.MathUtils.smoothstep(world.spaceProgress, 0, 0.1);
    realm.visible = keep > 0.001;
    if (!realm.visible) {
      world.rain = 0;
      return;
    }
    const n = world.night;
    const calm = world.reduceMotion ? 0 : 1;
    sea.update(t, n, keep, calm);
    isles.update(t, n, keep, calm);
    sky.update(t, n, keep);
    whale.update(t, dt, n, keep, calm);
    dolphins.update(t, dt, n, keep, calm);
    weather.update(t, dt, n, keep, calm);
  });
}

// ---------- Mưa và cầu vồng sau mưa ----------
// Thỉnh thoảng có một cơn mưa ngắn: trời tối sầm, mây mưa kéo tới trên cao, hạt mưa rơi khắp quanh đảo
// (không lọt vào trong phòng, không xuyên qua mặt đảo), mặt ao lăn tăn (xem island.js).
// Tạnh mưa thì hơi nước còn lơ lửng khắp nơi, nên hiện một cầu vồng lớn trên nền trời: đúng như ngoài đời,
// nó là một vòng tròn 42° quanh điểm đối diện Mặt Trời (cầu vồng phụ mờ hơn ở 51°), chỉ thấy khi quay lưng về phía
// Mặt Trời. Đảo lơ lửng trên mây nên nhìn xuống còn thấy được trọn cả vòng tròn, như nhìn từ máy bay.
// world.rain (0 → 1) là lượng mưa lúc này: ánh sáng, nền trời, biển mây, mặt ao đều đọc giá trị này.
function buildWeather(realm, world) {
  // Hạt mưa: mỗi hạt là một vạch ngắn, rơi bằng shader (máy chỉ cần gửi thời gian), tới đáy thì quay lại từ trên cao
  const COUNT = 2600;
  const TOP = 30;
  const HEIGHT = TOP - SEA_Y;
  const pos = new Float32Array(COUNT * 2 * 3);
  const end = new Float32Array(COUNT * 2);
  const phase = new Float32Array(COUNT * 2);
  for (let i = 0; i < COUNT; i++) {
    const x = between(-48, 48);
    const z = between(-48, 48);
    const ph = rand();
    for (let k = 0; k < 2; k++) {
      pos.set([x, 0, z], (i * 2 + k) * 3);
      end[i * 2 + k] = k;
      phase[i * 2 + k] = ph;
    }
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  rainGeo.setAttribute('end', new THREE.BufferAttribute(end, 1));
  rainGeo.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  rainGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 6, 0), 80);
  const rainMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, amount: { value: 0 }, night: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float end;   // 0: đầu trên của vạch mưa, 1: đầu dưới
      attribute float phase; // mỗi hạt một nhịp rơi riêng
      uniform float time;
      uniform float amount;  // lượng mưa: phần hạt được hiện ra
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float y = ${TOP.toFixed(1)} - mod(time * 22.0 + phase * ${HEIGHT.toFixed(1)}, ${HEIGHT.toFixed(1)});
        p.y = y - end * 0.75;
        p.x += end * 0.1; // gió nghiêng nhẹ
        vAlpha = step(phase, amount);
        // Không mưa trong phòng (dưới trần) và dưới mặt đảo
        float inRoom = step(-5.5, p.x) * step(p.x, 5.2) * step(-5.5, p.z) * step(p.z, 5.2) * step(p.y, 6.1);
        float underIsland = step(length(p.xz + vec2(0.15)), 10.4) * step(p.y, -0.5);
        if (inRoom + underIsland > 0.5) vAlpha = 0.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float night;
      varying float vAlpha;
      void main() {
        if (vAlpha < 0.01) discard;
        gl_FragColor = vec4(mix(vec3(0.86, 0.9, 1.0), vec3(0.55, 0.6, 0.85), night), 0.42 * vAlpha);
      }`,
    transparent: true,
    depthWrite: false,
  });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  realm.add(rain);

  // Mây mưa xám kéo tới trên cao
  const stormMat = new THREE.MeshStandardMaterial({ color: '#8d8a9c', emissive: '#4a4658', emissiveIntensity: 0.3, roughness: 1, transparent: true, opacity: 0 });
  const storm = [];
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const r = between(0, 60);
    const size = between(6, 13);
    for (let k = 0; k < 3; k++) storm.push([Math.cos(a) * r + between(-1, 1) * size, between(24, 30), Math.sin(a) * r + between(-1, 1) * size, size * between(0.7, 1)]);
  }
  const stormMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), stormMat, storm.length);
  const m = new THREE.Matrix4();
  storm.forEach(([x, y, z, s], i) => stormMesh.setMatrixAt(i, m.makeScale(s, s * 0.45, s).setPosition(x, y, z)));
  realm.add(stormMesh);

  // Cầu vồng sau mưa: vẽ lên mặt trong một quả cầu lớn bao quanh, mỗi điểm tự tính góc giữa tia nhìn và hướng nắng
  const bowMat = new THREE.ShaderMaterial({
    uniforms: { antiSun: { value: world.sunNow }, strength: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 antiSun;
      uniform float strength;
      varying vec3 vWorld;
      vec3 hue(float h) { return clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
      float band(float a, float lo, float hi) { return smoothstep(lo - 0.8, lo + 0.6, a) * (1.0 - smoothstep(hi - 0.6, hi + 0.8, a)); }
      void main() {
        float a = degrees(acos(clamp(dot(normalize(vWorld - cameraPosition), antiSun), -1.0, 1.0)));
        float p = band(a, 39.5, 43.5);                              // cầu vồng chính: tím trong, đỏ ngoài
        vec3 c1 = hue(mix(0.78, 0.0, clamp((a - 39.5) / 4.0, 0.0, 1.0)));
        float s = band(a, 50.5, 54.0) * 0.32;                       // cầu vồng phụ: đỏ trong, tím ngoài
        vec3 c2 = hue(mix(0.0, 0.78, clamp((a - 50.5) / 3.5, 0.0, 1.0)));
        float inner = smoothstep(42.0, 20.0, a) * 0.06;             // phía trong vòng cầu vồng trời sáng hơn một chút
        float w = p + s;
        vec3 col = mix((c1 * p + c2 * s) / max(w, 1e-3), vec3(1.0), 0.28);
        col = mix(vec3(1.0), col, w / max(w + inner, 1e-3));
        gl_FragColor = vec4(col, (w * 0.75 + inner) * strength);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(150, 64, 32), bowMat);
  dome.renderOrder = 1; // vẽ sau biển mây, nên cầu vồng hiện lên trước biển mây nhưng vẫn bị đảo che khuất
  realm.add(dome);

  // Lịch thời tiết: trời quang một lúc → mưa chừng 20 giây → tạnh, cầu vồng hiện rồi tan → lại trời quang
  const w = { phase: 'clear', t: 0, wait: between(45, 75), length: 22, rain: 0, bow: 0 };
  const ss = THREE.MathUtils.smoothstep;
  return {
    update(t, dt, n, keep, calm) {
      w.t += dt;
      if (w.phase === 'clear') {
        w.rain = 0;
        if (calm && (w.wait -= dt) <= 0) {
          w.phase = 'rain';
          w.t = 0;
          w.length = between(18, 26);
        }
      } else if (w.phase === 'rain') {
        w.rain = ss(w.t, 0, 3) * (1 - ss(w.t, w.length - 4, w.length));
        if (w.t > w.length) {
          w.phase = 'after';
          w.t = 0;
        }
      } else if (w.phase === 'after') {
        w.bow = ss(w.t, 0, 4) * (1 - ss(w.t, 34, 44));
        if (w.t > 44) {
          w.phase = 'clear';
          w.wait = between(240, 420); // vài phút sau mới mưa tiếp
          w.bow = 0;
        }
      }
      world.rain = w.rain * keep;
      rainMat.uniforms.time.value = t;
      rainMat.uniforms.amount.value = world.rain;
      rainMat.uniforms.night.value = n;
      rain.visible = world.rain > 0.005;
      stormMat.opacity = world.rain * 0.92;
      stormMesh.visible = stormMat.opacity > 0.01;
      bowMat.uniforms.strength.value = w.bow * (1 - n) * keep; // cầu vồng cần nắng: ban đêm không có
      dome.visible = bowMat.uniforms.strength.value > 0.005;
    },
    // Gọi mưa ngay (thử trong Console: room.world.rainNow())
    now() {
      w.phase = 'clear';
      w.wait = 0;
    },
  };
}

// Đổi chế độ trong suốt cho một nhóm vật liệu chỉ khi cần mờ dần (bình thường vẽ như vật đặc cho khỏi lỗi chồng hình)
function fader(mats) {
  let fading = false;
  return (opacity) => {
    const now = opacity < 0.999;
    if (now !== fading) {
      fading = now;
      mats.forEach((m) => { m.transparent = fading; m.needsUpdate = true; });
    }
    mats.forEach((m) => { m.opacity = opacity; });
  };
}

// ---------- Cá voi bay ----------
// Thỉnh thoảng một cá voi mẹ khổng lồ dẫn theo cá voi con bơi ngang qua biển mây: lượn lên khỏi mây rồi lặn xuống
// thành từng vòng, mỗi lần ngoi lên tới đỉnh thì phun một vòi hơi nước. Đuôi quẫy nhịp nhàng, vây ngực khẽ vẫy.
// Ban đêm những đốm trên lưng phát sáng xanh như sứa. Lượt đầu bơi ngang khung hình quen thuộc, các lượt sau đổi hướng.
const WHALE_L = 22;  // dài gấp đôi hòn đảo
const WHALE_R = 3.1; // bán kính chỗ thân to nhất
const SWIM = 3.2;    // tốc độ bơi
const ARC = 16;      // mỗi vòng lượn lên lặn xuống mất bao nhiêu giây
const PATH = 90;     // mỗi lượt bơi từ -PATH tới +PATH dọc theo đường bơi
const CALF = 0.42;   // cá voi con to bằng chừng này so với mẹ
const CALF_SIDE = 7.5; // con bơi lệch sang một bên mẹ
const CALF_LAG = 5;    // và lùi sau một chút (ngang vây ngực của mẹ)

// Dựng một con cá voi (scale = 1 là cá voi mẹ). Trả về thân cá voi cùng mấy việc cần làm mỗi khung hình
function makeWhale(realm, scale) {
  const L = WHALE_L;
  const R = WHALE_R;
  // Độ to của thân dọc theo chiều dài: s = 0 ở mũi, s = 1 ở chóp đuôi
  const S = [0, 0.04, 0.12, 0.25, 0.4, 0.55, 0.62, 0.7, 0.8, 0.9, 1];
  const RR = [0.22, 0.58, 0.86, 1, 0.97, 0.82, 0.72, 0.58, 0.4, 0.24, 0.12];
  const radius = (s) => {
    const i = Math.min(S.length - 2, S.findIndex((x, k) => s <= S[k + 1]));
    return THREE.MathUtils.lerp(RR[i], RR[i + 1], (s - S[i]) / (S[i + 1] - S[i])) * R;
  };
  const along = (s) => L / 2 - s * L; // vị trí dọc thân, mũi ở phía +x
  const backColor = new THREE.Color('#4a67a3');
  const bellyColor = new THREE.Color('#e3eef8');
  const FLAT = 0.85; // thân hơi dẹt theo chiều đứng

  // Một khúc thân từ s0 tới s1: xoay một đường viền quanh trục rồi dựng nằm ngang, lưng sẫm bụng sáng
  const segment = (s0, s1, originX) => {
    const pts = [];
    if (s1 === 1) pts.push(new THREE.Vector2(0, along(1) - originX - 0.05)); // khép chóp đuôi
    for (let s = s1; s >= s0 - 1e-6; s -= 0.02) pts.push(new THREE.Vector2(radius(s), along(s) - originX));
    if (s0 === 0) pts.push(new THREE.Vector2(0, along(0) - originX + 0.12)); // khép mũi
    const geo = new THREE.LatheGeometry(pts, 32).rotateZ(-Math.PI / 2).scale(1, FLAT, 1);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      c.copy(bellyColor).lerp(backColor, THREE.MathUtils.smoothstep(pos.getY(i), -0.55 * R, -0.1 * R)); // lưng xanh phủ xuống quá nửa sườn
      c.toArray(colors, i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  };

  const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, emissive: '#3a5aa8', emissiveIntensity: 0 });
  const finMat = new THREE.MeshStandardMaterial({ color: backColor, roughness: 0.6, emissive: '#3a5aa8', emissiveIntensity: 0 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#1d2236', roughness: 0.3 });
  const spotMat = new THREE.MeshStandardMaterial({ color: '#dffbff', emissive: '#5ff4ff', emissiveIntensity: 0.2, roughness: 0.4 });
  const fade = fader([bodyMat, finMat, eyeMat, spotMat]);

  // Quẫy đuôi: thân là một khối liền, nửa sau uốn cong mềm dần về phía chóp đuôi (uốn ngay trong shader).
  // Độ lệch lên xuống ở chỗ s: bend · L · 0,3 · k², với k chạy từ 0 (giữa thân) tới 1 (chóp đuôi)
  const BEND_FROM = 0.42;
  const bend = { value: 0 };
  const lift = (s) => {
    const k = Math.max(0, s - BEND_FROM) / (1 - BEND_FROM);
    return bend.value * L * 0.3 * k * k;
  };
  bodyMat.onBeforeCompile = (shader) => {
    shader.uniforms.uBend = bend;
    shader.vertexShader = `uniform float uBend;\n${shader.vertexShader}`.replace('#include <begin_vertex>', /* glsl */ `
      #include <begin_vertex>
      float k = max(0.0, (${(L / 2).toFixed(3)} - transformed.x) / ${L.toFixed(3)} - ${BEND_FROM.toFixed(2)}) / ${(1 - BEND_FROM).toFixed(2)};
      transformed.y += uBend * ${(L * 0.3).toFixed(3)} * k * k;`);
  };

  const whale = new THREE.Group();
  whale.add(new THREE.Mesh(segment(0, 1, 0), bodyMat));

  // Vây đuôi gắn vào chóp đuôi: đi theo chỗ uốn và nghiêng theo độ dốc của đuôi, có một nút thịt nối cho liền
  const fluke = at(new THREE.Group(), along(0.96), 0, 0);
  const flukeGeo = new THREE.SphereGeometry(1, 20, 12);
  const knob = new THREE.Mesh(flukeGeo, finMat);
  knob.scale.set(R * 0.32, R * 0.13, R * 0.24);
  fluke.add(knob);
  for (const side of [-1, 1]) {
    const blade = new THREE.Mesh(flukeGeo, finMat);
    blade.scale.set(R * 0.75, R * 0.07, R * 1.15);
    fluke.add(at(blade, -R * 0.4, 0, side * R * 0.8, 0, side * 0.45, 0));
  }
  whale.add(fluke);

  // Vây ngực hai bên, chúc xuống và quặt ra sau
  const fins = [-1, 1].map((side) => {
    const pivot = at(new THREE.Group(), along(0.3), -0.45 * R, side * 0.75 * R);
    const fin = new THREE.Mesh(flukeGeo, finMat);
    fin.scale.set(R * 0.9, R * 0.07, R * 0.36);
    pivot.add(at(fin, -R * 0.55, 0, side * R * 0.3, side * 0.5, side * 0.4, 0));
    whale.add(pivot);
    return { pivot, side };
  });

  // Mắt, có chấm sáng cho long lanh
  for (const side of [-1, 1]) {
    const z = side * radius(0.12) * 0.86;
    whale.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), eyeMat), along(0.12), -0.18 * R, z));
    whale.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), spotMat), along(0.12) + 0.12, -0.12 * R, z * 1.1));
  }

  // Đốm trên lưng, ban đêm phát sáng
  for (let k = 0; k < 16; k++) {
    const s = 0.12 + (k % 8) * 0.06;
    const side = k < 8 ? 1 : -1;
    const a = 0.45 + (k % 3) * 0.18; // góc tính từ đỉnh lưng xuống sườn
    const r = radius(s) * 1.01;
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.16 + (k % 4) * 0.05, 10, 8), spotMat);
    whale.add(at(spot, along(s), Math.cos(a) * r * FLAT, side * Math.sin(a) * r));
  }
  whale.scale.setScalar(scale);
  whale.visible = false;
  realm.add(whale);

  // Vòi hơi nước: mấy đám hơi trắng bắn vọt lên từ lỗ thở trên đỉnh đầu rồi tan
  const puffTex = canvasTexture(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.55, 'rgba(255, 255, 255, 0.7)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  // Hơi nước hơi ánh xanh cho nổi trên nền trời màu đào
  const spray = Array.from({ length: 18 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: '#d4ecff', transparent: true, depthWrite: false, opacity: 0 }));
    s.visible = false;
    realm.add(s);
    return { s, v: new THREE.Vector3(), life: 0 };
  });
  const blowhole = new THREE.Vector3(along(0.17), radius(0.17) * FLAT, 0);
  const spout = () => {
    whale.updateMatrixWorld(); // vị trí vừa cập nhật trong khung hình này
    const from = whale.localToWorld(blowhole.clone());
    spray.forEach((p, i) => {
      p.s.position.copy(from);
      p.v.set(between(-0.9, 0.9), 4.5 + (i % 5) * 0.8, between(-0.9, 0.9)).multiplyScalar(Math.sqrt(scale));
      p.life = 1;
      p.delay = i * 0.035;
    });
  };

  return {
    group: whale,
    spout,
    // Hơi nước của vòi phun bay lên rồi tan
    updateSpray(dt, keep) {
      spray.forEach((q) => {
        if (q.life <= 0) return;
        if (q.delay > 0) { q.delay -= dt; return; }
        q.v.y -= 1.6 * dt;
        q.s.position.addScaledVector(q.v, dt);
        q.life -= dt / 2.2;
        q.s.visible = q.life > 0;
        q.s.scale.setScalar((1.1 + (1 - q.life) * 3.6) * Math.sqrt(scale));
        q.s.material.opacity = Math.min(1, Math.sin(Math.max(0, q.life) * Math.PI) * 1.3) * keep;
      });
    },
    // Quẫy đuôi, vẫy vây, ban đêm phát sáng; tail: nhịp quẫy đuôi (con nhỏ quẫy nhanh hơn)
    animate(t, n, tail, opacity) {
      bend.value = Math.sin(t * tail) * 0.22;
      // Vây đuôi đi theo chóp đuôi: lên xuống theo chỗ uốn, nghiêng theo độ dốc của đuôi và hất thêm một chút
      const sTip = 0.96;
      fluke.position.y = lift(sTip);
      const slope = (lift(sTip) - lift(sTip - 0.02)) / (-0.02 * L);
      fluke.rotation.z = Math.atan(slope) - bend.value * 0.6;
      fins.forEach(({ pivot, side }) => { pivot.rotation.x = side * Math.sin(t * tail * 0.8) * 0.25; });
      bodyMat.emissiveIntensity = n * 0.35; // ban đêm thân hơi ửng xanh cho thấy dáng
      finMat.emissiveIntensity = n * 0.35;
      spotMat.emissiveIntensity = 0.2 + n * 2.6; // đốm trên lưng sáng như sứa
      fade(opacity);
    },
  };
}

// Cá voi mẹ và cá voi con: con bơi sát bên mẹ, lượn theo nhịp riêng (nhanh hơn, thấp hơn), cũng phun vòi hơi nước nhỏ
function buildWhale(realm) {
  const mom = makeWhale(realm, 1);
  const calf = makeWhale(realm, CALF);
  const R = WHALE_R;

  // Chọn đường bơi: đi ngang qua trước một hướng nhìn, cách hòn đảo một quãng, không đâm vào đảo nào
  const pass = { on: false, wait: 14, s: 0, side: 1, phase: 0, center: new THREE.Vector2(), tangent: new THREE.Vector2(), peaked: false, calfPeaked: false };
  const clear = (center, tangent) => ISLES.every(({ pos, size }) => {
    const rel = new THREE.Vector2(pos[0], pos[2]).sub(center);
    const along2 = THREE.MathUtils.clamp(rel.dot(tangent), -PATH, PATH);
    const gap = rel.sub(tangent.clone().multiplyScalar(along2)).length();
    // Cá voi bơi dọc theo đường, nên hai bên chỉ cần chừa bằng sải vây đuôi (chừng 2R), chỗ con bơi lệch bên cạnh,
    // cộng cỡ hòn đảo
    return gap > size * 1.4 + 2 * R + CALF_SIDE + 1 || Math.abs(pos[1] - (SEA_Y + 3)) > 12;
  });
  let first = true;
  const startPass = () => {
    for (let tries = 0; tries < 24; tries++) {
      // Lượt đầu: bơi ngang phía sau hòn đảo, đúng chỗ khung hình mặc định nhìn tới
      const fixed = first && tries === 0;
      const angle = fixed ? -Math.PI * 0.75 : rand() * Math.PI * 2;
      const dist = fixed ? 24 : between(24, 36);
      pass.center.set(Math.cos(angle), Math.sin(angle)).multiplyScalar(dist);
      pass.tangent.set(-Math.sin(angle), Math.cos(angle)).multiplyScalar(rand() < 0.5 ? 1 : -1);
      if (!clear(pass.center, pass.tangent)) continue;
      first = false;
      pass.on = true;
      pass.s = -PATH;
      pass.phase = -Math.PI / 2; // bắt đầu từ dưới mây trồi lên
      pass.side = fixed ? 1 : (rand() < 0.5 ? 1 : -1); // con bơi bên ngoài (xa hòn đảo hơn) hay bên trong
      return;
    }
    pass.wait = 20; // không tìm được đường nào thoáng thì lát nữa thử lại
  };

  // Đặt một con cá voi lên đường bơi: s là quãng đã bơi, offset là lệch sang ngang, rise và height là độ lượn
  const place = (whale, s, offset, phase, height, arc) => {
    const y = SEA_Y + 3 + height * Math.sin(phase);
    const climb = (height * Math.cos(phase) * Math.PI * 2) / arc; // mũi ngóc lên lúc trồi, chúc xuống lúc lặn
    // Hướng vuông góc với đường bơi, chỉ ra xa hòn đảo
    const nx = pass.center.x / pass.center.length();
    const nz = pass.center.y / pass.center.length();
    whale.position.set(
      pass.center.x + pass.tangent.x * s + nx * offset,
      y,
      pass.center.y + pass.tangent.y * s + nz * offset,
    );
    whale.rotation.set(0, Math.atan2(-pass.tangent.y, pass.tangent.x), Math.atan2(climb, SWIM));
  };
  const ends = (s) => THREE.MathUtils.smoothstep(s, -PATH, -PATH + 14) * (1 - THREE.MathUtils.smoothstep(s, PATH - 14, PATH));

  return {
    update(t, dt, n, keep, calm) {
      mom.updateSpray(dt, keep);
      calf.updateSpray(dt, keep);
      if (!pass.on) {
        mom.group.visible = false;
        calf.group.visible = false;
        if (calm && (pass.wait -= dt) <= 0) startPass();
        return;
      }
      pass.s += SWIM * dt;
      pass.phase += (Math.PI * 2 * dt) / ARC;
      if (pass.s > PATH + CALF_LAG) {
        pass.on = false;
        pass.wait = 60 + rand() * 40; // một hai phút nữa mới quay lại
        mom.group.visible = false;
        calf.group.visible = false;
        return;
      }
      // Mẹ lượn những vòng lớn; con lượn vòng nhỏ hơn, nhanh gấp rưỡi
      const calfPhase = pass.phase * 1.5 - 0.6;
      place(mom.group, pass.s, 0, pass.phase, 5, ARC);
      place(calf.group, pass.s - CALF_LAG, CALF_SIDE * pass.side, calfPhase, 3, ARC / 1.5);
      mom.group.visible = pass.s < PATH;
      calf.group.visible = true;
      mom.animate(t, n, 1.4, ends(pass.s) * keep);
      calf.animate(t, n, 2.3, ends(pass.s - CALF_LAG) * keep);
      // Mỗi lần ngoi lên tới đỉnh vòng lượn thì phun một vòi hơi nước
      const top = Math.sin(pass.phase) > 0.97;
      if (top && !pass.peaked) mom.spout();
      pass.peaked = top;
      const calfTop = Math.sin(calfPhase) > 0.97;
      if (calfTop && !pass.calfPeaked) calf.spout();
      pass.calfPeaked = calfTop;
    },
    // Cho cá voi bơi ra ngay (thử trong Console: room.world.whale())
    now() {
      pass.wait = 0;
    },
  };
}

// ---------- Cá heo ----------
// Thỉnh thoảng một đàn cá heo lướt qua, thay nhau nhảy vồng lên khỏi biển mây rồi lao xuống, bắn tung bọt mây.
// Ban đêm bọt mây bắn lên phát sáng xanh như sinh vật phát quang dưới biển.
const DOLPHIN_L = 2.6;   // dài chừng một phần tư hòn đảo
const DOLPHIN_SPEED = 7; // bơi nhanh hơn cá voi nhiều
const POD_PATH = 75;     // mỗi lượt bơi từ -POD_PATH tới +POD_PATH
const SURFACE = SEA_Y + 0.5; // ngang mặt biển mây (mặt mây còn phồng lên xẹp xuống quanh mức này)
const AIR = 0.45;        // phần thời gian bay trên không trong mỗi nhịp nhảy
// Mỗi con: lệch sang ngang, lùi sau con đầu đàn, một nhịp nhảy dài bao nhiêu giây, nhảy cao bao nhiêu, lệch nhịp
const POD = [
  [0, 0, 2.1, 3.0, 0],
  [-2.2, 2.5, 2.3, 2.4, 0.35],
  [2.0, 3.6, 1.9, 2.8, 0.7],
  [-0.8, 6.2, 2.2, 3.4, 0.15],
  [1.2, 8.4, 2.0, 2.2, 0.55],
];

// Một con cá heo: thân thon dài có mỏ, lưng xám xanh bụng trắng, vây lưng cong, hai vây ngực, đuôi ngang
function makeDolphin(realm) {
  const L = DOLPHIN_L;
  const R = 0.34;
  const S = [0, 0.05, 0.1, 0.16, 0.24, 0.36, 0.5, 0.64, 0.78, 0.9, 1];
  const RR = [0.12, 0.2, 0.3, 0.62, 0.88, 1, 0.95, 0.72, 0.42, 0.2, 0.1]; // mỏ nhỏ, trán phồng, thân thon dần về đuôi
  const radius = (s) => {
    const i = Math.min(S.length - 2, S.findIndex((x, k) => s <= S[k + 1]));
    return THREE.MathUtils.lerp(RR[i], RR[i + 1], (s - S[i]) / (S[i + 1] - S[i])) * R;
  };
  const along = (s) => L / 2 - s * L; // mũi ở phía +x
  const back = new THREE.Color('#6f86ad');
  const belly = new THREE.Color('#eaf2fb');

  const pts = [new THREE.Vector2(0, along(1) - 0.03)];
  for (let s = 1; s >= -1e-6; s -= 0.02) pts.push(new THREE.Vector2(radius(s), along(s)));
  pts.push(new THREE.Vector2(0, along(0) + 0.04));
  const geo = new THREE.LatheGeometry(pts, 28).rotateZ(-Math.PI / 2).scale(1, 0.9, 1);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.copy(belly).lerp(back, THREE.MathUtils.smoothstep(pos.getY(i), -0.4 * R, 0.05 * R)).toArray(colors, i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, emissive: '#3a5aa8', emissiveIntensity: 0 });
  const finMat = new THREE.MeshStandardMaterial({ color: back, roughness: 0.45, emissive: '#3a5aa8', emissiveIntensity: 0 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#1d2236', roughness: 0.3 });
  const fade = fader([bodyMat, finMat, eyeMat]);

  const dolphin = new THREE.Group();
  dolphin.add(new THREE.Mesh(geo, bodyMat));

  // Vây lưng: một tấm cong vút về phía đuôi
  const finShape = new THREE.Shape();
  finShape.moveTo(0.12, 0);
  finShape.quadraticCurveTo(0.1, 0.32, -0.22, 0.44);
  finShape.quadraticCurveTo(-0.16, 0.16, -0.36, 0);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.05, bevelEnabled: false }).translate(0, 0, -0.025);
  dolphin.add(at(new THREE.Mesh(finGeo, finMat), along(0.45), radius(0.45) * 0.86, 0));

  // Vây ngực hai bên và đuôi ngang (hai thuỳ vểnh ra sau)
  const blob = new THREE.SphereGeometry(1, 14, 10);
  for (const side of [-1, 1]) {
    const fin = new THREE.Mesh(blob, finMat);
    fin.scale.set(0.3, 0.035, 0.11);
    dolphin.add(at(fin, along(0.33), -0.16, side * 0.27, side * 0.6, side * 0.5, 0));
    dolphin.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), eyeMat), along(0.14), 0.04, side * 0.15));
  }
  const fluke = at(new THREE.Group(), along(0.97), 0, 0);
  for (const side of [-1, 1]) {
    const lobe = new THREE.Mesh(blob, finMat);
    lobe.scale.set(0.24, 0.03, 0.3);
    fluke.add(at(lobe, -0.12, 0, side * 0.2, 0, side * 0.55, 0));
  }
  dolphin.add(fluke);
  dolphin.visible = false;
  realm.add(dolphin);

  return {
    group: dolphin,
    animate(t, n, beat, opacity) {
      fluke.rotation.z = Math.sin(beat) * 0.35; // đuôi đập lên xuống
      bodyMat.emissiveIntensity = n * 0.4;     // ban đêm thân hơi ửng xanh cho thấy dáng
      finMat.emissiveIntensity = n * 0.4;
      fade(opacity);
      dolphin.visible = opacity > 0.01;
    },
  };
}

function buildDolphins(realm) {
  const rnd = makeRand(97);
  const pod = POD.map(([side, lag, period, height, offset]) => ({ body: makeDolphin(realm), side, lag, period, height, offset, air: false }));

  // Bọt mây bắn lên mỗi lần một con nhảy khỏi mây hay lao xuống: dùng chung một bể hạt
  const mist = canvasTexture(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.55, 'rgba(255, 255, 255, 0.65)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  const DAY_SPRAY = new THREE.Color('#ffffff');
  const NIGHT_SPRAY = new THREE.Color('#8ff6ff');
  const spray = Array.from({ length: 72 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mist, transparent: true, depthWrite: false, opacity: 0 }));
    s.visible = false;
    realm.add(s);
    return { s, v: new THREE.Vector3(), life: 0 };
  });
  let next = 0;
  const burst = (x, z, strength) => {
    for (let i = 0; i < 6; i++) {
      const q = spray[next];
      next = (next + 1) % spray.length;
      const a = rnd() * Math.PI * 2;
      q.s.position.set(x, SURFACE, z);
      q.v.set(Math.cos(a) * (0.5 + rnd()), 1.4 + rnd() * 1.8, Math.sin(a) * (0.5 + rnd())).multiplyScalar(strength);
      q.life = 1;
    }
  };

  // Chọn đường bơi giống cá voi: lướt ngang qua một phía của hòn đảo, không đâm vào đảo nào
  const pass = { on: false, wait: 7, s: 0, time: 0, center: new THREE.Vector2(), tangent: new THREE.Vector2(), normal: new THREE.Vector2() };
  const clear = (center, tangent) => ISLES.every(({ pos, size }) => {
    const rel = new THREE.Vector2(pos[0], pos[2]).sub(center);
    const along2 = THREE.MathUtils.clamp(rel.dot(tangent), -POD_PATH, POD_PATH);
    const gap = rel.sub(tangent.clone().multiplyScalar(along2)).length();
    return gap > size * 1.4 + 4 || Math.abs(pos[1] - SURFACE) > 10;
  });
  let first = true;
  const startPass = () => {
    for (let tries = 0; tries < 24; tries++) {
      // Lượt đầu: lướt qua phía sau bên phải hòn đảo (cá voi lượt đầu thì bơi phía sau bên trái)
      const fixed = first && tries === 0;
      const angle = fixed ? -Math.PI * 0.6 : rnd() * Math.PI * 2;
      const dist = fixed ? 18 : 17 + rnd() * 14;
      pass.center.set(Math.cos(angle), Math.sin(angle)).multiplyScalar(dist);
      pass.tangent.set(-Math.sin(angle), Math.cos(angle)).multiplyScalar(fixed || rnd() < 0.5 ? 1 : -1);
      pass.normal.set(Math.cos(angle), Math.sin(angle));
      if (!clear(pass.center, pass.tangent)) continue;
      first = false;
      pass.on = true;
      pass.s = -POD_PATH;
      pass.time = 0;
      pod.forEach((d) => { d.air = false; });
      return;
    }
    pass.wait = 15;
  };
  const ends = (s) => THREE.MathUtils.smoothstep(s, -POD_PATH, -POD_PATH + 10) * (1 - THREE.MathUtils.smoothstep(s, POD_PATH - 10, POD_PATH));

  return {
    update(t, dt, n, keep, calm) {
      spray.forEach((q) => {
        if (q.life <= 0) return;
        q.v.y -= 3 * dt;
        q.s.position.addScaledVector(q.v, dt);
        q.life -= dt / 1.1;
        q.s.visible = q.life > 0;
        q.s.scale.setScalar(0.5 + (1 - q.life) * 1.5);
        q.s.material.color.copy(DAY_SPRAY).lerp(NIGHT_SPRAY, n);
        q.s.material.opacity = Math.sin(Math.max(0, q.life) * Math.PI) * (0.85 + 0.15 * n) * keep;
      });

      if (!pass.on) {
        pod.forEach((d) => d.body.animate(t, n, 0, 0));
        if (calm && (pass.wait -= dt) <= 0) startPass();
        return;
      }
      pass.s += DOLPHIN_SPEED * dt;
      pass.time += dt;
      if (pass.s > POD_PATH + 10) {
        pass.on = false;
        pass.wait = 50 + rnd() * 40;
        pod.forEach((d) => d.body.animate(t, n, 0, 0));
        return;
      }
      const heading = Math.atan2(-pass.tangent.y, pass.tangent.x);
      pod.forEach((d) => {
        const s = pass.s - d.lag;
        // Mỗi nhịp: bay vồng lên trên không một quãng, rồi lặn xuống dưới mây một quãng
        const u = (pass.time / d.period + d.offset) % 1;
        let y;
        let rise; // tốc độ lên xuống, để mũi ngóc lên lúc nhảy ra, chúc xuống lúc lao vào
        if (u < AIR) {
          const v = u / AIR;
          y = SURFACE + d.height * Math.sin(Math.PI * v);
          rise = (d.height * Math.PI * Math.cos(Math.PI * v)) / (AIR * d.period);
        } else {
          const v = (u - AIR) / (1 - AIR);
          y = SURFACE - 2.2 * Math.sin(Math.PI * v);
          rise = (-2.2 * Math.PI * Math.cos(Math.PI * v)) / ((1 - AIR) * d.period);
        }
        const x = pass.center.x + pass.tangent.x * s + pass.normal.x * d.side;
        const z = pass.center.y + pass.tangent.y * s + pass.normal.y * d.side;
        d.body.group.position.set(x, y, z);
        d.body.group.rotation.set(0, heading, Math.atan2(rise, DOLPHIN_SPEED));
        const shown = ends(s) * keep;
        // Nhảy ra khỏi mây hay lao xuống thì bắn tung bọt mây
        const air = u < AIR;
        if (air !== d.air && shown > 0.2) burst(x, z, air ? 1 : 0.8);
        d.air = air;
        // Lặn sâu dưới mây thì khuất hẳn
        const under = THREE.MathUtils.smoothstep(y, SURFACE - 1.6, SURFACE - 0.1);
        d.body.animate(t, n, pass.time * 9 + d.offset * 6, shown * under);
      });
    },
    // Cho đàn cá heo ra ngay (thử trong Console: room.world.dolphins())
    now() {
      pass.wait = 0;
    },
  };
}

// ---------- Biển mây ----------
// Mặt biển mây là một tấm lưới rất rộng, phồng lên xẹp xuống thành từng đợt mây cuộn (đẩy đỉnh lưới ngay trong shader
// bằng nhiễu, nên mây trôi được và không lộ ô lặp lại). Mỗi chỗ trên mặt mây được chiếu theo hướng nắng thật:
// sườn đón nắng sáng trắng, sườn khuất nắng và hõm mây ánh tím, viền mây ngược nắng ửng sáng,
// càng ra xa càng nhoè vào màu trời. Bên trên là những cụm mây tích nhiều lớp, cũng được tô sáng tối như vậy.

// Nhiễu (GLSL) cho mặt biển mây
const CLOUD_NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }`;

// Tô sáng tối cho mây (GLSL), dùng chung cho mặt biển mây và các cụm mây tích.
// n: pháp tuyến, view: hướng từ mặt mây về camera, occlusion: độ khuất (hõm mây, đáy mây tối hơn), dist: cách đảo bao xa
const CLOUD_LIGHT = /* glsl */ `
  uniform vec3 toSun;   // hướng về phía Mặt Trời (ban đêm là trăng)
  uniform float night;
  uniform float golden; // sáng sớm, chiều tà: mây ửng vàng cam
  uniform float gloom;  // trời mưa: mây xám lại
  uniform vec3 haze;    // màu trời sát chân trời
  vec3 cloudShade(vec3 n, vec3 view, float occlusion, float dist) {
    vec3 lit = mix(mix(vec3(1.0), vec3(1.0, 0.87, 0.72), golden), vec3(0.44, 0.47, 0.78), night);
    vec3 dark = mix(mix(vec3(0.74, 0.7, 0.87), vec3(0.84, 0.58, 0.66), golden), vec3(0.08, 0.09, 0.23), night);
    lit = mix(lit, lit * vec3(0.76, 0.75, 0.82), gloom);
    dark = mix(dark, dark * vec3(0.7, 0.68, 0.78), gloom);
    float sun = clamp(dot(n, toSun) * 0.6 + 0.4, 0.0, 1.0);
    vec3 col = mix(dark, lit, sun * occlusion);
    // Viền mây ửng sáng, rõ nhất khi nhìn ngược về phía nắng
    float edge = pow(1.0 - clamp(dot(n, view), 0.0, 1.0), 3.0);
    float behind = clamp(dot(-view, toSun), 0.0, 1.0);
    col += edge * (0.25 + 0.5 * behind) * mix(vec3(1.0, 0.95, 0.86), vec3(0.55, 0.6, 0.95), night) * (1.0 - 0.7 * gloom) * 0.5;
    return mix(col, haze, smoothstep(40.0, 230.0, dist) * 0.85);
  }`;

// Màu trời sát chân trời (để mây ở xa nhoè vào): ban ngày hồng đào, chiều tà ửng cam, mưa xám, đêm xanh tím
const HAZE_DAY = new THREE.Vector3(0.965, 0.863, 0.812);
const HAZE_GOLD = new THREE.Vector3(0.96, 0.77, 0.68);
const HAZE_RAIN = new THREE.Vector3(0.8, 0.78, 0.84);
const HAZE_NIGHT = new THREE.Vector3(0.17, 0.18, 0.4);

// Ánh sáng chiếu lên mây, dùng chung cho mặt biển mây, mây tích và mây bông quanh đảo (buildCloudSea cập nhật mỗi khung hình)
const cloudLight = {
  toSun: { value: new THREE.Vector3(0, 1, 0) },
  night: { value: 0 },
  golden: { value: 0 },
  gloom: { value: 0 },
  haze: { value: HAZE_DAY.clone() },
};

// Vật liệu cho những đám mây có khối (khối cầu, có thể ép dẹt, có thể vẽ hàng loạt bằng InstancedMesh):
// đỉnh mây sáng, đáy mây tối, nhìn ngược nắng thì viền ửng sáng. island.js cũng dùng cho mây bông quanh đảo
export function cloudMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { ...cloudLight, opacity: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vNormal;
      void main() {
        vec4 local = vec4(position, 1.0);
        vec3 scale = vec3(1.0);
        #ifdef USE_INSTANCING
          local = instanceMatrix * local;
          scale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        #endif
        vec4 w = modelMatrix * local;
        vNormal = normalize(mat3(modelMatrix) * (normal / scale)); // pháp tuyến của khối cầu đã bị ép dẹt
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float opacity;
      varying vec3 vWorld;
      varying vec3 vNormal;
      ${CLOUD_LIGHT}
      void main() {
        vec3 n = normalize(vNormal);
        float occlusion = mix(0.55, 1.0, smoothstep(-0.7, 0.6, n.y)); // đáy mây khuất sáng
        vec3 col = cloudShade(n, normalize(cameraPosition - vWorld), occlusion, length(vWorld.xz));
        gl_FragColor = vec4(col, opacity);
      }`,
  });
}

// Bộ số ngẫu nhiên riêng cho những thứ thêm sau, để không xáo trộn chuỗi rand() đang dùng
function makeRand(s) {
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildCloudSea(realm, world) {
  const shade = cloudLight;
  const time = { value: 0 };
  const material = new THREE.ShaderMaterial({
    uniforms: { ...shade, time, opacity: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float time;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vHeight;
      ${CLOUD_NOISE}
      // Mặt mây phồng lên bao nhiêu: những đợt mây lớn kéo dài, cộng thêm từng cụm mây cuộn nhỏ hơn
      float cloudHeight(vec2 xz) {
        float swell = fbm(xz * 0.011 + vec2(time * 0.004, -time * 0.002));
        float billow = fbm(xz * 0.05 + vec2(time * 0.008, time * 0.004));
        return (swell - 0.5) * 6.0 + smoothstep(0.3, 0.8, billow) * 3.4 - 1.3;
      }
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        float amp = 1.0 - 0.6 * smoothstep(150.0, 260.0, length(w.xz)); // xa chân trời thì phẳng dần
        float e = 1.2;
        float h = cloudHeight(w.xz);
        float hx = cloudHeight(w.xz + vec2(e, 0.0));
        float hz = cloudHeight(w.xz + vec2(0.0, e));
        vNormal = normalize(vec3(-(hx - h) * amp / e, 1.0, -(hz - h) * amp / e));
        vHeight = h;
        w.y += h * amp;
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float time;
      uniform float opacity;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vHeight;
      ${CLOUD_NOISE}
      ${CLOUD_LIGHT}
      void main() {
        float detail = fbm(vWorld.xz * 0.16 + vec2(time * 0.02, time * 0.01)); // gợn mây li ti
        vec3 n = normalize(vNormal + vec3(detail - 0.5, 0.0, 0.5 - detail) * 0.45);
        float occlusion = mix(0.4, 1.0, smoothstep(-3.0, 3.4, vHeight)) * (0.8 + 0.4 * detail); // hõm mây tối hơn
        float dist = length(vWorld.xz);
        vec3 col = cloudShade(n, normalize(cameraPosition - vWorld), occlusion, dist);
        float horizon = 1.0 - smoothstep(150.0, 270.0, dist); // ra xa thì tan vào chân trời
        gl_FragColor = vec4(col, (0.88 + 0.12 * detail) * horizon * opacity);
      }`,
    transparent: true,
    depthWrite: false,
  });
  const plane = at(new THREE.Mesh(new THREE.PlaneGeometry(560, 560, 240, 240), material), 0, SEA_Y, 0, -Math.PI / 2, 0, 0);
  plane.renderOrder = -1; // vẽ trước như một lớp nền, để thác nước, hơi nước… luôn nằm đè lên trên
  plane.frustumCulled = false; // mặt mây được đẩy lên xuống trong shader, khung bao gốc (phẳng) không còn đúng
  realm.add(plane);

  // Những cụm mây tích nổi trên biển mây: mỗi cụm có một khối giữa to, vây quanh là mấy cục nhỏ hơn,
  // trên đỉnh nhô thêm vài cục, gom chung một lần vẽ. Tô sáng tối như mặt biển mây: đỉnh sáng, đáy tối.
  // Vẽ như vật đặc (chỉ chuyển sang trong suốt lúc mờ dần khi cất cánh): để vẽ trong suốt thì máy phải tự đoán
  // mây với thác nước cái nào xa hơn, có lúc đoán sai làm mây phía sau phủ lên dòng thác
  const puffMat = cloudMaterial();
  // Vẫn rút số ngẫu nhiên y như hồi mây bông còn xếp kiểu cũ, để những thứ dựng sau (đảo xa, cá voi...) không bị đổi chỗ
  for (let i = 0; i < 22 * 23; i++) rand();
  const rnd = makeRand(31);
  const lumps = []; // [x, y, z, cỡ, độ dẹt]
  for (let i = 0; i < 30; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 20 + rnd() * 140;
    const s = (2.4 + rnd() * 4) * (0.6 + r / 150);
    const cx = Math.cos(a) * r;
    const cz = Math.sin(a) * r;
    const base = SEA_Y + 0.3 * s;
    lumps.push([cx, base + 0.35 * s, cz, s, 0.7]); // khối giữa
    const ring = 5 + Math.floor(rnd() * 3);
    for (let k = 0; k < ring; k++) {
      const b = (k / ring) * Math.PI * 2 + rnd() * 0.6;
      const d = s * (0.75 + rnd() * 0.35);
      lumps.push([cx + Math.cos(b) * d, base + rnd() * 0.15 * s, cz + Math.sin(b) * d * 0.8, s * (0.5 + rnd() * 0.3), 0.6]);
    }
    for (let k = 0; k < 2; k++) { // đỉnh mây nhô lên
      lumps.push([cx + (rnd() - 0.5) * s * 0.8, base + s * (0.7 + rnd() * 0.25), cz + (rnd() - 0.5) * s * 0.6, s * (0.42 + rnd() * 0.18), 0.8]);
    }
  }
  const clouds = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 10), puffMat, lumps.length); // tô sáng tối mềm nên ít mặt cũng đủ tròn
  const m = new THREE.Matrix4();
  lumps.forEach(([x, y, z, s, flat], i) => {
    m.makeScale(s, s * flat, s).setPosition(x, y, z);
    clouds.setMatrixAt(i, m);
  });
  realm.add(clouds);

  return {
    update(t, n, keep, calm) {
      time.value = t * calm;
      shade.toSun.value.copy(world.sunNow).negate();
      shade.night.value = n;
      shade.golden.value = world.golden;
      shade.gloom.value = world.rain;
      shade.haze.value.copy(HAZE_DAY).lerp(HAZE_GOLD, world.golden).lerp(HAZE_RAIN, world.rain * 0.8).lerp(HAZE_NIGHT, n);
      material.uniforms.opacity.value = keep;
      const fading = keep < 0.999; // mây tích chỉ chuyển sang trong suốt lúc đang mờ dần
      if (fading !== puffMat.transparent) {
        puffMat.transparent = fading;
        puffMat.needsUpdate = true;
      }
      puffMat.uniforms.opacity.value = keep;
      clouds.position.x = Math.sin(t * 0.02) * 2 * calm; // cả đàn mây dạt qua dạt lại thật chậm
    },
  };
}

// ---------- Những hòn đảo bay xa xa ----------
// Đảo nào cũng có mặt cỏ, lớp đất và chân đá nhọn; trên đó mỗi đảo một kiểu: nhà nhỏ của "hàng xóm"
// (tối thì sáng đèn), một cái cây cô độc, mấy cây thông, bụi cây. Đảo càng xa thì càng nhạt màu vào sương.
const ISLES = [
  { pos: [-42, -9, -18], size: 3.6, kind: 'house' },
  { pos: [-14, -7, -55], size: 2.6, kind: 'tree' },
  { pos: [-58, -13, -50], size: 4.6, kind: 'pines' },
  { pos: [-30, -12, 26], size: 3, kind: 'bushes' },
  { pos: [34, -10, -12], size: 3.2, kind: 'tree' },
  { pos: [22, 5, -78], size: 2.8, kind: 'pines' },
  { pos: [48, -15, 34], size: 4, kind: 'house' },
];

function buildFarIslands(realm) {
  const mats = []; // gom lại để mờ dần cùng lúc khi cất cánh
  const material = (color, haze, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).lerp(HAZE, haze), roughness: 0.9, ...extra });
    mats.push(m);
    return m;
  };
  const windows = [];
  const isles = ISLES.map(({ pos, size, kind }, i) => {
    const haze = THREE.MathUtils.smoothstep(Math.hypot(...pos), 30, 100) * 0.55;
    const g = at(new THREE.Group(), ...pos, 0, between(0, 6), 0);
    const s = size;
    const grass = material('#8fd27a', haze);
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(s, s * 0.95, s * 0.16, 20), grass), 0, -s * 0.08, 0));
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(s * 0.95, s * 0.86, s * 0.28, 20), material('#b07a4f', haze)), 0, -s * 0.3, 0));
    const rock = new THREE.Mesh(new THREE.ConeGeometry(s * 0.86, s * 1.7, 9), material('#9b8577', haze, { flatShading: true }));
    g.add(at(rock, 0, -s * 0.44 - s * 0.85, 0, Math.PI, 0, 0));

    const leaf = material(['#5fb36a', '#6fc27a', '#4f9e5c'][i % 3], haze);
    const trunk = material('#8a5a3c', haze);
    const roundTree = (x, z, h, r) => {
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.16, r * 0.22, h, 8), trunk), x, h / 2, z));
      for (const [dx, dy, dz, k] of [[0, 0, 0, 1], [0.5, -0.25, 0.2, 0.72], [-0.45, -0.2, -0.15, 0.75]]) {
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(r * k, 14, 10), leaf), x + dx * r, h + dy * r, z + dz * r));
      }
    };
    const pine = (x, z, h) => {
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(h * 0.04, h * 0.06, h * 0.3, 8), trunk), x, h * 0.15, z));
      for (let k = 0; k < 3; k++) g.add(at(new THREE.Mesh(new THREE.ConeGeometry(h * (0.3 - k * 0.07), h * 0.42, 10), leaf), x, h * (0.38 + k * 0.22), z));
    };
    if (kind === 'house') {
      const house = at(new THREE.Group(), -s * 0.2, 0, 0, 0, between(0, 6), 0);
      const w = s * 0.42;
      house.add(at(new THREE.Mesh(new THREE.BoxGeometry(w, w * 0.8, w * 0.8), material('#f7dfcf', haze)), 0, w * 0.4, 0));
      house.add(at(new THREE.Mesh(new THREE.ConeGeometry(w * 0.78, w * 0.55, 4), material('#ef6f5c', haze)), 0, w * 1.07, 0, 0, Math.PI / 4, 0));
      const glow = material('#3a2e2a', 0, { emissive: '#ffcf7a', emissiveIntensity: 0 });
      windows.push(glow);
      // Cửa sổ và cửa ra vào là tấm mỏng có bề dày, nhô hẳn ra khỏi tường: nhà ở xa, dán sát mặt tường thì hình bị nhấp nháy
      const pane = (pw, ph, x, y) => house.add(at(new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.05), glow), x, y, w * 0.4 + 0.01));
      pane(w * 0.26, w * 0.26, w * 0.18, w * 0.42);
      pane(w * 0.22, w * 0.38, -w * 0.2, w * 0.24);
      g.add(house);
      roundTree(s * 0.45, -s * 0.2, s * 0.5, s * 0.28);
    } else if (kind === 'tree') {
      roundTree(0, 0, s * 0.7, s * 0.42);
    } else if (kind === 'pines') {
      pine(-s * 0.3, 0, s * 1.1);
      pine(s * 0.25, s * 0.2, s * 0.8);
      pine(s * 0.05, -s * 0.35, s * 0.65);
    } else {
      for (const [x, z, r] of [[-0.3, 0.1, 0.3], [0.25, -0.2, 0.26], [0.1, 0.35, 0.2]]) {
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(s * r, 14, 10), leaf), s * x, s * r * 0.5, s * z));
      }
    }
    // Vài hòn đá vụn bay lơ lửng quanh đảo
    for (let k = 0; k < 2; k++) {
      const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(s * between(0.08, 0.16), 0), rock.material);
      const a = rand() * Math.PI * 2;
      g.add(at(pebble, Math.cos(a) * s * 1.3, -s * between(0.3, 1.2), Math.sin(a) * s * 1.3));
    }
    realm.add(g);
    return { g, y: pos[1], phase: i * 1.9, spin: between(-0.02, 0.02) };
  });

  let fading = false;
  return {
    update(t, n, keep, calm) {
      isles.forEach((isle) => {
        isle.g.position.y = isle.y + Math.sin(t * 0.25 + isle.phase) * 0.6 * calm; // nhấp nhô chầm chậm
        isle.g.rotation.y += isle.spin * 0.016 * calm;
      });
      windows.forEach((m) => { m.emissiveIntensity = n * 1.8; }); // tối thì nhà hàng xóm sáng đèn
      // Chỉ bật chế độ trong suốt lúc đang mờ dần, còn bình thường thì vẽ như vật đặc cho khỏi lỗi chồng hình
      const nowFading = keep < 0.999;
      if (nowFading !== fading) {
        fading = nowFading;
        mats.forEach((m) => { m.transparent = fading; m.needsUpdate = true; });
      }
      mats.forEach((m) => { m.opacity = keep; });
    },
  };
}

// ---------- Mặt Trời, trăng và quầng sáng chân trời (sao dùng chung với vũ trụ, xem space.js) ----------
// Mặt Trời và trăng đặt đúng hướng nguồn sáng đang rọi vào phòng (ngược với hướng tia nắng),
// nên nhìn ngược lên phía sau căn phòng là thấy, và khớp với vệt nắng, bóng đổ, cầu vồng.
function buildSunMoonStars(realm, world) {

  const sunTex = canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255, 255, 245, 1)');
    g.addColorStop(0.12, 'rgba(255, 246, 200, 1)');
    g.addColorStop(0.16, 'rgba(255, 220, 150, 0.75)');
    g.addColorStop(0.45, 'rgba(255, 196, 140, 0.22)');
    g.addColorStop(1, 'rgba(255, 190, 140, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const sunMat = new THREE.SpriteMaterial({ map: sunTex, transparent: true, depthWrite: false, toneMapped: false });
  const sun = new THREE.Sprite(sunMat);
  sun.position.copy(world.sunNow).multiplyScalar(-140); // ngược hướng tia nắng (cập nhật mỗi khung hình)
  sun.scale.setScalar(40);
  realm.add(sun);

  // Trăng lưỡi liềm: vẽ một hình tròn rồi khoét bớt bằng một hình tròn lệch sang bên, thêm quầng sáng nhạt
  const moonTex = canvasTexture(256, 256, (ctx, w, h) => {
    const halo = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    halo.addColorStop(0, 'rgba(220, 230, 255, 0.35)');
    halo.addColorStop(1, 'rgba(220, 230, 255, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);
    const moon = document.createElement('canvas');
    moon.width = moon.height = 256;
    const m = moon.getContext('2d');
    m.fillStyle = '#fff6d6';
    m.beginPath();
    m.arc(128, 128, 44, 0, Math.PI * 2);
    m.fill();
    m.globalCompositeOperation = 'destination-out';
    m.beginPath();
    m.arc(150, 112, 40, 0, Math.PI * 2);
    m.fill();
    ctx.drawImage(moon, 0, 0);
  });
  const moonMat = new THREE.SpriteMaterial({ map: moonTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 });
  const moon = new THREE.Sprite(moonMat);
  moon.position.copy(sun.position);
  moon.scale.setScalar(22);
  realm.add(moon);

  // Sao ban đêm giờ dùng chung bầu trời sao với ngoài vũ trụ (xem starSky trong space.js).
  // Vẫn rút số ngẫu nhiên y như lúc còn rải sao ở đây, để những thứ dựng sau (cá voi, mây mưa...) không bị đổi chỗ
  const v = new THREE.Vector3();
  for (let i = 0; i < 360; i++) {
    do v.set(between(-1, 1), between(0.12, 1), between(-1, 1));
    while (v.lengthSq() > 1);
  }

  // Quầng sáng nhạt sát chân trời ban đêm: trời ở dưới đất không đen hẳn, phía trên biển mây còn hơi sáng
  // (ánh trăng hắt lên từ mây, và trời phát sáng mờ mờ ở tầng cao). Ngoài vũ trụ thì không còn quầng này
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { strength: { value: 0 }, color: { value: new THREE.Color('#8a90e0') } },
    vertexShader: /* glsl */ `
      varying float vUp;
      void main() {
        vUp = normalize(position).y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float strength;
      uniform vec3 color;
      varying float vUp;
      void main() {
        float glow = exp(-pow((vUp + 0.02) / 0.14, 2.0));
        gl_FragColor = vec4(color, glow * strength);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(new THREE.SphereGeometry(165, 48, 24), glowMat);
  glow.renderOrder = -5; // vẽ trước cả biển mây, như một lớp nền trời
  realm.add(glow);

  return {
    update(t, n, keep) {
      // Mặt Trời ban ngày và trăng ban đêm đều nằm đúng hướng ánh sáng đang rọi vào phòng
      sun.position.copy(world.sunNow).multiplyScalar(-140);
      moon.position.copy(sun.position);
      sun.material.color.setRGB(1, 1 - 0.18 * world.golden, 1 - 0.38 * world.golden); // lúc thấp thì ngả vàng cam
      const clouds = 1 - 0.85 * world.rain; // mưa thì mây mưa che khuất Mặt Trời, trăng
      sunMat.opacity = (1 - n) * keep * clouds;
      moonMat.opacity = n * keep * clouds;
      sun.visible = sunMat.opacity > 0.01;
      moon.visible = moonMat.opacity > 0.01;
      glowMat.uniforms.strength.value = 0.32 * n * keep;
      glow.visible = glowMat.uniforms.strength.value > 0.005;
    },
  };
}
