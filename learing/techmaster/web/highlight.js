// highlight.js – Tô màu code Java và XML (file .fxml, pom.xml), tự viết cho nhẹ, không cần thư viện ngoài.
// Kết quả là một danh sách dòng HTML; mỗi dòng bọc trong <span class="line"> để CSS đánh số dòng.

const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const KEYWORDS = new Set(`abstract assert boolean break byte case catch char class continue default do double else enum
  extends final finally float for if implements import instanceof int interface long native new package private
  protected public return short static super switch synchronized this throw throws transient try var void volatile
  while true false null module requires opens exports`.split(/\s+/));

// Chia code thành từng mẩu [loại, chữ]; loại rỗng là chữ thường
function javaTokens(src) {
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(@\w+)|(\b\d[\d_]*(?:\.\d+)?[fFdDlL]?\b)|([A-Za-z_$][\w$]*)|(\s+|[^\s\w])/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) {
    const [text, com, str, ann, num, word] = m;
    let kind = '';
    if (com) kind = 'com';
    else if (str) kind = 'str';
    else if (ann) kind = 'ann';
    else if (num) kind = 'num';
    else if (word) {
      if (KEYWORDS.has(word)) kind = 'kw';
      else if (/^\s*\(/.test(src.slice(re.lastIndex))) kind = 'fn';
      else if (/^[A-Z]/.test(word)) kind = 'type';
    }
    out.push([kind, text]);
  }
  return out;
}

function xmlTokens(src) {
  const re = /(<!--[\s\S]*?-->)|(<\?[\s\S]*?\?>)|(<\/?[\w:.-]+)|("[^"]*")|(\/?>)|([\w:.-]+(?==))|([^<"/>\w]+|[\s\S])/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) {
    const [text, com, pi, tag, str, close, attr] = m;
    const kind = com ? 'com' : pi ? 'ann' : tag || close ? 'tag' : str ? 'str' : attr ? 'attr' : '';
    out.push([kind, text]);
  }
  return out;
}

// Ghép các mẩu thành từng dòng; mẩu nào kéo dài qua nhiều dòng (ghi chú /* */) thì cắt ra cho từng dòng
export function highlight(src, path) {
  const tokens = /\.(fxml|xml)$/i.test(path) ? xmlTokens(src) : /\.java$/i.test(path) ? javaTokens(src) : [['', src]];
  const lines = [''];
  for (const [kind, text] of tokens) {
    text.split('\n').forEach((part, i) => {
      if (i > 0) lines.push('');
      if (!part) return;
      lines[lines.length - 1] += kind ? `<span class="t-${kind}">${escape(part)}</span>` : escape(part);
    });
  }
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop(); // bỏ dòng trống cuối file
  return lines;
}
