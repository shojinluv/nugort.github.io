// helpers.js – Mấy "dụng cụ" nhỏ giúp dựng đồ vật 3D nhanh và gọn hơn
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Số ngẫu nhiên "có hạt giống": lần nào tải trang cũng ra cùng một kết quả,
// nên căn phòng luôn trông giống nhau (sách, ván sàn, lá cây không bị nhảy lung tung)
let seed = 20221;
export function random() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

// Material (vật liệu) quyết định màu sắc và độ bóng của bề mặt.
// Cùng một màu thì dùng chung một material cho nhẹ máy.
const cache = new Map();
export function mat(color) {
  if (!cache.has(color)) {
    cache.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  }
  return cache.get(color);
}

// Cho phép truyền vào một mã màu ('#ff0000') hoặc một material có sẵn
const toMat = (c) => (c instanceof THREE.Material ? c : mat(c));

/** Hộp bo tròn góc: rộng w (trục x), cao h (trục y), sâu d (trục z) */
export function box(w, h, d, color, radius = 0.04) {
  const r = Math.min(radius, Math.min(w, h, d) / 2 - 0.001);
  const geometry = r > 0.005
    ? new RoundedBoxGeometry(w, h, d, 3, r)
    : new THREE.BoxGeometry(w, h, d);
  return new THREE.Mesh(geometry, toMat(color));
}

/** Hình trụ (rTop: bán kính đáy trên, rBottom: đáy dưới, h: chiều cao) */
export function cylinder(rTop, rBottom, h, color, segments = 24) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), toMat(color));
}

/** Hình cầu bán kính r */
export function sphere(r, color, wSeg = 24, hSeg = 16) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, wSeg, hSeg), toMat(color));
}

/** Đặt vị trí (x, y, z) và góc xoay (rx, ry, rz – đơn vị radian) rồi trả lại chính vật đó */
export function at(obj, x, y, z, rx = 0, ry = 0, rz = 0) {
  obj.position.set(x, y, z);
  obj.rotation.set(rx, ry, rz);
  return obj;
}

/** Một "que" hình trụ nối từ điểm a tới điểm b (dùng cho chân ghế, tay đèn, cuống lá…) */
export function stick(a, b, radius, color) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const length = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), toMat(color));
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  // Hình trụ mặc định dựng đứng theo trục y → xoay nó cho trùng hướng a → b
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

/** Vẽ lên một tấm canvas 2D, rồi biến nó thành texture (hình dán) cho vật thể 3D */
export function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Đánh dấu vật thể không bấm được và không đổ bóng (tia nắng, bụi, bầu trời…) */
export function decoration(obj) {
  obj.userData.noPick = true;
  obj.userData.noShadow = true;
  return obj;
}
