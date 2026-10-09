// TTS Studio — Supertonic 3 음성 합성 작업 도구 (브라우저 안에서, 서버 없음)
// 편집기 하나 + 문장 목록: 커서 문장 바로 듣기, 문장별 다시 뽑기(시드), 대본(인물별 목소리), 자막 시간 맞춤,
// WAV · SRT · 문장별 ZIP 내보내기, 단축키.
import { createTTS, VOICES } from './tts-client.js';

const $ = (id) => document.getElementById(id);

/* ================= 상수 ================= */
// Supertonic 3 공식 31개 언어 + na(언어 구분 없이 처리, 공식 README)
const LANGS = [
  ['na', '자동 · 언어 구분 없음'], ['ko', '한국어'], ['en', 'English'], ['ja', '日本語'], ['ar', 'العربية'],
  ['bg', 'Български'], ['cs', 'Čeština'], ['da', 'Dansk'], ['de', 'Deutsch'], ['el', 'Ελληνικά'], ['es', 'Español'],
  ['et', 'Eesti'], ['fi', 'Suomi'], ['fr', 'Français'], ['hi', 'हिन्दी'], ['hr', 'Hrvatski'], ['hu', 'Magyar'],
  ['id', 'Bahasa Indonesia'], ['it', 'Italiano'], ['lt', 'Lietuvių'], ['lv', 'Latviešu'], ['nl', 'Nederlands'],
  ['pl', 'Polski'], ['pt', 'Português'], ['ro', 'Română'], ['ru', 'Русский'], ['sk', 'Slovenčina'],
  ['sl', 'Slovenščina'], ['sv', 'Svenska'], ['tr', 'Türkçe'], ['uk', 'Українська'], ['vi', 'Tiếng Việt'],
];
const VOICE_LABEL = { F1: '여성 1', F2: '여성 2', F3: '여성 3', F4: '여성 4', F5: '여성 5', M1: '남성 1', M2: '남성 2', M3: '남성 3', M4: '남성 4', M5: '남성 5' };
// 표현 태그 10개: 앞의 3개만 공식 문서에 이름이 있음. 나머지 7개는 제3자 실행기 README의 목록(비공식)
const TAGS = [
  ['<laugh>', '😄', '웃음', true], ['<breath>', '🌬️', '숨', true], ['<sigh>', '😮‍💨', '한숨', true],
  ['<clear-throat>', '🗣️', '헛기침'], ['<cough>', '😷', '기침'], ['<sneeze>', '🤧', '재채기'], ['<sniff>', '👃', '훌쩍'],
  ['<groan>', '😣', '끙'], ['<yawn>', '🥱', '하품'], ['<hmm>', '🤔', '음…'],
];
const TAG_RE = /<[a-z-]+>/g;
// 나이: 음 높이는 합성 뒤 다시 표본화로 바꾸고, 합성 빠르기를 그만큼 나눠 말 빠르기는 유지
const AGES = { child: { pitch: 1.1, speed: 1.05 }, normal: { pitch: 1, speed: 1 }, adult: { pitch: 0.96, speed: 0.97 }, old: { pitch: 0.92, speed: 0.9 } };
const SET_KEYS = ['lang', 'voice', 'age', 'speed', 'pitch', 'steps', 'seed', 'gap', 'para', 'gain', 'rate'];
const DEFAULTS = { voice: 'F1', age: 'normal', speed: '1', pitch: '1', steps: '8', seed: '', gap: '300', para: '700', gain: '1', rate: '44100' };
const MODELS = {
  f32: 'leeyunjai/edge-lab@main/tts',
  int8: 'leeyunjai/edge-lab@71800e5/tts-int8',
  official: 'supertone-oss-archive/supertonic-3@aafc6e32416a594460b32413efc49d7fe4ce6d46',
};
const KEY = 'tts-studio:v2';
const PRESET_KEY = 'tts-studio:presets';

/* ================= 화면 요소 ================= */
const ids = ['engine', 'helpBtn', 'settings', 'closeSettings', 'sheetBackdrop', 'openSettings', 'lang', 'voice', 'preview', 'age',
  'preset', 'savePreset', 'delPreset', 'speed', 'pitch', 'steps', 'seed', 'dice', 'gap', 'para', 'gain', 'norm', 'rate',
  'resetSet', 'model', 'ep', 'applyEngine', 'clearModels', 'file', 'script', 'clearText', 'tagbar', 'text', 'cast', 'count',
  'cursorInfo', 'segInfo', 'genAll', 'segs', 'playCur', 'playFrom', 'stop', 'wave', 'nowText', 'saveWav', 'saveSrt', 'saveZip',
  'bar', 'help'];
const el = Object.fromEntries(ids.map((k) => [k, $(k)]));
el.progress = document.querySelector('.progress');
for (const k of ['speed', 'pitch', 'steps', 'gap', 'para', 'gain']) el[`${k}Out`] = $(`${k}Out`);

