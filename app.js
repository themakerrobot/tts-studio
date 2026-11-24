// TTS Studio — Supertonic 3 음성 합성 작업 도구 (브라우저 안에서, 서버 없음)
// 편집기 하나 + 문장 목록: 커서 문장 바로 듣기, 문장별 다시 뽑기(후보 3개), 문장별 설정, 대본(인물별 목소리),
// 쉼 표기([1초]), 읽기 사전, 자막 시간 맞춤, WAV · SRT · 문장별 ZIP · 프로젝트(.json) 내보내기, 단축키.
import { createTTS, VOICES } from './tts-client.js';
import { sentenceEnds } from './sentences.js';

const $ = (id) => document.getElementById(id);
// index.html 의 SVG 아이콘 묶음(<symbol id="i-…">)에서 하나를 씀
const ic = (name) => `<svg class="ic" aria-hidden="true"><use href="#i-${name}"/></svg>`;

/* ================= 상수 ================= */
// Supertonic 3 공식 31개 언어 + na(언어 미지정: 언어 태그 없이 처리. 언어 판별 기능은 아님, 공식 GitHub README)
const LANGS = [
  ['na', '언어 미지정'], ['ko', '한국어'], ['en', 'English'], ['ja', '日本語'], ['ar', 'العربية'],
  ['bg', 'Български'], ['cs', 'Čeština'], ['da', 'Dansk'], ['de', 'Deutsch'], ['el', 'Ελληνικά'], ['es', 'Español'],
  ['et', 'Eesti'], ['fi', 'Suomi'], ['fr', 'Français'], ['hi', 'हिन्दी'], ['hr', 'Hrvatski'], ['hu', 'Magyar'],
  ['id', 'Bahasa Indonesia'], ['it', 'Italiano'], ['lt', 'Lietuvių'], ['lv', 'Latviešu'], ['nl', 'Nederlands'],
  ['pl', 'Polski'], ['pt', 'Português'], ['ro', 'Română'], ['ru', 'Русский'], ['sk', 'Slovenčina'],
  ['sl', 'Slovenščina'], ['sv', 'Svenska'], ['tr', 'Türkçe'], ['uk', 'Українська'], ['vi', 'Tiếng Việt'],
];
// 목소리 미리 듣기 문장(고른 언어로)
const SAMPLES = {
  ko: '안녕하세요, 만나서 반가워요.', en: 'Hello, nice to meet you.', ja: 'こんにちは、はじめまして。',
  ar: 'مرحبا، تشرفت بلقائك.', bg: 'Здравейте, приятно ми е да се запознаем.', cs: 'Dobrý den, rád vás poznávám.',
  da: 'Hej, rart at møde dig.', de: 'Hallo, schön, dich kennenzulernen.', el: 'Γεια σας, χάρηκα πολύ.',
  es: 'Hola, encantado de conocerte.', et: 'Tere, meeldiv tutvuda.', fi: 'Hei, hauska tavata.',
  fr: 'Bonjour, ravi de vous rencontrer.', hi: 'नमस्ते, आपसे मिलकर खुशी हुई।', hr: 'Bok, drago mi je.',
  hu: 'Szia, örülök, hogy megismerhetlek.', id: 'Halo, senang bertemu dengan Anda.', it: 'Ciao, piacere di conoscerti.',
  lt: 'Labas, malonu susipažinti.', lv: 'Sveiki, prieks iepazīties.', nl: 'Hallo, leuk je te ontmoeten.',
  pl: 'Cześć, miło cię poznać.', pt: 'Olá, prazer em conhecê-lo.', ro: 'Bună, încântat de cunoștință.',
  ru: 'Здравствуйте, приятно познакомиться.', sk: 'Dobrý deň, teší ma.', sl: 'Pozdravljeni, me veseli.',
  sv: 'Hej, trevligt att träffas.', tr: 'Merhaba, tanıştığıma memnun oldum.', uk: 'Привіт, радий познайомитися.',
  vi: 'Xin chào, rất vui được gặp bạn.', na: 'Hello, nice to meet you.',
};
const VOICE_LABEL = { F1: '여성 1', F2: '여성 2', F3: '여성 3', F4: '여성 4', F5: '여성 5', M1: '남성 1', M2: '남성 2', M3: '남성 3', M4: '남성 4', M5: '남성 5' };
// 표현 태그 10개: 앞의 3개만 공식 문서에 이름이 있음. 나머지 7개는 제3자 실행기 README의 목록(비공식)
const TAGS = [
  ['<laugh>', '😄', '웃음', true], ['<breath>', '🌬️', '숨', true], ['<sigh>', '😮‍💨', '한숨', true],
  ['<clear-throat>', '🗣️', '헛기침'], ['<cough>', '😷', '기침'], ['<sneeze>', '🤧', '재채기'], ['<sniff>', '👃', '훌쩍'],
  ['<groan>', '😣', '끙'], ['<yawn>', '🥱', '하품'], ['<hmm>', '🤔', '음…'],
];
const TAG_RE = /<[a-z-]+>/g;
// 쉼 표기: [1초] [0.5초] [1.5s] [500ms] (최대 10초)
const PAUSE_RE = /\[\s*(\d+(?:\.\d+)?)\s*(초|s|ms)\s*\]/gi;
const pauseMs = (n, unit) => Math.min(10000, unit.toLowerCase() === 'ms' ? Number(n) : Number(n) * 1000);
const PUNCT_RE = /[\s.,!?…。、，！？।؟]/g;
// 화면·자막용: 태그와 쉼 표기를 뺀 글
const plain = (t) => t.replace(TAG_RE, '').replace(PAUSE_RE, '').replace(/\s+/g, ' ').trim();
// 나이: 음 높이는 합성 뒤 다시 표본화로 바꾸고, 합성 빠르기를 그만큼 나눠 말 빠르기는 유지
const AGES = { child: { pitch: 1.1, speed: 1.05 }, normal: { pitch: 1, speed: 1 }, adult: { pitch: 0.96, speed: 0.97 }, old: { pitch: 0.92, speed: 0.9 } };
const AGE_LABEL = [['child', '아이'], ['normal', '보통'], ['adult', '어른'], ['old', '노인']];
const SET_KEYS = ['lang', 'voice', 'age', 'speed', 'pitch', 'steps', 'seed', 'tagMode', 'gap', 'para', 'gain', 'rate'];
const DEFAULTS = { voice: 'F1', age: 'normal', speed: '1', pitch: '1', steps: '8', seed: '', tagMode: 'auto', gap: '300', para: '700', gain: '1', rate: '44100' };
const MODELS = {
  f32: 'leeyunjai/edge-lab@main/tts',
  int8: 'leeyunjai/edge-lab@71800e5/tts-int8',
  official: 'supertone-oss-archive/supertonic-3@aafc6e32416a594460b32413efc49d7fe4ce6d46',
};
// 문장별 설정 선택지
const SPEED_OPTS = [0.7, 0.8, 0.9, 1.1, 1.2, 1.3, 1.5];
const GAP_OPTS = [0, 150, 300, 500, 1000, 1500, 2000, 3000];
const KEY = 'tts-studio:v2';
const PRESET_KEY = 'tts-studio:presets';
const DICT_KEY = 'tts-studio:dict';
const THEME_KEY = 'tts-studio:theme';
const PROJECT_TYPE = 'tts-studio-project';

