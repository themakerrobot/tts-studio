// TTS Studio: Supertonic 3 음성 합성을 브라우저 안에서(서버 없음).
// 한 문장 듣기·저장 / 긴 글·파일(.txt .md .srt .vtt)·대본(이름: 대사) 읽기 / 표현 태그 / WAV 내보내기
import { createTTS, VOICES } from './tts-client.js';

const $ = (id) => document.getElementById(id);

/* ---------- 설정 ---------- */
// Supertonic 3 공식 지원 31개 언어(모델 카드 기준)
const LANGS = [
  ['na', '자동 · 언어 구분 없음'], ['ko', '한국어'], ['en', 'English'], ['ja', '日本語'], ['ar', 'العربية'], ['bg', 'Български'], ['cs', 'Čeština'],
  ['da', 'Dansk'], ['de', 'Deutsch'], ['el', 'Ελληνικά'], ['es', 'Español'], ['et', 'Eesti'], ['fi', 'Suomi'],
  ['fr', 'Français'], ['hi', 'हिन्दी'], ['hr', 'Hrvatski'], ['hu', 'Magyar'], ['id', 'Bahasa Indonesia'],
  ['it', 'Italiano'], ['lt', 'Lietuvių'], ['lv', 'Latviešu'], ['nl', 'Nederlands'], ['pl', 'Polski'],
  ['pt', 'Português'], ['ro', 'Română'], ['ru', 'Русский'], ['sk', 'Slovenčina'], ['sl', 'Slovenščina'],
  ['sv', 'Svenska'], ['tr', 'Türkçe'], ['uk', 'Українська'], ['vi', 'Tiếng Việt'],
];
const VOICE_LABEL = { F1: '여성 1', F2: '여성 2', F3: '여성 3', F4: '여성 4', F5: '여성 5', M1: '남성 1', M2: '남성 2', M3: '남성 3', M4: '남성 4', M5: '남성 5' };
// 표현 태그 10개. 공식 문서(모델 카드·README)가 이름을 밝힌 것은 앞의 3개뿐이고, 나머지 7개는 제3자 실행기 README의 목록(비공식)
const TAGS = [
  ['<laugh>', '😄 웃음', 1], ['<breath>', '🌬️ 숨', 1], ['<sigh>', '😮‍💨 한숨', 1],
  ['<clear-throat>', '🗣️ 헛기침'], ['<cough>', '🤧 기침'], ['<sneeze>', '🤧 재채기'], ['<sniff>', '👃 훌쩍'],
  ['<groan>', '😣 끙'], ['<yawn>', '🥱 하품'], ['<hmm>', '🤔 음…'],
];
// 나이: 음 높이(pitch)는 모델 입력이 없어 합성 뒤 다시 표본화(resample)로 바꿈. 합성 빠르기를 pitch 로 나눠 말 빠르기는 유지.
const AGES = { child: { pitch: 1.1, speed: 1.05 }, normal: { pitch: 1, speed: 1 }, adult: { pitch: 0.96, speed: 0.97 }, old: { pitch: 0.92, speed: 0.9 } };
const PARA_MS = 400; // 빈 줄(문단) 뒤 추가 쉼
const KEY = 'tts-studio:settings';
const SET_KEYS = ['lang', 'voice', 'age', 'pitch', 'speed', 'steps', 'gap', 'gain', 'seed'];
const DEFAULTS = { voice: 'F1', age: 'normal', pitch: '1', speed: '1', steps: '8', gap: '300', gain: '1', seed: '' };
// 모델·실행 방식: 주소의 ?model= ?ep= 로 엔진에 전달(바꾸면 다시 불러옴)
const MODELS = {
  f32: 'leeyunjai/edge-lab@main/tts',
  int8: 'leeyunjai/edge-lab@71800e5/tts-int8',
  official: 'supertone-oss-archive/supertonic-3@aafc6e32416a594460b32413efc49d7fe4ce6d46',
};