for (const [code, name] of LANGS) el.lang.add(new Option(`${name} (${code})`, code));
for (const v of VOICES) el.voice.add(new Option(VOICE_LABEL[v], v));

/* ================= 저장 ================= */
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* 공간 없음 */ } },
};
let castMap = {};   // 대본: 인물 → { voice, age }
let seedOver = {};  // 문장별로 다시 뽑은 시드: 문장 키 → 시드
const settingsNow = () => ({ ...Object.fromEntries(SET_KEYS.map((k) => [k, el[k].value])), norm: el.norm.checked });
function applySettings(s) {
  for (const k of SET_KEYS) if (s[k] != null && s[k] !== undefined) el[k].value = s[k];
  if (s.norm != null) el.norm.checked = !!s.norm;
  showOutputs();
}
function load() {
  const s = store.get(KEY, {});
  applySettings(s);
  if (!el.lang.value) el.lang.value = LANGS.some(([c]) => c === (navigator.language || '').slice(0, 2)) ? navigator.language.slice(0, 2) : 'ko';
  el.text.value = s.text || '';
  el.script.checked = !!s.script;
  castMap = s.cast || {};
  seedOver = s.seedOver || {};
}
let saveT = 0;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => store.set(KEY, { ...settingsNow(), text: el.text.value.slice(0, 300000), script: el.script.checked, cast: castMap, seedOver }), 300);
}
function showOutputs() {
  el.speedOut.textContent = `${Number(el.speed.value).toFixed(2)}×`;
  el.pitchOut.textContent = `${Number(el.pitch.value).toFixed(2)}×`;
  el.stepsOut.textContent = el.steps.value;
  el.gapOut.textContent = `${el.gap.value}ms`;
  el.paraOut.textContent = `${el.para.value}ms`;
  el.gainOut.textContent = `${Number(el.gain.value).toFixed(2)}×`;
}

/* ================= 엔진 ================= */
const tts = await createTTS();
let ready = false;
const setStatus = (m) => { el.engine.textContent = m; };
let rtf = 0.5; // 남은 시간 어림용(합성 초 / 음성 초), 실제 값으로 갱신
const loading = tts.load(setStatus).then(() => {
  ready = true;
  setStatus(`준비 · ${tts.backend} · ${tts.source || ''}`);
}, (e) => { console.error(e); setStatus(`엔진을 불러오지 못했어요: ${e.message}`); });

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 1000000; };
// 낭독용 표기: 검열 표시(××)는 '모모', 책 제목 괄호는 소리 내지 않음
const speakable = (t) => t.replace(/[×○]{2,}/g, '모모').replace(/[「」『』《》〈〉]/g, '').trim();
const segKey = (s) => `${s.who || ''}\u0001${s.text}`;

// 한 문장의 합성 설정: 전체 설정 + (대본이면 인물 목소리·나이) + 시드(문장별 다시 뽑은 것 > 전체 시드 > 문장 내용으로 정한 시드)
function optsFor(seg) {
  const c = seg.who && el.script.checked ? castMap[seg.who] : null;
  const seed = seedOver[segKey(seg)] ?? (el.seed.value !== '' ? Number(el.seed.value) : hash(seg.text));
  return {
    lang: el.lang.value, voice: c?.voice || el.voice.value, age: c?.age || el.age.value,
    speed: Number(el.speed.value), pitch: Number(el.pitch.value), steps: Number(el.steps.value), seed,
  };
}
const keyOf = (o, text) => `${o.lang}|${o.voice}|${o.age}|${o.speed}|${o.pitch}|${o.steps}|${o.seed}|${text}`;
const cache = new Map();
const MAX_CACHE = 600;
async function synth(text, o, signal) {
  if (!ready) await loading; // 아직 불러오는 중이면 끝날 때까지 기다림
  if (!ready) throw new Error('엔진을 불러오지 못했어요');
  const k = keyOf(o, text);
  if (cache.has(k)) return cache.get(k);
  const a = AGES[o.age] || AGES.normal;
  const pitch = a.pitch * o.pitch;
  const t0 = performance.now();
  const raw = await tts.synth(speakable(text), { voice: o.voice, lang: o.lang, steps: o.steps, speed: o.speed * a.speed / pitch, seed: o.seed, signal });
  const pcm = pitch === 1 ? raw : resample(raw, pitch);
  const audio = pcm.length / tts.sampleRate;
  if (audio > 0.2) rtf = rtf * 0.7 + ((performance.now() - t0) / 1000 / audio) * 0.3;
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(k, pcm);
  return pcm;
}
const cached = (seg) => cache.get(keyOf(optsFor(seg), seg.text));

