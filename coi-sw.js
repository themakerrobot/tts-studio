// 서비스 워커: 세 가지 일을 함.
// 1) 교차 출처 격리(cross-origin isolation): GitHub Pages는 COOP/COEP 헤더를 줄 수 없어서, 같은 사이트 파일의 응답에 헤더를 붙여 줌.
//    → crossOriginIsolated 가 켜져 WASM이 CPU 여러 코어(스레드)를 씀. WebGPU가 없는 휴대폰에서 합성이 빨라짐.
//    다른 사이트(HF 모델 파일)는 건드리지 않음. 그쪽은 CORS 로 받으므로 COEP 조건을 만족함.
// 2) 오프라인 실행: 앱 파일을 받을 때마다 기기에 보관해 두고, 인터넷이 끊기면 보관본을 씀.
//    (음성 모델은 tts.js 가 따로 Cache Storage 에 보관하므로, 둘 다 있으면 인터넷 없이 합성 가능)
// 3) jsDelivr 에서 받은 onnxruntime-web(버전 고정이라 내용이 바뀌지 않음)은 보관본을 먼저 씀
//    → 한 번 받은 기기는 CDN 이 끊기거나 막혀도 계속 동작. 주소는 tts.js 의 ORT_CDN 과 같아야 함
const APP_CACHE = 'tts-studio-app';
const ORT_CDN = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

const withIsolation = (res) => {
  const headers = new Headers(res.headers);
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method === 'GET' && req.url.startsWith(ORT_CDN)) {
    e.respondWith((async () => {
      const hit = await caches.match(req.url, { cacheName: APP_CACHE });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) { const copy = res.clone(); e.waitUntil(caches.open(APP_CACHE).then((c) => c.put(req.url, copy)).catch(() => {})); }
      return res;
    })());
    return;
  }
  if (new URL(req.url).origin !== self.location.origin) return;
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;
  if (req.method !== 'GET') return;
  // 앱 파일은 매번 서버에 바뀌었는지 물어봄(no-cache: 안 바뀌었으면 304로 짧게 끝남).
  // GitHub Pages 기본 캐시(10분) 때문에 업데이트 후에도 예전 파일이 쓰이는 일을 막음.
  const fresh = new Request(req, { cache: 'no-cache' });
  // 페이지 주소는 ?ep=… 같은 매개변수와 상관없이 하나로 보관
  const key = req.mode === 'navigate' ? new URL('./', self.location.href).href : req.url;
  e.respondWith((async () => {
    try {
      const res = await fetch(fresh);
      if (res.status === 0) return res;
      const out = withIsolation(res);
      if (res.ok && !req.headers.get('range')) {
        const copy = out.clone();
        e.waitUntil(caches.open(APP_CACHE).then((c) => c.put(key, copy)).catch(() => {}));
      }
      return out;
    } catch (err) {
      // 인터넷이 끊김: 보관본이 있으면 그것을 씀
      const hit = await caches.match(key, { cacheName: APP_CACHE });
      if (hit) return hit;
      throw err;
    }
  })());
});
