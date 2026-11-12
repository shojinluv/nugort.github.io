// programs.js – Danh sách các buổi học, các bài tập, và bản dựng lại từng bài bằng JavaScript.
//
// Mỗi bài có:
//  - files: các file Java gốc (đường dẫn tính từ thư mục java/), file đầu tiên là file chính
//  - entry: dòng lệnh hiện ở đầu terminal (chạy class nào, hay gọi thẳng hàm nào)
//  - run(sys): bản dựng lại. sys có out (System.out), Scanner và exit (System.exit), xem jvm.js.
//    Câu chữ in ra, cách tính kiểu float/double và cả mấy chỗ ngô nghê đều giữ y như bản Java.
//  - note: ghi chú nhỏ hiện phía trên cửa sổ chạy thử (không bắt buộc)
//  - unfinished: bài làm dở
import { fround, F, D, JavaException } from './jvm.js';

// ---------- Mấy hàm dùng chung (dịch từ code Java) ----------
function bmiVerdict(v) {
  if (v < 18.5) return "You're underweight !";
  if (v >= 18.5 && v < 24.9) return "You're normal";
  if (v >= 25 && v < 29.9) return "You're overweight";
  if (v >= 30 && v < 34.9) return "You're obese";
  return "You're extremely obese";
}
// Mọi phép tính trên float đều làm tròn về 32 bit ngay sau mỗi bước, như Java
const hypotenuse = (a, b) => fround(Math.sqrt(fround(fround(a * a) + fround(b * b))));
const isLetter = (ch) => /\p{L}/u.test(ch);

// ======================================================================
// Buổi 1 (fisrt-day)
// ======================================================================
async function geometry({ out, Scanner }) {
  const scan = new Scanner();
  out.println('Choose   your option');
  out.println('7: BMI value');
  out.println('0: Square basic calc');
  out.println('1: Triangle basic calc');
  out.println('3: Circle basic calc');
  const x = await scan.nextInt();
  if (x === 7) {
    out.println("You're chose 7");
    out.println('Plz enter your weigh (kg)');
    const weigh = await scan.nextDouble();
    out.println(' Plz enter your height (m)');
    const height = await scan.nextDouble();
    const bmi = weigh / (height * height);
    out.println(`Your BMI value is ${D(bmi)}`);
    out.println(bmiVerdict(bmi));
  } else if (x === 0) {
    out.println("You're chose 0, ");
    out.println('Plz enter square length side');
    const side = await scan.nextFloat();
    out.println(`Your square acreage is: ${F(fround(side * side))}`);
    out.println(`Your square perimeter is: ${F(fround(4 * side))}`);
  } else if (x === 1) {
    out.println("You're chose 1");
    out.println('Plz enter triangle a-side length');
    const a = await scan.nextFloat();
    out.println('Plz enter triangle b-side length');
    const b = await scan.nextFloat();
    out.println('Plz enter triangle c-side length');
    const c = await scan.nextFloat();
    // Công thức Heron: nửa chu vi p, diện tích = căn(p(p-a)(p-b)(p-c))
    const p = fround(fround(fround(a + b) + c) / 2);
    const product = fround(fround(fround(p * fround(p - a)) * fround(p - b)) * fround(p - c));
    out.println(`Your triangle acreage is: ${F(fround(Math.sqrt(product)))}`);
    out.println(`Your triangle perimeter is: ${F(fround(fround(a + b) + c))}`);
  } else if (x === 3) {
    out.println("You're chose 3");
    out.println('Plz enter circle radius');
    const r = await scan.nextFloat();
    const PI = fround(3.14);
    out.println(`Your circle acreage is: ${F(fround(fround(PI * r) * r))}`);
    out.println(`Your circle perimeter is: ${F(fround(fround(2 * PI) * r))}`);
  } else {
    out.println("Rll! - Just 3.1.0.7 or exit, my friend 💔");
  }
}

