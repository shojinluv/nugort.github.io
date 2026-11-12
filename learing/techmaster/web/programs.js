// programs.js – Danh sách các buổi học, các bài tập, và bản dựng lại từng bài bằng JavaScript.
//
// Mỗi bài có:
//  - files: các file Java (đường dẫn tính từ thư mục java/), file đầu tiên là file chính
//  - entry: dòng lệnh hiện ở đầu terminal (chạy class nào, hay gọi thẳng hàm nào)
//  - run(sys): bản dựng lại. sys có out (System.out), input (utils.Input) và exit (System.exit), xem jvm.js.
//    Câu chữ in ra và cách tính giữ y như bản Java.
//  - note: ghi chú nhỏ hiện phía trên cửa sổ chạy thử (không bắt buộc)
import { pretty } from './jvm.js';

// ---------- Mấy hàm dùng chung (dịch từ code Java) ----------
// Bảng BMI của WHO, các mốc nối liền nhau
function bmiVerdict(v) {
  if (v < 18.5) return 'Gầy';
  if (v < 25) return 'Bình thường';
  if (v < 30) return 'Thừa cân';
  if (v < 35) return 'Béo phì';
  return 'Béo phì nặng';
}
const hypotenuse = (a, b) => Math.sqrt(a * a + b * b);
const zero = (v) => v + 0; // giống "+ 0.0" trong Java: -0 thành 0 để không in ra -0.00

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.trunc(n / i); i++) if (n % i === 0) return false;
  return true;
}

// Chuẩn hoá tên: bỏ khoảng trắng thừa, viết hoa chữ cái đầu mỗi từ, các chữ còn lại viết thường
function normalizeName(name) {
  return name.trim().toLowerCase().split(/\s+/).filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
}

// Hỏi tới khi gõ đúng một số trong khoảng [min, max] (kiểu do { ... } while trong Java)
async function choose(out, input, prompt, min, max) {
  let select;
  do {
    out.print(prompt);
    select = await input.readInt();
  } while (select < min || select > max);
  return select;
}

// ======================================================================
// Buổi 1 (fisrt-day)
// ======================================================================
async function geometry({ out, input }) {
  out.println('1: Tính chỉ số BMI');
  out.println('2: Hình vuông');
  out.println('3: Tam giác');
  out.println('4: Hình tròn');
  out.print('Chọn: ');
  const x = await input.readInt();
  if (x === 1) {
    out.print('Cân nặng (kg): ');
    const weight = await input.readPositive();
    out.print('Chiều cao (m): ');
    const height = await input.readPositive();
    const bmi = weight / (height * height);
    out.printf('Chỉ số BMI: %.2f%n', bmi);
    out.println(`Xếp loại: ${bmiVerdict(bmi)}`);
  } else if (x === 2) {
    out.print('Độ dài cạnh: ');
    const side = await input.readPositive();
    out.printf('Diện tích: %.2f%n', side * side);
    out.printf('Chu vi: %.2f%n', 4 * side);
  } else if (x === 3) {
    out.print('Cạnh a: ');
    const a = await input.readPositive();
    out.print('Cạnh b: ');
    const b = await input.readPositive();
    out.print('Cạnh c: ');
    const c = await input.readPositive();
    if (!(a + b > c && a + c > b && b + c > a)) {
      out.println('Ba cạnh này không ghép được thành tam giác');
      return;
    }
    const p = (a + b + c) / 2; // công thức Heron
    out.printf('Diện tích: %.2f%n', Math.sqrt(p * (p - a) * (p - b) * (p - c)));
    out.printf('Chu vi: %.2f%n', a + b + c);
  } else if (x === 4) {
    out.print('Bán kính: ');
    const r = await input.readPositive();
    out.printf('Diện tích: %.2f%n', Math.PI * r * r);
    out.printf('Chu vi: %.2f%n', 2 * Math.PI * r);
  } else {
    out.println('Không có mục này');
  }
}