/* ================= 화면 요소 ================= */
const ids = ['engine', 'themeBtn', 'helpBtn', 'settings', 'closeSettings', 'sheetBackdrop', 'openSettings', 'lang', 'voice', 'preview', 'age',
  'preset', 'savePreset', 'delPreset', 'speed', 'pitch', 'steps', 'seed', 'dice', 'tagMode', 'dictCount', 'dictList', 'dictAdd',
  'gap', 'para', 'gain', 'norm', 'rate', 'resetSet', 'model', 'ep', 'applyEngine', 'clearModels', 'modelInfo',
  'file', 'saveProject', 'script', 'clearText', 'tagbar', 'text', 'cast', 'count', 'cursorInfo', 'segInfo', 'genAll', 'segs',
  'playCur', 'playFrom', 'stop', 'wave', 'nowText', 'saveWav', 'saveSrt', 'saveZip', 'saveSrt2', 'saveZip2', 'bar', 'help',
  'ask', 'askTitle', 'askMsg', 'askBtns'];
const el = Object.fromEntries(ids.map((k) => [k, $(k)]));
el.progress = document.querySelector('.progress');
el.waveWrap = document.querySelector('.wave-wrap');
for (const k of ['speed', 'pitch', 'steps', 'gap', 'para', 'gain']) el[`${k}Out`] = $(`${k}Out`);

for (const [code, name] of LANGS) el.lang.add(new Option(`${name} (${code})`, code));
for (const v of VOICES) el.voice.add(new Option(VOICE_LABEL[v], v));

/* ================= 저장 ================= */
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* 공간 없음 */ } },
};
let castMap = {};   // 대본: 인물 → { voice, age }
let seedOver = {};  // 문장별로 고른 시드: 문장 키 → 시드
let takes = {};     // 다시 뽑기 후보: 문장 키 → [시드…] (최근 3개)
let segOpt = {};    // 문장별 설정: 문장 키 → { voice, speed, gap }
let dict = [];      // 읽기 사전: [[원래 글, 읽을 말]…]
const settingsNow = () => ({ ...Object.fromEntries(SET_KEYS.map((k) => [k, el[k].value])), norm: el.norm.checked });
function applySettings(s) {
  for (const k of SET_KEYS) if (s[k] != null) el[k].value = s[k];
  if (s.norm != null) el.norm.checked = !!s.norm;
  showOutputs();
}
function load() {
  const s = store.get(KEY, {});
  applySettings(s);
  // 저장된 언어가 없으면(첫 방문) 브라우저 언어, 목록에 없으면 한국어. select 는 늘 첫 항목 값이 있어서 저장값으로 판단함
  if (!LANGS.some(([c]) => c === s.lang)) {
    const nav = (navigator.language || '').slice(0, 2).toLowerCase();
    el.lang.value = LANGS.some(([c]) => c === nav && c !== 'na') ? nav : 'ko';
  }
  el.text.value = s.text || '';
  el.script.checked = !!s.script;
  castMap = s.cast || {};
  seedOver = s.seedOver || {};
  takes = s.takes || {};
  segOpt = s.segOpt || {};
  dict = store.get(DICT_KEY, []);
  compileDict();
}
// 문장 키로 남겨 둔 값(시드·후보·문장별 설정)이 너무 많아지면 지금 글에 없는 것부터 정리
function prune(map) {
  const keys = Object.keys(map);
  if (keys.length < 400) return map;
  const live = new Set(segs.map(segKey));
  return Object.fromEntries(keys.filter((k) => live.has(k)).map((k) => [k, map[k]]));
}
let saveT = 0;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    seedOver = prune(seedOver); takes = prune(takes); segOpt = prune(segOpt);
    store.set(KEY, { ...settingsNow(), text: el.text.value.slice(0, 300000), script: el.script.checked, cast: castMap, seedOver, takes, segOpt });
  }, 300);
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
// 상태 문구 + 왼쪽 표시등(load 준비 중 / ok 준비됨 / busy 만드는 중 / error 실패)
const setStatus = (m, state = ready ? 'ok' : 'load') => { el.engine.textContent = m; el.engine.dataset.state = state; el.engine.title = m; };
const readyStatus = () => { if (ready) setStatus(`준비 · ${tts.backend} · ${tts.source || ''}`, 'ok'); };
const loading = tts.load(setStatus).then(() => {
  ready = true;
  readyStatus();
  refreshModelInfo();
}, (e) => { console.error(e); setStatus(`엔진을 불러오지 못했어요: ${e.message}`, 'error'); refreshModelInfo(); });

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 1000000; };
// 낭독용 표기: 검열 표시(××)는 한국어에서만 '모모'로 읽고, 책 제목 괄호는 소리 내지 않음
const speakable = (t, lang) => (lang === 'ko' ? t.replace(/[×○]{2,}/g, '모모') : t).replace(/[「」『』《》〈〉]/g, '').trim();
// 표현 태그 처리. 개발사 설명: 태그 학습 데이터는 주로 한국어·영어·일본어라 그 밖 언어에서는 태그를 글자로 읽기도 함.
// 자동 = 한·영·일·언어 미지정(na)에서는 그대로, 그 밖 언어에서는 빼고 읽음. 두 번 겹치기는 효과를 키우지만 글자로 읽힐 수도 있음.
const TAG_LANGS = ['ko', 'en', 'ja', 'na'];
function applyTags(text, lang, mode) {
  const m = mode === 'auto' ? (TAG_LANGS.includes(lang) ? 'keep' : 'strip') : mode;
  if (m === 'strip') return text.replace(TAG_RE, ' ').replace(/\s+/g, ' ').trim();
  if (m === 'double') return text.replace(TAG_RE, (t) => `${t} ${t}`);
  return text;
}

/* ---- 읽기 사전 ---- */
// 한 번에 바꾸는 정규식 하나로 만듦(바꾼 말을 다시 바꾸지 않도록). 긴 말 먼저, 영문은 대소문자 무시·단어 단위
let dictRe = null;
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function compileDict() {
  const ents = dict.map(([a, b]) => [String(a || '').trim(), String(b ?? '')]).filter(([a]) => a).sort((x, y) => y[0].length - x[0].length);
  el.dictCount.textContent = ents.length ? String(ents.length) : '';
  if (!ents.length) { dictRe = null; return; }
  const map = new Map(ents.map(([a, b]) => [a.toLowerCase(), b]));
  const alt = ents.map(([a]) => `${/^[A-Za-z0-9]/.test(a) ? '(?<![A-Za-z0-9])' : ''}${escRe(a)}${/[A-Za-z0-9]$/.test(a) ? '(?![A-Za-z0-9])' : ''}`);
  try { dictRe = { re: new RegExp(alt.join('|'), 'giu'), map }; } catch (_) { dictRe = null; }
}
const applyDict = (t) => (dictRe ? t.replace(dictRe.re, (m) => dictRe.map.get(m.toLowerCase()) ?? m) : t);

/* ---- 문장 키·합성 설정 ---- */
const segKey = (s) => `${s.who || ''}\u0001${s.text}`;
// 한 문장의 합성 설정: 전체 설정 < 대본 인물 < 문장별 설정, 시드는 고른 후보 > 전체 시드 > 문장 내용으로 정한 시드
function optsFor(seg) {
  const k = segKey(seg);
  const c = seg.who && el.script.checked ? castMap[seg.who] : null;
  const so = segOpt[k] || {};
  const seed = seedOver[k] ?? (el.seed.value !== '' ? Number(el.seed.value) : hash(seg.text));
  return {
    lang: el.lang.value, voice: so.voice || c?.voice || el.voice.value, age: c?.age || el.age.value,
    speed: Number(so.speed || el.speed.value), pitch: Number(el.pitch.value), steps: Number(el.steps.value), seed, tagMode: el.tagMode.value,
  };
}
// 모델에 넣기 전 글: 태그 처리 → 읽기 사전 (쉼 표기는 합성 때 나눔)
const prepare = (text, o) => applyDict(applyTags(text, o.lang, o.tagMode));
const keyOf = (o, text) => `${o.lang}|${o.voice}|${o.age}|${o.speed}|${o.pitch}|${o.steps}|${o.seed}|${prepare(text, o)}`;
function splitPauses(t) {
  const out = []; let last = 0;
  for (const m of t.matchAll(PAUSE_RE)) { out.push({ text: t.slice(last, m.index), pause: pauseMs(m[1], m[2]) }); last = m.index + m[0].length; }
  out.push({ text: t.slice(last), pause: 0 });
  return out;
}

