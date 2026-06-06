/* ── PLAYER LAUNCHER + MEDITATION MODAL + TIMER PICKER ──
   Depends on globals: LS, setEl, closeDrawer, intentions,
   logActivity, playBell, speakText, toast
───────────────────────────────────────────────────────── */

function launchPlayer(playerType, config = {}) {
  if (['viz-quick','viz-10min','viz-3min','visual-countdown'].includes(playerType)) {
    LS.set('ci_viz_plays', (LS.get('ci_viz_plays') || 0) + 1);
    setEl('vsVizPlays', LS.get('ci_viz_plays'));
  }
  if (playerType === 'gratitude') {
    LS.set('ci_gratitude_plays', (LS.get('ci_gratitude_plays') || 0) + 1);
  }
  closeDrawer();
  const w    = 1024, h = 768;
  const left = (screen.width  - w) / 2;
  const top  = (screen.height - h) / 2;
  const params = new URLSearchParams(config);
  const url    = `players/${playerType}.html${params.toString() ? '?' + params : ''}`;
  window.open(url, `ci_player_${playerType}`,
    `width=${w},height=${h},left=${left},top=${top},resizable=yes,menubar=no,toolbar=no,location=no,status=no`);
}

function launchCountdownTimer(duration = 30) {
  launchPlayer('countdown', { duration });
}

function launchMeditation(duration) {
  logActivity('meditation', { duration_s: duration }, 15);
  openMeditationModal(duration);
}

/* ── MEDITATION MODAL (inline player) ─────────────────── */
const MED_IMAGES = [
  'images/meditations/bg-meditations-1.jpg',
  'images/meditations/bg-meditations-2.jpg',
  'images/meditations/bg-meditations-3.jpg',
  'images/meditations/bg-meditations-4.jpg',
];
const MED_DURATIONS = [
  { label: '1 min',  s: 60   }, { label: '2 min',  s: 120  },
  { label: '3 min',  s: 180  }, { label: '5 min',  s: 300  },
  { label: '7 min',  s: 420  }, { label: '10 min', s: 600  },
  { label: '12 min', s: 720  }, { label: '15 min', s: 900  },
  { label: '20 min', s: 1200 }, { label: '25 min', s: 1500 },
  { label: '30 min', s: 1800 }, { label: '40 min', s: 2400 },
  { label: '45 min', s: 2700 }, { label: '60 min', s: 3600 },
  { label: '90 min', s: 5400 },
];
const medSt = {
  duration: 0, countdown: 0, halfPoint: 0,
  interval: null, autoClose: null, paused: false, timers: [], guided: false,
};

function medDayImage() {
  return MED_IMAGES[Math.floor(Date.now() / 86400000) % MED_IMAGES.length];
}
function medFmtTime(s) {
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}

