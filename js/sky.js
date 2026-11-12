// sky.js – Thế giới quanh hòn đảo ở "chiều không gian khác" (bối cảnh Trái Đất):
// biển mây trải tới tận chân trời, mấy hòn đảo bay xa xa trong sương, Mặt Trời ban ngày, trăng và sao ban đêm.
// Mặt Trời và trăng nằm đúng hướng nắng (hay ánh trăng) đang rọi vào phòng.
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

  const sea = buildCloudSea(realm, world.sunDir);
  const isles = buildFarIslands(realm);
  const sky = buildSunMoonStars(realm, world.sunDir);
  realm.traverse(decoration); // cảnh nền: không bấm được, không đổ bóng

  world.updaters.push((t) => {
    // Cất cánh thì mờ dần trong lúc Trái Đất thật hiện ra (p từ 0 tới 0,1), hạ cánh thì ngược lại
    const keep = 1 - THREE.MathUtils.smoothstep(world.spaceProgress, 0, 0.1);
    realm.visible = keep > 0.001;
    if (!realm.visible) return;
    const n = world.night;
    const calm = world.reduceMotion ? 0 : 1;
    sea.update(t, n, keep, calm);
    isles.update(t, n, keep, calm);
    sky.update(t, n, keep);
  });
}

// ---------- Biển mây ----------
// Một tấm phẳng rất rộng, mây vẽ bằng nhiễu (noise) ngay trong shader nên trôi được và không lộ ô lặp lại,
// càng ra xa càng tan vào màu trời. Bên trên rải thêm những đám mây bông phồng lên cho có khối.
function buildCloudSea(realm, sunDir) {
  const toSun = sunDir.clone().negate();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      night: { value: 0 },
      opacity: { value: 1 },
      sunXZ: { value: new THREE.Vector2(toSun.x, toSun.z).normalize() }, // hướng về phía Mặt Trời, trên mặt phẳng ngang
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float time;
      uniform float night;
      uniform float opacity;
      varying vec3 vWorld;
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
      }
      uniform vec2 sunXZ;
      void main() {
        vec2 q = vWorld.xz * 0.05 + vec2(time * 0.008, time * 0.004); // mây trôi rất chậm
        float c = fbm(q);
        float puff = smoothstep(0.38, 0.68, c); // chỗ mây dày, nổi lên sáng hơn
        // Giả bóng đổ: so độ dày mây ở ngay đây với chỗ lệch một chút về phía Mặt Trời.
        // Sườn mây quay về phía nắng thì sáng, sườn khuất nắng thì tối hơn, nhìn ra từng cụm mây có khối
        float lit = clamp((c - fbm(q + sunXZ * 0.12)) * 5.0 + 0.65, 0.0, 1.0);
        float d = length(vWorld.xz);
        float horizon = 1.0 - smoothstep(120.0, 250.0, d); // ra xa thì tan vào chân trời
        vec3 top = mix(vec3(1.0, 1.0, 1.0), vec3(0.42, 0.45, 0.74), night);
        vec3 shade = mix(vec3(0.95, 0.86, 0.89), vec3(0.1, 0.11, 0.26), night);
        vec3 col = mix(shade, top, mix(0.5, 1.0, puff) * lit);
        gl_FragColor = vec4(col, (0.72 + 0.28 * puff) * horizon * opacity);
      }`,
    transparent: true,
    depthWrite: false,
  });
  const plane = at(new THREE.Mesh(new THREE.PlaneGeometry(560, 560), material), 0, SEA_Y, 0, -Math.PI / 2, 0, 0);
  plane.renderOrder = -1; // vẽ trước như một lớp nền, để thác nước, hơi nước… luôn nằm đè lên trên
  realm.add(plane);

  // Những đám mây bông nổi trên biển mây: nhiều cục tròn ép dẹt, gom chung một lần vẽ
  const puffMat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 1, transparent: true });
  const puffs = [];
  for (let i = 0; i < 22; i++) {
    const a = rand() * Math.PI * 2;
    const r = between(22, 140);
    const size = between(3, 8) * (0.6 + r / 140);
    const cx = Math.cos(a) * r;
    const cz = Math.sin(a) * r;
    for (let k = 0; k < 5; k++) {
      puffs.push([cx + between(-1.4, 1.4) * size, SEA_Y + between(0, 0.5) * size, cz + between(-1, 1) * size, size * between(0.6, 1)]);
    }
  }
  const cloudGeo = new THREE.SphereGeometry(1, 16, 12);
  const clouds = new THREE.InstancedMesh(cloudGeo, puffMat, puffs.length);
  const m = new THREE.Matrix4();
  puffs.forEach(([x, y, z, s], i) => {
    m.makeScale(s, s * 0.55, s).setPosition(x, y, z);
    clouds.setMatrixAt(i, m);
  });
  realm.add(clouds);

  return {
    update(t, n, keep, calm) {
      material.uniforms.time.value = t * calm;
      material.uniforms.night.value = n;
      material.uniforms.opacity.value = keep;
      puffMat.emissiveIntensity = 0.35 * (1 - n) + 0.03; // ban đêm mây tối theo trời
      puffMat.opacity = keep;
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
      house.add(at(new THREE.Mesh(new THREE.PlaneGeometry(w * 0.26, w * 0.26), glow), w * 0.18, w * 0.42, w * 0.401));
      house.add(at(new THREE.Mesh(new THREE.PlaneGeometry(w * 0.22, w * 0.38), glow), -w * 0.2, w * 0.24, w * 0.401));
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

// ---------- Mặt Trời, trăng và sao ----------
// Mặt Trời và trăng đặt đúng hướng nguồn sáng đang rọi vào phòng (ngược với hướng tia nắng),
// nên nhìn ngược lên phía sau căn phòng là thấy, và khớp với vệt nắng, bóng đổ, cầu vồng.
function buildSunMoonStars(realm, sunDir) {
  const toSun = sunDir.clone().negate().normalize();

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
  sun.position.copy(toSun).multiplyScalar(140);
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

  // Sao: rải trên nửa trên của một mặt cầu lớn, chỉ hiện lúc trời tối
  const count = 360;
  const pos = new Float32Array(count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    do v.set(between(-1, 1), between(0.12, 1), between(-1, 1));
    while (v.lengthSq() > 1);
    v.normalize().multiplyScalar(170);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({ color: '#fffbe8', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false });
  const stars = new THREE.Points(starGeo, starMat);
  realm.add(stars);

  return {
    update(t, n, keep) {
      sunMat.opacity = (1 - n) * keep;
      moonMat.opacity = n * keep;
      sun.visible = sunMat.opacity > 0.01;
      moon.visible = moonMat.opacity > 0.01;
      starMat.opacity = n * keep * (0.75 + 0.25 * Math.sin(t * 1.3));
      stars.visible = starMat.opacity > 0.01;
    },
  };
}
