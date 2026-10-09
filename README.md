# TTS Studio

31개 언어 음성 합성을 **서버 없이 브라우저 안에서** 돌리는 도구입니다. 글은 기기 밖으로 나가지 않습니다.

- **한 문장 듣기**: 입력 → 듣기 → WAV 저장
- **긴 글 편집기**: 문장별로 나눠 이어서 읽기, 문장을 누르면 거기서부터, 문장별·전체 WAV 저장
- **파일 열기**: `.txt` `.md` `.srt` `.vtt` (자막은 자막 시간에 맞춰 내보냄)
- **대본 모드**: `이름: 대사` 줄마다 인물별 목소리·나이
- **표현 태그 버튼**: `<laugh>` `<sigh>` `<breath>` 를 커서 위치에 넣기
- **목소리 옵션**: 목소리 10종, 나이(음 높이), 빠르기, 품질(단계), 문장 사이 쉼

## 엔진
- 모델: [Supertonic 3](https://huggingface.co/supertone-oss-archive/supertonic-3) (ONNX, 약 99M 매개변수), 31개 언어
- 실행: [ONNX Runtime Web](https://onnxruntime.ai/) 1.22.0 (`vendor/ort/`), WebGPU → WASM 순서로 시도
- 휴대폰·WASM 은 8비트 변환본(vocoder 만 32비트)을 먼저 받아 가볍게
- 주소 뒤 `?ep=webgpu` / `?ep=wasm` 으로 실행 방식 강제, `?model=계정/저장소[@리비전][/폴더]` 로 모델 위치 지정
- 모델 파일은 처음 한 번 받아 브라우저 Cache Storage 에 보관

## 실행
정적 파일만 있으면 됩니다. GitHub Pages 에 그대로 올리거나 로컬에서:
```
python3 -m http.server 8000
```
`coi-sw.js` 서비스 워커가 교차 출처 격리를 켜서 WASM 이 여러 스레드를 씁니다(첫 방문 때 한 번 새로고침).

## 사용 조건
- 모델은 Open RAIL-M 라이선스입니다. 사용 제한(사칭, 속임, 불법 용도 등)을 지켜야 하고, 만든 음성은 AI 음성임을 밝혀야 합니다.
- 이 프로젝트는 Supertone Inc. 와 관계가 없습니다.
- 자세한 고지: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
