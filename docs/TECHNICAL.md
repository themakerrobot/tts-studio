# TTS Studio 기술 문서

사용법은 [README](../README.md)를 보세요. 이 문서는 구조, 엔진, 모델 위치, 실행 방법을 다룹니다.

## 구조
정적 파일만으로 돕니다. 빌드 단계와 서버 코드가 없습니다.

| 파일 | 역할 |
|---|---|
| `index.html` | 화면 구조. 전문가 모드는 PC 3칸(설정 / 편집기 / 문장 목록), 900px 미만은 한 칸 + 설정 시트. 간단 모드는 가운데 카드 하나(편집기 + 재생 막대). 모드·테마·화면 언어는 `<head>` 스크립트가 그리기 전에 `<html data-mode data-theme lang>` 로 적용 |
| `i18n.js` | 화면 문구 한국어/영어. HTML 은 `data-i18n` · `data-i18n-html` · `data-i18n-title` · `data-i18n-aria` · `data-i18n-ph`, JS 는 `t('키', {값})` |
| `style.css` | 배치·테마. 색은 `:root` 변수, 다크 모드는 `prefers-color-scheme`, 직접 고른 테마는 `<html data-theme>`. 간단 모드는 `html[data-mode="simple"]` 규칙(`.pro-only` 숨김, `.simple-only` 보임) |
| `app.js` | 편집기, 문장 나누기, 재생·일시정지, 다시 뽑기 후보, 문장별 설정, 쉼 표기, 읽기 사전, 내보내기(WAV/SRT/ZIP), 프로젝트(.json), 단축키, 설정 저장 |
| `tts-client.js` | 화면 쪽 창구. `tts-worker.js`(별도 스레드)를 쓰고, 워커를 못 쓰면 화면 스레드에서 직접 실행 |
| `tts-worker.js` | 워커 안에서 `tts.js` 실행 |
| `tts.js` | Supertonic 3 추론(ONNX Runtime Web). 모델 받기·캐시, 문장 나누기, 시드 고정 잡음 |
| `sentences.js` | 문장 끝 판정. `app.js`(문장 목록)와 `tts.js`(합성 조각)가 같이 씀 |
| `coi-sw.js` | 서비스 워커. 교차 출처 격리(COOP/COEP, WASM 다중 스레드용) + 앱 파일 보관(오프라인 실행) |
| `manifest.webmanifest`, `icons/` | 홈 화면에 추가(앱 설치)용 정보와 아이콘 |
| `vendor/ort/` | onnxruntime-web 1.22.0 `dist/` 파일 3개(수정 없음). CDN 의존 없음 |
| `licenses/` | 모델·코드·런타임 라이선스 원문 |