// ======================================================================
// Buổi 2 (second-day)
// ======================================================================
async function calculator({ out, input }) {
  out.println('1: Tính chỉ số BMI');
  out.println('2: Tính cạnh huyền');
  out.println('3: Cộng, trừ, nhân, chia, lũy thừa');
  out.println('4: Đổi nhiệt độ (°C ↔ °F)');
  out.print('Chọn: ');
  const x = await input.readInt();
  if (x === 1) {
    out.print('Chiều cao (m): ');
    const height = await input.readPositive();
    out.print('Cân nặng (kg): ');
    const weight = await input.readPositive();
    out.printf('Chỉ số BMI: %.2f%n', weight / (height * height));
  } else if (x === 2) {
    out.print('Cạnh góc vuông thứ nhất: ');
    const a = await input.readPositive();
    out.print('Cạnh góc vuông thứ hai: ');
    const b = await input.readPositive();
    out.printf('Cạnh huyền: %.2f%n', hypotenuse(a, b));
  } else if (x === 3) {
    await basicCalculations({ out, input });
  } else if (x === 4) {
    await temperature({ out, input });
  } else {
    out.println('Không có mục này');
  }
}

async function basicCalculations({ out, input }) {
  out.println('1: Cộng');
  out.println('2: Trừ');
  out.println('3: Nhân');
  out.println('4: Chia');
  out.println('5: Lũy thừa');
  out.print('Chọn phép tính: ');
  const fn = await input.readInt();
  const two = async (first, second) => {
    out.print(first);
    const u = await input.readDouble();
    out.print(second);
    const v = await input.readDouble();
    return [u, v];
  };
  if (fn === 1) {
    const [u, v] = await two('Số thứ nhất: ', 'Số thứ hai: ');
    out.println(`Kết quả: ${pretty(u + v)}`);
  } else if (fn === 2) {
    const [u, v] = await two('Số bị trừ: ', 'Số trừ: ');
    out.println(`Kết quả: ${pretty(u - v)}`);
  } else if (fn === 3) {
    const [u, v] = await two('Thừa số thứ nhất: ', 'Thừa số thứ hai: ');
    out.println(`Kết quả: ${pretty(u * v)}`);
  } else if (fn === 4) {
    const [u, v] = await two('Số bị chia: ', 'Số chia: ');
    out.println(v === 0 ? 'Không chia được cho 0' : `Kết quả: ${pretty(u / v)}`);
  } else if (fn === 5) {
    const [u, v] = await two('Cơ số: ', 'Số mũ: ');
    out.println(`Kết quả: ${pretty(u ** v)}`);
  } else {
    out.println('Không có phép tính này');
  }
}

async function temperature({ out, input }) {
  out.println('1: Độ C sang độ F');
  out.println('2: Độ F sang độ C');
  out.print('Chọn: ');
  const fn = await input.readInt();
  if (fn === 1) {
    out.print('Nhiệt độ (°C): ');
    const c = await input.readDouble();
    out.printf('Bằng %.2f °F%n', c * 1.8 + 32);
  } else if (fn === 2) {
    out.print('Nhiệt độ (°F): ');
    const f = await input.readDouble();
    out.printf('Bằng %.2f °C%n', (f - 32) / 1.8);
  } else {
    out.println('Không có mục này');
  }
}

// ======================================================================
// Buổi 2 làm thêm (another_second_day)
// ======================================================================
async function sideInput({ out, input }) {
  out.print('Cạnh góc vuông thứ nhất: ');
  const a = await input.readPositive();
  out.print('Cạnh góc vuông thứ hai: ');
  const b = await input.readPositive();
  out.printf('Cạnh huyền: %.2f%n', hypotenuse(a, b));
}