/* ---- 합성(캐시·같은 문장 동시 요청 합치기) ---- */
const cache = new Map();
const inflight = new Map();
const MAX_CACHE = 600;
async function synth(text, o, signal) {
  if (!ready) await loading; // 아직 불러오는 중이면 끝날 때까지 기다림
  if (!ready) throw new Error('엔진을 불러오지 못했어요');
  const k = keyOf(o, text);
  if (cache.has(k)) return cache.get(k);
  // 같은 문장을 이미 만드는 중이면 그 결과를 기다림. 그쪽이 취소됐으면 직접 만듦
  if (inflight.has(k)) {
    try { return await inflight.get(k); } catch (e) { if (e?.name !== 'AbortError' || signal?.aborted) throw e; }
  }
  const p = synthRaw(text, o, signal, k);
  inflight.set(k, p);
  try { return await p; } finally { if (inflight.get(k) === p) inflight.delete(k); }
}
async function synthRaw(text, o, signal, k) {
  const a = AGES[o.age] || AGES.normal;
  const pitch = a.pitch * o.pitch;
  const sr = tts.sampleRate;
  const parts = [];
  const pieces = splitPauses(prepare(text, o));
  for (let j = 0; j < pieces.length; j++) {
    const sp = speakable(pieces[j].text, o.lang);
    if (sp.replace(PUNCT_RE, '')) {
      const raw = await tts.synth(sp, { voice: o.voice, lang: o.lang, steps: o.steps, speed: o.speed * a.speed / pitch, seed: o.seed + j * 101, signal });
      parts.push(pitch === 1 ? raw : resample(raw, pitch));
    }
    if (pieces[j].pause) parts.push(new Float32Array(Math.round((pieces[j].pause / 1000) * sr)));
  }
  const pcm = new Float32Array(parts.reduce((n, p) => n + p.length, 0) || 1);
  let off = 0; for (const p of parts) { pcm.set(p, off); off += p.length; }
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

/* ---- ZIP(압축 없이 담기, 파일 이름 UTF-8) ---- */
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
// ZIP 안 파일 이름: 001_민준_서버 없이 정말.wav (파일 이름에 못 쓰는 글자는 뺌)
const fileSafe = (t, n = 24) => [...plain(t).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').replace(/[.,!?…。、，！？।؟]+$/u, '').trim()].slice(0, n).join('').trim().replace(/\s+/g, '_');
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
let lastWave = null;
function ac() {
  try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (_) { /* 미지원 */ }
  audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
const isPaused = () => !!(playing && audioCtx && audioCtx.state === 'suspended');
// 재생 버튼: 재생 중이면 일시정지 모양, 아니면 재생 모양
function syncPlayBtn() {
  const pauseLook = playing && !isPaused();
  el.playCur.innerHTML = ic(pauseLook ? 'pause' : 'play');
  el.playCur.setAttribute('aria-label', pauseLook ? '일시정지' : isPaused() ? '이어 듣기' : '듣기');
  el.waveWrap.classList.toggle('paused', isPaused());
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
    source.onended = () => { source = null; playing = null; drawWave(); syncPlayBtn(); resolve(); };
    source.start();
    playing = { pcm: p, start: c.currentTime, dur: p.length / tts.sampleRate };
    el.nowText.textContent = plain(label);
    drawWave(); animate(); syncPlayBtn();
  });
}
function stopSound() {
  if (source) { source.onended = null; try { source.stop(); } catch (_) { /* 끝남 */ } source = null; }
  playing = null;
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  syncPlayBtn();
}
async function togglePause() {
  if (!playing || !audioCtx) return false;
  if (audioCtx.state === 'suspended') await audioCtx.resume(); else await audioCtx.suspend();
  syncPlayBtn();
  if (!isPaused()) animate();
  return true;
}
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
  if (!playing || !audioCtx || isPaused()) return;
  drawWave(Math.min(1, (audioCtx.currentTime - playing.start) / playing.dur));
  requestAnimationFrame(animate);
}
addEventListener('resize', () => drawWave());

/* ================= 글 넣기(되돌리기 기록 유지) ================= */
// textarea.value 로 바꾸면 Ctrl+Z 기록이 사라지므로, 가능한 브라우저에서는 '입력'으로 넣음
function replaceText(start, end, str) {
  const ta = el.text;
  ta.focus();
  ta.setSelectionRange(start, end);
  let ok = false;
  if (str.length < 200000 && end - start < 400000) {
    try { ok = str ? document.execCommand('insertText', false, str) : document.execCommand('delete'); } catch (_) { ok = false; }
  }
  if (!ok) { ta.setRangeText(str, start, end, 'end'); }
  save(); refresh();
}