/* ================= 소리 처리 ================= */
// 다시 표본화: rate>1 이면 짧아짐(음 높이↑). 줄일 때는 구간 평균으로 잡음(앨리어싱)을 줄임
function resample(src, rate) {
  const n = Math.max(1, Math.floor(src.length / rate));
  const out = new Float32Array(n);
  if (rate > 1.5) {
    for (let i = 0; i < n; i++) {
      const a = Math.floor(i * rate); const b = Math.min(src.length, Math.floor((i + 1) * rate));
      let s = 0; for (let j = a; j < b; j++) s += src[j];
      out[i] = b > a ? s / (b - a) : 0;
    }
    return out;
  }
  for (let i = 0; i < n; i++) {
    const x = i * rate; const j = Math.floor(x); const f = x - j;
    out[i] = (src[j] || 0) * (1 - f) + (src[j + 1] || 0) * f;
  }
  return out;
}
// 음량 배율, 자동 맞춤이면 최대치를 −0.5dB(≈0.944)로
function finish(pcm) {
  let g = Number(el.gain.value);
  if (el.norm.checked) {
    let peak = 0;
    for (let i = 0; i < pcm.length; i++) { const v = Math.abs(pcm[i]); if (v > peak) peak = v; }
    if (peak > 0) g *= 0.944 / peak;
  }
  if (g === 1) return pcm;
  const out = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) out[i] = Math.max(-1, Math.min(1, pcm[i] * g));
  return out;
}
function wavBytes(pcm, sr) {
  const buf = new ArrayBuffer(44 + pcm.length * 2);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buf);
}
// 내보낼 형식(표본화율)로 바꿔 WAV 바이트
function toWav(pcm) {
  const sr = Number(el.rate.value) || tts.sampleRate;
  const p = finish(pcm);
  return wavBytes(sr === tts.sampleRate ? p : resample(p, tts.sampleRate / sr), sr);
}

