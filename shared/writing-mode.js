/* Phone writing mode (Scott 2026-10-29).
   On phones the keyboard covers about half the screen, so a tapped text box shows only a few
   lines. When a member taps a multi-line text box on a touch phone, this opens a full-screen
   writing sheet that fills the space above the keyboard, with Done pinned at the top. Every
   keystroke is copied back into the original box (and its normal input/change handlers fire),
   so saving works exactly as before. Opens in the top page when embedded in a same-origin frame,
   because the embedded frames are taller than the screen. */

const PHONE = '(max-width: 650px) and (pointer: coarse)';

function topWindow() {
  try { if (window.top !== window && window.top.document) return window.top; } catch (_) { /* cross-origin */ }
  return window;
}

function wanted(el) {
  if (!el || el.tagName !== 'TEXTAREA' || el.readOnly || el.disabled) return false;
  if (el.closest('[data-no-writing-mode]')) return false;
  if (el.getAttribute('rows') === '1') return false;                       // one-line names
  const max = Number(el.getAttribute('maxlength') || 0);
  if (max && max < 300) return false;                                       // short fields
  const w = topWindow();
  return !!(w.matchMedia && w.matchMedia(PHONE).matches);
}

function labelFor(el) {
  const aria = el.getAttribute('aria-label');
  if (aria) return aria;
  if (el.id) {
    const l = el.ownerDocument.querySelector('label[for="' + CSS.escape(el.id) + '"]');
    if (l) return l.textContent.trim();
  }
  const wrap = el.closest('label');
  if (wrap) return (wrap.firstChild && wrap.firstChild.textContent || wrap.textContent).trim().slice(0, 60);
  return el.getAttribute('placeholder') ? 'Write' : 'Your text';
}

const STYLE = `
#ci-writing-sheet{position:fixed;left:0;right:0;top:0;height:100vh;z-index:2147483000;display:flex;flex-direction:column;background:#fff;box-sizing:border-box;padding:env(safe-area-inset-top) env(safe-area-inset-right) 0 env(safe-area-inset-left)}
#ci-writing-sheet header{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #e3ded6;background:#f6f3ee}
#ci-writing-sheet h2{flex:1;margin:0;font:700 15px/1.2 Arial,sans-serif;color:#292929;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#ci-writing-sheet .ws-count{font:12px Arial,sans-serif;color:#777}
#ci-writing-sheet button{min-height:40px;padding:0 18px;border:0;border-radius:20px;background:#292929;color:#fff;font:700 15px Arial,sans-serif;cursor:pointer}
#ci-writing-sheet textarea{flex:1;width:100%;box-sizing:border-box;border:0;outline:0;resize:none;padding:16px;font:17px/1.55 Arial,sans-serif;color:#292929;background:#fff}
html.ci-writing-open,html.ci-writing-open body{overflow:hidden!important}`;

let open = null;

function openSheet(src) {
  const win = topWindow(), doc = win.document;
  if (open) return;
  if (!doc.getElementById('ci-writing-style')) {
    const s = doc.createElement('style'); s.id = 'ci-writing-style'; s.textContent = STYLE; doc.head.append(s);
  }
  const sheet = doc.createElement('div');
  sheet.id = 'ci-writing-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
  sheet.innerHTML = '<header><h2></h2><span class="ws-count"></span><button type="button">Done</button></header><textarea></textarea>';
  const title = sheet.querySelector('h2'), count = sheet.querySelector('.ws-count');
  const area = sheet.querySelector('textarea'), done = sheet.querySelector('button');
  title.textContent = labelFor(src);
  sheet.setAttribute('aria-label', title.textContent);
  area.value = src.value;
  area.placeholder = src.getAttribute('placeholder') || '';
  const max = src.getAttribute('maxlength'); if (max) area.maxLength = Number(max);
  const showCount = () => { count.textContent = max ? area.value.length + '/' + max : ''; };
  showCount();

  // Keep the sheet exactly above the on-screen keyboard.
  const vv = win.visualViewport;
  const fit = () => { if (!vv) return; sheet.style.top = vv.offsetTop + 'px'; sheet.style.height = vv.height + 'px'; };
  fit(); vv && vv.addEventListener('resize', fit); vv && vv.addEventListener('scroll', fit);

  const sync = () => {
    src.value = area.value;
    src.dispatchEvent(new Event('input', { bubbles: true }));
    showCount();
  };
  area.addEventListener('input', sync);
  // Safety net: if the keyboard stays attached to the original box, mirror it into the sheet.
  const back = () => { if (area.value !== src.value) { area.value = src.value; showCount(); } };
  src.addEventListener('input', back);

  const close = () => {
    if (!open) return;
    open = null;
    vv && vv.removeEventListener('resize', fit); vv && vv.removeEventListener('scroll', fit);
    src.removeEventListener('input', back);
    if (src.value !== area.value) src.value = area.value;
    src.dispatchEvent(new Event('change', { bubbles: true }));
    sheet.remove();
    doc.documentElement.classList.remove('ci-writing-open');
    src.dataset.ciWritingSkip = '1';             // don't reopen from the refocus below
    try { src.focus({ preventScroll: true }); src.blur(); } catch (_) {}
    delete src.dataset.ciWritingSkip;
  };
  done.addEventListener('click', close);
  sheet.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  doc.body.append(sheet);
  doc.documentElement.classList.add('ci-writing-open');
  open = { close };
  // Move the keyboard to the sheet (the tapped box may live in an embedded frame).
  src.dataset.ciWritingSkip = '1';
  try { src.blur(); } catch (_) {}
  delete src.dataset.ciWritingSkip;
  try { win.focus(); } catch (_) {}
  area.focus();
  try { area.setSelectionRange(area.value.length, area.value.length); } catch (_) {}
}

document.addEventListener('focusin', e => {
  const el = e.target;
  if (el && el.dataset && el.dataset.ciWritingSkip) return;
  if (!wanted(el)) return;
  openSheet(el);
}, true);