/* ================= 글 나누기 (위치 포함) ================= */
// seg: { text, who, start, end (글자 위치), para (문단 끝), t (자막 시작 초) }
const SRT_TIME = /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/;
const toSec = (h, m, s, ms) => Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, '0')) / 1000;
// 소리 낼 글이 없는 조각(태그·쉼 표기·문장부호뿐)
const onlyMarks = (t) => !t.replace(TAG_RE, '').replace(PAUSE_RE, '').replace(PUNCT_RE, '');
function parse(text) {
  const out = [];
  if (SRT_TIME.test(text)) {
    const re = /(^|\n)[^\n]*?(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})[^\n]*\n([\s\S]*?)(?=\n\s*\n|$)/g;
    let m;
    while ((m = re.exec(text))) {
      const t = m[2].match(SRT_TIME);
      const body = m[3].replace(/<\/?[ibu]>|\{[^}]*\}/g, '').replace(/\s*\n\s*/g, ' ').trim();
      if (!body) continue;
      const start = m.index + m[0].length - m[3].length;
      out.push({ text: body, start, end: start + m[3].length, t: toSec(t[1], t[2], t[3], t[4]) });
    }
    return out;
  }
  let pos = 0;
  const lines = text.split('\n');
  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    const lineStart = pos;
    pos += raw.length + 1;
    if (!raw.trim()) { if (out.length) out[out.length - 1].para = true; continue; }
    let body = raw; let off = 0;
    const md = body.match(/^(\s*(?:#+|[-*]|\d+[.)])\s+)/); // 마크다운 제목·목록 기호
    if (md) { off = md[1].length; body = body.slice(off); }
    let who = null;
    if (el.script.checked) {
      const sm = body.match(/^([^:：[\]]{1,24})\s*[:：]\s*/);
      if (sm) { who = sm[1].trim(); off += sm[0].length; body = body.slice(sm[0].length); }
    }
    // 문장 끝에서 자름(기준: sentences.js)
    let s0 = 0;
    let lead = null; // 줄 앞의 태그·쉼 조각(다음 문장 앞에 붙임)
    const cut = (a, b) => {
      const piece = body.slice(a, b);
      const sp = piece.length - piece.trimStart().length;
      const t = piece.trim();
      if (!t) return;
      const start = lineStart + off + a + sp; const end = start + t.length;
      // 태그·쉼만 있는 조각('…요. <laugh>', '…요. [1초]')은 같은 줄의 앞 문장 끝에 붙임. 줄 첫 조각이면 다음 문장 앞에 붙임
      if (onlyMarks(t)) {
        const prev = out[out.length - 1];
        if (prev && prev.end >= lineStart && prev.who === who) { prev.text += ` ${t}`; prev.end = end; }
        else lead = lead ? { text: `${lead.text} ${t}`, start: lead.start } : { text: t, start };
        return;
      }
      if (lead) { out.push({ text: `${lead.text} ${t}`, who, start: lead.start, end }); lead = null; return; }
      out.push({ text: t, who, start, end });
    };
    for (const e of sentenceEnds(body)) { cut(s0, e); s0 = e; }
    cut(s0, body.length);
    // 줄 전체가 태그·쉼뿐이면 바로 앞 문장 끝에 붙임
    if (lead && out.length) { const prev = out[out.length - 1]; prev.text += ` ${lead.text}`; }
  }
  return out;
}

/* ================= 대본: 인물 목소리 ================= */
// 새 인물 기본 목소리: 해설(기본 목소리)과 겹치지 않게, 남성·여성을 번갈아
const castOrder = () => {
  const pick = (g) => VOICES.filter((v) => v[0] === g && v !== el.voice.value);
  const m = pick('M'); const f = pick('F');
  return Array.from({ length: Math.max(m.length, f.length) }, (_, i) => [m[i], f[i]]).flat().filter(Boolean);
};
// 이름 없는 첫 줄은 기본 목소리(해설)로 읽힘
const SCRIPT_SAMPLE = '두 사람이 마주 앉았습니다.\n민준: 오늘 녹음 준비됐어?\n서연: 응, 바로 시작하자.';
function renderCast() {
  const who = el.script.checked ? [...new Set(segs.map((s) => s.who).filter(Boolean))] : [];
  el.cast.hidden = !el.script.checked;
  if (!el.script.checked) { el.cast.replaceChildren(); return; }
  const head = document.createElement('span'); head.className = 'cast-head';
  head.innerHTML = `${ic('users')}<span>인물</span>`;
  if (!who.length) {
    // 대본 모드인데 '이름: 대사' 줄이 없음 → 체크해도 바뀌는 게 없으므로 형식을 알려 줌
    const tip = document.createElement('span'); tip.className = 'cast-tip';
    tip.textContent = "'이름: 대사' 형식의 줄이 없어요. 줄 앞에 이름과 쌍점(:)을 쓰면 인물마다 목소리를 따로 줄 수 있습니다.";
    const ex = document.createElement('button'); ex.type = 'button'; ex.textContent = '예시 넣기';
    ex.onclick = () => {
      const v = el.text.value; const t = v.replace(/\s+$/, '');
      replaceText(t.length, v.length, t ? `\n\n${SCRIPT_SAMPLE}` : SCRIPT_SAMPLE);
    };
    el.cast.replaceChildren(head, tip, ex);
    return;
  }
  const order = castOrder();
  const used = new Set(who.map((w) => castMap[w]?.voice).filter(Boolean));
  for (const w of who) {
    if (castMap[w]) continue;
    const v = order.find((x) => !used.has(x)) || order[who.indexOf(w) % order.length];
    used.add(v);
    castMap[w] = { voice: v, age: /아이|꼬마|아기|소년|소녀|child|boy|girl|kid/i.test(w) ? 'child' : /할머니|할아버지|노인|grand|old/i.test(w) ? 'old' : 'normal' };
  }
  el.cast.replaceChildren(head, ...who.map((w) => {
    const c = castMap[w];
    const chip = document.createElement('span'); chip.className = 'chip';
    const n = document.createElement('b'); n.textContent = w;
    const vs = document.createElement('select'); vs.setAttribute('aria-label', `${w} 목소리`);
    for (const v of VOICES) vs.add(new Option(VOICE_LABEL[v], v, false, v === c.voice));
    const as = document.createElement('select'); as.setAttribute('aria-label', `${w} 나이`);
    for (const [k, l] of AGE_LABEL) as.add(new Option(l, k, false, k === c.age));
    const pv = document.createElement('button'); pv.type = 'button'; pv.className = 'icon'; pv.innerHTML = ic('play'); pv.title = `${w} 목소리 듣기`;
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
const openRows = new Set(); // ⋯ 로 펼친 문장(문장 키)
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const sel = (k, opts, cur) => {
  const s = document.createElement('select'); s.dataset.k = k;
  for (const [v, l] of opts) s.add(new Option(l, v, false, String(v) === String(cur ?? '')));
  return s;
};
function makeRow(s, i) {
  const k = segKey(s);
  const li = document.createElement('li');
  li.dataset.i = i;
  const pcm = cached(s);
  if (pcm) li.classList.add('done');
  if (i === curIdx) li.classList.add('cur');
  if (segOpt[k] && Object.keys(segOpt[k]).length) li.classList.add('custom');
  const no = document.createElement('span'); no.className = 'no'; no.textContent = s.t != null ? fmt(s.t) : i + 1;
  const tx = document.createElement('button'); tx.type = 'button'; tx.className = 'tx';
  if (s.who && el.script.checked) { const b = document.createElement('b'); b.textContent = `${s.who} `; tx.append(b); }
  tx.append(s.text);
  // 아래 줄: 길이 + 다시 뽑기 후보(1·2·3)
  const meta = document.createElement('span'); meta.className = 'meta';
  const seed = optsFor(s).seed;
  meta.title = `시드 #${seed}`;
  const dur = document.createElement('span'); dur.textContent = pcm ? `${(pcm.length / tts.sampleRate).toFixed(1)}s` : '';
  meta.append(dur);
  const tk = takes[k];
  if (tk?.length > 1) {
    const box = document.createElement('span'); box.className = 'takes'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', '다시 뽑기 후보');
    tk.forEach((sd, n) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'take'; b.dataset.act = 'take'; b.dataset.seed = sd;
      b.textContent = n + 1; b.title = `후보 ${n + 1} 듣기 (시드 #${sd})`;
      b.setAttribute('aria-pressed', String(sd === seed));
      box.append(b);
    });
    meta.append(box);
  }
  const acts = document.createElement('span'); acts.className = 'acts';
  for (const [act, label, title] of [['play', 'play', '듣기'], ['re', 'reroll', '다시 뽑기 (후보 3개까지)'], ['more', 'more', '이 문장 설정·저장']]) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'icon'; b.dataset.act = act; b.innerHTML = ic(label); b.title = title; b.setAttribute('aria-label', title);
    if (act === 'more') b.setAttribute('aria-expanded', String(openRows.has(k)));
    acts.append(b);
  }
  li.append(no, tx, meta, acts);
  if (openRows.has(k)) li.append(morePanel(s, k, seed)), li.classList.add('open');
  return li;
}
// ⋯ 로 펼치는 문장별 설정: 목소리·빠르기·뒤 쉼, 이 문장 WAV 저장
function morePanel(s, k, seed) {
  const so = segOpt[k] || {};
  const box = document.createElement('div'); box.className = 'more';
  const field = (label, control) => { const l = document.createElement('label'); const t = document.createElement('span'); t.textContent = label; l.append(t, control); return l; };
  box.append(
    field('목소리', sel('voice', [['', '기본'], ...VOICES.map((v) => [v, VOICE_LABEL[v]])], so.voice)),
    field('빠르기', sel('speed', [['', '기본'], ...SPEED_OPTS.map((v) => [v, `${v.toFixed(1)}×`])], so.speed)),
    field('뒤 쉼', sel('gap', [['', '기본'], ...GAP_OPTS.map((v) => [v, v ? `${v / 1000}초` : '없음'])], so.gap)),
  );
  const row = document.createElement('span'); row.className = 'more-acts';
  const dl = document.createElement('button'); dl.type = 'button'; dl.dataset.act = 'dl'; dl.innerHTML = `${ic('download')}<span>WAV</span>`; dl.title = '이 문장만 WAV 로 저장';
  const rs = document.createElement('button'); rs.type = 'button'; rs.dataset.act = 'reset'; rs.textContent = '기본으로'; rs.disabled = !Object.keys(so).length;
  const sd = document.createElement('span'); sd.className = 'muted'; sd.textContent = `시드 #${seed}`;
  row.append(dl, rs, sd);
  box.append(row);
  return box;
}
function renderSegs() {
  const frag = document.createDocumentFragment();
  segs.forEach((s, i) => frag.append(makeRow(s, i)));
  el.segs.replaceChildren(frag);
  showSegInfo();
  el.count.textContent = `${plain(el.text.value).length.toLocaleString()}자`;
}
// 한 줄만 다시 그림(재생 표시·키보드 위치 유지)
function updateRow(i) {
  const old = rowOf(i); const s = segs[i];
  if (!old || !s) return;
  const li = makeRow(s, i);
  for (const c of ['busy', 'now', 'cur']) li.classList.toggle(c, old.classList.contains(c));
  const focusAct = old.contains(document.activeElement) ? (document.activeElement.dataset.act || 'tx') : null;
  old.replaceWith(li);
  if (focusAct) (li.querySelector(focusAct === 'tx' ? '.tx' : `[data-act="${focusAct}"]`) || li.querySelector('.tx'))?.focus();
}
function showSegInfo() {
  const done = segs.filter((s) => cached(s)).length;
  el.segInfo.textContent = segs.length ? `${segs.length}개 · 만듦 ${done}${segs[0]?.t != null ? ' · 자막 시간' : ''}` : '';
  idleWave();
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
function markDone(i) { if (segs[i] && cached(segs[i])) { updateRow(i); showSegInfo(); } }
function setCursorTo(i) {
  const s = segs[i]; if (!s) return;
  el.text.setSelectionRange(s.start, s.start);
  updateCursor();
}
el.segs.addEventListener('click', async (e) => {
  const li = e.target.closest('li'); if (!li) return;
  const i = Number(li.dataset.i); const s = segs[i]; if (!s) return;
  const k = segKey(s);
  const actEl = e.target.closest('[data-act]');
  const act = actEl?.dataset.act;
  if (!act) {
    if (e.target.closest('.more')) return; // 펼친 설정 칸 안을 누른 것은 듣기가 아님
    setCursorTo(i); playSeg(i); // 문장 글자를 누르면 편집기 커서를 그 문장으로 옮기고 듣기
    return;
  }
  if (act === 'play') playSeg(i);
  if (act === 're') reroll(i);
  if (act === 'take') { seedOver[k] = Number(actEl.dataset.seed); save(); updateRow(i); playSeg(i); }
  if (act === 'more') { if (openRows.has(k)) openRows.delete(k); else openRows.add(k); updateRow(i); }
  if (act === 'reset') { delete segOpt[k]; save(); updateRow(i); showSegInfo(); }
  if (act === 'dl') {
    try {
      const name = `tts-${stamp()}-${String(i + 1).padStart(3, '0')}.wav`;
      download(new Blob([toWav(await synth(s.text, optsFor(s)))], { type: 'audio/wav' }), name); markDone(i);
    } catch (err) { report(err); }
  }
});
// 문장별 설정 바꾸기
el.segs.addEventListener('change', (e) => {
  const s0 = e.target.closest('.more select'); if (!s0) return;
  const i = Number(e.target.closest('li').dataset.i); const s = segs[i]; if (!s) return;
  const k = segKey(s);
  const so = { ...(segOpt[k] || {}) };
  if (s0.value === '') delete so[s0.dataset.k]; else so[s0.dataset.k] = s0.dataset.k === 'voice' ? s0.value : Number(s0.value);
  if (Object.keys(so).length) segOpt[k] = so; else delete segOpt[k];
  save(); updateRow(i); showSegInfo();
  rowOf(i)?.querySelector(`.more select[data-k="${s0.dataset.k}"]`)?.focus();
});
// 문장 목록 키보드: ↑↓ 이동(커서도 따라감), Enter 는 듣기(버튼 기본 동작)
el.segs.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  if (!e.target.classList?.contains('tx')) return;
  const i = Number(e.target.closest('li').dataset.i) + (e.key === 'ArrowDown' ? 1 : -1);
  const li = rowOf(i); if (!li) return;
  e.preventDefault();
  li.querySelector('.tx').focus();
  setCursorTo(i);
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
// 듣기(run)와 모두 만들기·내보내기(build)는 따로 취소함: 만드는 동안에도 다른 문장을 들을 수 있음
let runId = 0;
let ctl = null;
let buildCtl = null;
const report = (e) => { if (e?.name !== 'AbortError') { console.error(e); setStatus(`실패: ${e.message}`, 'error'); } };
function newRun() { runId++; ctl?.abort(); ctl = new AbortController(); stopSound(); for (const li of el.segs.querySelectorAll('.now')) li.classList.remove('now'); return runId; }
// 만드는 동안 내보내기·모두 만들기 버튼을 잠금(멈춤 버튼·Esc 로 취소)
const BUILD_BTNS = [el.saveWav, el.saveSrt, el.saveZip, el.saveSrt2, el.saveZip2, el.genAll];
function setBuilding(on) { for (const b of BUILD_BTNS) b.disabled = on; el.stop.classList.toggle('attn', on); }

async function playSeg(i) {
  const my = newRun(); const s = segs[i]; if (!s) return;
  ac(); mark(i, 'busy');
  try {
    const pcm = await synth(s.text, optsFor(s), ctl.signal);
    mark(i, 'busy', false);
    if (my !== runId) return;
    markDone(i); mark(i, 'now');
    await playPcm(pcm, 0, s.text);
    mark(i, 'now', false);
  } catch (e) { mark(i, 'busy', false); report(e); }
}
async function playSelection() {
  flush();
  const { selectionStart: a, selectionEnd: b } = el.text;
  const picked = el.text.value.slice(a, b).trim();
  if (!picked) { if (curIdx >= 0) playSeg(curIdx); return; }
  const my = newRun(); ac();
  try {
    const pcm = await synth(picked, optsFor({ text: picked }), ctl.signal);
    if (my === runId) await playPcm(pcm, 0, picked);
  } catch (e) { report(e); }
}
// 재생 버튼: 재생 중이면 일시정지/이어 듣기, 아니면 커서 문장 듣기
async function playButton() { if (!(await togglePause())) playSelection(); }
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
      const p = synth(segs[i].text, optsFor(segs[i]), sig).then((pcm) => { markDone(i); return pcm; });
      p.catch(() => {}).finally(() => mark(i, 'busy', false));
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
// 다시 뽑기: 새 시드로 만들고, 이전 것은 후보로 남김(최근 3개)
async function reroll(i) {
  const s = segs[i]; if (!s) return;
  const k = segKey(s);
  const cur = optsFor(s).seed;
  const list = takes[k] ? [...takes[k]] : [cur];
  if (!list.includes(cur)) list.push(cur);
  const fresh = Math.floor(Math.random() * 1000000);
  list.push(fresh);
  // 3개를 넘으면 지금 고른 것과 새것을 빼고 가장 오래된 것부터 지움(번호 순서는 유지)
  while (list.length > 3) list.splice(list.findIndex((x) => x !== cur && x !== fresh), 1);
  takes[k] = list;
  seedOver[k] = fresh;
  save(); updateRow(i);
  await playSeg(i);
}
// 이 문장 뒤 쉼: 문장별 설정 > 문장 쉼(+ 문단 끝이면 문단 쉼)
const gapAfter = (s) => {
  const g = segOpt[segKey(s)]?.gap;
  return g != null ? Number(g) : Number(el.gap.value) + (s.para ? Number(el.para.value) : 0);
};
function stopAll() {
  const wasBuilding = !!buildCtl;
  newRun(); buildCtl?.abort();
  el.nowText.textContent = '';
  if (wasBuilding) setStatus('만들기를 멈췄습니다 · 이미 만든 문장은 남아 있습니다', 'ok'); else readyStatus();
  idleWave();
}
// 아직 아무것도 재생하지 않았으면 파형 칸에 안내
function idleWave() {
  if (playing || lastWave) return;
  el.nowText.textContent = segs.length ? '재생하면 여기에 파형이 나타납니다' : '';
}

/* ================= 전체 만들기·내보내기 ================= */
async function buildAll(label) {
  flush();
  if (!segs.length) throw new Error('글이 없어요');
  if (buildCtl) throw new DOMException('이미 만드는 중', 'AbortError');
  buildCtl = new AbortController(); const sig = buildCtl.signal;
  const list = segs.slice(); // 만드는 동안 글을 고쳐도 시작할 때의 문장으로 만듦
  el.progress.hidden = false;
  setBuilding(true);
  setStatus(`${label} 1/${list.length}`, 'busy');
  const total = list.reduce((a, s) => a + s.text.length, 0) || 1;
  let doneChars = 0; const t0 = performance.now();
  const parts = [];
  try {
    for (let i = 0; i < list.length; i++) {
      if (sig.aborted) throw new DOMException('취소됨', 'AbortError');
      const row = segs[i] === list[i] ? i : -1;
      if (row >= 0) mark(row, 'busy');
      try { parts.push(await synth(list[i].text, optsFor(list[i]), sig)); } finally { if (row >= 0) mark(row, 'busy', false); }
      if (row >= 0) markDone(row);
      doneChars += list[i].text.length;
      const frac = doneChars / total;
      const sec = (performance.now() - t0) / 1000;
      const eta = frac > 0.02 ? sec / frac - sec : 0;
      el.bar.style.width = `${frac * 100}%`;
      setStatus(`${label} ${i + 1}/${list.length}${eta ? ` · 남은 시간 약 ${Math.ceil(eta)}초` : ''}`, 'busy');
    }
  } finally {
    buildCtl = null;
    setBuilding(false);
    setTimeout(() => { el.progress.hidden = true; el.bar.style.width = '0'; }, 600);
  }
  // 이어 붙일 위치: 자막이면 자막 시작 시간(앞이 길면 바로 뒤), 아니면 문장 쉼·문단 쉼
  const sr = tts.sampleRate;
  const timed = list[0].t != null;
  let end = 0;
  const at = parts.map((p, i) => {
    const st = timed ? Math.max(end, Math.round(list[i].t * sr)) : end;
    end = st + p.length + (timed ? 0 : Math.round((gapAfter(list[i]) / 1000) * sr));
    return st;
  });
  if (!timed) end -= Math.round((gapAfter(list[list.length - 1]) / 1000) * sr); // 마지막 뒤 쉼은 뺌
  return { list, parts, at, total: Math.max(end, at[at.length - 1] + parts[parts.length - 1].length) };
}
function srtOf({ list, parts, at }) {
  const sr = tts.sampleRate;
  const t = (x) => { const ms = Math.round((x / sr) * 1000); const p = (n, l = 2) => String(n).padStart(l, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
  return list.map((s, i) => `${i + 1}\n${t(at[i])} --> ${t(at[i] + parts[i].length)}\n${(s.who && el.script.checked ? `${s.who}: ` : '') + plain(s.text)}\n`).join('\n');
}
async function exportWav() {
  if (buildCtl) return;
  try {
    const r = await buildAll('WAV 만드는 중');
    const mix = new Float32Array(r.total);
    r.parts.forEach((p, i) => mix.set(p, r.at[i]));
    download(new Blob([toWav(mix)], { type: 'audio/wav' }), `tts-${stamp()}.wav`);
    setStatus(`WAV 저장 · ${(r.total / tts.sampleRate / 60).toFixed(1)}분 · ${tts.backend}`);
  } catch (e) { report(e); }
}
async function exportSrt() {
  if (buildCtl) return;
  try {
    const r = await buildAll('자막 시간 계산 중');
    download(new Blob([srtOf(r)], { type: 'text/plain;charset=utf-8' }), `tts-${stamp()}.srt`);
    setStatus(`자막 저장 · ${r.list.length}개`);
  } catch (e) { report(e); }
}
async function exportZip() {
  if (buildCtl) return;
  try {
    const r = await buildAll('ZIP 만드는 중');
    const files = r.parts.map((p, i) => {
      const s = r.list[i];
      const who = s.who && el.script.checked ? `${fileSafe(s.who, 12)}_` : '';
      return { name: `${String(i + 1).padStart(3, '0')}_${who}${fileSafe(s.text) || 'line'}.wav`, data: toWav(p) };
    });
    const enc = new TextEncoder();
    files.push({ name: 'timeline.srt', data: enc.encode(srtOf(r)) });
    files.push({ name: 'script.txt', data: enc.encode(r.list.map((s, i) => `${String(i + 1).padStart(3, '0')}\t${s.who || ''}\t${s.text}`).join('\n')) });
    download(zipBlob(files), `tts-${stamp()}.zip`);
    setStatus(`ZIP 저장 · 문장 ${r.list.length}개`);
  } catch (e) { report(e); }
}
async function generateAll() {
  if (buildCtl) return;
  try { const r = await buildAll('미리 만드는 중'); setStatus(`모두 만듦 · ${r.list.length}개 · ${tts.backend}`); } catch (e) { report(e); }
}

/* ================= 태그·쉼 버튼 ================= */
// 커서 자리에 넣고 앞뒤 띄어쓰기를 맞춤: 앞 글자가 붙어 있으면 한 칸, 뒤가 공백·문장부호면 띄우지 않음
function insertAtCursor(token) {
  const ta = el.text;
  const s = ta.selectionStart; const e = ta.selectionEnd;
  const before = ta.value.slice(0, s); const after = ta.value.slice(e);
  const pre = before && !/\s$/.test(before) ? ' ' : '';
  replaceText(s, e, `${pre}${token}${!after || /^[\s.,!?…。，！？]/.test(after) ? '' : ' '}`);
  return s + pre.length; // 넣은 표기의 시작 위치
}
function insertTag(tag) {
  insertAtCursor(tag);
  // 문장 중간에 넣었으면 안내(태그는 문장 처음이나 끝에서 더 잘 됨)
  const ta = el.text; const pos = ta.selectionStart;
  const sb = plain(ta.value.slice(0, pos).split(/[.!?…。！？।؟\n]/).pop());
  const sa = plain(ta.value.slice(pos).split(/[.!?…。！？।؟\n]/)[0]);
  if (sb && sa) setStatus('표현 태그는 문장 처음이나 끝에 둘 때 더 잘 됩니다');
  else if (!TAG_LANGS.includes(el.lang.value) && el.tagMode.value === 'auto') setStatus('이 언어는 태그를 빼고 읽습니다 (설정 › 소리 › 표현 태그)');
}
// 쉼 넣기: [1초] 를 넣고 숫자를 선택해 두어 바로 고쳐 쓸 수 있게 함
function insertPause() {
  const at = insertAtCursor('[1초]');
  el.text.setSelectionRange(at + 1, at + 2);
  setStatus('쉼 [1초] 를 넣었습니다 · 숫자를 바로 고쳐 쓰면 길이가 바뀝니다');
}
TAGS.forEach(([tag, , name, official], i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = `btn tag${official ? '' : ' unofficial'}`;
  b.innerHTML = `<span class="tag-name">${name}</span><span class="k">${(i + 1) % 10}</span>`;
  b.title = `${tag} 넣기 (Alt+${(i + 1) % 10})${official ? '' : ' · 비공식 목록: 효과가 없을 수 있음'}`;
  b.addEventListener('mousedown', (e) => e.preventDefault()); // 커서 위치 유지
  b.onclick = () => insertTag(tag);
  el.tagbar.append(b);
  if (i === 2) { // 공식 태그 3개 뒤에 쉼 버튼
    const p = document.createElement('button');
    p.type = 'button'; p.className = 'btn tag pause-btn';
    p.innerHTML = `${ic('pausemark')}<span class="tag-name">쉼</span>`;
    p.title = '커서 자리에 쉼 [1초] 넣기 · 숫자를 고쳐 길이를 바꿈 (최대 10초)';
    p.addEventListener('mousedown', (e) => e.preventDefault());
    p.onclick = insertPause;
    el.tagbar.append(p);
  }
});
// 비공식 7개는 기본으로 숨기고 '실험' 단추로 펼침(Alt+4~0 단축키는 숨겨도 동작)
const EXP_KEY = 'tts-studio:expTags';
const expBtn = document.createElement('button');
expBtn.type = 'button'; expBtn.className = 'btn tag exp-toggle';
expBtn.title = '공식 문서에 없는 태그 7개 (효과가 없거나 글자로 읽힐 수 있음)';
expBtn.addEventListener('mousedown', (e) => e.preventDefault());
function showExp(on) {
  el.tagbar.classList.toggle('show-exp', on);
  expBtn.textContent = on ? '실험 태그 접기' : '실험 태그 +7';
  expBtn.setAttribute('aria-expanded', String(on));
  store.set(EXP_KEY, on);
}
expBtn.onclick = () => showExp(!el.tagbar.classList.contains('show-exp'));
el.tagbar.append(expBtn);
showExp(!!store.get(EXP_KEY, false));

/* ================= 확인 창 ================= */
// ask('제목', '내용', [['값','글자', 'primary'?]…]) → 누른 버튼의 값('' = 취소·Esc)
function ask(title, msg, buttons) {
  el.askTitle.textContent = title;
  el.askMsg.textContent = msg;
  el.askBtns.replaceChildren(...buttons.map(([v, label, cls]) => {
    const b = document.createElement('button'); b.value = v; b.textContent = label; if (cls) b.className = cls; return b;
  }));
  el.ask.returnValue = '';
  el.ask.showModal();
  el.askBtns.querySelector('.primary')?.focus();
  return new Promise((resolve) => el.ask.addEventListener('close', () => resolve(el.ask.returnValue || ''), { once: true }));
}

/* ================= 단축키 ================= */
document.addEventListener('keydown', (e) => {
  if (document.querySelector('dialog[open]')) return; // 창이 열려 있으면 창이 처리
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 'Enter') {
    const run = () => (e.shiftKey ? playFrom() : playSelection());
    // 한글 조합 중이면 조합이 끝난 뒤(마지막 글자가 글에 들어간 뒤) 실행
    if (e.isComposing || e.keyCode === 229) { el.text.addEventListener('compositionend', () => setTimeout(run, 0), { once: true }); return; }
    e.preventDefault(); run(); return;
  }
  if (e.key === 'Escape') { stopAll(); closeSheet(); return; }
  if (mod && e.shiftKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); saveProject(); return; }
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

/* ================= 파일·프로젝트 ================= */
function projectData() {
  return {
    type: PROJECT_TYPE, version: 1, saved: new Date().toISOString(),
    text: el.text.value, script: el.script.checked, settings: settingsNow(),
    cast: castMap, seedOver, takes, segOpt, dict,
  };
}
function saveProject() {
  // 내려받는 파일 이름은 영문만(일부 브라우저가 한글 이름을 버림)
  download(new Blob([JSON.stringify(projectData(), null, 1)], { type: 'application/json' }), `tts-project-${stamp()}.json`);
  setStatus('프로젝트 저장 · 열기로 다시 불러올 수 있습니다');
}
async function loadProject(p, name) {
  if (el.text.value.trim() && (await ask('프로젝트 열기', `"${name}" 을 열면 지금 글과 설정이 바뀝니다. 지금 글을 남기려면 먼저 저장을 누르세요.`, [['', '취소'], ['open', '열기', 'primary']])) !== 'open') return;
  if (p.settings) applySettings(p.settings);
  el.script.checked = !!p.script;
  castMap = p.cast || {}; seedOver = p.seedOver || {}; takes = p.takes || {}; segOpt = p.segOpt || {};
  // 사전은 합침(같은 말은 프로젝트 것을 씀)
  if (Array.isArray(p.dict)) {
    const m = new Map(dict.map(([a, b]) => [String(a).trim().toLowerCase(), [a, b]]));
    for (const [a, b] of p.dict) if (String(a || '').trim()) m.set(String(a).trim().toLowerCase(), [a, b]);
    dict = [...m.values()]; store.set(DICT_KEY, dict); compileDict(); renderDict();
  }
  replaceText(0, el.text.value.length, String(p.text || ''));
  setStatus(`프로젝트 열기 · ${name}`);
}
el.file.onchange = async () => {
  const f = el.file.files[0]; el.file.value = '';
  if (!f) return;
  if (f.size > 3_000_000) { setStatus('3MB가 넘는 파일은 열 수 없어요', 'error'); return; }
  let t = (await f.text()).replace(/\r\n?/g, '\n');
  if (/\.json$/i.test(f.name) || /^\s*\{/.test(t)) {
    let p = null; try { p = JSON.parse(t); } catch (_) { /* 글로 취급 */ }
    if (p?.type === PROJECT_TYPE) { loadProject(p, f.name); return; }
  }
  if (/\.vtt$/i.test(f.name)) t = t.replace(/^WEBVTT[^\n]*\n/, '');
  // 지금 글이 있으면 바꿀지, 끝에 붙일지 물어봄(Ctrl+Z 로도 되돌릴 수 있음)
  let how = 'replace';
  if (el.text.value.trim()) {
    how = await ask('파일 열기', `"${f.name}" 을 어떻게 넣을까요? 지금 글이 있습니다.`, [['', '취소'], ['append', '끝에 붙이기'], ['replace', '바꾸기', 'primary']]);
    if (!how) return;
  }
  const v = el.text.value;
  if (how === 'append') { const base = v.replace(/\s+$/, ''); replaceText(base.length, v.length, `\n\n${t}`); }
  else replaceText(0, v.length, t);
  setStatus(`열기 · ${f.name}${how === 'append' ? ' (끝에 붙임)' : ''} · Ctrl+Z 로 되돌릴 수 있습니다`);
};
el.saveProject.onclick = saveProject;
el.clearText.onclick = async () => {
  if (!el.text.value) return;
  if ((await ask('글 모두 지우기', '편집기의 글을 모두 지울까요? 지운 뒤에도 Ctrl+Z 로 되돌릴 수 있습니다.', [['', '취소'], ['clear', '지우기', 'danger']])) !== 'clear') return;
  replaceText(0, el.text.value.length, '');
  setStatus('글을 지웠습니다 · Ctrl+Z 로 되돌릴 수 있습니다');
};

/* ================= 읽기 사전 화면 ================= */
let dictSaveT = 0;
function dictChanged() {
  clearTimeout(dictSaveT);
  dictSaveT = setTimeout(() => { store.set(DICT_KEY, dict); compileDict(); renderSoon(); }, 250);
}
function renderDict() {
  el.dictList.replaceChildren(...dict.map((ent, n) => {
    const row = document.createElement('div'); row.className = 'dict-row';
    const a = document.createElement('input'); a.type = 'text'; a.value = ent[0] || ''; a.placeholder = '원래 글 (예: TTS)'; a.setAttribute('aria-label', '원래 글');
    const arrow = document.createElement('span'); arrow.className = 'dict-arrow'; arrow.textContent = '→';
    const b = document.createElement('input'); b.type = 'text'; b.value = ent[1] || ''; b.placeholder = '읽을 말'; b.setAttribute('aria-label', '읽을 말');
    const x = document.createElement('button'); x.type = 'button'; x.className = 'icon'; x.innerHTML = ic('x'); x.title = '이 항목 지우기'; x.setAttribute('aria-label', '이 항목 지우기');
    a.oninput = () => { dict[n][0] = a.value; dictChanged(); };
    b.oninput = () => { dict[n][1] = b.value; dictChanged(); };
    x.onclick = () => { dict.splice(n, 1); renderDict(); dictChanged(); };
    row.append(a, arrow, b, x);
    return row;
  }));
}
el.dictAdd.addEventListener('mousedown', (e) => e.preventDefault()); // 편집기 선택 유지
el.dictAdd.onclick = () => {
  // 편집기에서 선택한 글이 있으면 그 글을 원래 글로 넣음
  const picked = plain(el.text.value.slice(el.text.selectionStart, el.text.selectionEnd));
  const word = picked.length <= 40 ? picked : '';
  dict.push([word, '']);
  renderDict(); dictChanged();
  const rows = el.dictList.querySelectorAll('.dict-row');
  rows[rows.length - 1]?.querySelectorAll('input')[word ? 1 : 0]?.focus();
};

/* ================= 설정 시트(모바일) ================= */
const isSheet = () => matchMedia('(max-width: 899px)').matches;
function openSheet() { el.settings.classList.add('open'); el.sheetBackdrop.hidden = false; }
function closeSheet() { el.settings.classList.remove('open'); el.sheetBackdrop.hidden = true; }
el.openSettings.onclick = () => (el.settings.classList.contains('open') ? closeSheet() : openSheet());
el.closeSettings.onclick = closeSheet;
el.sheetBackdrop.onclick = closeSheet;
if (isSheet()) for (const d of el.settings.querySelectorAll('details')) d.open = d === el.settings.querySelector('details');

/* ================= 화면 테마 ================= */
const THEMES = [['auto', '자동'], ['light', '밝게'], ['dark', '어둡게']];
function applyTheme(t) {
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  const label = THEMES.find(([k]) => k === t)?.[1] || '자동';
  el.themeBtn.innerHTML = ic(`theme-${THEMES.some(([k]) => k === t) ? t : 'auto'}`);
  el.themeBtn.title = `화면 테마: ${label} (누르면 바뀜)`;
  drawWave();
}
el.themeBtn.onclick = () => {
  const cur = store.get(THEME_KEY, 'auto');
  const next = THEMES[(THEMES.findIndex(([k]) => k === cur) + 1) % THEMES.length][0];
  store.set(THEME_KEY, next); applyTheme(next);
};

/* ================= 설정 변경 ================= */
// 밀대를 끄는 동안 input 이 계속 오므로, 문장 목록은 화면 그리기 한 번에 한 번만 다시 그림(긴 글에서 끊김 방지)
let renderQ = 0;
function renderSoon() { if (!renderQ) renderQ = requestAnimationFrame(() => { renderQ = 0; renderSegs(); }); }
for (const k of SET_KEYS) el[k].addEventListener('input', () => { showOutputs(); save(); renderSoon(); });
el.norm.onchange = save;
el.dice.onclick = () => { el.seed.value = String(Math.floor(Math.random() * 1000000)); el.seed.dispatchEvent(new Event('input')); };
el.resetSet.onclick = () => { applySettings(DEFAULTS); el.norm.checked = false; save(); renderSegs(); };
el.preview.onclick = async () => {
  const sample = SAMPLES[el.lang.value] || SAMPLES.en;
  const my = newRun(); ac();
  try { const pcm = await synth(sample, optsFor({ text: sample }), ctl.signal); if (my === runId) await playPcm(pcm, 0, sample); } catch (e) { report(e); }
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
  for (const o of el.model.options) o.dataset.label = o.textContent;
  el.clearModels.onclick = async () => {
    if ((await ask('받은 모델 지우기', '기기에 받아 둔 모델 파일을 지울까요? 다음에 열 때 다시 받습니다.', [['', '취소'], ['clear', '지우기', 'danger']])) !== 'clear') return;
    try { for (const k of await caches.keys()) if (k.startsWith('supertonic')) await caches.delete(k); } catch (_) { /* 미지원 */ }
    location.reload();
  };
}

/* ---- 지금 쓰는 모델 표시 (기기에는 이 모델 1개만 저장됨) ---- */
const hfBase = (spec) => {
  const m = spec.match(/^([\w.-]+\/[\w.-]+)@([\w.-]+)(?:\/(.+))?$/);
  return `https://huggingface.co/${m[1]}/resolve/${m[2]}${m[3] ? `/${m[3]}` : ''}`;
};
async function refreshModelInfo() {
  const dir = tts.onnxDir || '';
  let current = '';
  for (const [k, spec] of Object.entries(MODELS)) {
    const base = hfBase(spec);
    const inUse = dir === base || dir.startsWith(`${base}/`);
    const opt = el.model.querySelector(`option[value="${k}"]`);
    opt.textContent = `${opt.dataset.label}${inUse ? ' · 사용 중' : ''}`;
    if (inUse) current = opt.dataset.label;
  }
  let used = '';
  try { const e = await navigator.storage?.estimate?.(); if (e?.usage) used = ` · 이 사이트 저장 공간 약 ${Math.round(e.usage / 1048576)}MB`; } catch (_) { /* 미지원 */ }
  if (!el.modelInfo) return; // 예전 index.html 이 캐시에 남아 있을 때
  el.modelInfo.textContent = `${current ? `기기에 저장된 모델: ${current}${used}. ` : ''}다른 모델로 바꾸면 새로 내려받고, 지금 모델은 지웁니다.`;
}

/* ---- 버튼 ---- */
el.playCur.onclick = playButton;
el.playFrom.onclick = () => playFrom();
el.stop.onclick = stopAll;
el.saveWav.onclick = exportWav;
el.saveSrt.onclick = exportSrt;
el.saveZip.onclick = exportZip;
el.saveSrt2.onclick = exportSrt;
el.saveZip2.onclick = exportZip;
el.genAll.onclick = generateAll;
el.helpBtn.onclick = () => el.help.showModal();

/* ================= 시작 ================= */
load();
applyTheme(store.get(THEME_KEY, 'auto'));
renderPresets();
renderDict();
showOutputs();
refresh();
drawWave();
