// 화면 문구(한국어 / English). index.html 은 data-i18n* 속성으로, app.js 는 t('키') 로 씀.
// {이름} 자리는 t(키, { 이름: 값 }) 로 채움. 영어에 없는 키는 한국어로 나옴.
const D = {
  ko: {
    'mode.simple': '간단', 'mode.pro': '전문가',
    'mode.title': '화면 모드 · 간단: 글 하나 빠르게 · 전문가: 문장별 다듬기·대본·자막·사전',
    'ui.switch': 'EN', 'ui.title': 'Switch to English',
    'theme.title': '화면 테마: {name} (누르면 바뀜)', 'theme.auto': '자동', 'theme.light': '밝게', 'theme.dark': '어둡게',
    'help.btn': '단축키·안내 (?)', 'ai.badge': 'AI 음성', 'ai.title': '모든 음성은 AI(Supertonic 3)가 이 기기 안에서 만든 것입니다',

    'simple.intro': '글을 쓰고 ▶ 를 누르면 읽어 줍니다. 마음에 들면 WAV 로 저장하세요.',
    'simple.more': '문장별 다듬기 · 대본 · 자막 · 읽기 사전이 필요하면',
    'simple.toPro': '전문가 모드로 →',
    'simple.play': '처음부터 듣기 (재생 중에는 일시정지)',
    'ph.simple': '여기에 읽을 글을 쓰거나 붙여 넣으세요.',
    'ph.pro': "여기에 글을 쓰거나 붙여 넣으세요.\n\n• Ctrl+Enter  커서가 있는 문장(또는 선택한 글) 듣기\n• Ctrl+Shift+Enter  커서부터 끝까지 듣기\n• Esc  멈춤 · Ctrl+S  WAV 저장 · Alt+1~0  표현 태그\n• [1초] 처럼 쓰면 그 자리에서 쉼 · 빈 줄 = 문단 쉼\n• 대본 모드: '이름: 대사' · .srt 자막은 자막 시간에 맞춰 내보냄",

    'set.title': '설정', 'set.close': '설정 닫기',
    'grp.voice': '목소리', 'grp.sound': '소리', 'grp.dict': '읽기 사전', 'grp.output': '출력', 'grp.engine': '엔진',
    'f.lang': '언어', 'f.voice': '목소리', 'f.age': '나이', 'f.preset': '프리셋',
    'preview.title': '이 목소리 들어 보기', 'preview.aria': '미리 듣기',
    'age.child': '아이', 'age.normal': '보통', 'age.adult': '어른', 'age.old': '노인',
    'preset.none': '— 저장한 설정 —', 'preset.save': '지금 설정을 프리셋으로 저장', 'preset.del': '고른 프리셋 지우기', 'preset.prompt': '프리셋 이름',
    'f.speed': '빠르기', 'f.pitch': '음 높이', 'f.steps': '품질 단계', 'f.seed': '시드',
    'seed.ph': '자동 (문장마다 따로)', 'seed.dice': '무작위 시드',
    'hint.quality': '품질 단계가 높을수록 깨끗하지만 느립니다. 시드를 비우면 같은 문장은 늘 같은 소리로 나옵니다.',
    'f.tagMode': '표현 태그',
    'tag.auto': '자동 (한·영·일·언어 미지정만 사용)', 'tag.keep': '항상 그대로', 'tag.double': '두 번 겹쳐 강조', 'tag.strip': '모두 빼고 읽기',
    'hint.tags': '태그는 실험 기능이라 글자로 읽힐 때가 있습니다. 문장 처음이나 끝에 두세요. 요령은 <kbd>?</kbd> 창에 있습니다.',
    'hint.dict': '글은 그대로 두고, 읽을 때만 바꿉니다. 예) TTS → 티티에스. 영문은 대소문자를 가리지 않고 단어 단위로 바꿉니다.',
    'dict.add': '항목 추가', 'dict.addTitle': '편집기에서 글을 선택한 채 누르면 그 글이 들어갑니다',
    'dict.from': '원래 글 (예: TTS)', 'dict.fromAria': '원래 글', 'dict.to': '읽을 말', 'dict.del': '이 항목 지우기',
    'f.gap': '문장 쉼', 'f.para': '문단 쉼', 'f.gain': '음량', 'norm': '음량 자동 맞춤 (최대치 −0.5dB)', 'f.rate': '저장 형식', 'reset': '설정 처음값으로',
    'f.model': '모델', 'model.auto': '자동 (기기에 맞게)', 'model.f32': '32비트 (379MB)', 'model.int8': '8비트 (177MB)', 'model.official': '공식 원본 (379MB)',
    'mname.f32': '32비트', 'mname.int8': '8비트', 'mname.official': '공식 원본', 'mname.local': '자체 호스팅',
    'f.ep': '실행', 'ep.auto': '자동 (WebGPU → WASM)', 'ep.wasm': 'WASM (CPU)',
    'hint.engine': '자동은 휴대폰·WASM 에서 8비트, 그 밖에서 32비트를 씁니다. 8비트는 WASM 과 함께 쓸 때 빠릅니다. 적용하면 페이지를 다시 불러옵니다.',
    'apply': '적용', 'clearModels': '받은 모델 지우기',
    'model.inUse': ' · 사용 중', 'model.info': '기기에 저장된 모델: {name}{used}. ', 'model.used': ' · 이 사이트 저장 공간 약 {mb}MB',
    'model.switch': '다른 모델로 바꾸면 새로 내려받고, 지금 모델은 지웁니다.',

    'open': '열기', 'open.title': '파일 열기: 글(.txt .md), 자막(.srt .vtt), 프로젝트(.json) (Ctrl+O)',
    'save': '저장', 'save.title': '프로젝트 저장: 글·인물·사전·문장별 설정을 .json 파일 하나로 (Ctrl+Shift+S)',
    'script': '대본', 'script.title': "'이름: 대사' 줄마다 인물 목소리로",
    'clear.title': '글 모두 지우기 (Ctrl+Z 로 되돌릴 수 있음)', 'clear.aria': '글 모두 지우기', 'tagbar': '표현 태그·쉼',
    'tagname.laugh': '웃음', 'tagname.breath': '숨', 'tagname.sigh': '한숨', 'tagname.clear-throat': '헛기침', 'tagname.cough': '기침',
    'tagname.sneeze': '재채기', 'tagname.sniff': '훌쩍', 'tagname.groan': '끙', 'tagname.yawn': '하품', 'tagname.hmm': '음…',
    'tag.insert': '{tag} 넣기 (Alt+{n})', 'tag.unofficial': ' · 비공식 목록: 효과가 없을 수 있음',
    'pause.btn': '쉼', 'pause.token': '[1초]', 'pause.title': '커서 자리에 쉼 [1초] 넣기 · 숫자를 고쳐 길이를 바꿈 (최대 10초)',
    'pause.done': '쉼 [1초] 를 넣었습니다 · 숫자를 바로 고쳐 쓰면 길이가 바뀝니다',
    'exp.show': '실험 태그 +7', 'exp.hide': '실험 태그 접기', 'exp.title': '공식 문서에 없는 태그 7개 (효과가 없거나 글자로 읽힐 수 있음)',
    'tag.mid': '표현 태그는 문장 처음이나 끝에 둘 때 더 잘 됩니다', 'tag.stripLang': '이 언어는 태그를 빼고 읽습니다 (설정 › 소리 › 표현 태그)',

    'chars': '{n}자', 'cursor': '문장 {i} / {n}',
    'segs.title': '문장', 'segs.info': '{n}개 · 만듦 {done}', 'segs.timed': ' · 자막 시간', 'segs.empty': '글을 쓰거나 파일을 열면\n여기에 문장별로 나뉩니다',
    'genAll': '모두 만들기', 'genAll.title': '모든 문장을 미리 만들어 둠 (만드는 동안에도 듣기 가능)',
    'srt.short': '자막(SRT) 저장', 'zip.short': '문장별 WAV ZIP', 'segs.aria': '문장 목록 (↑↓ 로 이동, Enter 로 듣기)',
    'row.play': '듣기', 'row.re': '다시 뽑기 (후보 3개까지)', 'row.more': '이 문장 설정·저장', 'takes.aria': '다시 뽑기 후보',
    'take.title': '후보 {n} 듣기 (시드 #{seed})', 'seed.label': '시드 #{seed}',
    'more.voice': '목소리', 'more.speed': '빠르기', 'more.gap': '뒤 쉼', 'opt.default': '기본', 'gap.none': '없음', 'gap.sec': '{s}초',
    'more.wav': 'WAV', 'more.wavTitle': '이 문장만 WAV 로 저장', 'more.reset': '기본으로',

    'play.title': '커서 문장·선택 듣기 (Ctrl+Enter) · 재생 중에는 일시정지', 'play.aria': '듣기', 'pause.aria': '일시정지', 'resume.aria': '이어 듣기',
    'playFrom.title': '커서부터 끝까지 (Ctrl+Shift+Enter)', 'playFrom.aria': '커서부터 끝까지', 'stop.title': '멈춤 (Esc)', 'stop.aria': '멈춤',
    'wav.title': '전체 WAV 저장 (Ctrl+S)', 'srt.title': '전체 WAV 와 시간이 맞는 자막(SRT)', 'zip.title': '문장별 WAV 를 ZIP 하나로 (파일 이름에 문장 앞부분)',
    'settings.aria': '설정', 'wave.idle': '재생하면 여기에 파형이 나타납니다', 'wave.paused': '일시정지 · ',

    'st.loading': '엔진 불러오는 중…', 'st.ready': '준비 · {backend} · {source}', 'st.loadFail': '엔진을 불러오지 못했어요: {msg}', 'st.fail': '실패: {msg}',
    'st.noEngine': '엔진을 불러오지 못했어요', 'st.noText': '글이 없어요', 'st.eta': ' · 남은 시간 약 {s}초',
    'b.wav': 'WAV 만드는 중', 'b.srt': '자막 시간 계산 중', 'b.zip': 'ZIP 만드는 중', 'b.all': '미리 만드는 중',
    'st.wav': 'WAV 저장 · {min}분 · {backend}', 'st.srt': '자막 저장 · {n}개', 'st.zip': 'ZIP 저장 · 문장 {n}개', 'st.all': '모두 만듦 · {n}개 · {backend}',
    'st.stopped': '만들기를 멈췄습니다 · 이미 만든 문장은 남아 있습니다', 'st.tooBig': '3MB가 넘는 파일은 열 수 없어요',
    'st.opened': '열기 · {name}{how} · Ctrl+Z 로 되돌릴 수 있습니다', 'st.appended': ' (끝에 붙임)', 'st.cleared': '글을 지웠습니다 · Ctrl+Z 로 되돌릴 수 있습니다',
    'st.projSaved': '프로젝트 저장 · 열기로 다시 불러올 수 있습니다', 'st.projOpened': '프로젝트 열기 · {name}',

    'ask.cancel': '취소', 'ask.open.title': '파일 열기', 'ask.open.msg': '"{name}" 을 어떻게 넣을까요? 지금 글이 있습니다.', 'ask.append': '끝에 붙이기', 'ask.replace': '바꾸기',
    'ask.proj.title': '프로젝트 열기', 'ask.proj.msg': '"{name}" 을 열면 지금 글과 설정이 바뀝니다. 지금 글을 남기려면 먼저 저장을 누르세요.', 'ask.openBtn': '열기',
    'ask.clear.title': '글 모두 지우기', 'ask.clear.msg': '편집기의 글을 모두 지울까요? 지운 뒤에도 Ctrl+Z 로 되돌릴 수 있습니다.', 'ask.clearBtn': '지우기',
    'ask.models.title': '받은 모델 지우기', 'ask.models.msg': '기기에 받아 둔 모델 파일을 지울까요? 다음에 열 때 다시 받습니다.', 'ask.delBtn': '지우기',

    'cast.head': '인물', 'cast.tip': "'이름: 대사' 형식의 줄이 없어요. 줄 앞에 이름과 쌍점(:)을 쓰면 인물마다 목소리를 따로 줄 수 있습니다.",
    'cast.example': '예시 넣기', 'cast.sample': '두 사람이 마주 앉았습니다.\n민준: 오늘 녹음 준비됐어?\n서연: 응, 바로 시작하자.',
    'cast.voiceAria': '{w} 목소리', 'cast.ageAria': '{w} 나이', 'cast.play': '{w} 목소리 듣기',
    'v.F': '여성 {n}', 'v.M': '남성 {n}',

    'help.title': '단축키·안내',
    'help.rows': [
      ['<kbd>Ctrl</kbd>+<kbd>Enter</kbd>', '커서가 있는 문장 듣기 (글을 선택했으면 선택한 글)'],
      ['<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd>', '커서부터 끝까지 듣기'],
      ['재생 버튼', '재생 중에 누르면 일시정지 · 다시 누르면 이어 듣기'],
      ['<kbd>Esc</kbd>', '멈춤 (모두 만들기·내보내기도 멈춤)'],
      ['<kbd>Ctrl</kbd>+<kbd>S</kbd>', '전체 WAV 저장'],
      ['<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>', '프로젝트 저장 (.json)'],
      ['<kbd>Ctrl</kbd>+<kbd>O</kbd>', '파일 열기 (글·자막·프로젝트)'],
      ['<kbd>Alt</kbd>+<kbd>R</kbd>', '커서 문장 다시 뽑기 (최근 3개 후보를 남김)'],
      ['<kbd>Alt</kbd>+<kbd>1</kbd>~<kbd>0</kbd>', '표현 태그 넣기 (버튼 오른쪽 숫자)'],
      ['문장 목록 <kbd>↑</kbd><kbd>↓</kbd>', '문장 이동 · <kbd>Enter</kbd> 듣기'],
      ['<kbd>?</kbd>', '이 창 (편집기 밖에서)'],
    ],
    'help.notes': [
      'Mac 은 <kbd>Ctrl</kbd> 대신 <kbd>⌘</kbd>, <kbd>Alt</kbd> 대신 <kbd>⌥</kbd>.',
      '<b>간단 / 전문가</b> · 위쪽에서 화면 모드를 바꿉니다. 간단은 글 하나를 빠르게 듣고 저장하는 화면, 전문가는 문장별 다듬기·대본·자막·사전까지 쓰는 화면입니다. 글과 설정은 두 모드가 같이 씁니다.',
      '<b>쉼</b> · 글 안에 <code>[1초]</code> <code>[0.5초]</code> <code>[500ms]</code> 처럼 쓰면 그 자리에서 쉽니다(최대 10초). 툴바의 <b>쉼</b> 버튼으로 넣을 수 있습니다.',
      '<b>읽기 사전</b> · 설정 › 읽기 사전에 <code>TTS → 티티에스</code> 처럼 적으면 글은 그대로 두고 읽을 때만 바꿉니다. 편집기에서 단어를 선택한 채 <b>항목 추가</b>를 누르면 그 단어가 들어갑니다.',
      '<b>문장별 설정</b> · 문장 목록의 <b>⋯</b> 를 누르면 그 문장만 목소리·빠르기·뒤 쉼을 바꾸고, 문장 WAV 를 저장할 수 있습니다. 다시 뽑기 후보(1·2·3)를 눌러 마음에 드는 소리로 돌아갈 수 있습니다.',
      "<b>표현 태그</b> · 공식 태그는 웃음·숨·한숨 3개입니다. 문장 처음이나 끝에 두세요(문장 중간은 잘 안 됨). 소리 대신 글자로 읽히면 그 문장만 다시 뽑거나 설정 › 소리 › 표현 태그를 '두 번 겹쳐 강조'로 바꿔 보세요. 학습 데이터가 주로 한·영·일이라 자동일 때 그 밖 언어는 태그를 빼고 읽습니다. '실험 태그'(점선) 7개는 공식 문서에 없는 목록이라 효과가 없거나 글자로 읽힐 수 있습니다.",
      "<b>대본 모드</b> · 툴바의 '대본'을 켜고 줄을 '이름: 대사'로 쓰면 인물마다 목소리·나이를 따로 정합니다. 이름이 없는 줄은 기본 목소리로 읽습니다.",
      "<b>프로젝트</b> · 툴바의 저장으로 글·인물·사전·문장별 설정·다시 뽑은 소리를 .json 하나로 저장하고, 열기로 다시 불러옵니다. 휴대폰에서는 브라우저 메뉴의 '홈 화면에 추가'로 앱처럼 쓸 수 있습니다.",
      '음성은 <a href="https://huggingface.co/supertone-oss-archive/supertonic-3" target="_blank" rel="noopener">Supertonic 3</a>(Open RAIL-M)로 이 기기 안에서 만들며 글이 서버로 가지 않습니다. 만든 음성은 AI 음성임을 밝히고, 사람을 사칭하거나 속이는 데 쓰지 마세요. Supertone Inc. 와 관계없는 프로젝트입니다. · <a href="THIRD_PARTY_NOTICES.md">라이선스</a>',
    ],
  },

  en: {
    'mode.simple': 'Simple', 'mode.pro': 'Pro',
    'mode.title': 'View · Simple: one quick text · Pro: per-sentence editing, scripts, subtitles, dictionary',
    'ui.switch': '한', 'ui.title': '한국어로 바꾸기',
    'theme.title': 'Theme: {name} (click to change)', 'theme.auto': 'Auto', 'theme.light': 'Light', 'theme.dark': 'Dark',
    'help.btn': 'Shortcuts & tips (?)', 'ai.badge': 'AI voice', 'ai.title': 'All audio is AI-generated (Supertonic 3) on this device',

    'simple.intro': 'Type your text and press ▶ to hear it. Save it as WAV when you like it.',
    'simple.more': 'Need per-sentence editing, scripts, subtitles or a pronunciation dictionary?',
    'simple.toPro': 'Switch to Pro →',
    'simple.play': 'Play from the start (pauses while playing)',
    'ph.simple': 'Type or paste the text to read here.',
    'ph.pro': "Type or paste text here.\n\n• Ctrl+Enter  play the sentence at the cursor (or the selection)\n• Ctrl+Shift+Enter  play from the cursor to the end\n• Esc  stop · Ctrl+S  save WAV · Alt+1~0  expression tags\n• Write [1s] for a pause there · blank line = paragraph pause\n• Script mode: 'Name: line' · .srt subtitles keep their timing",

    'set.title': 'Settings', 'set.close': 'Close settings',
    'grp.voice': 'Voice', 'grp.sound': 'Sound', 'grp.dict': 'Pronunciation', 'grp.output': 'Output', 'grp.engine': 'Engine',
    'f.lang': 'Language', 'f.voice': 'Voice', 'f.age': 'Age', 'f.preset': 'Preset',
    'preview.title': 'Hear this voice', 'preview.aria': 'Preview',
    'age.child': 'Child', 'age.normal': 'Normal', 'age.adult': 'Adult', 'age.old': 'Elder',
    'preset.none': '— Saved presets —', 'preset.save': 'Save current settings as a preset', 'preset.del': 'Delete the selected preset', 'preset.prompt': 'Preset name',
    'f.speed': 'Speed', 'f.pitch': 'Pitch', 'f.steps': 'Quality', 'f.seed': 'Seed',
    'seed.ph': 'Auto (per sentence)', 'seed.dice': 'Random seed',
    'hint.quality': 'Higher quality steps sound cleaner but are slower. With an empty seed, the same sentence always sounds the same.',
    'f.tagMode': 'Expression tags',
    'tag.auto': 'Auto (ko · en · ja · na)', 'tag.keep': 'Always keep', 'tag.double': 'Double for emphasis', 'tag.strip': 'Remove all',
    'hint.tags': 'Tags are experimental and are sometimes read out as text. Put them at the start or end of a sentence. Tips are in the <kbd>?</kbd> window.',
    'hint.dict': 'The text stays as written; only the reading changes. e.g. PiBrain → pie brain. Latin words match whole words and ignore case.',
    'dict.add': 'Add entry', 'dict.addTitle': 'Select a word in the editor first to fill it in',
    'dict.from': 'Written (e.g. TTS)', 'dict.fromAria': 'Written', 'dict.to': 'Spoken as', 'dict.del': 'Remove this entry',
    'f.gap': 'Sentence gap', 'f.para': 'Paragraph gap', 'f.gain': 'Volume', 'norm': 'Normalize volume (peak −0.5 dB)', 'f.rate': 'File format', 'reset': 'Reset settings',
    'f.model': 'Model', 'model.auto': 'Auto (fits device)', 'model.f32': '32-bit (379 MB)', 'model.int8': '8-bit (177 MB)', 'model.official': 'Official (379 MB)',
    'mname.f32': '32-bit', 'mname.int8': '8-bit', 'mname.official': 'Official', 'mname.local': 'Self-hosted',
    'f.ep': 'Runtime', 'ep.auto': 'Auto (WebGPU → WASM)', 'ep.wasm': 'WASM (CPU)',
    'hint.engine': 'Auto uses 8-bit on phones and WASM, 32-bit elsewhere. 8-bit is fast with WASM. Applying reloads the page.',
    'apply': 'Apply', 'clearModels': 'Delete downloaded model',
    'model.inUse': ' · in use', 'model.info': 'Model stored on this device: {name}{used}. ', 'model.used': ' · about {mb} MB used by this site',
    'model.switch': 'Switching models downloads the new one and deletes the current one.',

    'open': 'Open', 'open.title': 'Open a file: text (.txt .md), subtitles (.srt .vtt), project (.json) (Ctrl+O)',
    'save': 'Save', 'save.title': 'Save project: text, cast, dictionary and per-sentence settings in one .json (Ctrl+Shift+S)',
    'script': 'Script', 'script.title': "Give each 'Name: line' its own voice",
    'clear.title': 'Clear all text (undo with Ctrl+Z)', 'clear.aria': 'Clear all text', 'tagbar': 'Expression tags & pauses',
    'tagname.laugh': 'Laugh', 'tagname.breath': 'Breath', 'tagname.sigh': 'Sigh', 'tagname.clear-throat': 'Clear throat', 'tagname.cough': 'Cough',
    'tagname.sneeze': 'Sneeze', 'tagname.sniff': 'Sniff', 'tagname.groan': 'Groan', 'tagname.yawn': 'Yawn', 'tagname.hmm': 'Hmm…',
    'tag.insert': 'Insert {tag} (Alt+{n})', 'tag.unofficial': ' · unofficial: may have no effect',
    'pause.btn': 'Pause', 'pause.token': '[1s]', 'pause.title': 'Insert a pause [1s] at the cursor · edit the number to change it (max 10 s)',
    'pause.done': 'Inserted a pause [1s] · type a new number to change its length',
    'exp.show': 'Experimental +7', 'exp.hide': 'Hide experimental', 'exp.title': '7 tags not in the official docs (may do nothing or be read as text)',
    'tag.mid': 'Tags work best at the start or end of a sentence', 'tag.stripLang': 'Tags are removed for this language (Settings › Sound › Expression tags)',

    'chars': '{n} chars', 'cursor': 'Sentence {i} / {n}',
    'segs.title': 'Sentences', 'segs.info': '{n} · {done} ready', 'segs.timed': ' · subtitle timing', 'segs.empty': 'Type text or open a file\nand it is split into sentences here',
    'genAll': 'Generate all', 'genAll.title': 'Generate every sentence in advance (you can keep listening meanwhile)',
    'srt.short': 'Save subtitles (SRT)', 'zip.short': 'Per-sentence WAV ZIP', 'segs.aria': 'Sentence list (↑↓ to move, Enter to play)',
    'row.play': 'Play', 'row.re': 'Regenerate (keeps up to 3 takes)', 'row.more': 'Settings & save for this sentence', 'takes.aria': 'Takes',
    'take.title': 'Play take {n} (seed #{seed})', 'seed.label': 'Seed #{seed}',
    'more.voice': 'Voice', 'more.speed': 'Speed', 'more.gap': 'Pause after', 'opt.default': 'Default', 'gap.none': 'None', 'gap.sec': '{s} s',
    'more.wav': 'WAV', 'more.wavTitle': 'Save just this sentence as WAV', 'more.reset': 'Reset',

    'play.title': 'Play the sentence at the cursor or the selection (Ctrl+Enter) · pauses while playing', 'play.aria': 'Play', 'pause.aria': 'Pause', 'resume.aria': 'Resume',
    'playFrom.title': 'Play from the cursor to the end (Ctrl+Shift+Enter)', 'playFrom.aria': 'Play to the end', 'stop.title': 'Stop (Esc)', 'stop.aria': 'Stop',
    'wav.title': 'Save everything as WAV (Ctrl+S)', 'srt.title': 'Subtitles (SRT) timed to the full WAV', 'zip.title': 'Per-sentence WAVs in one ZIP (named by sentence)',
    'settings.aria': 'Settings', 'wave.idle': 'The waveform appears here when playing', 'wave.paused': 'Paused · ',

    'st.loading': 'Loading engine…', 'st.ready': 'Ready · {backend} · {source}', 'st.loadFail': 'Could not load the engine: {msg}', 'st.fail': 'Failed: {msg}',
    'st.noEngine': 'The engine is not loaded', 'st.noText': 'There is no text', 'st.eta': ' · about {s}s left',
    'b.wav': 'Building WAV', 'b.srt': 'Timing subtitles', 'b.zip': 'Building ZIP', 'b.all': 'Generating',
    'st.wav': 'WAV saved · {min} min · {backend}', 'st.srt': 'Subtitles saved · {n}', 'st.zip': 'ZIP saved · {n} sentences', 'st.all': 'All ready · {n} · {backend}',
    'st.stopped': 'Stopped · finished sentences are kept', 'st.tooBig': 'Files over 3 MB cannot be opened',
    'st.opened': 'Opened · {name}{how} · undo with Ctrl+Z', 'st.appended': ' (appended)', 'st.cleared': 'Text cleared · undo with Ctrl+Z',
    'st.projSaved': 'Project saved · reopen it with Open', 'st.projOpened': 'Project opened · {name}',

    'ask.cancel': 'Cancel', 'ask.open.title': 'Open file', 'ask.open.msg': 'How should "{name}" be added? The editor already has text.', 'ask.append': 'Append', 'ask.replace': 'Replace',
    'ask.proj.title': 'Open project', 'ask.proj.msg': 'Opening "{name}" replaces the current text and settings. Press Save first to keep them.', 'ask.openBtn': 'Open',
    'ask.clear.title': 'Clear all text', 'ask.clear.msg': 'Clear all text in the editor? You can still undo with Ctrl+Z.', 'ask.clearBtn': 'Clear',
    'ask.models.title': 'Delete downloaded model', 'ask.models.msg': 'Delete the model files on this device? They will be downloaded again next time.', 'ask.delBtn': 'Delete',

    'cast.head': 'Cast', 'cast.tip': "No 'Name: line' lines yet. Start a line with a name and a colon to give each character a voice.",
    'cast.example': 'Insert example', 'cast.sample': "Two people sat down at the table.\nAlex: Are we ready to record?\nSam: Yes, let's start.",
    'cast.voiceAria': '{w} voice', 'cast.ageAria': '{w} age', 'cast.play': 'Hear {w}',
    'v.F': 'Female {n}', 'v.M': 'Male {n}',

    'help.title': 'Shortcuts & tips',
    'help.rows': [
      ['<kbd>Ctrl</kbd>+<kbd>Enter</kbd>', 'Play the sentence at the cursor (or the selected text)'],
      ['<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd>', 'Play from the cursor to the end'],
      ['Play button', 'Pause while playing · press again to resume'],
      ['<kbd>Esc</kbd>', 'Stop (also stops Generate all and exports)'],
      ['<kbd>Ctrl</kbd>+<kbd>S</kbd>', 'Save everything as WAV'],
      ['<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>', 'Save project (.json)'],
      ['<kbd>Ctrl</kbd>+<kbd>O</kbd>', 'Open a file (text, subtitles, project)'],
      ['<kbd>Alt</kbd>+<kbd>R</kbd>', 'Regenerate the sentence at the cursor (keeps the last 3 takes)'],
      ['<kbd>Alt</kbd>+<kbd>1</kbd>~<kbd>0</kbd>', 'Insert an expression tag (number on the button)'],
      ['Sentence list <kbd>↑</kbd><kbd>↓</kbd>', 'Move between sentences · <kbd>Enter</kbd> to play'],
      ['<kbd>?</kbd>', 'This window (outside the editor)'],
    ],
    'help.notes': [
      'On Mac use <kbd>⌘</kbd> for <kbd>Ctrl</kbd> and <kbd>⌥</kbd> for <kbd>Alt</kbd>.',
      '<b>Simple / Pro</b> · Switch the view at the top. Simple is for hearing and saving one text quickly; Pro adds per-sentence editing, scripts, subtitles and the dictionary. Both views share the same text and settings.',
      '<b>Pauses</b> · Write <code>[1s]</code> <code>[0.5s]</code> <code>[500ms]</code> in the text to pause there (max 10 s). The <b>Pause</b> button in the toolbar inserts one.',
      '<b>Pronunciation</b> · Add <code>PiBrain → pie brain</code> under Settings › Pronunciation to change only how it is read; the text stays the same. Select a word in the editor and press <b>Add entry</b> to fill it in.',
      '<b>Per-sentence settings</b> · Press <b>⋯</b> in the sentence list to change the voice, speed or pause after for just that sentence, or save its WAV. Press a take number (1·2·3) to go back to a version you liked.',
      "<b>Expression tags</b> · The official tags are laugh, breath and sigh. Put them at the start or end of a sentence (the middle rarely works). If a tag is read out as text, regenerate that sentence or set Settings › Sound › Expression tags to 'Double for emphasis'. The training data is mostly Korean, English and Japanese, so Auto removes tags in other languages. The 7 'experimental' tags (dashed) are not in the official docs and may do nothing.",
      "<b>Script mode</b> · Turn on 'Script' and write lines as 'Name: line' to give each character a voice and age. Lines without a name use the default voice.",
      "<b>Projects</b> · Save stores the text, cast, dictionary, per-sentence settings and chosen takes in one .json; Open loads it again. On phones, use the browser's 'Add to Home Screen' to use it like an app.",
      'Audio is made on this device with <a href="https://huggingface.co/supertone-oss-archive/supertonic-3" target="_blank" rel="noopener">Supertonic 3</a> (Open RAIL-M); your text is not sent to a server. Disclose that the audio is AI-generated and do not use it to impersonate or deceive people. This project is not affiliated with Supertone Inc. · <a href="THIRD_PARTY_NOTICES.md">Licenses</a>',
    ],
  },
};

let cur = 'ko';
export const UI_LANGS = ['ko', 'en'];
export function setUiLang(l) { cur = D[l] ? l : 'ko'; document.documentElement.lang = cur; }
export const uiLang = () => cur;
export function t(key, vars) {
  let s = D[cur][key] ?? D.ko[key] ?? key;
  if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
  return s;
}
// data-i18n(글자) · data-i18n-html(태그 포함 글) · data-i18n-title · data-i18n-aria · data-i18n-ph(placeholder)
export function applyDom(root = document) {
  for (const e of root.querySelectorAll('[data-i18n]')) e.textContent = t(e.dataset.i18n);
  for (const e of root.querySelectorAll('[data-i18n-html]')) e.innerHTML = t(e.dataset.i18nHtml);
  for (const e of root.querySelectorAll('[data-i18n-title]')) e.title = t(e.dataset.i18nTitle);
  for (const e of root.querySelectorAll('[data-i18n-aria]')) e.setAttribute('aria-label', t(e.dataset.i18nAria));
  for (const e of root.querySelectorAll('[data-i18n-ph]')) e.placeholder = t(e.dataset.i18nPh);
}
