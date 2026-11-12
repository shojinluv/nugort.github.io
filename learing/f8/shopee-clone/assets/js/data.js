// data.js – Dữ liệu dùng chung của Chợ Nugỏrt: danh mục, sản phẩm, shop, đánh giá.
// Không có máy chủ nào phía sau: mọi thứ đều bịa và nằm ngay trong file này.

export const CATS = [
  { id: 'all', name: 'Tất cả' },
  { id: 'cat', name: 'Đồ cho mèo' },
  { id: 'desk', name: 'Bàn làm việc' },
  { id: 'plant', name: 'Cây cảnh' },
  { id: 'coffee', name: 'Cà phê & trà' },
  { id: 'space', name: 'Đồ vũ trụ' },
  { id: 'book', name: 'Sách & nhạc' },
];

// Mỗi danh mục là một shop, kèm phân loại mặc định cho các món trong shop
export const SHOPS = {
  cat: { name: 'Tiệm của Mèo Sphynx', icon: '🐱', variants: ['Hồng phấn', 'Kem sữa', 'Xám khói'] },
  desk: { name: 'Góc Code Nugỏrt', icon: '💻', variants: ['Trắng sữa', 'Đen nhám', 'Hồng đào'] },
  plant: { name: 'Vườn Trầu Bà', icon: '🌿', variants: ['Chậu nhỏ', 'Chậu vừa', 'Chậu lớn'] },
  coffee: { name: 'Quán Thức Khuya', icon: '☕', variants: ['Gói 250g', 'Gói 500g', 'Gói 1kg'] },
  space: { name: 'Trạm SHOJINLUV-01', icon: '🚀', variants: ['Bản tiêu chuẩn', 'Bản phi hành gia'] },
  book: { name: 'Kệ Sách Cũ', icon: '📚', variants: ['Bản thường', 'Bản có chữ ký'] },
};

