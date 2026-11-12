// jvm.js – "Máy ảo Java" tí hon, vừa đủ để chạy lại mấy bài tập ngay trên trình duyệt.
// Gồm: printf kiểu Java (%.2f làm tròn "5 thì lên"), lớp Input đọc từng dòng gõ vào terminal (giống utils.Input
// trong các bài Java), System.out, System.exit, và vài lỗi (exception) mà bài tập có thể gặp.

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

// ---------- System.out, Input, System.exit ----------
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

  // Giống lớp utils.Input trong các bài Java: mỗi lần đọc nguyên một dòng, gõ sai thì nhắc gõ lại
  // (Integer.parseInt, Double.parseDouble: có thể có dấu +/-, phần mũ e, đuôi f/d)
  const DOUBLE = /^[+-]?(NaN|Infinity|(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?[fFdD]?)$/;
  const input = {
    readLine: () => term.readLine(),
    async readNonEmpty() {
      for (;;) {
        const line = await term.readLine();
        if (line.trim() !== '') return line;
        out.print('Bạn chưa nhập gì, nhập lại: ');
      }
    },
    async readChar() {
      for (;;) {
        const line = await term.readLine();
        if (line.length === 1) return line; // một ký tự (một đơn vị UTF-16, như char của Java)
        out.print('Hãy nhập đúng một ký tự: ');
      }
    },
    async readIntBetween(min, max) {
      for (;;) {
        const v = await input.readInt();
        if (v >= min && v <= max) return v;
        out.print(`Hãy nhập số từ ${min} tới ${max}: `);
      }
    },
    async readInt() {
      for (;;) {
        const line = (await term.readLine()).trim();
        if (/^[+-]?\d+$/.test(line)) {
          const v = Number(line) + 0; // + 0: "-0" thành 0 như Java
          if (v >= -2147483648 && v <= 2147483647) return v;
        }
        out.print('Hãy nhập một số nguyên: ');
      }
    },
    async readDouble() {
      for (;;) {
        const line = (await term.readLine()).trim().replaceAll(',', '.');
        if (DOUBLE.test(line)) {
          const v = Number(line.replace(/[fFdD]$/, ''));
          if (Number.isFinite(v)) return v;
        }
        out.print('Hãy nhập một số: ');
      }
    },
    async readPositive() {
      for (;;) {
        const v = await input.readDouble();
        if (v > 0) return v;
        out.print('Hãy nhập một số lớn hơn 0: ');
      }
    },
  };

  const exit = (code) => { throw new JavaExit(code); };
  return { out, input, exit };
}

// In số cho gọn như hàm pretty() trong second-day/src/main.java: 3 thay vì 3.0, tối đa 4 chữ số lẻ
export function pretty(v) {
  if (v === Math.round(v) && Math.abs(v) < 1e15) return String(v + 0);
  return format('%.4f', [v]).replace(/\.?0+$/, '');
}