// ======================================================================
// Buổi 2 (second-day)
// ======================================================================
async function calculator({ out, Scanner }) {
  const scan = new Scanner();
  out.println('Select your option');
  out.println('3: BMI value ');
  out.println('1: Hypotenuse ');
  out.println('0: Basic calculations ');
  out.println('7: Convert temperature (Celsius to Fahrenheit, else) ');
  const x = await scan.nextInt();
  if (x === 3) {
    out.println("BMI value again ? K, let's get it");
    out.println('Enter your height (m) ');
    const height = await scan.nextFloat();
    out.println('Last step, enter your weight ');
    const weigh = await scan.nextFloat();
    // Hàm tính bằng float nhưng trả về double, nên in ra cả đống chữ số lẻ
    out.println(`Is this what you expected ? ${D(fround(weigh / fround(height * height)))}`);
  } else if (x === 1) {
    out.println("Yeh yeh, you're selected new option and I like it :3 ");
    out.println('Right now, enter any side length');
    const a = await scan.nextFloat();
    out.println('and rest side length ');
    const b = await scan.nextFloat();
    out.println(`It's time to look at ${F(hypotenuse(a, b))}`);
  } else if (x === 0) {
    out.println('Ez, select any function');
    out.println('1: Addition');
    out.println('2: Subtraction');
    out.println('3: Multiplication');
    out.println('4: Division');
    out.println('5: Power');
    const fn = await scan.nextInt();
    const two = async (first, second) => {
      out.print(first);
      const u = await scan.nextDouble();
      out.print(second);
      const v = await scan.nextDouble();
      return [u, v];
    };
    if (fn === 1) {
      out.println("Yes, it's addition");
      const [u, v] = await two('Value: ', 'Value, too: ');
      out.println(`Take result: ${D(u + v)}`);
    } else if (fn === 2) {
      out.println("K, let's sub");
      const [u, v] = await two('Minuend: ', 'Subtrahend: ');
      out.println(`Is it ? ... ${D(u - v)}`);
    } else if (fn === 3) {
      out.println("Let's try to multiplying");
      const [u, v] = await two('Multiplicand: ', 'Multiplier: ');
      out.println(`${D(u * v)}. Hmm, not bad`);
    } else if (fn === 4) {
      out.println('Welcome, division');
      const [u, v] = await two('Dividend: ', 'Divisor: ');
      out.println(`${D(u / v)}, done`);
    } else if (fn === 5) {
      out.println("Thanks god, you're here");
      const [u, v] = await two('Base: ', 'Exponent: ');
      out.println(`Maybe ... ${D(u ** v)} =)))`);
    } else {
      out.println('Option unavailable, bye');
    }
  } else if (x === 7) {
    out.println("That's right, this temperature conversion");
    out.println('1: Celsius to Fahrenheit');
    out.println('2: Fahrenheit to Celsius');
    const fn = await scan.nextInt();
    if (fn === 1) {
      out.println('Celsius to Fahrenheit');
      out.print('Celsius: ');
      const c = await scan.nextFloat();
      out.println(`Fahrenheit: ${F(fround(c * 1.8 + 32))}`);
    } else if (fn === 2) {
      out.println('Fahrenheit to Celsius');
      out.print('Fahrenheit: ');
      const f = await scan.nextFloat();
      out.println(`Celsius: ${F(fround(fround(f - 32) / 1.8))}`);
    } else {
      out.println('Unavailable, reselect !');
    }
  } else {
    out.println("You're broke my heart ... cya");
  }
}

// ======================================================================
// Buổi 2 làm thêm (another_second_day)
// ======================================================================
async function sideInput({ out, Scanner }) {
  const scanner = new Scanner();
  out.println('Input a side length');
  const a = await scanner.nextFloat();
  out.println('Input rest length');
  const b = await scanner.nextFloat();
  out.printf('Hypotenuse length: %.2f', hypotenuse(a, b));
}