function openMeditationModal(duration) {
  document.getElementById('medModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('medHeroBg').style.backgroundImage = `url("${medDayImage()}")`;
  [['medGridGuided', true], ['medGridUnguided', false]].forEach(([id, guided]) => {
    const grid = document.getElementById(id);
    if (!grid.hasChildNodes()) {
      MED_DURATIONS.forEach(d => {
        const btn = document.createElement('button');
        btn.className   = 'med-dur-btn';
        btn.textContent = d.label;
        btn.onclick     = () => startMedTimer(d.s, guided);
        grid.appendChild(btn);
      });
    }
  });
  if (duration) {
    startMedTimer(duration, false);
  } else {
    document.getElementById('medSelectView').style.display = 'flex';
    document.getElementById('medTimerView').classList.remove('active');
    medBackToChoice();
  }
}

function showMedSubview(type) {
  document.getElementById('medChoiceScreen').style.display = 'none';
  document.getElementById('medSubGuided').classList.toggle('active',   type === 'guided');
  document.getElementById('medSubUnguided').classList.toggle('active', type === 'unguided');
}

function medBackToChoice() {
  document.getElementById('medChoiceScreen').style.display = 'flex';
  document.getElementById('medSubGuided').classList.remove('active');
  document.getElementById('medSubUnguided').classList.remove('active');
}

function startMedTimer(seconds, guided = false) {
  medStopTimers();
  medSt.duration  = seconds;
  medSt.countdown = seconds;
  medSt.halfPoint = Math.floor(seconds / 2);
  medSt.paused    = false;
  medSt.guided    = guided;
  document.getElementById('medSelectView').style.display = 'none';
  document.getElementById('medTimerView').classList.add('active');
  document.getElementById('medTimerBg').style.backgroundImage = `url("${medDayImage()}")`;
  document.getElementById('medPauseBtn').textContent = '⏸';
  const mins = seconds / 60;
  document.getElementById('medSessionLabel').textContent =
    `${Number.isInteger(mins) ? mins : Math.round(mins)} Minute Meditation`;
  document.getElementById('medCountdownNum').textContent = medFmtTime(seconds);
  document.getElementById('medCountdownCircle').classList.remove('ending');
  medSt.timers.push(setTimeout(medTick, 800));
}

function medTick() {
  const display = document.getElementById('medCountdownNum');
  const circle  = document.getElementById('medCountdownCircle');
  medSt.interval = setInterval(() => {
    medSt.countdown--;
    display.textContent = medFmtTime(medSt.countdown);
    if (medSt.countdown === 300 && medSt.duration > 300) {
      playBell();
      medSt.timers.push(setTimeout(() => playBell(), 2500));
    }
    if (medSt.countdown <= 3 && medSt.countdown > 0) circle.classList.add('ending');
    if (medSt.countdown <= 0) {
      clearInterval(medSt.interval); medSt.interval = null;
      circle.classList.remove('ending');
      medComplete();
    }
  }, 1000);
}

function medComplete() {
  playBell();
  const circle = document.getElementById('medCountdownCircle');
  document.getElementById('medCountdownNum').textContent  = 'CLOSE';
  document.getElementById('medCountdownNum').style.fontSize = '11px';
  circle.style.cursor = 'pointer';
  circle.onclick = () => closeMeditationModal();
  if (medSt.guided) speakText('Your meditation is complete. Well done.');
  LS.set('ci_med_plays', (LS.get('ci_med_plays') || 0) + 1);
  setEl('vsMedPlays', LS.get('ci_med_plays'));
  medSt.autoClose = setTimeout(() => closeMeditationModal(), 10000);
}

function toggleMedPause() {
  const btn = document.getElementById('medPauseBtn');
  medSt.paused = !medSt.paused;
  if (medSt.paused) {
    clearInterval(medSt.interval); medSt.interval = null;
    medSt.timers.forEach(id => clearTimeout(id)); medSt.timers = [];
    btn.textContent = '▶';
  } else {
    btn.textContent = '⏸';
    medTick();
  }
}

function restartMeditation() {
  medStopTimers();
  startMedTimer(medSt.duration);
}

function medStopTimers() {
  clearInterval(medSt.interval); medSt.interval = null;
  clearTimeout(medSt.autoClose); medSt.autoClose = null;
  medSt.timers.forEach(id => clearTimeout(id)); medSt.timers = [];
}

function closeMeditationModal() {
  medStopTimers();
  const modal = document.getElementById('medModal');
  modal.classList.remove('open', 'inline');
  document.body.style.overflow = '';
  document.getElementById('medTimerView').classList.remove('active');
  document.getElementById('medSelectView').style.display = 'flex';
  document.getElementById('medCountdownCircle').classList.remove('ending');
  medBackToChoice();
  if (modal.parentElement !== document.body) document.body.appendChild(modal);
}

/* ── TIMER PICKER ────────────────────────────────────── */
const TIMER_DURATIONS = [
  { label: '1 min',  s: 60   }, { label: '2 min',  s: 120  },
  { label: '3 min',  s: 180  }, { label: '5 min',  s: 300  },
  { label: '8 min',  s: 480  }, { label: '10 min', s: 600  },
  { label: '12 min', s: 720  }, { label: '15 min', s: 900  },
  { label: '20 min', s: 1200 }, { label: '25 min', s: 1500 },
  { label: '30 min', s: 1800 }, { label: '35 min', s: 2100 },
  { label: '45 min', s: 2700 }, { label: '50 min', s: 3000 },
  { label: '60 min', s: 3600 },
];

function openTimerPicker() {
  const grid = document.getElementById('timerPickerGrid');
  if (!grid.hasChildNodes()) {
    TIMER_DURATIONS.forEach(d => {
      const btn = document.createElement('button');
      btn.className   = 'timer-pick-btn';
      btn.textContent = d.label;
      btn.onclick     = () => { closeTimerPicker(); launchPlayer('meditation-timer', { duration: d.s }); };
      grid.appendChild(btn);
    });
  }
  document.getElementById('timerPickerBg').classList.add('open');
}

function closeTimerPicker(e) {
  if (e && e.target !== document.getElementById('timerPickerBg')) return;
  document.getElementById('timerPickerBg').classList.remove('open');
}

/* ── PLAYER ACCORDIONS ───────────────────────────────── */
let _accMedGuided = false;

function toggleAcc(key) {
  const panel  = document.getElementById('accPanel-' + key);
  const trig   = document.getElementById('accTrig-'  + key);
  const isOpen = panel.classList.contains('open');
  document.querySelectorAll('.acc-panel').forEach(p  => { p.classList.remove('open'); p.style.maxHeight = ''; });
  document.querySelectorAll('.acc-trigger').forEach(t => t.classList.remove('open'));
  if (key === 'timer' && !document.getElementById('accTimerGrid').hasChildNodes()) {
    TIMER_DURATIONS.forEach(d => {
      const btn = document.createElement('button');
      btn.className   = 'acc-dur-btn';
      btn.textContent = d.label;
      btn.onclick     = () => launchVizInline('meditation-timer', { duration: d.s });
      document.getElementById('accTimerGrid').appendChild(btn);
    });
  }
  if (!isOpen) { panel.classList.add('open'); trig.classList.add('open'); }
}

function closeAllAcc() {
  document.querySelectorAll('.acc-panel').forEach(p  => { p.classList.remove('open'); p.style.maxHeight = ''; });
  document.querySelectorAll('.acc-trigger').forEach(t => t.classList.remove('open'));
}

function accMedType(type) {
  _accMedGuided = (type === 'guided');
  document.getElementById('accMedGuided').classList.toggle('active',   type === 'guided');
  document.getElementById('accMedUnguided').classList.toggle('active', type === 'unguided');
  const grid = document.getElementById('accMedGrid');
  grid.style.display = 'flex';
  grid.innerHTML = '';
  MED_DURATIONS.forEach(d => {
    const btn = document.createElement('button');
    btn.className   = 'acc-dur-btn';
    btn.textContent = d.label;
    btn.onclick = () => {
      closeAllAcc();
      const modal = document.getElementById('medModal');
      const slot  = document.getElementById('medInlineSlot');
      if (slot) {
        slot.appendChild(modal);
        modal.classList.add('open', 'inline');
        document.body.style.overflow = '';
      } else {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
      document.getElementById('medHeroBg').style.backgroundImage = `url("${medDayImage()}")`;
      document.getElementById('medSelectView').style.display = 'none';
      startMedTimer(d.s, _accMedGuided);
    };
    grid.appendChild(btn);
  });
  document.getElementById('accPanel-meditation').style.maxHeight = '500px';
}

/* ── VIZ INLINE IFRAME PLAYER ────────────────────────── */
function launchVizInline(playerType, params = {}) {
  LS.set('ci_viz_plays', (LS.get('ci_viz_plays') || 0) + 1);
  closeAllAcc();

  const slot = document.getElementById('vizInlineSlot');
  if (!slot) { launchPlayer(playerType, params); return; }

  // Close any open viz inline first
  closeVizInline();

  const wrap = document.createElement('div');
  wrap.className = 'viz-inline-wrap';
  wrap.id = 'vizInlineWrap';

  const closeBtn = document.createElement('button');
  closeBtn.className   = 'viz-inline-close';
  closeBtn.textContent = '✕ Close';
  closeBtn.onclick = closeVizInline;

  const frame = document.createElement('iframe');
  frame.className = 'viz-inline-frame';
  frame.id  = 'vizInlineFrame';
  const qs  = new URLSearchParams(params).toString();
  frame.src = `players/${playerType}.html${qs ? '?' + qs : ''}`;
  frame.allow = 'autoplay';

  wrap.appendChild(closeBtn);
  wrap.appendChild(frame);
  slot.appendChild(wrap);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeVizInline() {
  const wrap = document.getElementById('vizInlineWrap');
  if (wrap) wrap.remove();
}

/* ── GRATITUDE INLINE PLAYER ─────────────────────────── */
const GRAT_SETS = [
  [
    'images/GRATITUDE/GRATITUDE 1/A COMFY BED.jpg',
    'images/GRATITUDE/GRATITUDE 1/A GOOD BOOK.jpg',
    'images/GRATITUDE/GRATITUDE 1/A RELAXING BATH.jpg',
    'images/GRATITUDE/GRATITUDE 1/CHOCOLATE.jpg',
    'images/GRATITUDE/GRATITUDE 1/FRIENDS.jpg',
  ],
  [
    'images/GRATITUDE/GRATITUDE 2/A COMFY CHAIR.jpg',
    'images/GRATITUDE/GRATITUDE 2/A HOT BATH.jpg',
    'images/GRATITUDE/GRATITUDE 2/COMFORT FOOD.jpg',
    'images/GRATITUDE/GRATITUDE 2/FAMILY TIME.jpg',
    'images/GRATITUDE/GRATITUDE 2/PIZZA.jpg',
  ],
  [
    'images/GRATITUDE/GRATITUDE 3/FRESH PRODUCE.jpg',
    'images/GRATITUDE/GRATITUDE 3/MY ABILITY TO EXERCISE.jpg',
    'images/GRATITUDE/GRATITUDE 3/MY CARDIOVASCULAR HEALTH.jpg',
    'images/GRATITUDE/GRATITUDE 3/MY GRANDCHILDREN.jpg',
    'images/GRATITUDE/GRATITUDE 3/SCENIC TRAIN RIDES.jpg',
  ],
  [
    'images/GRATITUDE/GRATITUDE 4/A GREAT ROADTRIP.jpg',
    'images/GRATITUDE/GRATITUDE 4/A WALK IN NATURE.jpg',
    'images/GRATITUDE/GRATITUDE 4/A YUMMY BURGER.jpg',
    'images/GRATITUDE/GRATITUDE 4/EXOTIC TRAVEL.jpg',
    'images/GRATITUDE/GRATITUDE 4/TIME WITH MY KIDS.jpg',
  ],
  [
    'images/GRATITUDE/GRATITUDE 5/COZY SOCKS.jpg',
  ],
];

const gratSt = { running: false };

function gratLabelFromPath(src) {
  let name = src.split('/').pop().replace(/\.(jpg|jpeg|png|webp|gif)(\.\w+)*$/i,'').replace(/[-_]/g,' ').trim();
  return name.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function launchGratitudeInline() {
  LS.set('ci_gratitude_plays', (LS.get('ci_gratitude_plays') || 0) + 1);
  closeAllAcc();
  const slot   = document.getElementById('gratInlineSlot');
  const player = document.getElementById('gratPlayer');
  if (!slot || !player) { launchPlayer('gratitude'); return; }
  slot.appendChild(player);
  player.classList.add('open');
  player.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const setIdx = Math.floor(Date.now() / 86400000) % GRAT_SETS.length;
  const slides = GRAT_SETS[setIdx];

  // Build dots
  const dotsEl = document.getElementById('gratDots');
  dotsEl.innerHTML = '';
  slides.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'grat-dot';
    d.id = `gratDot-${i}`;
    dotsEl.appendChild(d);
  });

  gratSt.running = true;
  gratShowSlide(slides, 0);
}

const gratDelay = ms => new Promise(r => setTimeout(r, ms));

async function gratShowSlide(slides, n) {
  if (!gratSt.running) return;
  if (n >= slides.length) { gratComplete(); return; }

  const src   = slides[n];
  const label = gratLabelFromPath(src);
  const img   = document.getElementById('gratImage');
  const lbl   = document.getElementById('gratLabel');

  // Update dots
  document.querySelectorAll('.grat-dot').forEach((d, i) => d.classList.toggle('active', i === n));

  // Fade in image
  img.style.opacity = '0';
  lbl.style.opacity = '0';
  lbl.textContent   = ' ';
  await gratDelay(50);
  img.style.backgroundImage = `url("${src}")`;
  img.style.opacity = '1';

  await gratDelay(3000);
  if (!gratSt.running) return;

  lbl.textContent   = label || ' ';
  lbl.style.opacity = '1';
  if (label && typeof speakText === 'function') await speakText(`I am grateful for ${label.toLowerCase()}`);
  if (!gratSt.running) return;

  await gratDelay(3000);
  if (!gratSt.running) return;

  img.style.opacity = '0';
  lbl.style.opacity = '0';
  await gratDelay(2800);
  if (!gratSt.running) return;

  gratShowSlide(slides, n + 1);
}

async function gratComplete() {
  const lbl = document.getElementById('gratLabel');
  const img = document.getElementById('gratImage');
  if (img) img.style.opacity = '1';
  if (lbl) { lbl.textContent = 'Carry this gratitude with you.'; lbl.style.opacity = '1'; }
  if (typeof speakText === 'function') await speakText('Carry this gratitude with you today.');
  await gratDelay(3000);
  closeGratitudeInline();
}

function closeGratitudeInline() {
  gratSt.running = false;
  if (typeof stopSpeech === 'function') stopSpeech();
  const player = document.getElementById('gratPlayer');
  if (player) {
    player.classList.remove('open');
    document.body.appendChild(player); // park back on body
  }
}

// Listen for inline player close signal from iframe
window.addEventListener('message', e => {
  if (e.data?.type === 'ci_close_inline') closeVizInline();
});

/* ── ROADMAP LAUNCHER ────────────────────────────────── */
function openRoadmapForSelected() {
  const idx = (typeof selectedVaultIdx !== 'undefined' && selectedVaultIdx !== null)
    ? selectedVaultIdx : 0;
  launchPlayer('roadmap', { idx });
}

/* ── CONVENIENCE LAUNCHERS ───────────────────────────── */
function launch3MinViz()         { launchPlayer('viz-3min');      }
function launch10MinViz()        { launchPlayer('viz-10min');     }
function launchPegboardLoop()    { launchPlayer('pegboard-loop'); }

function launchQuickViz(duration) {
  if (duration) localStorage.setItem('viz_quick_duration', duration);
  launchPlayer('viz-quick');
}

function launchSlideshow(slidesConfig) {
  LS.set('slideshow_config', JSON.stringify(slidesConfig));
  launchPlayer('slideshow');
}

function launchVideo(videoUrl) {
  LS.set('video_url', videoUrl);
  launchPlayer('video');
}

function launchVisualCountdown(duration, idx = 0) {
  const title = (intentions[idx]?.title || '').replace(/^(i am)\s+/i, 'I AM ');
  localStorage.setItem('visual_countdown_duration', duration);
  localStorage.setItem('visual_countdown_goal', title);
  logActivity('viz', { duration_s: duration, intention: title }, 10);
  launchPlayer('visual-countdown');
}
