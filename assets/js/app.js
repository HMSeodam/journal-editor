/* ══════════════════════════════════════════════════════════
   불교학 학술지 편집검토 프롬프트 아카이브 — app.js
   ══════════════════════════════════════════════════════════ */

/* ── YouTube 영상 ID ─────────────────────────────────────
   아래 VIDEO_ID를 실제 유튜브 영상 ID로 교체하십시오.
   예: const YOUTUBE_VIDEO_ID = "dQw4w9WgXcQ";
   ─────────────────────────────────────────────────────── */
const YOUTUBE_VIDEO_ID = "VIDEO_ID";

/* ── 프롬프트 파일 경로 ──────────────────────────────────── */
const PROMPT_BUDDHIST = "prompts/claude_buddhist_journal_editorial_review_prompt_ultimate.md";
const PROMPT_GENERIC  = "prompts/claude_journal_editorial_review_prompt_generic.md";

/* ── 학술지 데이터 ───────────────────────────────────────── */
const journals = [
  { name: "강좌미술사",            file: "강좌미술사.pdf" },
  { name: "대각사상",              file: "대각사상.pdf" },
  { name: "동아시아불교문화",      file: "동아시아불교문화.pdf" },
  { name: "동악미술사학",          file: "동악미술사학.pdf" },
  { name: "명상심리상담",          file: "명상심리상담.pdf" },
  { name: "무형문화연구",          file: "무형문화연구.pdf" },
  { name: "보조사상",              file: "보조사상.pdf" },
  { name: "불교문예연구",          file: "불교문예연구.pdf" },
  { name: "불교미술사학",          file: "불교미술사학.pdf" },
  { name: "불교연구",              file: "불교연구.pdf" },
  { name: "불교와 사회",           file: "불교와 사회.pdf" },
  { name: "불교철학",              file: "불교철학.pdf" },
  { name: "불교학리뷰",            file: "불교학리뷰.pdf" },
  { name: "불교학밀교학연구",      file: "불교학밀교학연구.pdf" },
  { name: "불교학보",              file: "불교학보.pdf" },
  { name: "불교학연구",            file: "불교학연구.pdf" },
  { name: "선문화연구",            file: "선문화연구.pdf" },
  { name: "선학",                  file: "선학.pdf" },
  { name: "세화불학",              file: "세화불학.pdf" },
  { name: "원불교사상과 종교문화", file: "원불교사상과 종교문화.pdf" },
  { name: "인도철학",              file: "인도철학.pdf" },
  { name: "전자불전",              file: "전자불전.pdf" },
  { name: "정토학연구",            file: "정토학연구.pdf" },
  { name: "종학연구",              file: "종학연구.pdf" },
  { name: "한국교수불자연합",      file: "한국교수불자연합.pdf" },
  { name: "한국불교사연구",        file: "한국불교사연구.pdf" },
  { name: "한국불교학",            file: "한국불교학.pdf" },
  { name: "한마음연구",            file: "한마음연구.pdf" },
  { name: "IJBTC",                 file: "IJBTC.pdf" }
];

/* ── 사용법 복사 문구 (AI 도구별 사용 절차와 동일하게 유지) ── */
const USAGE_TEXT =
`【공통 절차 1~5단계】
1. 학술지 투고 양식 PDF를 업로드합니다.
2. 투고규정 분석 및 저널 전용 편집 기준표 작성을 요청합니다.
3. 검토할 논문 PDF를 업로드합니다.
4. 학술지 편집검토 프롬프트를 붙여넣습니다.
5. 논문 전수 검토를 요청합니다.

【6단계 — 도구별 출력 방식】
• Claude : 최종 결과를 docx 파일로 출력하도록 요청합니다.
• Gemini : 결과를 Google Docs로 내보내거나, 항목별 표 형식으로 정리하도록 요청합니다.
• ChatGPT : 코드 인터프리터를 통해 결과를 Excel(.xlsx) 또는 CSV 파일로 출력하도록 요청합니다.

※ AI 검토 결과는 참고자료이며, 최종 제출 전 반드시 사람이 직접 검토해야 합니다.`;

/* ══════════════════════════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════════════════════════ */

/** 모바일 여부 판단 */
function isMobile() {
  return (
    navigator.maxTouchPoints > 0 ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

/** 파일명 인코딩 (한글·공백 처리) */
function encodePath(path) {
  return path.split('/').map(function(seg, i, arr) {
    return i === arr.length - 1 ? encodeURIComponent(seg) : seg;
  }).join('/');
}

/** 클립보드 복사 */
function copyToClipboard(text, callback) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function() {
      if (callback) callback();
    }).catch(function() {
      fallbackCopy(text, callback);
    });
  } else {
    fallbackCopy(text, callback);
  }
}

function fallbackCopy(text, callback) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;top:0;left:0;';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); if (callback) callback(); }
  catch (e) { console.error('복사 실패', e); }
  document.body.removeChild(ta);
}

/** 토스트 표시 */
var _toastTimers = {};
function showToast(el, msg, key) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  if (_toastTimers[key]) clearTimeout(_toastTimers[key]);
  _toastTimers[key] = setTimeout(function() { el.classList.add('hidden'); }, 4000);
}

/**
 * fetch로 파일을 가져와 Blob 다운로드 트리거
 * mimeType: 'application/pdf' 또는 'text/markdown'
 */