/* ---- ZIP(압축 없이 담기) ---- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zipBlob(files) {
  const enc = new TextEncoder();
  const chunks = []; const central = []; let off = 0;
  for (const f of files) {
    const name = enc.encode(f.name); const crc = crc32(f.data); const size = f.data.length;
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint32(14, crc, true); h.setUint32(18, size, true); h.setUint32(22, size, true); h.setUint16(26, name.length, true);
    chunks.push(new Uint8Array(h.buffer), name, f.data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint32(16, crc, true); c.setUint32(20, size, true); c.setUint32(24, size, true); c.setUint16(28, name.length, true);
    c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), name);
    off += 30 + name.length + size;
  }
  const cdSize = central.reduce((a, u) => a + u.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
  return new Blob([...chunks, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 20000);
}
const stamp = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };

/* ================= 재생 + 파형 ================= */
let audioCtx = null;
let source = null;
let playing = null; // { pcm, start, dur }
function ac() {
  try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (_) { /* 미지원 */ }
  audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function playPcm(pcm, tailMs = 0, label = '') {
  const c = ac();
  const p = finish(pcm);
  const pad = Math.floor((tailMs / 1000) * tts.sampleRate);
  const buf = c.createBuffer(1, p.length + pad, tts.sampleRate);
  buf.copyToChannel(p, 0);
  stopSound();
  return new Promise((resolve) => {
    source = c.createBufferSource();
    source.buffer = buf;
    source.connect(c.destination);
    source.onended = () => { source = null; playing = null; drawWave(); resolve(); };
    source.start();
    playing = { pcm: p, start: c.currentTime, dur: p.length / tts.sampleRate };
    el.nowText.textContent = label.replace(TAG_RE, '').trim();
    drawWave(); animate();
  });
}
function stopSound() {
  if (source) { source.onended = null; try { source.stop(); } catch (_) { /* 끝남 */ } source = null; }
  playing = null;
}
let lastWave = null;
function drawWave(progress = -1) {
  const cv = el.wave; const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth; const h = cv.clientHeight;
  if (!w) return;
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  const pcm = playing?.pcm || lastWave;
  if (playing) lastWave = playing.pcm;
  if (!pcm) return;
  const css = getComputedStyle(document.documentElement);
  const step = pcm.length / w;
  for (let x = 0; x < w; x++) {
    let m = 0;
    const a = Math.floor(x * step); const b = Math.min(pcm.length, Math.floor((x + 1) * step));
    for (let i = a; i < b; i += 4) { const v = Math.abs(pcm[i]); if (v > m) m = v; }
    const y = Math.max(1, m * h * 0.95);
    g.fillStyle = progress >= 0 && x / w <= progress ? css.getPropertyValue('--accent') : css.getPropertyValue('--wave');
    g.fillRect(x, (h - y) / 2, 1, y);
  }
}
function animate() {
  if (!playing || !audioCtx) return;
  drawWave(Math.min(1, (audioCtx.currentTime - playing.start) / playing.dur));
  requestAnimationFrame(animate);
}
addEventListener('resize', () => drawWave());

/* ================= 글 나누기 (위치 포함) ================= */
// seg: { text, who, start, end (글자 위치), para (문단 끝), t (자막 시작 초) }
const SRT_TIME = /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/;
const toSec = (h, m, s, ms) => Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, '0')) / 1000;
const SENT_END = /[.!?…。！？]+["'”’)\]]*\s+/g;
function parse(text) {
  const segs = [];
  if (SRT_TIME.test(text)) {
    const re = /(^|\n)[^\n]*?(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})[^\n]*\n([\s\S]*?)(?=\n\s*\n|$)/g;
    let m;
    while ((m = re.exec(text))) {
      const t = m[2].match(SRT_TIME);
      const body = m[3].replace(/<\/?[ibu]>|\{[^}]*\}/g, '').replace(/\s*\n\s*/g, ' ').trim();
      if (!body) continue;
      const start = m.index + m[0].length - m[3].length;
      segs.push({ text: body, start, end: start + m[3].length, t: toSec(t[1], t[2], t[3], t[4]) });
    }
    return segs;
  }
  let pos = 0;
  const lines = text.split('\n');
  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    const lineStart = pos;
    pos += raw.length + 1;
    if (!raw.trim()) { if (segs.length) segs[segs.length - 1].para = true; continue; }
    let body = raw; let off = 0;
    const md = body.match(/^(\s*(?:#+|[-*]|\d+[.)])\s+)/); // 마크다운 제목·목록 기호
    if (md) { off = md[1].length; body = body.slice(off); }
    let who = null;
    if (el.script.checked) {
      const sm = body.match(/^([^:：]{1,24})\s*[:：]\s*/);
      if (sm) { who = sm[1].trim(); off += sm[0].length; body = body.slice(sm[0].length); }
    }
    // 문장 끝(마침표 등 + 공백)에서 자름
    let s0 = 0; let mm;
    SENT_END.lastIndex = 0;
    const cut = (a, b) => {
      const piece = body.slice(a, b);
      const lead = piece.length - piece.trimStart().length;
      const t = piece.trim();
      if (t.replace(TAG_RE, '').trim()) segs.push({ text: t, who, start: lineStart + off + a + lead, end: lineStart + off + a + lead + t.length });
    };
    while ((mm = SENT_END.exec(body))) { cut(s0, mm.index + mm[0].length); s0 = mm.index + mm[0].length; }
    cut(s0, body.length);
  }
  return segs;
}

/* ================= 대본: 인물 목소리 ================= */
function renderCast() {
  const who = el.script.checked ? [...new Set(segs.map((s) => s.who).filter(Boolean))] : [];
  el.cast.hidden = !who.length;
  if (!who.length) { el.cast.replaceChildren(); return; }
  const used = new Set(who.map((w) => castMap[w]?.voice).filter(Boolean));
  for (const w of who) {
    if (castMap[w]) continue;
    const v = VOICES.find((x) => !used.has(x)) || VOICES[who.indexOf(w) % VOICES.length];
    used.add(v);
    castMap[w] = { voice: v, age: /아이|꼬마|아기|소년|소녀|child|boy|girl|kid/i.test(w) ? 'child' : /할머니|할아버지|노인|grand|old/i.test(w) ? 'old' : 'normal' };
  }
  el.cast.replaceChildren(...who.map((w) => {
    const c = castMap[w];
    const chip = document.createElement('span'); chip.className = 'chip';
    const n = document.createElement('b'); n.textContent = w;
    const vs = document.createElement('select'); vs.setAttribute('aria-label', `${w} 목소리`);
    for (const v of VOICES) vs.add(new Option(VOICE_LABEL[v], v, false, v === c.voice));
    const as = document.createElement('select'); as.setAttribute('aria-label', `${w} 나이`);
    for (const [k, l] of [['child', '아이'], ['normal', '보통'], ['adult', '어른'], ['old', '노인']]) as.add(new Option(l, k, false, k === c.age));
    const pv = document.createElement('button'); pv.type = 'button'; pv.className = 'small ghost'; pv.textContent = '▶'; pv.title = `${w} 목소리 듣기`;
    vs.onchange = () => { c.voice = vs.value; save(); renderSegs(); };
    as.onchange = () => { c.age = as.value; save(); renderSegs(); };
    pv.onclick = () => { const s = segs.find((x) => x.who === w); if (s) playSeg(segs.indexOf(s)); };
    chip.append(n, vs, as, pv);
    return chip;
  }));
}

/* ================= 문장 목록 ================= */
let segs = [];
let refreshT = 0; // 글을 고친 뒤 목록을 다시 나누기까지의 대기
const flush = () => { if (refreshT) refresh(); }; // 대기 중인 고침을 바로 반영
let curIdx = -1;
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
function renderSegs() {
  const frag = document.createDocumentFragment();
  segs.forEach((s, i) => {
    const li = document.createElement('li');
    li.dataset.i = i;
    if (cached(s)) li.classList.add('done');
    if (i === curIdx) li.classList.add('cur');
    const no = document.createElement('span'); no.className = 'no'; no.textContent = s.t != null ? fmt(s.t) : i + 1;
    const tx = document.createElement('button'); tx.type = 'button'; tx.className = 'tx';
    if (s.who && el.script.checked) { const b = document.createElement('b'); b.textContent = `${s.who} `; tx.append(b); }
    tx.append(s.text);
    const pcm = cached(s);
    const meta = document.createElement('span'); meta.className = 'meta';
    meta.textContent = `${pcm ? `${(pcm.length / tts.sampleRate).toFixed(1)}s · ` : ''}#${optsFor(s).seed}${seedOver[segKey(s)] != null ? '*' : ''}`;
    meta.title = '시드 (* = 다시 뽑은 시드)';
    const acts = document.createElement('span'); acts.className = 'acts';
    for (const [act, label, title] of [['play', '▶', '듣기'], ['re', '↻', '다시 뽑기(새 시드)'], ['dl', '⬇', 'WAV 저장']]) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'icon'; b.dataset.act = act; b.textContent = label; b.title = title;
      acts.append(b);
    }
    li.append(no, tx, meta, acts);
    frag.append(li);
  });
  el.segs.replaceChildren(frag);
  const chars = el.text.value.replace(TAG_RE, '').length;
  showSegInfo();
  el.count.textContent = `${chars.toLocaleString()}자`;
}
function showSegInfo() {
  const done = segs.filter((s) => cached(s)).length;
  el.segInfo.textContent = segs.length ? `${segs.length}개 · 만듦 ${done}${segs[0]?.t != null ? ' · 자막 시간' : ''}` : '';
}
function refresh() {
  clearTimeout(refreshT); refreshT = 0;
  segs = parse(el.text.value);
  renderCast();
  updateCursor(true);
  renderSegs();
}
const rowOf = (i) => el.segs.children[i];
function mark(i, cls, on = true) { rowOf(i)?.classList.toggle(cls, on); }
function markDone(i) {
  const li = rowOf(i); const s = segs[i]; const pcm = s && cached(s);
  if (!li || !pcm) return;
  li.classList.add('done');
  showSegInfo();
  li.querySelector('.meta').textContent = `${(pcm.length / tts.sampleRate).toFixed(1)}s · #${optsFor(s).seed}${seedOver[segKey(s)] != null ? '*' : ''}`;
}
el.segs.addEventListener('click', async (e) => {
  const li = e.target.closest('li'); if (!li) return;
  const i = Number(li.dataset.i); const s = segs[i];
  const act = e.target.dataset.act;
  if (!act) { // 문장 글자를 누르면 편집기 커서를 그 문장으로 옮기고 듣기
    el.text.setSelectionRange(s.start, s.start);
    updateCursor();
    playSeg(i);
    return;
  }
  if (act === 'play') playSeg(i);
  if (act === 're') reroll(i);
  if (act === 'dl') {
    try { download(new Blob([toWav(await synth(s.text, optsFor(s)))], { type: 'audio/wav' }), `tts-${stamp()}-${String(i + 1).padStart(3, '0')}.wav`); markDone(i); }
    catch (err) { report(err); }
  }
});

