// content.js – Chữ và đường link hiện trong khung thông tin.
// Muốn sửa lời giới thiệu, thêm ảnh hay đổi link thì chỉ cần sửa file này,
// không phải đụng vào phần code 3D.

// Chữ hiện ra khi rê chuột lên đồ vật
export const labels = {
  computer: 'Máy tính · Về mình',
  guitar: 'Cây đàn · The Band',
  bag: 'Túi hàng · Shopee clone',
  lamp: 'Đèn bàn · Đổi ngày/đêm',
  cat: 'Mèo Sphynx · Đang ngủ',
  plant: 'Cây Monstera · Tưới cây',
};

// Nội dung khung thông tin khi bấm vào đồ vật
export const content = {
  computer: {
    tag: 'Về mình',
    title: 'Xin chào, mình là Shojinluv 👋',
    body: [
      'Chào mừng bạn ghé căn phòng nhỏ của mình! Đây là nơi mình cất những dự án tự làm trong lúc học lập trình.',
      'Mình học HTML/CSS ở F8 và Java ở Techmaster. Còn căn phòng 3D này thì làm bằng Three.js.',
      'Cứ đi một vòng và bấm thử vào các đồ vật nhé. Con mèo hơi khó tính đấy!',
    ],
    links: [{ text: 'GitHub của mình', href: 'https://github.com/shojinluv' }],
  },
  guitar: {
    tag: 'Dự án · HTML/CSS',
    title: 'The Band',
    image: 'assets/thumbs/the-band.jpg',
    body: [
      'Trang web cho một ban nhạc tưởng tượng, làm theo khóa HTML/CSS của F8.',
      'Có ảnh bìa lớn, lịch lưu diễn, form liên hệ, và tự co giãn cho vừa màn hình điện thoại.',
    ],
    links: [{ text: 'Mở trang The Band', href: 'learing/f8/the-band/index.html' }],
  },
  bag: {
    tag: 'Dự án · Đang làm',
    title: 'Shopee clone',
    body: [
      'Bài tập dựng lại giao diện trang thương mại điện tử Shopee, cũng theo khóa F8.',
      'Mới xong một phần thanh điều hướng, phần còn lại đang được "giao hàng" từ từ 📦',
    ],
    links: [{ text: 'Xem bản đang làm', href: 'learing/f8/shopee-clone/index.html' }],
  },
};

// Câu thoại ngẫu nhiên
export const catLines = [
  'Meo~',
  'Đang ngủ mà…',
  'Tui không trọc nha, tui là Sphynx!',
  'Lạnh quá, cho tui cái áo len đi 🥶',
  'Nắng ấm ghê, đừng kéo rèm nha ☀️',
  'Prrr… prrr…',
];
export const plantLines = ['Mát quá! 💧', 'Cảm ơn nha 🌱', 'Lớn thêm xíu rồi nè!', 'Uống no rồi 💦'];