async function stringCompare({ out, Scanner }) {
  const scanner = new Scanner();
  out.println('\nInput first string');
  const first = await scanner.nextLine();
  out.println('Rest string');
  const rest = await scanner.nextLine();
  out.println(first === rest ? 'Strings are same' : 'Strings not same');
  out.println(first.length > rest.length ? 'The first string is longer' : 'The first string is shorter');
  out.println(first.includes(rest) ? 'The first contain the rest string' : "The first doesn't contains the rest string");
}

async function randomNumber({ out, Scanner }) {
  const scanner = new Scanner();
  const random = fround(Math.random());
  const number = Math.trunc(fround(random * 1099));
  out.println('Input your any number');
  const input = await scanner.nextInt();
  out.println(`Random number: ${number}`);
  out.println(number === input ? 'Numbers are equal' : 'Numbers not equal');
}

async function circusMenu(sys) {
  const { out, Scanner, exit } = sys;
  const scanner = new Scanner();
  for (;;) {
    out.println('\n');
    out.println('1: Hypotenuse length calc');
    out.println('2: Basic string manipulation');
    out.println('3: Basic random number manipulation');
    out.println('4: Quit');
    let select;
    do {
      out.println('1 2 3 or quail 😢');
      out.print('Your select: ');
      select = await scanner.nextInt();
    } while (select < 1 || select > 4);
    if (select === 1) await sideInput(sys);
    else if (select === 2) await stringCompare(sys);
    else if (select === 3) await randomNumber(sys);
    else {
      out.println("Really ? You're chose quail. cya");
      exit(0);
    }
  }
}

// ======================================================================
// Buổi 3 (third-day)
// ======================================================================
async function countE({ out }) {
  const text = 'Hello everyone';
  let count = 0;
  for (const ch of text) if (ch === 'e') count++;
  out.println(`Appearance of e in ${text}: ${count}`);
}

async function palindrome({ out, Scanner }) {
  const scanner = new Scanner();
  out.println('Input string you want to check');
  const input = await scanner.nextLine();
  let reverse = '';
  for (let i = input.length - 1; i >= 0; i--) reverse += input[i];
  out.printf(input === reverse ? '%s is a palindrome' : "%s isn't a palindrome", input);
}

async function bmiWithVerdict({ out, Scanner }) {
  const scanner = new Scanner();
  out.println('Input your weigh');
  const weigh = await scanner.nextFloat();
  out.println('Input your height');
  const height = await scanner.nextFloat();
  const bmi = fround(weigh / fround(height * height));
  out.printf('Your BMI value: %f', bmi);
  out.println(bmiVerdict(bmi));
}

async function fizzbuzz({ out }) {
  for (let i = 0; i <= 100; i++) {
    if (i % 3 === 0) out.println(i % 5 === 0 ? 'FIZZBUZZ' : 'FIZZ');
    else if (i % 5 === 0) out.println('BUZZ');
    else out.println(i);
  }
}

async function quadratic({ out, Scanner }) {
  const scanner = new Scanner();
  out.println('It time to solve any quadratic: ax^2 + bx + c');
  out.println('a value');
  const a = await scanner.nextFloat();
  out.println('b value');
  const b = await scanner.nextFloat();
  out.println('c value');
  const c = await scanner.nextFloat();
  const delta = fround(b ** 4 - fround(fround(4 * a) * c)); // b mũ 4, giữ y như bản gốc
  // Cả ba nhánh delta = 0, > 0, < 0 đều chỉ in một dòng trống
  if (delta === 0) out.println();
  else out.println('');
}

async function login({ out }) {
  out.println('null');
}

// ======================================================================
// Buổi 4 (fourth-day)
// ======================================================================
async function displayName(sys) {
  const { out, Scanner } = sys;
  const scanner = new Scanner();
  out.println('Input your name: ');
  const chars = (await scanner.nextLine()).split('');
  let foundSpace = true;
  for (let i = 0; i < chars.length; i++) {
    if (isLetter(chars[i])) {
      if (foundSpace) {
        const upper = chars[i].toUpperCase();
        if (upper.length === 1) chars[i] = upper;
        foundSpace = false;
      }
    } else {
      foundSpace = true;
    }
  }
  out.println(`Your name: ${chars.join('')}\n`);
  out.println('Once again my friend 😢');
  let select;
  do {
    out.println('Select 1 to continue');
    out.println('Select 2 to end');
    select = await scanner.nextInt();
  } while (select < 1 || select > 2);
  // case 1 gọi lại chính nó (đệ quy) rồi rơi xuống case 2: break outer_loop
  if (select === 1) await displayName(sys);
}