/* ================= 커서 ================= */
function indexAt(pos) {
  let k = -1;
  for (let i = 0; i < segs.length; i++) { if (segs[i].start <= pos) k = i; else break; }
  return k < 0 && segs.length ? 0 : k;
}
function updateCursor(silent = false) {
  const i = indexAt(el.text.selectionStart);
  if (i === curIdx && !silent) return;
  if (!silent) mark(curIdx, 'cur', false);
  curIdx = i;
  if (!silent && i >= 0) { mark(i, 'cur', true); rowOf(i)?.scrollIntoView({ block: 'nearest' }); }
  el.cursorInfo.textContent = i >= 0 ? `문장 ${i + 1} / ${segs.length}` : '';
}
for (const ev of ['click', 'keyup', 'select']) el.text.addEventListener(ev, () => updateCursor());

/* ================= 듣기 ================= */
let runId = 0;
let ctl = null;
const report = (e) => { if (e?.name !== 'AbortError') { console.error(e); setStatus(`실패: ${e.message}`); } };
function newRun() { runId++; ctl?.abort(); ctl = new AbortController(); stopSound(); for (const li of el.segs.querySelectorAll('.busy,.now')) li.classList.remove('busy', 'now'); return runId; }

async function playSeg(i) {
  const my = newRun(); const s = segs[i]; if (!s) return;
  ac(); mark(i, 'busy');
  try {
    const pcm = await synth(s.text, optsFor(s), ctl.signal);
    if (my !== runId) return;
    markDone(i); mark(i, 'busy', false); mark(i, 'now');
    await playPcm(pcm, 0, s.text);
    mark(i, 'now', false);
  } catch (e) { mark(i, 'busy', false); report(e); }
}
async function playSelection() {
  flush();
  const { selectionStart: a, selectionEnd: b } = el.text;
  const sel = el.text.value.slice(a, b).trim();
  if (!sel) { if (curIdx >= 0) playSeg(curIdx); return; }
  const my = newRun(); ac();
  try {
    const o = optsFor({ text: sel });
    const pcm = await synth(sel, o, ctl.signal);
    if (my === runId) await playPcm(pcm, 0, sel);
  } catch (e) { report(e); }
}
async function playFrom(from = null) {
  flush();
  if (from == null) from = Math.max(0, curIdx); // 비우면 커서 문장부터
  if (!segs.length) return;
  const my = newRun(); ac();
  const sig = ctl.signal;
  const pend = new Map();
  const get = (i) => {
    if (!pend.has(i)) {
      mark(i, 'busy');
      const p = synth(segs[i].text, optsFor(segs[i]), sig).then((pcm) => { markDone(i); mark(i, 'busy', false); return pcm; });
      p.catch(() => {});
      pend.set(i, p);
    }
    return pend.get(i);
  };
  try {
    for (let i = Math.max(0, from); i < segs.length; i++) {
      for (let k = 1; k <= 2 && i + k < segs.length; k++) get(i + k);
      const pcm = await get(i);
      if (my !== runId) return;
      mark(i, 'now'); rowOf(i)?.scrollIntoView({ block: 'nearest' });
      await playPcm(pcm, gapAfter(segs[i]), segs[i].text);
      mark(i, 'now', false);
      if (my !== runId) return;
    }
  } catch (e) { report(e); }
}
async function reroll(i) {
  const s = segs[i]; if (!s) return;
  seedOver[segKey(s)] = Math.floor(Math.random() * 1000000);
  save(); markDone(i);
  rowOf(i).querySelector('.meta').textContent = `#${optsFor(s).seed}*`;
  rowOf(i).classList.remove('done');
  await playSeg(i);
}
const gapAfter = (s) => Number(el.gap.value) + (s.para ? Number(el.para.value) : 0);
function stopAll() { newRun(); el.nowText.textContent = ''; }