// price/old tính bằng đồng, sold là số đã bán, added càng lớn thì càng mới.
// variants (nếu có) thay cho phân loại mặc định của shop.
export const PRODUCTS = [
  { id: 1, cat: 'cat', icon: '🐟', name: 'Cá khô thượng hạng, mèo ăn xong tự rửa bát', price: 45000, old: 60000, sold: 12400, rating: 4.9, from: 'Phan Thiết', fav: true, added: 3,
    variants: ['Vị cá hồi', 'Vị cá ngừ', 'Vị cá cơm'],
    desc: 'Cá phơi đủ ba nắng ở biển Phan Thiết, giòn rụm và thơm tới mức mèo nhà hàng xóm cũng trèo sang. Gói zip kéo được, mở ra đóng vào không bay mùi khắp phòng.' },
  { id: 2, cat: 'cat', icon: '🧶', name: 'Cuộn len cho mèo Sphynx tự đan áo', price: 32000, old: 40000, sold: 3100, rating: 4.7, from: 'Hà Nội', added: 14,
    desc: 'Len cotton mềm, không xù lông, đủ đan một chiếc áo cho mèo cỡ vừa. Mèo nhà bạn có tự đan được hay không thì shop không dám hứa, nhưng chắc chắn nó sẽ lăn cuộn len khắp nhà.' },
  { id: 3, cat: 'cat', icon: '🛏️', name: 'Ổ nằm sưởi nắng, kèm vệt nắng dùng thử 7 ngày', price: 289000, old: 420000, sold: 860, rating: 4.8, from: 'Đà Lạt', fav: true, added: 20,
    desc: 'Ổ nằm lót bông dày, thành cao vừa đủ để mèo gác cằm ngủ. Đặt cạnh cửa sổ buổi sáng là thành chỗ sưởi nắng chính chủ. Vệt nắng dùng thử chỉ có hiệu lực vào ngày trời quang.' },
  { id: 4, cat: 'cat', icon: '🧴', name: 'Kem dưỡng da cho mèo không lông, hương cá hồi', price: 119000, sold: 540, rating: 4.5, from: 'TP. Hồ Chí Minh', added: 22,
    desc: 'Mèo Sphynx không có lông che nắng nên da rất dễ khô. Kem thấm nhanh, không bết dính, hương cá hồi nhẹ để mèo chịu ngồi yên cho bôi.' },
  { id: 5, cat: 'desk', icon: '⌨️', name: 'Bàn phím cơ gõ lách cách, hàng xóm đánh giá 1 sao', price: 890000, old: 1290000, sold: 2300, rating: 4.8, from: 'Hà Nội', fav: true, added: 9,
    desc: 'Switch xanh kêu lách cách giòn tan, gõ code cảm giác như đang chơi đàn. Có đèn nền bảy màu và kê tay gỗ. Không kèm thư xin lỗi gửi hàng xóm.' },
  { id: 6, cat: 'desk', icon: '🖱️', name: 'Chuột không dây, thỉnh thoảng bị mèo vồ', price: 259000, old: 320000, sold: 4700, rating: 4.6, from: 'Đà Nẵng', added: 11,
    desc: 'Chuột không dây pin dùng ba tháng, bấm êm không kêu. Thiết kế nhỏ gọn nên mèo hay nhầm là đồ chơi; vỏ đã được gia cố chịu được vài cú vồ.' },
  { id: 7, cat: 'desk', icon: '💡', name: 'Đèn bàn ánh vàng, bật lên là thấy mình chăm chỉ', price: 345000, sold: 1500, rating: 4.7, from: 'Hà Nội', added: 6,
    desc: 'Ánh vàng ấm 3000K, chỉnh được ba mức sáng, cần đèn gập được mọi hướng. Hiệu ứng "thấy mình chăm chỉ" rõ nhất sau 11 giờ đêm.' },
  { id: 8, cat: 'desk', icon: '🪑', name: 'Ghế xoay công thái học, xoay ba vòng là quên deadline', price: 2190000, old: 2900000, sold: 310, rating: 4.4, from: 'Bình Dương', added: 17,
    desc: 'Lưng lưới thoáng, tựa đầu và tay vịn chỉnh được, ngả 135 độ để chợp mắt giữa giờ. Bánh xe êm, xoay tròn mượt tới mức dễ quên mất mình đang làm gì.' },
  { id: 9, cat: 'desk', icon: '🗒️', name: 'Giấy note ba màu để chép thơ dán tường', price: 18000, sold: 9800, rating: 4.9, from: 'Hà Nội', added: 2,
    variants: ['Vàng · hồng · bạc hà', 'Toàn màu vàng', 'Toàn màu hồng'],
    desc: 'Ba xấp giấy note vàng, hồng, xanh bạc hà, mỗi xấp 100 tờ. Keo dán chắc, gỡ ra không để lại vết trên tường. Hợp để chép thơ, ghi việc cần làm, hay viết lời nhắn cho người ở chung phòng.' },
  { id: 10, cat: 'plant', icon: '🪴', name: 'Trầu bà leo kệ, lớn nhanh hơn lương', price: 75000, old: 95000, sold: 6200, rating: 4.8, from: 'Sa Đéc', fav: true, added: 8,
    desc: 'Trầu bà lá to, dễ sống, chịu được phòng ít nắng. Tưới mỗi tuần một lần là đủ, lá vươn dài đẹp nhất khi có kệ cho nó leo. Có thể ăn vào kệ sách nếu quên cắt tỉa.' },
  { id: 11, cat: 'plant', icon: '🌵', name: 'Xương rồng mini, quên tưới ba tháng vẫn sống', price: 39000, sold: 15300, rating: 4.9, from: 'Đà Lạt', added: 1,
    desc: 'Xương rồng tí hon trong chậu đất nung, hợp đặt bậu cửa sổ hay góc bàn làm việc. Gần như không cần chăm, chỉ cần nắng và một chút kiên nhẫn.' },
  { id: 12, cat: 'plant', icon: '🚿', name: 'Bình tưới cây phun sương, mèo ghét', price: 54000, old: 70000, sold: 2100, rating: 4.3, from: 'TP. Hồ Chí Minh', added: 13,
    variants: ['500ml', '1 lít'],
    desc: 'Phun sương mịn đều cho lá cây, chỉnh được từ tia sang sương. Tác dụng phụ đã được kiểm chứng: mèo lập tức rời khỏi mặt bàn.' },
  { id: 13, cat: 'coffee', icon: '☕', name: 'Cà phê rang xay, một ngụm là code tới sáng', price: 135000, old: 160000, sold: 8700, rating: 4.9, from: 'Buôn Ma Thuột', fav: true, added: 5,
    desc: 'Robusta Buôn Ma Thuột rang mộc vừa, đắng đậm, hậu ngọt. Pha phin hay pha máy đều ngon. Không chịu trách nhiệm về những dòng code viết lúc 3 giờ sáng.' },
  { id: 14, cat: 'coffee', icon: '🍵', name: 'Trà sen ướp tay, uống xong thấy đời chậm lại', price: 210000, sold: 1900, rating: 4.8, from: 'Hà Nội', added: 15,
    desc: 'Chè Thái Nguyên ướp gạo sen Tây Hồ theo cách làm thủ công, mỗi mẻ ướp năm lần. Hãm nước 85 độ, ngồi bên cửa sổ, nhấp từng ngụm nhỏ.' },
  { id: 15, cat: 'coffee', icon: '🥛', name: 'Cốc sứ có nắp, chống đổ khi mất trọng lực', price: 99000, old: 149000, sold: 3400, rating: 4.6, from: 'Bát Tràng', added: 19,
    variants: ['Trắng men rạn', 'Xanh ngọc', 'Hồng đào'],
    desc: 'Cốc sứ Bát Tràng dung tích 350ml, có nắp đậy và lót silicon chống trượt. Đã thử trên tàu SHOJINLUV-01: cà phê vẫn nằm yên trong cốc.' },
  { id: 16, cat: 'coffee', icon: '🧋', name: 'Trà sữa trân châu, ống hút dài 1 đơn vị thiên văn', price: 42000, sold: 22000, rating: 4.7, from: 'TP. Hồ Chí Minh', added: 4,
    variants: ['Size M', 'Size L', 'Size thiên văn'],
    desc: 'Trà đen ủ lạnh, sữa tươi, trân châu đường đen nấu mỗi sáng. Chỉnh được độ ngọt và lượng đá. Ống hút dài một đơn vị thiên văn chỉ có ở size thiên văn.' },
  { id: 17, cat: 'space', icon: '🚀', name: 'Vé một chiều lên Sao Hỏa, không hoàn không hủy', price: 99000000, old: 150000000, sold: 3, rating: 5.0, from: 'Quỹ đạo thấp', added: 24,
    variants: ['Ghế cửa sổ', 'Ghế cạnh mèo'],
    desc: 'Hành trình khoảng bảy tháng, bao trọn ăn uống bằng ống, kèm một chậu khoai tây để tự trồng khi tới nơi. Vé không hoàn, không hủy, không đổi chiều.' },
  { id: 18, cat: 'space', icon: '🧑‍🚀', name: 'Mũ phi hành gia có tai mèo, size S cho mèo', price: 1450000, old: 1800000, sold: 120, rating: 4.9, from: 'Trạm SHOJINLUV-01', fav: true, added: 23,
    variants: ['Size S', 'Size M'],
    desc: 'Mũ kính cong có hai chỗ riêng cho đôi tai to của mèo Sphynx, viền cam và đèn hiệu nhấp nháy trên đỉnh. Đã được một chú mèo thật đeo ngủ suốt một chuyến bay.' },
  { id: 19, cat: 'space', icon: '🔋', name: 'Tấm pin mặt trời gắn tường, sạc bằng nắng thật', price: 3200000, sold: 450, rating: 4.5, from: 'Ninh Thuận', added: 21,
    desc: 'Tấm pin 200W khung nhôm có bản lề, nằm áp tường khi không dùng và bung ra đón nắng khi cần. Kèm hộp ắc quy có vạch báo mức sạc nhấp nháy rất vui mắt.' },
  { id: 20, cat: 'space', icon: '🔭', name: 'Kính thiên văn ngắm Sao Thổ, nhìn rõ cả vành đai', price: 4750000, old: 5600000, sold: 280, rating: 4.7, from: 'Hà Nội', added: 16,
    desc: 'Kính phản xạ đường kính 130mm, đủ nhìn rõ vành đai Sao Thổ và bốn mặt trăng lớn của Sao Mộc. Kèm chân đế và bản đồ sao in sẵn.' },
  { id: 21, cat: 'space', icon: '🌙', name: 'Đèn ngủ Mặt Trăng, tỉ lệ 1 trên rất nhiều', price: 185000, old: 250000, sold: 5100, rating: 4.6, from: 'Đà Nẵng', added: 10,
    desc: 'Đèn in 3D theo bản đồ bề mặt Mặt Trăng thật, đổi được ánh vàng và ánh trắng, chạm để chỉnh độ sáng. Hợp đặt đầu giường cho những đêm ngủ muộn.' },
  { id: 22, cat: 'book', icon: '📚', name: 'Combo sách lập trình, mua về để đó cho yên tâm', price: 399000, old: 560000, sold: 2700, rating: 4.8, from: 'Hà Nội', added: 7,
    desc: 'Bộ ba cuốn: HTML/CSS cho người mới, JavaScript căn bản, và một cuốn về thuật toán để trên kệ cho đẹp. Giấy dày, chữ to, gáy sách thẳng tắp.' },
  { id: 23, cat: 'book', icon: '🎸', name: 'Đàn guitar gỗ, chủ cũ chỉ biết đánh đúng một bài', price: 1250000, sold: 190, rating: 4.4, from: 'TP. Hồ Chí Minh', added: 12,
    variants: ['Dây sắt', 'Dây nylon'],
    desc: 'Đàn acoustic mặt gỗ thông, âm ấm và vang. Đã được chỉnh dây, tặng kèm bao đàn và capo. Bài duy nhất chủ cũ biết đánh vẫn còn văng vẳng trong thùng đàn.' },
  { id: 24, cat: 'book', icon: '📖', name: 'Tập thơ sáu dòng, đọc xong muốn thở dài', price: 68000, old: 80000, sold: 740, rating: 4.9, from: 'Huế', added: 18,
    desc: 'Tập thơ mỏng in trên giấy dó, mỗi trang một bài sáu dòng. Đọc nhanh hết trong một buổi chiều, nhưng nghĩ thì lâu hơn thế nhiều.' },
];