const el = {
  engine: $('engine'), lang: $('lang'), voice: $('voice'), age: $('age'), speed: $('speed'), steps: $('steps'), gap: $('gap'),
  pitch: $('pitch'), gain: $('gain'), norm: $('norm'), seed: $('seed'), dice: $('dice'), resetSet: $('resetSet'),
  model: $('model'), ep: $('ep'), applyEngine: $('applyEngine'), clearModels: $('clearModels'),
  speedOut: $('speedOut'), stepsOut: $('stepsOut'), gapOut: $('gapOut'), pitchOut: $('pitchOut'), gainOut: $('gainOut'), preview: $('preview'),
  tabQuick: $('tabQuick'), tabEditor: $('tabEditor'), quick: $('quick'), editor: $('editor'),
  quickText: $('quickText'), quickPlay: $('quickPlay'), quickStop: $('quickStop'), quickSave: $('quickSave'), quickInfo: $('quickInfo'),
  file: $('file'), script: $('script'), edText: $('edText'), cast: $('cast'), edPlay: $('edPlay'), edStop: $('edStop'), edSave: $('edSave'),
  edInfo: $('edInfo'), segs: $('segs'), bar: $('bar'), progress: document.querySelector('.progress'),
};

for (const [code, name] of LANGS) el.lang.add(new Option(`${name} (${code})`, code));
for (const v of VOICES) el.voice.add(new Option(VOICE_LABEL[v], v));

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (const k of SET_KEYS) if (s[k] != null) el[k].value = s[k];
    if (s.norm) el.norm.checked = true;
    if (s.quick) el.quickText.value = s.quick;
    if (s.editor) el.edText.value = s.editor;
    if (s.script) el.script.checked = true;
    if (s.cast) castMap = s.cast;
  } catch (_) { /* 저장된 설정 없음 */ }
  if (!el.lang.value) el.lang.value = (navigator.language || 'ko').slice(0, 2);
  if (!el.lang.value) el.lang.value = 'ko';
}
let saveTimer = 0;
function saveSettings() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        ...Object.fromEntries(SET_KEYS.map((k) => [k, el[k].value])), norm: el.norm.checked,
        quick: el.quickText.value.slice(0, 2000), editor: el.edText.value.slice(0, 200000), script: el.script.checked, cast: castMap,
      }));
    } catch (_) { /* 저장 공간 없음 */ }
  }, 400);
}
const showOutputs = () => {
  el.speedOut.textContent = Number(el.speed.value).toFixed(2);
  el.stepsOut.textContent = el.steps.value;
  el.gapOut.textContent = el.gap.value;
  el.pitchOut.textContent = Number(el.pitch.value).toFixed(2);
  el.gainOut.textContent = Number(el.gain.value).toFixed(2);
};
let castMap = {}; // 대본 모드: 인물 이름 → { voice, age }

/* ---------- 표현 태그 버튼: 커서 위치에 넣기 ---------- */
function insertAtCursor(ta, text) {
  ta.focus();
  const s = ta.selectionStart ?? ta.value.length;
  const e = ta.selectionEnd ?? s;
  const before = ta.value.slice(0, s);
  const after = ta.value.slice(e);
  const pad = before && !/\s$/.test(before) ? ' ' : '';
  const tail = /^\s/.test(after) ? '' : ' ';
  ta.setRangeText(`${pad}${text}${tail}`, s, e, 'end');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}
for (const bar of document.querySelectorAll('.tagbar')) {
  const ta = $(bar.dataset.target);
  for (const [tag, label] of TAGS) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = `small tag${TAGS.find((x) => x[0] === tag)[2] ? '' : ' unofficial'}`; b.textContent = label;
    b.title = `${tag} 넣기${TAGS.find((x) => x[0] === tag)[2] ? '' : ' (비공식 목록: 효과가 없을 수 있음)'}`;
    // mousedown 기본 동작을 막아 입력칸 선택(커서 위치)이 풀리지 않게
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.onclick = () => insertAtCursor(ta, tag);
    bar.append(b);
  }
}

/* ---------- 음성 엔진 ---------- */
const tts = await createTTS();
let ready = false;
const setStatus = (m) => { el.engine.textContent = m; };
tts.load(setStatus).then(() => {
  ready = true;
  setStatus(`준비 완료 · ${tts.backend}${tts.source ? ` · ${tts.source}` : ''}`);
}).catch((e) => { console.error(e); setStatus(`음성 엔진을 불러오지 못했어요: ${e.message}`); });