## 엔진
- 모델: [Supertonic 3](https://huggingface.co/supertone-oss-archive/supertonic-3) ONNX 4개 — `duration_predictor`, `text_encoder`, `vector_estimator`, `vocoder`. 출력 표본율은 모델 설정(`tts.json` 의 `ae.sample_rate`)을 따름.
- 언어: 공식 31개 + `na`(언어 미지정. 언어 태그 없이 처리하며 언어 판별은 하지 않음, supertone-inc/supertonic README 기준). 목록 항목 수는 32개.
- 목소리: `voice_styles/F1~F5, M1~M5.json`.
- 실행 방식: WebGPU → WASM 순서로 시도. 휴대폰·태블릿 GPU(Adreno, Mali 등)는 자동일 때 WebGPU 를 건너뜀.
- WASM 스레드: `crossOriginIsolated` 일 때 `min(4, hardwareConcurrency)`, 아니면 1.
- 모델 파일은 처음 받을 때 Cache Storage(`supertonic3-aafc6e3`)에 바로 흘려 넣고, 다음부터 네트워크 없이 읽음.
- 기기에는 모델 1개만 둠: 로딩이 끝나면 지금 쓰는 4개 파일이 아닌 `.onnx`(다른 모델, 예전 리비전 등)는 지움. 설정 › 엔진에 지금 쓰는 모델(`사용 중`)과 `navigator.storage.estimate()` 사용량 표시.

## 모델 위치
위에서부터 차례로 시도하고, 없거나 구성이 다르면 다음으로 넘어갑니다.

| 이름 | 위치 | 비고 |
|---|---|---|
| 자체 호스팅 | `./assets` | 있을 때만 |
| 32비트 | `leeyunjai/edge-lab@main/tts` | PC·WebGPU 기본, 379MB |
| 8비트 | `leeyunjai/edge-lab@71800e5/tts-int8` | 휴대폰·WASM 기본. vocoder 만 32비트(전부 8비트는 vocoder 잡음), 177MB |
| 공식 원본 | `supertone-oss-archive/supertonic-3@aafc6e3…` | 고정 리비전, 379MB |

8비트 모델은 WebGPU 에서 정수 연산이 CPU 로 넘어가 느려지므로 WASM 과 함께 쓰는 것이 맞습니다.

### 주소 매개변수
| 매개변수 | 뜻 |
|---|---|
| `?ep=webgpu` / `?ep=wasm` | 실행 방식 강제 |
| `?model=계정/저장소[@리비전][/폴더]` | 이 위치를 가장 먼저 시도 |
| `&strict=1` | `model` 로 지정한 위치만 씀(다른 모델로 넘어가지 않음) |

설정 화면의 `엔진` 칸이 이 매개변수를 만들어 페이지를 다시 불러옵니다.

## 합성 처리
- **문장 나누기**: `. ! ? …` 는 뒤에 공백이 올 때, `。 ！ ？ । ؟` 는 공백 없이도 문장 끝. 일본어 따옴표 안(`「…」` `『…』`)이거나 따옴표를 닫고 바로 글이 이어지면(`「…？」と言った`) 나누지 않음. 빈 줄은 문단 표시. 줄 앞의 마크다운 제목·목록 기호(`#`, `-`, `*`, `1.`)는 떼어 냄.
- **합성 조각**: 한 문장이 길면(ko·ja 120자, 그 밖 300자 초과) 쉼표·쉼 부호 → 띄어쓰기 → 글자 수 순서로 더 나눠 합성하고 0.25초 쉼으로 이어 붙임.
- **대본 모드**: `이름: 대사` 줄. 인물마다 목소리·나이 지정. 새 인물은 기본 목소리를 빼고 남성·여성을 번갈아 배정.
- **쉼 표기**: `[1초]` `[0.5초]` `[1.5s]` `[500ms]`(최대 10초). 합성 때 표기 위치에서 글을 나눠 따로 합성하고 그 길이만큼 무음을 넣음. 조각마다 시드는 `시드 + 조각번호 × 101`. 태그·쉼 표기·문장부호뿐인 조각은 앞 문장(줄 첫 조각이면 다음 문장)에 붙임.
- **읽기 사전**: `원래 글 → 읽을 말` 목록을 정규식 하나로 묶어 한 번에 바꿈(바꾼 말을 다시 바꾸지 않음). 긴 말 먼저, 대소문자 무시, 영숫자로 시작·끝나는 말은 영숫자 경계에서만. 태그 처리 뒤, 모델 전처리 앞에 적용. 자막·대본 파일에는 원래 글을 씀.
- **문장별 설정**: 문장 키(인물 + 글)마다 목소리·빠르기·뒤 쉼. 우선순위: 문장별 > 대본 인물 > 전체 설정.
- **자막**: `.srt` / `.vtt` 를 열면 각 자막의 시작 시간에 맞춰 이어 붙임(앞 문장이 길면 바로 뒤에).
- **시드**: mulberry32 로 초기 잡음을 고정. 전체 시드가 비면 문장 내용의 FNV-1a 해시(0~999999)를 씀 → 같은 문장은 늘 같은 소리. `↻` 는 그 문장만 무작위 시드로 바꾸고, 최근 3개를 후보로 남김(지금 고른 것은 지우지 않음).
- **나이·음 높이**: 합성 뒤 다시 표본화로 음 높이를 바꾸고, 합성 빠르기를 `speed × 나이빠르기 ÷ 음높이` 로 맞춰 말 빠르기는 유지.
- **표현 태그**: 모델에 특수 토큰이 없고 `<`, `>`, 영문자를 보통 글자로 넣음(공식 전처리도 태그를 따로 다루지 않음). 개발사 답변(supertone-inc/supertonic 이슈 124·148)에 따르면 태그 데이터는 주로 한·영·일이고, 문장 처음·끝에서 잘 되며, 겹쳐 쓰면 효과가 커지지만 글자로 읽힐 수도 있음. 설정 `표현 태그`: 자동(ko·en·ja·na 는 그대로, 그 밖은 빼기) / 그대로 / 두 번 겹치기 / 빼기. 캐시 키는 처리한 뒤의 글로 계산.
- **캐시**: (언어, 목소리, 나이, 빠르기, 음 높이, 품질 단계, 시드, 태그·사전 처리한 글) 이 같으면 다시 합성하지 않음. 최대 600 문장. 같은 문장을 동시에 요청하면(모두 만들기 + 듣기) 한 번만 합성하고, 먼저 요청한 쪽이 취소되면 남은 쪽이 다시 합성.
- **듣기와 만들기 분리**: 듣기(`ctl`)와 모두 만들기·내보내기(`buildCtl`)는 따로 취소. 만드는 중에 다른 문장을 들어도 만들기는 계속되고, `Esc`·멈춤은 둘 다 멈춤. 만드는 동안 내보내기 버튼은 잠김.
- **일시정지**: `AudioContext.suspend()` / `resume()`.
- **글 넣기**: 파일 열기·예시·지우기·태그·쉼은 `document.execCommand('insertText')` 로 넣어 `Ctrl+Z` 기록을 남김(안 되면 `setRangeText`). 한글 조합 중 `Ctrl+Enter` 는 `compositionend` 뒤에 실행.

## 내보내기
- **WAV**: 16bit PCM 모노. 44.1k / 24k / 16k 중 선택, 낮출 때는 구간 평균으로 다시 표본화. 음량 배율 → 자동 맞춤(최대치 0.944 ≈ −0.5dB).
- **SRT**: 전체 WAV 와 같은 시간축(문장 쉼·문단 쉼 또는 원래 자막 시간 반영). 태그는 자막에서 뺌.
- **ZIP**: `001_인물_문장앞부분.wav …` + `timeline.srt` + `script.txt`. 압축 없이 저장(store), CRC32 직접 계산, 파일 이름은 UTF-8 표시(0x0800).
- **프로젝트**: `{ type: 'tts-studio-project', version: 1, text, script, settings, cast, seedOver, takes, segOpt, dict }`. 열 때 사전은 합침(같은 말은 프로젝트 것).
- 내려받는 파일 이름: `tts-YYYYMMDD-HHMM[-번호].wav`, `tts-project-YYYYMMDD-HHMM.json` (ASCII 만 — 일부 브라우저가 한글 파일 이름을 바꾸거나 버림).

## 저장
`localStorage` 에 설정·글(최대 30만 자)·인물 설정·고른 시드·후보·문장별 설정(`tts-studio:v2`), 프리셋(`tts-studio:presets`), 읽기 사전(`tts-studio:dict`), 화면 테마(`tts-studio:theme`), 화면 모드(`tts-studio:mode`, 없으면 처음 온 사람은 간단·이미 쓰던 사람은 전문가), 화면 언어(`tts-studio:ui`, 없으면 브라우저 언어). 문장 키로 남긴 값이 400개를 넘으면 지금 글에 없는 것부터 정리. 브라우저마다 따로이며 서버로 가지 않습니다.

앱 파일은 서비스 워커가 Cache Storage(`tts-studio-app`)에 보관하고, 네트워크가 끊기면 보관본을 씀. 모델 파일(`supertonic3-aafc6e3`)과 함께 있으면 인터넷 없이 열고 합성할 수 있음.

## 로컬 실행
```
python3 -m http.server 8000
# http://localhost:8000/
```
`coi-sw.js` 는 HTTPS 또는 localhost 에서만 동작합니다. 첫 방문 때 한 번 자동으로 새로고침해 교차 출처 격리를 켭니다.

## GitHub Pages
저장소 Settings → Pages → Branch `main` / `(root)`. 게시 주소: https://themakerrobot.github.io/tts-studio/

## 라이선스
- TTS Studio 코드: MIT ([LICENSE](../LICENSE)).
- 모델: BigScience Open RAIL-M — 사용 제한(Attachment A)과 AI 생성물 표시 의무. 화면에 `AI 음성` 표시가 있습니다.
- `tts.js` 는 Supertonic 웹 예제(`web/helper.js`, MIT)를 바탕으로 다시 작성.
- onnxruntime-web: MIT.
- 자세한 내용: [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)
