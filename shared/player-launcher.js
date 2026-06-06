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
      btn.onclick     = () => { closeAllAcc(); launchPlayer('meditation-timer', { duration: d.s }); };
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