async function evenPlusOne(sys) {
  const { out, Scanner } = sys;
  const scanner = new Scanner();
  let n;
  do {
    out.println("Number of array's element");
    n = await scanner.nextInt();
  } while (n < 1);
  const array = new Array(n).fill(0);
  out.println(n > 1 ? "Array's elements" : "Array's element");
  for (let i = 1; i < n + 1; i++) {
    out.print(`Element number ${i}: `);
    array[i - 1] = await scanner.nextInt();
  }
  out.println('Your ogirinal array');
  for (let i = 0; i < n; i++) out.print(`${array[i]} `);
  out.println();
  out.println('After extra 1 to even number(s), your array here');
  for (let i = 0; i < n; i++) {
    if (array[i] % 2 === 0) array[i] = (array[i] + 1) | 0;
    out.print(`${array[i]} `);
  }
  out.println();
  out.println('\nOnce again my friend ?');
  let select;
  do {
    out.println('1 to continue');
    out.println('2 to end');
    select = await scanner.nextInt();
  } while (select < 1 || select > 2);
  if (select === 1) await evenPlusOne(sys);
}

async function homeworkMenu(sys) {
  const { out, Scanner } = sys;
  const scanner = new Scanner();
  for (;;) {
    out.println('What exercise do you want to test ?');
    let select;
    do {
      out.println('1: Exercise 1');
      out.println('2: Exercise 2');
      out.println('3: Exit');
      select = await scanner.nextInt();
    } while (select < 1 || select > 3);
    if (select === 1) await displayName(sys);
    else if (select === 2) await evenPlusOne(sys);
    else {
      out.println('Cya ...');
      return;
    }
  }
}

async function minMax({ out }) {
  const options = [3, 1, 0, 7];
  out.println('Default array !');
  for (const v of options) out.print(`${v} `);
  out.println();
  out.println(`Min: ${Math.min(...options)}`);
  out.println(`Max: ${Math.max(...options)}`);
}

// ======================================================================
// Bài kiểm tra (test)
// ======================================================================
async function starTriangle({ out, Scanner }) {
  const scanner = new Scanner();
  out.println('Triangle high: ');
  const high = await scanner.nextInt();
  for (let i = 1; i <= high; ++i) {
    for (let j = 1; j <= i; ++j) out.print('* ');
    out.println();
  }
}

async function countWords({ out }) {
  const text = 'You only live once, but if you do it right, once is enough';
  out.println(`Default string: ${text}`);
  let count = 0;
  let notCounted = true;
  for (const ch of text) {
    if (ch !== ' ' && ch !== '\t' && ch !== '\n') {
      if (notCounted) { count++; notCounted = false; }
    } else {
      notCounted = true;
    }
  }
  const positions = [];
  for (let i = 0; i < text.length; i++) if (text[i] === 'o') positions.push(i);
  out.println(`Word count of string: ${count}`);
  out.println(`Number of occurrences of "o" :${positions.length}`);
  out.println('Position of "o" in the string');
  for (const i of positions) out.print(`${i} `);
}

async function randomPrime({ out }) {
  const n = Math.trunc(Math.random() * 1099);
  out.println(`Random number: ${n}`);
  if (n < 2) {
    out.println(`${n} isn't a prime number`);
    return;
  }
  // Vòng for gốc dừng ngay ở lần đầu (i = 2) dù chia hết hay không
  for (let i = 2; i <= n; i++) {
    out.println(n % i === 0 ? `${n} isn't a prime number` : `${n} is a prime number`);
    break;
  }
}

