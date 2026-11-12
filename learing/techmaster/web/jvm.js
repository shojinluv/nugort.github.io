// jvm.js – "Máy ảo Java" tí hon, vừa đủ để chạy lại mấy bài tập ngay trên trình duyệt.
// Gồm: in số y như Java (float, double, printf), Scanner đọc chữ gõ vào terminal,
// System.out, System.exit, và vài lỗi (exception) mà bài tập có thể gặp.

export const fround = Math.fround; // làm tròn về kiểu float (32 bit) giống Java

export class JavaExit {
  constructor(code) { this.code = code; }
}
export class JavaException {
  constructor(name, message = '') { this.name = name; this.message = message; }
}
export class Stopped {}       // người xem bấm Dừng hoặc Chạy lại
export class OutputLimit {}   // in quá nhiều (ví dụ tam giác cao 1 triệu dòng), dừng cho trình duyệt đỡ mệt

// ---------- In số kiểu Java ----------
// Đổi "1.5e-7" thành "0.00000015" (không còn chữ e)
function plain(str) {
  const m = /^(-?)(\d+)(?:\.(\d+))?e([+-]\d+)$/i.exec(str);
  if (!m) return str;
  const [, sign, int, frac = '', exp] = m;
  const digits = int + frac;
  const point = int.length + Number(exp);
  if (point <= 0) return `${sign}0.${'0'.repeat(-point)}${digits}`;
  if (point >= digits.length) return sign + digits + '0'.repeat(point - digits.length);
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
}

// Cách viết ngắn nhất mà vẫn đúng y con số đó (float thì chỉ cần đủ cho 32 bit)
function shortest(x, isFloat) {
  if (!isFloat) return String(x);
  for (let p = 1; p <= 9; p++) {
    const s = x.toPrecision(p);
    if (fround(Number(s)) === x) return s;
  }
  return String(x);
}

// Giống Float.toString / Double.toString: 6.0 thay vì 6, 1.0E7 thay vì 10000000
function javaToString(x, isFloat) {
  if (Number.isNaN(x)) return 'NaN';
  if (!Number.isFinite(x)) return x > 0 ? 'Infinity' : '-Infinity';
  if (x === 0) return Object.is(x, -0) ? '-0.0' : '0.0';
  const s = Number(shortest(x, isFloat));
  const abs = Math.abs(x);
  if (abs >= 1e-3 && abs < 1e7) {
    const text = String(s);
    return text.includes('.') ? text : `${text}.0`;
  }
  let [mantissa, exp] = s.toExponential().split('e');
  if (!mantissa.includes('.')) mantissa += '.0';
  return `${mantissa}E${Number(exp)}`;
}

export const F = (x) => javaToString(fround(x), true); // in một số float
export const D = (x) => javaToString(x, false);        // in một số double

// %.2f của Java: lấy các chữ số của số đó rồi làm tròn "5 thì lên"
function fixed(x, places) {
  if (Number.isNaN(x)) return 'NaN';
  if (!Number.isFinite(x)) return x > 0 ? 'Infinity' : '-Infinity';
  const neg = x < 0 || Object.is(x, -0);
  let [int, frac = ''] = plain(String(Math.abs(x))).split('.');
  if (frac.length > places) {
    const up = frac[places] >= '5';
    frac = frac.slice(0, places);
    if (up) {
      const all = (int + frac).split('');
      let k = all.length - 1;
      for (; k >= 0; k--) {
        if (all[k] === '9') all[k] = '0';
        else { all[k] = String(Number(all[k]) + 1); break; }
      }
      let joined = all.join('');
      if (k < 0) joined = `1${joined}`;
      int = joined.slice(0, joined.length - places);
      frac = joined.slice(joined.length - places);
    }
  }
  const body = places > 0 ? `${int}.${frac.padEnd(places, '0')}` : int;
  return (neg ? '-' : '') + body;
}

// printf: đủ dùng cho %s, %d, %f, %.2f, %n, %%
export function format(fmt, args) {
  let i = 0;
  return fmt.replace(/%(?:\.(\d+))?([sdfn%])/g, (all, places, conv) => {
    if (conv === '%') return '%';
    if (conv === 'n') return '\n';
    const v = args[i++];
    if (conv === 's') return String(v);
    if (conv === 'd') return String(Math.trunc(v));
    return fixed(v, places === undefined ? 6 : Number(places));
  });
}

// ---------- System.out, Scanner, System.exit ----------
// term: ô terminal trên trang (xem app.js), có write(text) và readLine() trả về dòng người xem gõ
export function makeSystem(term) {
  let budget = 200000; // số ký tự tối đa được in trong một lần chạy
  const write = (text) => {
    budget -= text.length;
    if (budget < 0) throw new OutputLimit();
    term.write(text);
  };
  const out = {
    print: (v) => write(String(v)),
    println: (v = '') => write(`${v}\n`),
    printf: (fmt, ...args) => write(format(fmt, args)),
  };

  const mismatch = (token) => new JavaException('java.util.InputMismatchException', token ? `For input string: "${token}"` : '');
  const NUMBER = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)([eE][+-]?\d+)?$/;

  // Mỗi Scanner có bộ đệm riêng, y như Java: nextInt() đọc xong một số thì dấu xuống dòng phía sau vẫn còn nằm lại,
  // nên nextLine() ngay sau đó trên cùng Scanner sẽ trả về chuỗi rỗng
  class Scanner {
    constructor() { this.buf = ''; }

    async more() { this.buf += `${await term.readLine()}\n`; }

    // Tìm "từ" kế tiếp (bỏ qua khoảng trắng, xuống dòng); chưa có thì chờ người xem gõ thêm
    async peek() {
      for (;;) {
        const m = /^\s*(\S+)\s/.exec(this.buf);
        if (m) return m;
        await this.more();
      }
    }

    take(m) { this.buf = this.buf.slice(m[0].length - 1); }

    async nextInt() {
      const m = await this.peek();
      const t = m[1];
      if (!/^[+-]?\d+$/.test(t)) throw mismatch();
      const v = Number(t);
      if (v > 2147483647 || v < -2147483648) throw mismatch(t);
      this.take(m);
      return v;
    }

    async nextDouble() {
      const m = await this.peek();
      if (!NUMBER.test(m[1])) throw mismatch();
      this.take(m);
      return Number(m[1].replace(',', '.')); // nhận cả 3,5 lẫn 3.5 cho tiện
    }

    async nextFloat() { return fround(await this.nextDouble()); }

    async nextLine() {
      for (;;) {
        const i = this.buf.indexOf('\n');
        if (i >= 0) {
          const line = this.buf.slice(0, i);
          this.buf = this.buf.slice(i + 1);
          return line;
        }
        await this.more();
      }
    }
  }

  const exit = (code) => { throw new JavaExit(code); };
  return { out, Scanner, exit };
}