/* ================= 전체 만들기·내보내기 ================= */
async function buildAll(label) {
  flush();
  if (!segs.length) throw new Error('글이 없어요');
  const my = newRun(); const sig = ctl.signal;
  el.progress.hidden = false;
  const total = segs.reduce((a, s) => a + s.text.length, 0);
  let doneChars = 0; const t0 = performance.now();
  const parts = [];
  try {
    for (let i = 0; i < segs.length; i++) {
      mark(i, 'busy');
      parts.push(await synth(segs[i].text, optsFor(segs[i]), sig));
      markDone(i); mark(i, 'busy', false);
      if (my !== runId) throw new DOMException('취소됨', 'AbortError');
      doneChars += segs[i].text.length;
      const frac = doneChars / total;
      const el2 = (performance.now() - t0) / 1000;
      const eta = frac > 0.02 ? el2 / frac - el2 : 0;
      el.bar.style.width = `${frac * 100}%`;
      setStatus(`${label} ${i + 1}/${segs.length}${eta ? ` · 남은 시간 약 ${Math.ceil(eta)}초` : ''}`);
    }
  } finally {
    setTimeout(() => { el.progress.hidden = true; el.bar.style.width = '0'; }, 600);
  }
  // 이어 붙일 위치: 자막이면 자막 시작 시간(앞이 길면 바로 뒤), 아니면 문장 쉼·문단 쉼
  const sr = tts.sampleRate;
  const timed = segs[0].t != null;
  let end = 0;
  const at = parts.map((p, i) => {
    const st = timed ? Math.max(end, Math.round(segs[i].t * sr)) : end;
    end = st + p.length + (timed ? 0 : Math.round((gapAfter(segs[i]) / 1000) * sr));
    return st;
  });
  if (!timed) end -= Math.round((gapAfter(segs[segs.length - 1]) / 1000) * sr); // 마지막 뒤 쉼은 뺌
  return { parts, at, total: Math.max(end, at[at.length - 1] + parts[parts.length - 1].length) };
}
function srtOf({ parts, at }) {
  const sr = tts.sampleRate;
  const t = (x) => { const ms = Math.round((x / sr) * 1000); const p = (n, l = 2) => String(n).padStart(l, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
  return segs.map((s, i) => `${i + 1}\n${t(at[i])} --> ${t(at[i] + parts[i].length)}\n${(s.who && el.script.checked ? `${s.who}: ` : '') + s.text.replace(TAG_RE, '').replace(/\s+/g, ' ').trim()}\n`).join('\n');
}
async function exportWav() {
  try {
    const r = await buildAll('WAV 만드는 중');
    const mix = new Float32Array(r.total);
    r.parts.forEach((p, i) => mix.set(p, r.at[i]));
    download(new Blob([toWav(mix)], { type: 'audio/wav' }), `tts-${stamp()}.wav`);
    setStatus(`저장 · ${(r.total / tts.sampleRate / 60).toFixed(1)}분 · ${tts.backend}`);
  } catch (e) { report(e); }
}
async function exportSrt() {
  try {
    const r = await buildAll('자막 시간 계산 중');
    download(new Blob([srtOf(r)], { type: 'text/plain;charset=utf-8' }), `tts-${stamp()}.srt`);
    setStatus(`자막 저장 · ${segs.length}개`);
  } catch (e) { report(e); }
}
async function exportZip() {
  try {
    const r = await buildAll('ZIP 만드는 중');
    const files = r.parts.map((p, i) => ({ name: `${String(i + 1).padStart(3, '0')}${segs[i].who && el.script.checked ? `_${hash(segs[i].who)}` : ''}.wav`, data: toWav(p) }));
    const enc = new TextEncoder();
    files.push({ name: 'timeline.srt', data: enc.encode(srtOf(r)) });
    files.push({ name: 'script.txt', data: enc.encode(segs.map((s, i) => `${String(i + 1).padStart(3, '0')}\t${s.who || ''}\t${s.text}`).join('\n')) });
    download(zipBlob(files), `tts-${stamp()}.zip`);
    setStatus(`ZIP 저장 · 문장 ${segs.length}개`);
  } catch (e) { report(e); }
}
async function generateAll() {
  try { await buildAll('미리 만드는 중'); setStatus(`모두 만듦 · ${segs.length}개 · ${tts.backend}`); } catch (e) { report(e); }
}

/* ================= 태그 버튼 ================= */
function insertTag(tag) {
  const ta = el.text;
  ta.focus();
  const s = ta.selectionStart; const e = ta.selectionEnd;
  const before = ta.value.slice(0, s); const after = ta.value.slice(e);
  // 앞뒤 띄어쓰기를 맞춤: 앞 글자가 붙어 있으면 한 칸, 뒤가 공백·문장부호면 띄우지 않음
  ta.setRangeText(`${before && !/\s$/.test(before) ? ' ' : ''}${tag}${!after || /^[\s.,!?…。，！？]/.test(after) ? '' : ' '}`, s, e, 'end');
  ta.dispatchEvent(new Event('input'));
}
TAGS.forEach(([tag, icon, name, official], i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = `btn tag${official ? '' : ' unofficial'}`;
  b.innerHTML = `<span>${icon}</span><span class="tag-name">${name}</span>`;
  b.title = `${tag} 넣기 (Alt+${(i + 1) % 10})${official ? '' : ' · 비공식 목록: 효과가 없을 수 있음'}`;
  b.addEventListener('mousedown', (e) => e.preventDefault()); // 커서 위치 유지
  b.onclick = () => insertTag(tag);
  el.tagbar.append(b);
});

/* ================= 단축키 ================= */
document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 'Enter') { e.preventDefault(); if (e.shiftKey) playFrom(); else playSelection(); return; }
  if (e.key === 'Escape' && !el.help.open) { stopAll(); closeSheet(); return; }
  if (mod && (e.key === 's' || e.key === 'S')) { e.preventDefault(); exportWav(); return; }
  if (mod && (e.key === 'o' || e.key === 'O')) { e.preventDefault(); el.file.click(); return; }
  if (e.altKey && (e.code === 'KeyR')) { e.preventDefault(); if (curIdx >= 0) reroll(curIdx); return; }
  if (e.altKey && /^Digit\d$/.test(e.code)) {
    const n = Number(e.code.slice(5)); const t = TAGS[(n + 9) % 10];
    if (t) { e.preventDefault(); insertTag(t[0]); }
    return;
  }
  if ((e.key === '?' || (e.shiftKey && e.code === 'Slash')) && !mod && !/textarea|input|select/i.test(document.activeElement?.tagName || '')) { e.preventDefault(); el.help.showModal(); }
});