const cache = new Map(); // 같은 설정·같은 문장은 다시 만들지 않음
const optsOf = (o = {}) => ({
  lang: o.lang || el.lang.value, voice: o.voice || el.voice.value, age: o.age || el.age.value,
  pitch: Number(el.pitch.value), speed: Number(el.speed.value), steps: Number(el.steps.value),
  seed: el.seed.value === '' ? null : Number(el.seed.value),
});
// 낭독용 표기: 검열 표시(××)는 '모모', 책 제목 괄호는 소리 내지 않음
const speakable = (t) => t.replace(/[×○]{2,}/g, '모모').replace(/[「」『』《》〈〉]/g, '').trim();

async function synth(text, o, signal) {
  if (!ready) throw new Error('음성 엔진이 아직 준비되지 않았어요');
  const k = keyOf(o, text);
  if (cache.has(k)) return cache.get(k);
  const a = AGES[o.age] || AGES.normal;
  const pitch = a.pitch * o.pitch;
  const raw = await tts.synth(speakable(text), { voice: o.voice, lang: o.lang, steps: o.steps, speed: o.speed * a.speed / pitch, seed: o.seed, signal });
  const pcm = pitch === 1 ? raw : resample(raw, pitch);
  if (cache.size > 300) cache.delete(cache.keys().next().value);
  cache.set(k, pcm);
  return pcm;
}
const keyOf = (o, text) => `${o.lang}|${o.voice}|${o.age}|${o.pitch}|${o.speed}|${o.steps}|${o.seed}|${text}`;
// 음량: 배율을 곱하고, 자동 맞춤이면 가장 큰 소리가 0.95가 되게. 넘치는 값은 잘라 냄
function finish(pcm) {
  let g = Number(el.gain.value);
  if (el.norm.checked) {
    let peak = 0;
    for (let i = 0; i < pcm.length; i++) { const v = Math.abs(pcm[i]); if (v > peak) peak = v; }
    if (peak > 0) g *= 0.95 / peak;
  }
  if (g === 1) return pcm;
  const out = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) out[i] = Math.max(-1, Math.min(1, pcm[i] * g));
  return out;
}
// 음 높이 바꾸기: rate 배 빠르게 읽은 것과 같음(선형 보간)
function resample(src, rate) {
  const n = Math.floor(src.length / rate);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * rate; const j = Math.floor(x); const f = x - j;
    out[i] = (src[j] || 0) * (1 - f) + (src[j + 1] || 0) * f;
  }
  return out;
}