async function stringCompare({ out, input }) {
  out.print('Chuỗi thứ nhất: ');
  const first = await input.readLine();
  out.print('Chuỗi thứ hai: ');
  const second = await input.readLine();
  out.println(first === second ? 'Hai chuỗi giống hệt nhau' : 'Hai chuỗi khác nhau');
  if (first.length > second.length) out.println('Chuỗi thứ nhất dài hơn');
  else if (first.length < second.length) out.println('Chuỗi thứ nhất ngắn hơn');
  else out.println('Hai chuỗi dài bằng nhau');
  out.println(first.includes(second) ? 'Chuỗi thứ nhất có chứa chuỗi thứ hai' : 'Chuỗi thứ nhất không chứa chuỗi thứ hai');
}

async function guessNumber({ out, input }) {
  const number = Math.trunc(Math.random() * 1099);
  let tries = 0;
  out.println('Mình đang nghĩ một số từ 0 tới 1098, đoán thử xem!');
  for (;;) {
    out.print('Bạn đoán: ');
    const guess = await input.readInt();
    tries++;
    if (guess < number) out.println('Số cần tìm lớn hơn ⬆');
    else if (guess > number) out.println('Số cần tìm nhỏ hơn ⬇');
    else {
      out.println(`Đúng rồi! Là số ${number}, bạn đoán ${tries} lần 🎉`);
      return;
    }
  }
}

async function circusMenu(sys) {
  const { out, input } = sys;
  for (;;) {
    out.println();
    out.println('1: Tính cạnh huyền');
    out.println('2: So sánh hai chuỗi');
    out.println('3: Đoán số');
    out.println('4: Thoát');
    const select = await choose(out, input, 'Chọn (1-4): ', 1, 4);
    if (select === 1) await sideInput(sys);
    else if (select === 2) await stringCompare(sys);
    else if (select === 3) await guessNumber(sys);
    else {
      out.println('Tạm biệt!');
      return;
    }
  }
}

// ======================================================================
// Buổi 3 (third-day)
// ======================================================================
// Không phân biệt hoa thường: so từng ký tự (đơn vị UTF-16) sau khi viết thường, như Character.toLowerCase
const lower = (ch) => (ch.toLowerCase().length === 1 ? ch.toLowerCase() : ch);

async function countCharacter({ out, input }) {
  out.print('Nhập một câu: ');
  const sentence = await input.readNonEmpty();
  out.print('Chữ cần đếm: ');
  const character = await input.readChar();
  const target = lower(character);
  let count = 0;
  for (let i = 0; i < sentence.length; i++) if (lower(sentence[i]) === target) count++;
  out.println(`Chữ "${character}" xuất hiện ${count} lần`);
}

async function palindrome({ out, input }) {
  out.print('Nhập chuỗi cần kiểm tra: ');
  const text = await input.readNonEmpty();
  const cleaned = text.replaceAll(' ', '').toLowerCase();
  const reversed = [...cleaned].reverse().join(''); // như StringBuilder.reverse(): giữ nguyên emoji
  out.printf(cleaned === reversed ? '"%s" là chuỗi đối xứng%n' : '"%s" không phải chuỗi đối xứng%n', text);
}

async function bmiWithVerdict({ out, input }) {
  out.print('Cân nặng (kg): ');
  const weight = await input.readPositive();
  out.print('Chiều cao (m): ');
  const height = await input.readPositive();
  const bmi = weight / (height * height);
  out.printf('Chỉ số BMI: %.2f%n', bmi);
  out.println(`Xếp loại: ${bmiVerdict(bmi)}`);
}

async function fizzbuzz({ out, input }) {
  out.print('Đếm từ 1 tới số mấy (1-1000)? ');
  const n = await input.readIntBetween(1, 1000);
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) out.println('FIZZBUZZ');
    else if (i % 3 === 0) out.println('FIZZ');
    else if (i % 5 === 0) out.println('BUZZ');
    else out.println(i);
  }
}