function fetchAndDownload(filePath, fileName, mimeType, onSuccess, onError) {
  fetch(filePath)
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return mimeType === 'text/markdown' ? res.text() : res.blob();
    })
    .then(function(data) {
      var blob = (typeof data === 'string')
        ? new Blob([data], { type: mimeType + ';charset=utf-8' })
        : data;
      var url = URL.createObjectURL(blob);
      var a   = document.createElement('a');
      a.href     = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
      if (onSuccess) onSuccess(typeof data === 'string' ? data : null);
    })
    .catch(function(err) {
      console.error('다운로드 실패:', err);
      if (onError) onError(err);
    });
}

/**
 * MD 파일 처리
 * PC  → 다운로드만
 * 모바일 → 다운로드 + 전문 클립보드 복사
 */
function handleMdBtn(filePath, fileName, toastEl, toastKey) {
  fetchAndDownload(
    filePath,
    fileName,
    'text/markdown',
    function(text) {
      showToast(toastEl,
        '✓ 다운로드 완료.',
        toastKey);
    },
    function() {
      showToast(toastEl,
        '⚠ 파일을 불러올 수 없습니다. GitHub Pages의 prompts 폴더에 파일이 있는지 확인하십시오.',
        toastKey);
    }
  );
}

/* ══════════════════════════════════════════════════════════
   INIT FUNCTIONS
   ══════════════════════════════════════════════════════════ */

function initDropdown() {
  var dropdown = document.getElementById('journal-dropdown');
  if (!dropdown) return;
  journals.forEach(function(j) {
    var opt = document.createElement('option');
    opt.value = j.file;
    opt.textContent = j.name;
    dropdown.appendChild(opt);
  });
  dropdown.addEventListener('change', handleJournalSelect);
}

function handleJournalSelect(e) {
  var file   = e.target.value;
  var result = document.getElementById('journal-result');
  var nameEl = document.getElementById('selected-journal-name');
  var pdfBtn = document.getElementById('pdf-download-btn');

  if (!file) { result.classList.add('hidden'); return; }

  var journal = journals.find(function(j) { return j.file === file; });
  if (!journal) return;

  nameEl.textContent = journal.name;

  /* PDF 버튼: fetch → blob 방식으로 강제 다운로드 */
  pdfBtn.onclick = function(ev) {
    ev.preventDefault();
    var pdfPath = encodePath('assets/pdfs/' + file);
    var toast   = document.getElementById('copy-toast');
    fetchAndDownload(
      pdfPath,
      file,
      'application/pdf',
      function() {
        /* 성공 시 별도 토스트 없이 진행 */
      },
      function() {
        showToast(toast,
          '⚠ PDF를 불러올 수 없습니다. assets/pdfs 폴더에 파일이 있는지 확인하십시오.',
          'pdf');
      }
    );
  };

  result.classList.remove('hidden');
}

function initBuddhistPromptBtn() {
  var btn   = document.getElementById('buddhist-prompt-btn');
  var toast = document.getElementById('copy-toast');
  if (!btn) return;
  btn.addEventListener('click', function() {
    handleMdBtn(
      PROMPT_BUDDHIST,
      'claude_buddhist_journal_editorial_review_prompt_ultimate.md',
      toast,
      'buddhist'
    );
  });
}

function initGenericPromptBtn() {
  var btn   = document.getElementById('generic-prompt-btn');
  var toast = document.getElementById('generic-copy-toast');
  if (!btn) return;
  btn.addEventListener('click', function() {
    handleMdBtn(
      PROMPT_GENERIC,
      'claude_journal_editorial_review_prompt_generic.md',
      toast,
      'generic'
    );
  });
}

function initCopyUsageBtn() {
  var btn   = document.getElementById('copy-usage-btn');
  var toast = document.getElementById('copy-toast');
  if (!btn) return;
  btn.addEventListener('click', function() {
    copyToClipboard(USAGE_TEXT, function() {
      showToast(toast, '✓ 사용법이 클립보드에 복사되었습니다.', 'usage');
    });
  });
}

function initYoutube() {
  var iframe = document.getElementById('youtube-iframe');
  if (!iframe) return;
  if (YOUTUBE_VIDEO_ID && YOUTUBE_VIDEO_ID !== 'VIDEO_ID') {
    iframe.src = 'https://www.youtube.com/embed/' + YOUTUBE_VIDEO_ID;
  } else {
    var wrapper = iframe.closest('.video-wrapper');
    if (wrapper) {
      iframe.style.display = 'none';
      var ph = document.createElement('div');
      ph.style.cssText =
        'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
        'justify-content:center;background:#1D2B4E;color:rgba(255,255,255,.4);' +
        'font-size:.85rem;text-align:center;padding:24px;border-radius:6px;' +
        'font-family:Noto Sans KR,sans-serif;line-height:1.8;gap:6px;';
      ph.innerHTML =
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.4">' +
        '<polygon points="23 7 16 12 23 17 23 7"/>' +
        '<rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' +
        '<span>안내 영상 준비 중</span>' +
        '<span style="font-size:.72rem;opacity:.5;">' +
        'app.js의 YOUTUBE_VIDEO_ID를<br>실제 영상 ID로 교체하십시오.</span>';
      wrapper.appendChild(ph);
    }
  }
}

/* ══════════════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  initDropdown();
  initBuddhistPromptBtn();
  initGenericPromptBtn();
  initCopyUsageBtn();
  initYoutube();
});
