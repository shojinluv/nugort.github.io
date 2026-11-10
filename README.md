# Căn phòng nhỏ của Shojinluv

Trang chủ 3D làm bằng [Three.js](https://threejs.org): một căn phòng nhỏ xoay được bằng chuột,
bấm vào đồ vật để xem các dự án.

| Đồ vật | Bấm vào thì… |
| --- | --- |
| 🖥️ Máy tính | Giới thiệu về mình |
| 🎸 Đàn guitar | Mở dự án **The Band** |
| 🛍️ Túi hàng | Mở dự án **Shopee clone** |
| 💡 Đèn bàn | Đổi ngày ↔ đêm |
| 🐱 Mèo Sphynx | Mèo giật mình nói chuyện |
| 🪴 Cây Monstera | Tưới cây, cây lớn dần |

Một vài chi tiết nhỏ: đồng hồ treo tường chạy theo giờ thật, mở trang sau 6 giờ tối thì phòng tự chuyển sang
buổi tối, và có bộ đếm xem bạn đã khám phá hết đồ vật chưa.

## Chạy thử trên máy

Trang dùng ES module nên phải mở qua một web server, không mở thẳng file `index.html` được.

- **VS Code:** cài extension *Live Server*, mở `index.html` rồi bấm **Go Live**.
- **Hoặc dùng Python:**

  ```bash
  python3 -m http.server 8000
  ```

  rồi mở http://localhost:8000

Không cần cài npm hay build gì cả. Three.js đã được để sẵn trong thư mục `vendor/`.

## Cấu trúc thư mục

```
index.html          Khung trang: tiêu đề, nút ngày/đêm, khung thông tin
css/room.css        Giao diện chữ và nút nằm trên khung 3D
js/main.js          "Bộ não": scene, camera, ánh sáng, chuột, ngày/đêm, vòng lặp vẽ
js/room.js          Vỏ phòng: sàn, tường, cửa sổ, tia nắng, dây đèn, tranh, đồng hồ
js/furniture.js     Đồ đạc: bàn, máy tính, đèn, giường, cây, đàn, túi hàng, mèo…
js/helpers.js       Hàm tiện ích để dựng hình hộp, hình trụ, texture vẽ bằng canvas
js/content.js       Chữ và link trong khung thông tin (sửa nội dung ở đây)
vendor/three/       Thư viện Three.js r186 (giấy phép MIT)
learing/            Các bài tập cũ (F8, Techmaster)
```

## Muốn sửa thì sửa ở đâu?

- **Đổi lời giới thiệu, link, ảnh:** sửa `js/content.js`.
- **Đổi màu tường, sàn:** tìm `mat('#f7dfcf')` (sơn tường) và màu ván sàn trong `js/room.js`.
- **Thêm đồ vật bấm được:**
  1. Viết hàm dựng đồ vật trong `js/furniture.js` rồi gọi `clickable(world, 'ten-do-vat', group)`.
  2. Thêm chú thích vào `labels` và nội dung vào `content` trong `js/content.js`.
- **Nghịch trực tiếp:** mở Console của trình duyệt (F12) rồi gõ, ví dụ:

  ```js
  room.setNight(true)
  room.world.clickables.cat.position.x = 3
  ```