async function quadratic({ out, input }) {
  out.println('Giải phương trình ax² + bx + c = 0');
  out.print('a = ');
  const a = await input.readDouble();
  out.print('b = ');
  const b = await input.readDouble();
  out.print('c = ');
  const c = await input.readDouble();
  if (a === 0) {
    if (b === 0) out.println(c === 0 ? 'Phương trình có vô số nghiệm' : 'Phương trình vô nghiệm');
    else out.printf('Đây là phương trình bậc nhất, nghiệm x = %.2f%n', zero(-c / b));
    return;
  }
  const delta = b * b - 4 * a * c;
  if (delta < 0) {
    out.println('Delta < 0: phương trình vô nghiệm');
  } else if (delta === 0) {
    out.printf('Delta = 0: nghiệm kép x1 = x2 = %.2f%n', zero(-b / (2 * a)));
  } else {
    const root = Math.sqrt(delta);
    out.printf('Delta > 0: hai nghiệm x1 = %.2f, x2 = %.2f%n', zero((-b + root) / (2 * a)), zero((-b - root) / (2 * a)));
  }
}

async function login({ out, input }) {
  const MAX_TRIES = 3;
  for (let i = 1; i <= MAX_TRIES; i++) {
    out.print('Tên đăng nhập: ');
    const username = (await input.readLine()).trim();
    out.print('Mật khẩu: ');
    const password = await input.readLine();
    if (username === 'admin' && password === '123456') {
      out.println(`Chào mừng ${username} quay lại 🎉`);
      return;
    }
    const left = MAX_TRIES - i;
    if (left > 0) out.println(`Sai tên đăng nhập hoặc mật khẩu, còn ${left} lần thử`);
  }
  out.println(`Sai quá ${MAX_TRIES} lần, tạm khoá đăng nhập 🔒`);
}

// ======================================================================
// Buổi 4 (fourth-day)
// ======================================================================
async function displayName({ out, input }) {
  let select;
  do {
    out.print('Nhập họ tên: ');
    let name = normalizeName(await input.readLine());
    while (name === '') {
      out.print('Tên không được để trống, nhập lại: ');
      name = normalizeName(await input.readLine());
    }
    out.println(`Tên đã chuẩn hoá: ${name}`);
    select = await choose(out, input, 'Nhập tên khác? (1: có, 2: không): ', 1, 2);
  } while (select === 1);
}

async function evenPlusOne({ out, input }) {
  const printArray = (array) => {
    for (const v of array) out.print(`${v} `);
    out.println();
  };
  let select;
  do {
    const n = await choose(out, input, 'Mảng có bao nhiêu phần tử (1-100)? ', 1, 100);
    const array = [];
    for (let i = 0; i < n; i++) {
      out.print(`Phần tử thứ ${i + 1}: `);
      array.push(await input.readInt());
    }
    out.print('Mảng ban đầu: ');
    printArray(array);
    for (let i = 0; i < n; i++) if (array[i] % 2 === 0) array[i] += 1;
    out.print('Sau khi cộng 1 vào các số chẵn: ');
    printArray(array);
    select = await choose(out, input, 'Làm lại? (1: có, 2: không): ', 1, 2);
  } while (select === 1);
}

async function homeworkMenu(sys) {
  const { out, input } = sys;
  for (;;) {
    out.println();
    out.println('1: Chuẩn hoá tên');
    out.println('2: Cộng 1 vào các số chẵn trong mảng');
    out.println('3: Thoát');
    const select = await choose(out, input, 'Chọn (1-3): ', 1, 3);
    if (select === 1) await displayName(sys);
    else if (select === 2) await evenPlusOne(sys);
    else {
      out.println('Tạm biệt!');
      return;
    }
  }
}

async function minMax({ out, input }) {
  out.print('Mảng có bao nhiêu phần tử (1-100)? ');
  const n = await input.readIntBetween(1, 100);
  const numbers = [];
  for (let i = 0; i < n; i++) {
    out.print(`Phần tử thứ ${i + 1}: `);
    numbers.push(await input.readInt());
  }
  out.println(`Nhỏ nhất: ${Math.min(...numbers)}`);
  out.println(`Lớn nhất: ${Math.max(...numbers)}`);
}