/* ================= 파일 ================= */
el.file.onchange = async () => {
  const f = el.file.files[0]; if (!f) return;
  if (f.size > 3_000_000) { setStatus('3MB가 넘는 파일은 열 수 없어요'); return; }
  let t = await f.text();
  if (/\.vtt$/i.test(f.name)) t = t.replace(/^WEBVTT[^\n]*\n/, '');
  el.text.value = t.replace(/\r\n?/g, '\n');
  el.file.value = '';
  save(); refresh();
  setStatus(`열기 · ${f.name}`);
};
el.clearText.onclick = () => { if (el.text.value && !confirm('글을 모두 지울까요?')) return; el.text.value = ''; save(); refresh(); el.text.focus(); };

/* ================= 설정 시트(모바일) ================= */
const isSheet = () => matchMedia('(max-width: 899px)').matches;
function openSheet() { el.settings.classList.add('open'); el.sheetBackdrop.hidden = false; }
function closeSheet() { el.settings.classList.remove('open'); el.sheetBackdrop.hidden = true; }
el.openSettings.onclick = () => (el.settings.classList.contains('open') ? closeSheet() : openSheet());
el.closeSettings.onclick = closeSheet;
el.sheetBackdrop.onclick = closeSheet;
if (isSheet()) for (const d of el.settings.querySelectorAll('details')) d.open = d === el.settings.querySelector('details');