/* ---------- 재생 ---------- */
let audioCtx = null;
let source = null;
function ctx() {
  try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (_) { /* 미지원 */ }
  audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function play(pcm, tailMs = 0) {
  const c = ctx();
  const pad = Math.floor((tailMs / 1000) * tts.sampleRate);
  const buf = c.createBuffer(1, pcm.length + pad, tts.sampleRate);
  buf.copyToChannel(finish(pcm), 0);
  return new Promise((resolve) => {
    stopSound();
    source = c.createBufferSource();
    source.buffer = buf;
    source.connect(c.destination);
    source.onended = () => { source = null; resolve(); };
    source.start();
  });
}
function stopSound() {
  if (source) { source.onended = null; try { source.stop(); } catch (_) { /* 이미 끝남 */ } source = null; }
}

/* ---------- WAV ---------- */
function wavBlob(pcm, sr) {
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
  return new Blob([buf], { type: 'audio/wav' });
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
const stamp = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
// 파일 이름은 영문·숫자만(브라우저에 따라 한글 이름이 'download' 로 바뀌는 경우가 있음)
const fileName = (tag = '') => `tts-${stamp()}${tag ? `-${tag}` : ''}.wav`;

/* ---------- 한 문장 ---------- */
let quickCtl = null;
let quickPcm = null;
el.quickPlay.onclick = async () => {
  const text = el.quickText.value.trim();
  if (!text) { el.quickText.focus(); return; }
  ctx();
  quickCtl?.abort(); quickCtl = new AbortController();
  el.quickInfo.textContent = '만드는 중…';
  const t0 = performance.now();
  try {
    const pcm = await synth(text, optsOf(), quickCtl.signal);
    const sec = (performance.now() - t0) / 1000; const len = pcm.length / tts.sampleRate;
    quickPcm = pcm; el.quickSave.disabled = false;
    el.quickInfo.textContent = `${len.toFixed(1)}초 음성 · 합성 ${sec.toFixed(1)}초`;
    await play(pcm);
  } catch (e) { if (e.name !== 'AbortError') { console.error(e); el.quickInfo.textContent = `실패: ${e.message}`; } }
};
el.quickStop.onclick = () => { quickCtl?.abort(); stopSound(); el.quickInfo.textContent = ''; };
el.quickSave.onclick = () => quickPcm && download(wavBlob(finish(quickPcm), tts.sampleRate), fileName(`${el.lang.value}-${el.voice.value}`));
el.quickText.addEventListener('input', () => { el.quickSave.disabled = true; quickPcm = null; saveSettings(); });
el.quickText.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) el.quickPlay.click(); });
el.preview.onclick = async () => {
  ctx();
  const sample = { ko: '안녕하세요, 반가워요.', ja: 'こんにちは、はじめまして。' }[el.lang.value] || 'Hello, nice to meet you.';
  try { await play(await synth(sample, optsOf())); } catch (e) { console.error(e); setStatus(`실패: ${e.message}`); }
};

/* ---------- 긴 글 나누기 ---------- */
// 결과: [{ text, who?, voice?, age?, para(문단 끝), start?(초, 자막) }]
const SRT_TIME = /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/;
const toSec = (h, m, s, ms) => Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, '0')) / 1000;
function splitSentences(t) {
  return t.split(/(?<=[.!?…。！？])\s+/).map((s) => s.trim()).filter((s) => s.replace(/<[a-z]+>/g, '').trim());
}
function parse(text) {
  const segs = [];
  // 자막(SRT/VTT): 시간 줄이 있으면 자막으로 봄
  if (SRT_TIME.test(text)) {
    for (const block of text.replace(/\r/g, '').split(/\n\s*\n/)) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      const i = lines.findIndex((l) => SRT_TIME.test(l));
      if (i < 0) continue;
      const m = lines[i].match(SRT_TIME);
      const body = lines.slice(i + 1).join(' ').replace(/<\/?[ibu]>|\{[^}]*\}/g, '').trim();
      if (body) segs.push({ text: body, start: toSec(m[1], m[2], m[3], m[4]), end: toSec(m[5], m[6], m[7], m[8]) });
    }
    return segs;
  }
  const paras = text.replace(/\r/g, '').split(/\n\s*\n/);
  for (const para of paras) {
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const clean = line.replace(/^#+\s*/, '').replace(/^[-*]\s+/, ''); // 마크다운 제목·목록 기호
      const m = el.script.checked && clean.match(/^([^:：]{1,20})\s*[:：]\s*(.+)$/);
      const who = m ? m[1].trim() : null;
      for (const s of splitSentences(m ? m[2] : clean)) segs.push({ text: s, who });
    }
    if (segs.length) segs[segs.length - 1].para = true;
  }
  return segs;
}