// ======================================================================
// Bài kiểm tra (test)
// ======================================================================
async function starTriangle({ out, input }) {
  out.print('Chiều cao tam giác: ');
  let height = await input.readInt();
  while (height < 1) {
    out.print('Chiều cao phải từ 1 trở lên, nhập lại: ');
    height = await input.readInt();
  }
  for (let i = 1; i <= height; i++) {
    for (let j = 1; j <= i; j++) out.print('* ');
    out.println();
  }
}

async function countWords({ out, input }) {
  out.print('Nhập một câu: ');
  const sentence = await input.readNonEmpty();
  let count = 0;
  let notCounted = true;
  for (let i = 0; i < sentence.length; i++) {
    const ch = sentence[i];
    if (ch !== ' ' && ch !== '\t' && ch !== '\n') {
      if (notCounted) { count++; notCounted = false; }
    } else {
      notCounted = true;
    }
  }
  out.println(`Số từ: ${count}`);
  out.print('Chữ cần tìm: ');
  const character = await input.readChar();
  const target = lower(character);
  const positions = [];
  for (let i = 0; i < sentence.length; i++) if (lower(sentence[i]) === target) positions.push(i + 1);
  if (positions.length === 0) out.println(`Chữ "${character}" không xuất hiện lần nào`);
  else out.println(`Chữ "${character}" xuất hiện ${positions.length} lần, ở vị trí thứ: ${positions.join(' ')}`);
}

async function checkPrime({ out, input }) {
  out.print('Nhập số cần kiểm tra: ');
  const n = await input.readInt();
  out.println(isPrime(n) ? `${n} là số nguyên tố` : `${n} không phải số nguyên tố`);
}

async function firstPrimes({ out, input }) {
  out.print('Muốn liệt kê bao nhiêu số nguyên tố (1-1000)? ');
  const n = await input.readIntBetween(1, 1000);
  let count = 0;
  out.print(`${n} số nguyên tố đầu tiên: `);
  for (let number = 2; count < n; number++) {
    if (isPrime(number)) {
      out.print(`${number} `);
      count++;
    }
  }
  out.println();
}

async function diagonal({ out, input }) {
  out.print('Số hàng (1-10): ');
  const row = await input.readIntBetween(1, 10);
  out.print('Số cột (1-10): ');
  const column = await input.readIntBetween(1, 10);
  const array = [];
  for (let i = 0; i < row; i++) {
    array.push([]);
    for (let j = 0; j < column; j++) {
      out.print(`Phần tử [${i}][${j}]: `);
      array[i].push(await input.readInt());
    }
  }
  out.println('Ma trận vừa nhập:');
  for (const line of array) {
    for (const v of line) out.print(`${v} `);
    out.println();
  }
  out.print('Đường chéo chính: ');
  for (let i = 0; i < Math.min(row, column); i++) out.print(`${array[i][i]} `);
  out.println();
}