/* ================= 설정 변경 ================= */
for (const k of SET_KEYS) el[k].addEventListener('input', () => { showOutputs(); save(); renderSegs(); });
el.norm.onchange = save;
el.dice.onclick = () => { el.seed.value = String(Math.floor(Math.random() * 1000000)); el.seed.dispatchEvent(new Event('input')); };
el.resetSet.onclick = () => { applySettings(DEFAULTS); el.norm.checked = false; save(); renderSegs(); };
el.preview.onclick = async () => {
  const sample = { ko: '안녕하세요, 이 목소리로 읽어 드릴게요.', ja: 'こんにちは、この声で読みます。', na: 'Hello, I will read with this voice.' }[el.lang.value] || 'Hello, I will read with this voice.';
  const my = newRun(); ac();
  try { const pcm = await synth(sample, optsFor({ text: sample })); if (my === runId) await playPcm(pcm, 0, sample); } catch (e) { report(e); }
};
el.text.addEventListener('input', () => { save(); clearTimeout(refreshT); refreshT = setTimeout(refresh, 250); });
el.script.onchange = () => { save(); refresh(); };

/* ---- 프리셋 ---- */
function renderPresets() {
  const ps = store.get(PRESET_KEY, {});
  el.preset.replaceChildren(new Option('— 저장한 설정 —', ''), ...Object.keys(ps).map((n) => new Option(n, n)));
}
el.savePreset.onclick = () => {
  const name = prompt('프리셋 이름', `${VOICE_LABEL[el.voice.value]} ${el.lang.value}`);
  if (!name) return;
  const ps = store.get(PRESET_KEY, {}); ps[name] = settingsNow(); store.set(PRESET_KEY, ps);
  renderPresets(); el.preset.value = name;
};
el.delPreset.onclick = () => {
  const n = el.preset.value; if (!n) return;
  const ps = store.get(PRESET_KEY, {}); delete ps[n]; store.set(PRESET_KEY, ps); renderPresets();
};
el.preset.onchange = () => { const ps = store.get(PRESET_KEY, {}); if (ps[el.preset.value]) { applySettings(ps[el.preset.value]); save(); renderSegs(); } };

/* ---- 엔진 선택 ---- */
{
  const q = new URLSearchParams(location.search);
  const m = Object.entries(MODELS).find(([, v]) => v === q.get('model'));
  el.model.value = m ? m[0] : 'auto';
  el.ep.value = ['webgpu', 'wasm'].includes(q.get('ep')) ? q.get('ep') : 'auto';
  el.model.onchange = el.ep.onchange = () => { el.applyEngine.disabled = false; };
  el.applyEngine.onclick = () => {
    const p = new URLSearchParams(location.search);
    for (const k of ['model', 'ep', 'strict']) p.delete(k);
    if (el.model.value !== 'auto') { p.set('model', MODELS[el.model.value]); p.set('strict', '1'); }
    if (el.ep.value !== 'auto') p.set('ep', el.ep.value);
    location.search = p.toString();
  };
  el.clearModels.onclick = async () => {
    if (!confirm('받아 둔 모델 파일을 지울까요? 다음에 열 때 다시 받습니다.')) return;
    try { for (const k of await caches.keys()) if (k.startsWith('supertonic')) await caches.delete(k); } catch (_) { /* 미지원 */ }
    location.reload();
  };
}

/* ---- 버튼 ---- */
el.playCur.onclick = () => playSelection();
el.playFrom.onclick = () => playFrom();
el.stop.onclick = stopAll;
el.saveWav.onclick = exportWav;
el.saveSrt.onclick = exportSrt;
el.saveZip.onclick = exportZip;
document.getElementById('saveSrt2').onclick = exportSrt;
document.getElementById('saveZip2').onclick = exportZip;
el.genAll.onclick = generateAll;
el.helpBtn.onclick = () => el.help.showModal();

/* ================= 시작 ================= */
load();
renderPresets();
showOutputs();
refresh();
drawWave();
