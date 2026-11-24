// 문장 끝 찾기. app.js(문장 목록)와 tts.js(합성 조각)가 같은 기준을 씀.
// - . ! ? … 뒤에 공백이 오면 문장 끝
// - 。！？।؟ 는 공백 없이도 문장 끝(일본어·힌디어 등은 문장 사이를 띄우지 않음)
//   단, 일본어 따옴표 안(「…」『…』)이거나, 따옴표를 닫고 바로 글이 이어지면(「本当に？」と言った) 문장 끝으로 보지 않음
const END = /[.!?…]+["'”’)\]]*\s+|[。！？।؟]+[」』"'”’)\]]*\s*/gu;
const CLOSE = /[」』"'”’)\]]/u;

// 문장이 끝나는 글자 위치(끝 부호와 뒤 공백까지 포함한 다음 위치) 목록
export function sentenceEnds(text) {
  const ends = [];
  let depth = 0;
  let last = 0;
  for (const m of text.matchAll(END)) {
    const e = m.index + m[0].length;
    for (const ch of text.slice(last, e)) {
      if (ch === '「' || ch === '『') depth++;
      else if ((ch === '」' || ch === '』') && depth > 0) depth--;
    }
    last = e;
    if (/^[.!?…]/u.test(m[0])) { ends.push(e); continue; }
    if (depth > 0) continue;
    if (CLOSE.test(m[0]) && e < text.length && !/\s/u.test(text[e])) continue;
    ends.push(e);
  }
  return ends;
}

// 문장 단위로 나눈 글 목록(앞뒤 공백 없음, 빈 조각 없음)
export function splitSentences(text) {
  const out = [];
  let s = 0;
  for (const e of sentenceEnds(text)) {
    const piece = text.slice(s, e).trim();
    if (piece) out.push(piece);
    s = e;
  }
  const rest = text.slice(s).trim();
  if (rest) out.push(rest);
  return out;
}