/* ---------- 대본 모드: 인물별 목소리 ---------- */
function speakersOf(segs) {
  return [...new Set(segs.map((s) => s.who).filter(Boolean))];
}
function renderCast(segs) {
  const who = el.script.checked ? speakersOf(segs) : [];
  el.cast.hidden = !who.length;
  if (!who.length) return;
  const used = new Set(who.map((w) => castMap[w]?.voice).filter(Boolean));
  for (const w of who) {
    if (castMap[w]) continue;
    const v = VOICES.find((x) => !used.has(x)) || VOICES[who.indexOf(w) % VOICES.length];
    used.add(v);
    castMap[w] = { voice: v, age: /아이|꼬마|아기|소년|소녀|child|boy|girl/i.test(w) ? 'child' : /할머니|할아버지|노인|grand|old/i.test(w) ? 'old' : 'normal' };
  }
  el.cast.replaceChildren(...who.map((w) => {
    const c = castMap[w];
    const row = document.createElement('div'); row.className = 'chip';
    const n = document.createElement('strong'); n.textContent = w;
    const vs = document.createElement('select');
    for (const v of VOICES) vs.add(new Option(VOICE_LABEL[v], v, false, v === c.voice));
    const as = document.createElement('select');
    for (const [k, l] of [['child', '아이'], ['normal', '보통'], ['adult', '어른'], ['old', '노인']]) as.add(new Option(l, k, false, k === c.age));
    vs.onchange = () => { c.voice = vs.value; saveSettings(); refresh(); };
    as.onchange = () => { c.age = as.value; saveSettings(); refresh(); };
    row.append(n, vs, as);
    return row;
  }));
}
const segOpts = (s) => (s.who && el.script.checked && castMap[s.who] ? optsOf(castMap[s.who]) : optsOf());

/* ---------- 긴 글 목록·재생·내보내기 ---------- */
let segs = [];
let runId = 0;
let edCtl = null;
const keyOfSeg = (s) => keyOf(segOpts(s), s.text);

