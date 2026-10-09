# TTS Studio 기술 문서

사용법은 [README](../README.md)를 보세요. 이 문서는 구조, 엔진, 모델 위치, 실행 방법을 다룹니다.

## 구조
정적 파일만으로 돕니다. 빌드 단계와 서버 코드가 없습니다.

| 파일 | 역할 |
|---|---|
| `index.html` | 화면 구조. PC 3칸(설정 / 편집기 / 문장 목록), 900px 미만은 한 칸 + 설정 시트 |
| `style.css` | 배치·테마. 색은 `:root` 변수, 다크 모드는 `prefers-color-scheme` |
| `app.js` | 편집기, 문장 나누기, 재생, 다시 뽑기, 내보내기(WAV/SRT/ZIP), 단축키, 설정 저장 |
| `tts-client.js` | 화면 쪽 창구. `tts-worker.js`(별도 스레드)를 쓰고, 워커를 못 쓰면 화면 스레드에서 직접 실행 |
| `tts-worker.js` | 워커 안에서 `tts.js` 실행 |
| `tts.js` | Supertonic 3 추론(ONNX Runtime Web). 모델 받기·캐시, 문장 나누기, 시드 고정 잡음 |
| `coi-sw.js` | 교차 출처 격리(COOP/COEP)를 켜는 서비스 워커. WASM 다중 스레드용 |
| `vendor/ort/` | onnxruntime-web 1.22.0 `dist/` 파일 3개(수정 없음). CDN 의존 없음 |
| `licenses/` | 모델·코드·런타임 라이선스 원문 |

## 엔진
- 모델: [Supertonic 3](https://huggingface.co/supertone-oss-archive/supertonic-3) ONNX 4개 — `duration_predictor`, `text_encoder`, `vector_estimator`, `vocoder`. 출력 표본율은 모델 설정(`tts.json` 의 `ae.sample_rate`)을 따름.
- 언어: 31개 + `na`(언어 구분 없이 처리, 공식 README 기준).
- 목소리: `voice_styles/F1~F5, M1~M5.json`.
- 실행 방식: WebGPU → WASM 순서로 시도. 휴대폰·태블릿 GPU(Adreno, Mali 등)는 자동일 때 WebGPU 를 건너뜀.
- WASM 스레드: `crossOriginIsolated` 일 때 `min(4, hardwareConcurrency)`, 아니면 1.
- 모델 파일은 처음 받을 때 Cache Storage(`supertonic3-aafc6e3`)에 바로 흘려 넣고, 다음부터 네트워크 없이 읽음.

## 모델 위치
위에서부터 차례로 시도하고, 없거나 구성이 다르면 다음으로 넘어갑니다.

| 이름 | 위치 | 비고 |
|---|---|---|
| 자체 호스팅 | `./assets` | 있을 때만 |
| edge-lab (32비트) | `leeyunjai/edge-lab@main/tts` | PC·WebGPU 기본 |
| edge-lab 8비트 | `leeyunjai/edge-lab@71800e5/tts-int8` | 휴대폰·WASM 기본. vocoder 만 32비트(전부 8비트는 vocoder 잡음), 약 177MB |
| 공식 원본 | `supertone-oss-archive/supertonic-3@aafc6e3…` | 고정 리비전 |

8비트 모델은 WebGPU 에서 정수 연산이 CPU 로 넘어가 느려지므로 WASM 과 함께 쓰는 것이 맞습니다.

### 주소 매개변수
| 매개변수 | 뜻 |
|---|---|
| `?ep=webgpu` / `?ep=wasm` | 실행 방식 강제 |
| `?model=계정/저장소[@리비전][/폴더]` | 이 위치를 가장 먼저 시도 |
| `&strict=1` | `model` 로 지정한 위치만 씀(다른 모델로 넘어가지 않음) |

설정 화면의 `엔진` 칸이 이 매개변수를 만들어 페이지를 다시 불러옵니다.

## 합성 처리
- **문장 나누기**: 문장 끝 부호(`. ! ? … 。 ！ ？`) 뒤 공백 기준. 빈 줄은 문단 표시. 줄 앞의 마크다운 제목·목록 기호(`#`, `-`, `*`, `1.`)는 떼어 냄.
- **대본 모드**: `이름: 대사` 줄. 인물마다 목소리·나이 지정.
- **자막**: `.srt` / `.vtt` 를 열면 각 자막의 시작 시간에 맞춰 이어 붙임(앞 문장이 길면 바로 뒤에).
- **시드**: mulberry32 로 초기 잡음을 고정. 전체 시드가 비면 문장 내용의 FNV-1a 해시(0~999999)를 씀 → 같은 문장은 늘 같은 소리. `↻` 는 그 문장만 무작위 시드로 바꾸고 기억함(`*` 표시).
- **나이·음 높이**: 합성 뒤 다시 표본화로 음 높이를 바꾸고, 합성 빠르기를 `speed × 나이빠르기 ÷ 음높이` 로 맞춰 말 빠르기는 유지.
- **캐시**: (언어, 목소리, 나이, 빠르기, 음 높이, 품질 단계, 시드, 글) 이 같으면 다시 합성하지 않음. 최대 600 문장.

## 내보내기
- **WAV**: 16bit PCM 모노. 44.1k / 24k / 16k 중 선택, 낮출 때는 구간 평균으로 다시 표본화. 음량 배율 → 자동 맞춤(최대치 0.944 ≈ −0.5dB).
- **SRT**: 전체 WAV 와 같은 시간축(문장 쉼·문단 쉼 또는 원래 자막 시간 반영). 태그는 자막에서 뺌.
- **ZIP**: `001.wav …` + `timeline.srt` + `script.txt`. 압축 없이 저장(store), CRC32 직접 계산.
- 파일 이름: `tts-YYYYMMDD-HHMM[-번호].wav` (ASCII 만 — 일부 브라우저가 한글 파일 이름을 바꿈).

## 저장
`localStorage` 에 설정·글(최대 30만 자)·인물 설정·다시 뽑은 시드(`tts-studio:v2`), 프리셋(`tts-studio:presets`). 브라우저마다 따로이며 서버로 가지 않습니다.

## 로컬 실행
```
python3 -m http.server 8000
# http://localhost:8000/
```
`coi-sw.js` 는 HTTPS 또는 localhost 에서만 동작합니다. 첫 방문 때 한 번 자동으로 새로고침해 교차 출처 격리를 켭니다.

## GitHub Pages
저장소 Settings → Pages → Branch `main` / `(root)`. 게시 주소: https://themakerrobot.github.io/tts-studio/

## 라이선스
- 모델: BigScience Open RAIL-M — 사용 제한(Attachment A)과 AI 생성물 표시 의무. 화면에 `AI 음성` 표시가 있습니다.
- `tts.js` 는 Supertonic 웹 예제(`web/helper.js`, MIT)를 바탕으로 다시 작성.
- onnxruntime-web: MIT.
- 자세한 내용: [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)