export const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
export const catName = (id) => (CATS.find((c) => c.id === id) || CATS[0]).name;
export const variantsOf = (p) => p.variants || SHOPS[p.cat].variants;
export const stockOf = (p) => 20 + ((p.id * 37) % 180);

// ---------- Tiện ích hiển thị ----------
export const money = (n) => n.toLocaleString('vi-VN') + '₫';
export const sold = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '').replace('.', ',') + 'k' : String(n));
export const tint = (id, light = 92) => `hsl(${(id * 47) % 360} 70% ${light}%)`; // mỗi món một màu nền riêng
export const discount = (p) => (p.old ? Math.round((1 - p.price / p.old) * 100) : 0);
// Bỏ dấu tiếng Việt để gõ "ca kho" vẫn tìm ra "Cá khô"
export const plain = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
// Chèn chữ vào HTML an toàn (tránh ký tự < > & làm vỡ trang)
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Đánh giá (bịa ra, nhưng lần nào mở trang cũng giống nhau) ----------
const NAMES = ['meo_beo_99', 'trambu.codes', 'chuot.khong.day', 'linh.xuong.rong', 'anh_thuc_khuya', 'hoa.tra.sen', 'pi.ha.lo', 'bong.den.vang', 'nhim_ngu_gat', 'ca.kho.fan', 'sao.tho.xoay', 'gau_trang_9x'];
const COMMON = [
  'Đóng gói cẩn thận, giao nhanh hơn mình nghĩ.',
  'Hàng y như hình, shop tư vấn nhiệt tình. Sẽ ủng hộ tiếp.',
  'Mèo nhà mình kiểm tra chất lượng trước, nó gật gù nên chắc là ổn.',
  'Shipper đi tên lửa thật hay sao mà nhanh dữ vậy.',
  'Giá hơi cao nhưng dùng thích, đáng tiền.',
];
const BY_CAT = {
  cat: ['Mèo nhà mình mê lắm, ngửi thấy là chạy tới liền.', 'Chất lượng ổn, mèo dùng xong còn đòi thêm.'],
  desk: ['Dùng code cả ngày không mỏi, đặt lên bàn nhìn xịn hẳn.', 'Làm việc năng suất hơn hẳn, ít nhất là cảm giác vậy.'],
  plant: ['Cây xanh tốt, về tới nơi vẫn tươi rói.', 'Đặt góc phòng nhìn mát mắt ghê.'],
  coffee: ['Thơm lắm, sáng nào cũng phải có một ly.', 'Uống xong tỉnh như sáo, deadline sợ mình luôn.'],
  space: ['Cảm giác như đang sống trên trạm vũ trụ.', 'Bạn bè tới nhà ai cũng hỏi mua ở đâu.'],
  book: ['Giấy đẹp, chữ dễ đọc, gói hàng có cả lời nhắn viết tay.', 'Đọc tới đâu thấm tới đó.'],
};

