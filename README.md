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
| 🖼️ Bức tranh | Mở "Di sản của Trâm Anh": vùng cấm, nội dung bị mây mù và ổ khoá che lại |

Một vài chi tiết nhỏ: đồng hồ treo tường và Mặt Trời đều chạy theo giờ thật (sáng sớm nắng thấp bên trái,
trưa cao ngay sau cửa sổ, chiều tà vàng cam bên phải), tới 6 giờ tối thì phòng tự chuyển sang buổi tối,
và có bộ đếm xem bạn đã khám phá hết đồ vật chưa. Muốn xem trời lúc khác thì gõ `room.setTime(17.5)` trong Console.

**🚀 Chế độ Vũ trụ:** bấm nút **Vũ trụ** ở góc trên để cả căn phòng bay ra ngoài quỹ đạo. Xung quanh là sao,
Trái Đất và Mặt Trăng, thỉnh thoảng có sao băng; đồ đạc trôi lơ lửng; mèo mặc đồ phi hành gia (mũ có hai tai
mèo, ăng-ten nhấp nháy, ba lô dưỡng khí) và lộn nhào khi bị chọc; tưới cây thì nước tụ thành giọt tròn bay
khắp phòng. Vì ngoài vũ trụ là chân không nên không còn vệt nắng, chỉ còn mảng nắng rọi trên sàn.
Ngoài vũ trụ còn có Dải Ngân Hà vắt ngang trời, Mặt Trời nằm đúng hướng nắng chiếu vào cửa sổ, và 7 hành tinh
còn lại là những chấm sáng trôi chậm dọc hoàng đạo (rê chuột để xem tên, bấm vào để đọc một câu giới thiệu).
Ngoài vũ trụ không có ngày đêm như dưới đất, nên nút ngày đêm đổi thành **Vào bóng Trái Đất**: Mặt Trời trượt dần
ra sau Trái Đất, lóe sáng ở mép rồi khuất hẳn; nắng tắt, chỉ còn đèn trong phòng, sao sáng rõ hơn, và nửa Trái Đất
quay về phía mình hiện đèn thành phố. Bấm **Ra chỗ có nắng** thì ngược lại. Lúc này camera xoay được 360° quanh căn phòng. Bấm **Hạ cánh** để về lại như cũ.

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
js/space.js         Chế độ vũ trụ: đường bay lên từ mặt đất, sao, Ngân Hà, Mặt Trời, hành tinh, Trái Đất, sao băng, đồ đạc trôi lơ lửng
js/island.js        Bối cảnh Trái Đất: hòn đảo cỏ lơ lửng kiểu cổ tích (cây, nấm, hoa, ao, thác nước, đèn lồng, bướm, đom đóm)
js/sky.js           Quanh hòn đảo: biển mây tới chân trời, đảo bay xa, Mặt Trời, trăng và sao, cá voi bay, mưa và cầu vồng sau mưa
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
- **Cho một đồ vật trôi lơ lửng ngoài vũ trụ:** gọi `floaty(world, vật, { lift, tilt, spin, delay })` ngay sau
  khi dựng nó (xem các ví dụ trong `js/furniture.js`, giải thích từng tuỳ chọn ở đầu `js/space.js`).
- **Nghịch trực tiếp:** mở Console của trình duyệt (F12) rồi gõ, ví dụ:

  ```js
  room.setNight(true)
  room.setSpace(true)
  room.world.clickables.cat.position.x = 3
  ```