// ======================================================================
// Danh sách các buổi học
// ======================================================================
export const days = [
  {
    id: 'buoi-1',
    label: 'Buổi 1',
    folder: 'fisrt-day',
    hue: '#ef6f5c',
    summary: 'Làm quen nhập xuất, rẽ nhánh và tách các phép tính ra từng class riêng.',
    lessons: [
      {
        id: 'hinh-hoc',
        icon: '📐',
        title: 'Hình học và BMI',
        desc: 'Tính chỉ số BMI, hoặc chu vi và diện tích hình vuông, tam giác (công thức Heron), hình tròn.',
        tags: ['switch', 'printf', 'Math.PI'],
        entry: 'java main',
        files: [
          'fisrt-day/src/main.java',
          'fisrt-day/src/basic_geometries_bmi_calc/BMI_values.java',
          'fisrt-day/src/basic_geometries_bmi_calc/square.java',
          'fisrt-day/src/basic_geometries_bmi_calc/triangle.java',
          'fisrt-day/src/basic_geometries_bmi_calc/circle.java',
          'fisrt-day/src/utils/Input.java',
        ],
        run: geometry,
      },
    ],
  },
  {
    id: 'buoi-2',
    label: 'Buổi 2',
    folder: 'second-day',
    hue: '#f0965a',
    summary: 'Một chiếc máy tính nhiều chức năng, chọn món bằng switch/case.',
    lessons: [
      {
        id: 'may-tinh',
        icon: '🧮',
        title: 'Máy tính bỏ túi',
        desc: 'Tính BMI, cạnh huyền, cộng trừ nhân chia, lũy thừa và đổi độ C ↔ độ F.',
        tags: ['switch', 'double', 'Math.pow'],
        entry: 'java main',
        files: [
          'second-day/src/main.java',
          'second-day/src/basic_calc/basic_calculations.java',
          'second-day/src/basic_calc/bmi_calc.java',
          'second-day/src/basic_calc/convert_temperature.java',
          'second-day/src/basic_calc/hypotenuse_calc.java',
          'second-day/src/utils/Input.java',
        ],
        run: calculator,
      },
    ],
  },
  {
    id: 'buoi-2-them',
    label: 'Buổi 2 · làm thêm',
    folder: 'another_second_day',
    hue: '#d9a92b',
    summary: 'Gom bài vào một menu vòng lặp, chỉ dừng khi chọn thoát.',
    lessons: [
      {
        id: 'ganh-xiec',
        icon: '🎪',
        title: 'Gánh xiếc 4.0',
        desc: 'Ba trò trong một menu: tính cạnh huyền, so sánh hai chuỗi, và đoán số từ 0 tới 1098 có gợi ý lớn hơn hay nhỏ hơn.',
        tags: ['for (;;)', 'do/while', 'String'],
        entry: 'java Main',
        files: [
          'another_second_day/src/Main.java',
          'another_second_day/src/Exercises/Four_dot_0_circus_menu.java',
          'another_second_day/src/Exercises/Exercise_1.java',
          'another_second_day/src/Exercises/Exercise_2.java',
          'another_second_day/src/Exercises/Exercise_3.java',
          'another_second_day/src/utils/Input.java',
        ],
        run: circusMenu,
      },
    ],
  },
  {
    id: 'buoi-3',
    label: 'Buổi 3',
    folder: 'third-day',
    hue: '#5fb49c',
    summary: 'Vòng lặp for, xử lý chuỗi và viết hàm. main.java là menu gọi được cả sáu bài.',
    lessons: [
      {
        id: 'dem-chu-e',
        icon: '🔤',
        title: 'Đếm một chữ trong câu',
        desc: 'Gõ một câu và một chữ, chương trình đếm xem chữ đó xuất hiện mấy lần (không phân biệt hoa thường).',
        tags: ['for', 'charAt'],
        entry: 'Exercise_1.count_character()',
        files: ['third-day/src/functions/Exercise_1.java', 'third-day/src/main.java', 'third-day/src/utils/Input.java'],
        run: countCharacter,
      },
      {
        id: 'doi-xung',
        icon: '🪞',
        title: 'Chuỗi đối xứng',
        desc: 'Gõ một chuỗi xem có đọc xuôi ngược như nhau không, bỏ qua khoảng trắng và hoa thường. Thử “Kayak” hay “nurses run” xem.',
        tags: ['StringBuilder', 'reverse'],
        entry: 'Exercise_2.palindrome_check()',
        files: ['third-day/src/functions/Exercise_2.java', 'third-day/src/main.java', 'third-day/src/utils/Input.java'],
        run: palindrome,
      },
      {
        id: 'bmi-phan',
        icon: '⚖️',
        title: 'BMI kèm xếp loại',
        desc: 'Nhập cân nặng, chiều cao, in chỉ số BMI rồi xếp loại từ gầy tới béo phì theo bảng của WHO.',
        tags: ['printf', 'double'],
        entry: 'BMI_calc.input()',
        files: ['third-day/src/functions/BMI_calc.java', 'third-day/src/utils/Input.java'],
        run: bmiWithVerdict,
      },
      {
        id: 'fizzbuzz',
        icon: '🫧',
        title: 'FizzBuzz',
        desc: 'Đếm từ 1 tới số bạn chọn: chia hết cho 3 in FIZZ, cho 5 in BUZZ, cho cả hai in FIZZBUZZ.',
        tags: ['for', '%'],
        entry: 'Fizzbuzz.fizzbuzz()',
        files: ['third-day/src/functions/Fizzbuzz.java', 'third-day/src/utils/Input.java'],
        run: fizzbuzz,
      },
      {
        id: 'bac-hai',
        icon: '📈',
        title: 'Phương trình bậc 2',
        desc: 'Nhập a, b, c của ax² + bx + c = 0, tính delta rồi in nghiệm. a = 0 thì giải như phương trình bậc nhất.',
        tags: ['Math.sqrt', 'if/else'],
        entry: 'Quadratic_solve.solve()',
        files: ['third-day/src/functions/Quadratic_solve.java', 'third-day/src/utils/Input.java'],
        run: quadratic,
      },
      {
        id: 'dang-nhap',
        icon: '🔐',
        title: 'Đăng nhập',
        desc: 'Nhập tên đăng nhập và mật khẩu, sai quá 3 lần là bị khoá. Tài khoản thử: admin / 123456.',
        tags: ['final', 'equals'],
        entry: 'F__king_sh_t_login.check_info()',
        files: ['third-day/src/functions/F__king_sh_t_login.java', 'third-day/src/utils/Input.java'],
        run: login,
      },
    ],
  },
  {
    id: 'buoi-4',
    label: 'Buổi 4',
    folder: 'fourth-day',
    hue: '#5b9bd5',
    summary: 'Mảng, chuẩn hoá chuỗi, và vòng lặp do/while để hỏi có làm lại không.',
    lessons: [
      {
        id: 'menu-buoi-4',
        icon: '🗂️',
        title: 'Menu bài về nhà',
        desc: 'Chọn bài chuẩn hoá tên, bài mảng hoặc thoát. Làm xong mỗi bài lại hỏi có muốn làm lại không.',
        tags: ['for (;;)', 'switch'],
        entry: 'java main',
        files: [
          'fourth-day/src/main.java',
          'fourth-day/src/Home_Work/Chmua_Hme_Menu.java',
          'fourth-day/src/Home_Work/Exercise_1.java',
          'fourth-day/src/Home_Work/Exercise_2.java',
          'fourth-day/src/utils/Input.java',
        ],
        run: homeworkMenu,
      },
      {
        id: 'viet-hoa',
        icon: '✍️',
        title: 'Chuẩn hoá tên',
        desc: 'Gõ tên kiểu “  nGUYỄN   văn  an ”, chương trình bỏ khoảng trắng thừa và viết hoa chữ cái đầu mỗi từ.',
        tags: ['split', 'StringBuilder'],
        entry: 'Exercise_1.display_name()',
        files: ['fourth-day/src/Home_Work/Exercise_1.java', 'fourth-day/src/utils/Input.java'],
        run: displayName,
      },
      {
        id: 'so-chan',
        icon: '➕',
        title: 'Số chẵn thêm 1',
        desc: 'Nhập một mảng số nguyên, số nào chẵn thì cộng thêm 1. Trong code còn có dòng cãi nhẹ cô giáo về đề bài 😆',
        tags: ['int[]', '%'],
        entry: 'Exercise_2.another_array()',
        files: ['fourth-day/src/Home_Work/Exercise_2.java', 'fourth-day/src/utils/Input.java'],
        run: evenPlusOne,
      },
      {
        id: 'min-max',
        icon: '🔍',
        title: 'Tìm min, max',
        desc: 'Bài làm trên lớp: nhập một mảng số nguyên, tìm số nhỏ nhất và lớn nhất bằng một vòng lặp.',
        tags: ['int[]', 'on lab'],
        entry: 'Array_test.Min_Max()',
        files: ['fourth-day/src/On_Lab/Array_test.java', 'fourth-day/src/utils/Input.java'],
        run: minMax,
      },
    ],
  },
  {
    id: 'buoi-5',
    label: 'Buổi 5',
    folder: 'fifth-day',
    hue: '#9b7fd1',
    summary: 'Làm quen JavaFX và Maven: dựng giao diện bằng file FXML.',
    lessons: [
      {
        id: 'super-idol',
        icon: '🌟',
        title: 'Mạng xã hội Super Idol',
        desc: 'Màn hình đăng nhập JavaFX: ô tên đăng nhập, ô mật khẩu, quên mật khẩu và hai nút bấm. Tài khoản thử: admin / 123456.',
        tags: ['JavaFX', 'FXML', 'Maven'],
        entry: 'mvn javafx:run',
        files: [
          'fifth-day/src/main/resources/com/example/fifthday/hello-view.fxml',
          'fifth-day/src/main/java/com/example/fifthday/HelloController.java',
          'fifth-day/src/main/java/com/example/fifthday/HelloApplication.java',
          'fifth-day/src/main/java/module-info.java',
          'fifth-day/pom.xml',
        ],
        fx: true, // không có terminal, thay bằng hình cửa sổ dựng lại từ file FXML
        note: 'Đây là cửa sổ dựng lại từ file FXML, các nút làm đúng như HelloController. Không gửi gì đi đâu cả, thử bằng admin / 123456.',
      },
    ],
  },
  {
    id: 'kiem-tra',
    label: 'Bài kiểm tra',
    folder: 'test',
    hue: '#e07a9f',
    summary: 'Năm câu kiểm tra cuối đợt (câu 6 để trống). Main.java là menu chọn câu.',
    lessons: [
      {
        id: 'tam-giac',
        icon: '⭐',
        title: 'Tam giác sao',
        desc: 'Nhập chiều cao, in một tam giác vuông xếp bằng dấu sao.',
        tags: ['for lồng for'],
        entry: 'Exercise_1.triangle()',
        files: ['test/src/java_test/Exercise_1.java', 'test/src/Main.java', 'test/src/utils/Input.java'],
        run: starTriangle,
      },
      {
        id: 'dem-tu',
        icon: '📝',
        title: 'Đếm từ, tìm chữ',
        desc: 'Gõ một câu, chương trình đếm số từ, rồi tìm một chữ: xuất hiện mấy lần, ở những vị trí nào.',
        tags: ['char', 'StringBuilder'],
        entry: 'Exercise_2.count_words()',
        files: ['test/src/java_test/Exercise_2.java', 'test/src/utils/Input.java'],
        run: countWords,
      },
      {
        id: 'nguyen-to',
        icon: '🧪',
        title: 'Kiểm tra số nguyên tố',
        desc: 'Nhập một số, xem có phải số nguyên tố không bằng cách chia thử tới căn bậc hai.',
        tags: ['boolean', 'static'],
        entry: 'Exercise_3.check_prime()',
        files: ['test/src/java_test/Exercise_3.java', 'test/src/utils/Input.java'],
        run: checkPrime,
      },
      {
        id: 'muoi-so',
        icon: '🔢',
        title: 'Liệt kê số nguyên tố',
        desc: 'Chọn muốn bao nhiêu số, in ra từng ấy số nguyên tố đầu tiên, dùng lại hàm is_prime của câu 3.',
        tags: ['for', 'static'],
        entry: 'Exercise_4.list_prime_number()',
        files: ['test/src/java_test/Exercise_4.java', 'test/src/java_test/Exercise_3.java', 'test/src/utils/Input.java'],
        run: firstPrimes,
      },
      {
        id: 'duong-cheo',
        icon: '▦',
        title: 'Đường chéo ma trận',
        desc: 'Nhập số hàng, số cột (1 tới 10) và từng phần tử, rồi in ma trận cùng các phần tử trên đường chéo chính.',
        tags: ['int[][]'],
        entry: 'Exercise_5.two_d_array()',
        files: ['test/src/java_test/Exercise_5.java', 'test/src/Main.java', 'test/src/utils/Input.java'],
        run: diagonal,
      },
    ],
  },
];