function seeded(n) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function reviewsOf(p) {
  const rand = seeded(p.id);
  const count = Math.max(1, Math.round(p.sold * 0.18)); // khoảng một phần năm người mua để lại đánh giá
  const texts = [...BY_CAT[p.cat], ...COMMON];
  const variants = variantsOf(p);
  const list = [];
  const first = Math.floor(rand() * NAMES.length);
  for (let i = 0; i < Math.min(8, count); i++) {
    // Điểm thấp xuất hiện ít hơn nếu sản phẩm được chấm cao
    const r = rand();
    const stars = r < (p.rating - 4) * 0.95 + 0.05 ? 5 : r < 0.93 ? 4 : 3;
    list.push({
      name: NAMES[(first + i * 5) % NAMES.length], // bước 5 trên 12 tên: tám người khác nhau
      stars,
      variant: variants[Math.floor(rand() * variants.length)],
      date: `${1 + Math.floor(rand() * 28)}/${1 + Math.floor(rand() * 10)}/2026`,
      text: rand() < 0.85 ? texts[Math.floor(rand() * texts.length)] : '',
      helpful: Math.floor(rand() * 40),
    });
  }
  list.forEach((r) => { r.base = true; }); // tám đánh giá hiện ở mục "Tất cả"

  // Tỉ lệ số sao cho phần tổng quan, khớp với điểm trung bình của sản phẩm
  const five = Math.min(0.97, Math.max(0.4, (p.rating - 3.6) / 1.4));
  const split = [five, (1 - five) * 0.7, (1 - five) * 0.2, (1 - five) * 0.07, (1 - five) * 0.03];

  // Thêm vài đánh giá ở các mức sao thấp, để bấm lọc "3 Sao", "2 Sao"… không bị trống
  [4, 3, 2, 1].forEach((stars, k) => {
    if (Math.round(count * split[k + 1]) < 1) return;
    const pool = stars === 4 ? texts : LOW[stars];
    for (let j = 0; j < (stars >= 3 ? 2 : 1); j++) {
      list.push({
        name: NAMES[(first + 3 + list.length * 7) % NAMES.length],
        stars,
        variant: variants[Math.floor(rand() * variants.length)],
        date: `${1 + Math.floor(rand() * 28)}/${1 + Math.floor(rand() * 10)}/2026`,
        text: pool[Math.floor(rand() * pool.length)],
        helpful: Math.floor(rand() * 12),
        base: false,
      });
    }
  });
  return { count, list, split };
}

const LOW = {
  3: ['Dùng tạm ổn, nhưng hộp bị mèo cắn mất một góc.', 'Giao hơi chậm so với tên lửa, bù lại hàng tốt.'],
  2: ['Màu ngoài đời hơi khác ảnh, chắc tại đèn phòng mình.', 'Mèo không thèm nhìn tới, chắc tại mèo khó tính.'],
  1: ['Đặt nhầm phân loại, lỗi tại mình chứ không phải shop.', 'Shipper đi lạc sang Sao Hỏa, chờ mãi mới tới.'],
};