async function firstPrimes({ out }) {
  const n = 10;
  let num = 2;
  out.println('First 10 prime number');
  for (let i = 2; i <= n;) {
    let status = 1;
    for (let j = 2; j <= Math.sqrt(num); j++) {
      if (num % j === 0) { status = 0; break; }
    }
    if (status !== 0) {
      out.print(`${num} `);
      i++;
    }
    num++;
  }
}

async function diagonal({ out, Scanner }) {
  const scanner = new Scanner();
  out.println('Row(s) of array: ');
  const row = await scanner.nextInt();
  out.println('Column(s) of array: ');
  const column = await scanner.nextInt();
  if (row < 0 || column < 0) throw new JavaException('java.lang.NegativeArraySizeException', String(row < 0 ? row : column));
  const array = Array.from({ length: row }, () => new Array(column).fill(0));
  for (let i = 0; i < row; i++) {
    for (let j = 0; j < column; j++) {
      out.println(`Element no [${i}, ${j}]: `);
      array[i][j] = await scanner.nextInt();
    }
  }
  out.println('Your array');
  for (let i = 0; i < row; i++) {
    for (let j = 0; j < column; j++) out.print(`${array[i][j]} `);
    out.println();
  }
  out.println('Elements of main diagonal');
  for (let i = 0; i < row; i++) {
    for (let j = 0; j < column; j++) if (i === j) out.print(`${array[i][j]} `);
  }
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
    summary: 'Làm quen Scanner, if/else và tách các phép tính ra từng class riêng.',
    lessons: [
      {
        id: 'hinh-hoc',
        icon: '📐',
        title: 'Hình học và BMI',
        desc: 'Chọn 7, 0, 1 hoặc 3 để tính chỉ số BMI, hoặc chu vi và diện tích hình vuông, tam giác, hình tròn.',
        tags: ['Scanner', 'if/else', 'float'],
        entry: 'java main',
        files: [
          'fisrt-day/src/main.java',
          'fisrt-day/src/basic_geometries_bmi_calc/BMI_values.java',
          'fisrt-day/src/basic_geometries_bmi_calc/square.java',
          'fisrt-day/src/basic_geometries_bmi_calc/triangle.java',
          'fisrt-day/src/basic_geometries_bmi_calc/circle.java',
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
        desc: 'Tính BMI, cạnh huyền, cộng trừ nhân chia, lũy thừa và đổi độ C ↔ độ F. Mỗi lựa chọn có một câu thoại riêng.',
        tags: ['switch', 'double', 'Math.pow'],
        entry: 'java main',
        files: [
          'second-day/src/main.java',
          'second-day/src/basic_calc/basic_calculations.java',
          'second-day/src/basic_calc/bmi_calc.java',
          'second-day/src/basic_calc/convert_temperature.java',
          'second-day/src/basic_calc/hypotenuse_calc.java',
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
    summary: 'Gom bài vào một menu vòng lặp vô tận, chỉ dừng khi chọn thoát.',
    lessons: [
      {
        id: 'ganh-xiec',
        icon: '🎪',
        title: 'Menu “Four dot 0 circus”',
        desc: 'Ba trò trong một menu: tính cạnh huyền, so sánh hai chuỗi, đoán số ngẫu nhiên từ 0 tới 1098. Chọn 4 để thoát.',
        tags: ['for (;;)', 'do/while', 'String'],
        entry: 'java Main',
        files: [
          'another_second_day/src/Main.java',
          'another_second_day/src/Exercises/Four_dot_0_circus_menu.java',
          'another_second_day/src/Exercises/Exercise_1.java',
          'another_second_day/src/Exercises/Exercise_2.java',
          'another_second_day/src/Exercises/Exercise_3.java',
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
    summary: 'Vòng lặp for, xử lý chuỗi và viết hàm.',
    lessons: [
      {
        id: 'dem-chu-e',
        icon: '🔤',
        title: 'Đếm chữ e',
        desc: 'Đếm xem chữ e xuất hiện mấy lần trong câu “Hello everyone”.',
        tags: ['for', 'charAt'],
        entry: 'Exercise_1.appearance_of_a()',
        files: ['third-day/src/functions/Exercise_1.java', 'third-day/src/main.java'],
        run: countE,
      },
      {
        id: 'doi-xung',
        icon: '🪞',
        title: 'Chuỗi đối xứng',
        desc: 'Gõ một chuỗi, chương trình lật ngược lại để xem có đọc xuôi ngược như nhau không. Thử “kayak” xem.',
        tags: ['nextLine', 'equals'],
        entry: 'Exercise_2.palindrome_check()',
        files: ['third-day/src/functions/Exercise_2.java', 'third-day/src/main.java'],
        run: palindrome,
      },
      {
        id: 'bmi-phan',
        icon: '⚖️',
        title: 'BMI kèm lời phán',
        desc: 'Nhập cân nặng, chiều cao, in chỉ số BMI rồi xếp loại từ gầy tới béo phì.',
        tags: ['printf', 'float'],
        entry: 'BMI_calc.input()',
        files: ['third-day/src/functions/BMI_calc.java'],
        note: 'printf không xuống dòng nên câu xếp loại dính liền ngay sau con số, y như hồi chạy trong IntelliJ.',
        run: bmiWithVerdict,
      },
      {
        id: 'fizzbuzz',
        icon: '🫧',
        title: 'FizzBuzz',
        desc: 'Đếm từ 0 tới 100: chia hết cho 3 in FIZZ, cho 5 in BUZZ, cho cả hai in FIZZBUZZ.',
        tags: ['for', '%'],
        entry: 'Fizzbuzz.fizzbuzz()',
        files: ['third-day/src/functions/Fizzbuzz.java'],
        run: fizzbuzz,
      },
      {
        id: 'bac-hai',
        icon: '📈',
        title: 'Phương trình bậc 2',
        desc: 'Nhập a, b, c của ax² + bx + c rồi tính delta.',
        tags: ['Math.pow'],
        entry: 'Quadratic_solve.solve()',
        files: ['third-day/src/functions/Quadratic_solve.java'],
        unfinished: true,
        note: 'Bài này mới làm tới đoạn tính delta (còn viết nhầm thành b mũ 4), các nhánh in nghiệm vẫn để trống nên chạy xong chỉ in ra một dòng trống.',
        run: quadratic,
      },
      {
        id: 'dang-nhap',
        icon: '🔐',
        title: 'Đăng nhập',
        desc: 'Mới đặt tên hàm check_info, bên trong chỉ in ra chữ null.',
        tags: ['static'],
        entry: 'F__king_sh_t_login.check_info()',
        files: ['third-day/src/functions/F__king_sh_t_login.java'],
        unfinished: true,
        run: login,
      },
    ],
  },
  {
    id: 'buoi-4',
    label: 'Buổi 4',
    folder: 'fourth-day',
    hue: '#5b9bd5',
    summary: 'Mảng, vòng lặp có nhãn (outer_loop) và gọi lại chính hàm đó để chơi lại.',
    lessons: [
      {
        id: 'menu-buoi-4',
        icon: '🗂️',
        title: 'Menu bài về nhà',
        desc: 'Chọn bài 1, bài 2 hoặc thoát. Làm xong mỗi bài lại hỏi có muốn chơi tiếp không.',
        tags: ['label', 'break'],
        entry: 'java main',
        files: [
          'fourth-day/src/main.java',
          'fourth-day/src/Home_Work/Chmua_Hme_Menu.java',
          'fourth-day/src/Home_Work/Exercise_1.java',
          'fourth-day/src/Home_Work/Exercise_2.java',
        ],
        run: homeworkMenu,
      },
      {
        id: 'viet-hoa',
        icon: '✍️',
        title: 'Viết hoa tên',
        desc: 'Gõ tên kiểu “nguyễn văn an”, chương trình viết hoa chữ cái đầu của mỗi từ.',
        tags: ['char[]', 'toUpperCase'],
        entry: 'Exercise_1.display_name()',
        files: ['fourth-day/src/Home_Work/Exercise_1.java'],
        run: displayName,
      },
      {
        id: 'so-chan',
        icon: '➕',
        title: 'Số chẵn thêm 1',
        desc: 'Nhập một mảng số nguyên, số nào chẵn thì cộng thêm 1. Trong code còn có dòng cãi nhẹ cô giáo về đề bài 😆',
        tags: ['int[]', '%'],
        entry: 'Exercise_2.another_array()',
        files: ['fourth-day/src/Home_Work/Exercise_2.java'],
        run: evenPlusOne,
      },
      {
        id: 'min-max',
        icon: '🔍',
        title: 'Tìm min, max',
        desc: 'Bài làm trên lớp: tìm số nhỏ nhất và lớn nhất trong mảng 3 1 0 7.',
        tags: ['int[]', 'on lab'],
        entry: 'Array_test.Min_Max()',
        files: ['fourth-day/src/On_Lab/Array_test.java'],
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
        title: 'Super Idol Social Network',
        desc: 'Màn hình đăng nhập JavaFX đầu tiên: ô tài khoản, ô mật khẩu, quên mật khẩu và hai nút bấm.',
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
        note: 'Đây là hình cửa sổ dựng lại từ file FXML. Mấy hàm xử lý nút bấm trong HelloController vẫn để trống, nên bấm vào chưa có gì xảy ra.',
      },
    ],
  },
  {
    id: 'kiem-tra',
    label: 'Bài kiểm tra',
    folder: 'test',
    hue: '#e07a9f',
    summary: 'Năm câu kiểm tra cuối đợt (câu 6 để trống).',
    lessons: [
      {
        id: 'tam-giac',
        icon: '⭐',
        title: 'Tam giác sao',
        desc: 'Nhập chiều cao, in một tam giác vuông xếp bằng dấu sao.',
        tags: ['for lồng for'],
        entry: 'Exercise_1.triangle()',
        files: ['test/src/java_test/Exercise_1.java', 'test/src/Main.java'],
        run: starTriangle,
      },
      {
        id: 'dem-tu',
        icon: '📝',
        title: 'Đếm từ và chữ o',
        desc: 'Đếm số từ trong câu “You only live once…”, rồi đếm và chỉ ra vị trí từng chữ o.',
        tags: ['char', 'final'],
        entry: 'Exercise_2.count_words()',
        files: ['test/src/java_test/Exercise_2.java'],
        run: countWords,
      },
      {
        id: 'nguyen-to',
        icon: '🎲',
        title: 'Số nguyên tố ngẫu nhiên',
        desc: 'Bốc một số ngẫu nhiên từ 0 tới 1098 rồi xem có phải số nguyên tố không.',
        tags: ['Math.random'],
        entry: 'Exercise_3.check_prime()',
        files: ['test/src/java_test/Exercise_3.java'],
        note: 'Vòng for dừng ngay ở lần chia đầu tiên (chia cho 2), nên số lẻ nào cũng được báo là số nguyên tố. Chạy lại vài lần là thấy 😅',
        run: randomPrime,
      },
      {
        id: 'muoi-so',
        icon: '🔟',
        title: '10 số nguyên tố đầu tiên',
        desc: 'In ra các số nguyên tố đầu tiên, kiểm tra bằng cách chia thử tới căn bậc hai.',
        tags: ['Math.sqrt', 'break'],
        entry: 'Exercise_4.list_prime_number()',
        files: ['test/src/java_test/Exercise_4.java'],
        note: 'Biến đếm bắt đầu từ 2 nên in ra 9 số chứ không phải 10.',
        run: firstPrimes,
      },
      {
        id: 'duong-cheo',
        icon: '▦',
        title: 'Đường chéo ma trận',
        desc: 'Nhập số hàng, số cột và từng phần tử, rồi in ma trận cùng các phần tử trên đường chéo chính.',
        tags: ['int[][]'],
        entry: 'Exercise_5.two_d_array()',
        files: ['test/src/java_test/Exercise_5.java', 'test/src/Main.java'],
        run: diagonal,
      },
    ],
  },
];