function renderSegs() {
  el.segs.replaceChildren(...segs.map((s, i) => {
    const li = document.createElement('li');
    li.className = cache.has(keyOfSeg(s)) ? 'done' : '';
    const t = document.createElement('button');
    t.type = 'button'; t.className = 'seg-text'; t.title = '여기서부터 듣기';
    t.textContent = (s.start != null ? `[${fmtTime(s.start)}] ` : '') + (s.who && el.script.checked ? `${s.who}: ` : '') + s.text;
    t.onclick = () => playFrom(i);
    const d = document.createElement('button');
    d.type = 'button'; d.className = 'small'; d.textContent = '⬇'; d.title = '이 문장 WAV 저장';
    d.onclick = async () => {
      try { download(wavBlob(finish(await synth(s.text, segOpts(s))), tts.sampleRate), fileName(String(i + 1).padStart(3, '0'))); } catch (e) { console.error(e); el.edInfo.textContent = `실패: ${e.message}`; }
      li.className = 'done';
    };
    li.append(t, d);
    return li;
  }));
  const chars = segs.reduce((a, s) => a + s.text.length, 0);
  el.edInfo.textContent = segs.length ? `${segs.length}문장 · ${chars.toLocaleString()}자${segs[0]?.start != null ? ' · 자막 시간 맞춤' : ''}` : '';
}
const fmtTime = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(1).padStart(4, '0')}`;
function refresh() {
  segs = parse(el.edText.value);
  renderCast(segs);
  renderSegs();
}
let refreshTimer = 0;
el.edText.addEventListener('input', () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(refresh, 300); saveSettings(); });
el.script.onchange = () => { saveSettings(); refresh(); };

function mark(i, cls) {
  const li = el.segs.children[i];
  if (!li) return;
  li.classList.remove('busy', 'now');
  if (cls) li.classList.add(cls);
  if (cls === 'now') li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
const gapAfter = (s) => Number(el.gap.value) + (s.para ? PARA_MS : 0);

async function playFrom(from) {
  if (!segs.length) return;
  ctx();
  const my = ++runId;
  edCtl?.abort(); edCtl = new AbortController();
  const sig = edCtl.signal;
  // 앞의 두 문장을 미리 만들어 둠
  const pending = new Map();
  const get = (i) => {
    if (!pending.has(i)) {
      mark(i, 'busy');
      const p = synth(segs[i].text, segOpts(segs[i]), sig).then((pcm) => { el.segs.children[i]?.classList.add('done'); return pcm; });
      p.catch(() => {});
      pending.set(i, p);
    }
    return pending.get(i);
  };
  try {
    for (let i = from; i < segs.length; i++) {
      for (let k = 1; k <= 2 && i + k < segs.length; k++) get(i + k);
      const pcm = await get(i);
      if (my !== runId) return;
      mark(i, 'now');
      await play(pcm, gapAfter(segs[i]));
      mark(i, null);
      if (my !== runId) return;
    }
  } catch (e) { if (e.name !== 'AbortError') { console.error(e); el.edInfo.textContent = `실패: ${e.message}`; } }
}
el.edPlay.onclick = () => playFrom(0);
el.edStop.onclick = () => { runId++; edCtl?.abort(); stopSound(); for (const li of el.segs.children) li.classList.remove('busy', 'now'); };

el.edSave.onclick = async () => {
  if (!segs.length) return;
  const my = ++runId;
  edCtl?.abort(); edCtl = new AbortController();
  el.progress.hidden = false;
  el.edSave.disabled = true;
  try {
    const sr = tts.sampleRate;
    const parts = [];
    for (let i = 0; i < segs.length; i++) {
      mark(i, 'busy');
      parts.push(await synth(segs[i].text, segOpts(segs[i]), edCtl.signal));
      el.segs.children[i]?.classList.add('done'); mark(i, null);
      el.bar.style.width = `${((i + 1) / segs.length) * 100}%`;
      el.edInfo.textContent = `내보내는 중 ${i + 1} / ${segs.length}`;
      if (my !== runId) return;
    }
    // 자막이면 각 문장을 자막 시작 시간에 놓음(앞 문장이 길면 바로 뒤에 이어 붙임)
    const timed = segs[0].start != null;
    let total = 0;
    const at = parts.map((p, i) => {
      const start = timed ? Math.max(total, Math.round(segs[i].start * sr)) : total;
      total = start + p.length + (timed ? 0 : Math.round((gapAfter(segs[i]) / 1000) * sr));
      return start;
    });
    const out = new Float32Array(total);
    parts.forEach((p, i) => out.set(p, at[i]));
    download(wavBlob(finish(out), sr), fileName('all'));
    el.edInfo.textContent = `저장 완료 · ${(total / sr / 60).toFixed(1)}분`;
  } catch (e) { if (e.name !== 'AbortError') { console.error(e); el.edInfo.textContent = `실패: ${e.message}`; } }
  finally { el.edSave.disabled = false; setTimeout(() => { el.progress.hidden = true; el.bar.style.width = '0'; }, 800); }
};

/* ---------- 파일 열기 ---------- */
el.file.onchange = async () => {
  const f = el.file.files[0];
  if (!f) return;
  if (f.size > 2_000_000) { el.edInfo.textContent = '2MB가 넘는 파일은 열 수 없어요'; return; }
  let text = await f.text();
  if (/\.vtt$/i.test(f.name)) text = text.replace(/^WEBVTT.*\n/, '');
  el.edText.value = text;
  el.file.value = '';
  saveSettings(); refresh();
};

/* ---------- 탭 ---------- */
function tab(which) {
  const q = which === 'quick';
  el.tabQuick.setAttribute('aria-selected', String(q)); el.tabEditor.setAttribute('aria-selected', String(!q));
  el.quick.hidden = !q; el.editor.hidden = q;
}
el.tabQuick.onclick = () => tab('quick');
el.tabEditor.onclick = () => tab('editor');

/* ---------- 설정 변경 ---------- */
for (const k of SET_KEYS) {
  el[k].addEventListener('input', () => { showOutputs(); saveSettings(); el.quickSave.disabled = true; renderSegs(); });
}
el.norm.onchange = saveSettings;
el.dice.onclick = () => { el.seed.value = String(Math.floor(Math.random() * 1000000)); el.seed.dispatchEvent(new Event('input')); };
el.resetSet.onclick = () => {
  for (const [k, v] of Object.entries(DEFAULTS)) el[k].value = v;
  el.norm.checked = false;
  showOutputs(); saveSettings(); renderSegs();
};

/* ---------- 엔진(모델·실행 방식) ---------- */
{
  const q = new URLSearchParams(location.search);
  const m = Object.entries(MODELS).find(([, v]) => v === q.get('model'));
  el.model.value = m ? m[0] : 'auto';
  el.ep.value = ['webgpu', 'wasm'].includes(q.get('ep')) ? q.get('ep') : 'auto';
  const changed = () => { el.applyEngine.disabled = false; };
  el.model.onchange = changed; el.ep.onchange = changed;
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

loadSettings();
showOutputs();
refresh();
