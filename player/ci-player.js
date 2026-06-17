/* ============================================================
   CIPlayer — ONE engine for all Cosmic Intentions session
   players. Mode + duration are parameters, not separate files.

   Replaces: viz-quick / viz-3min / viz-10min / visual-countdown /
   countdown / meditation / meditation-select / meditation-timer /
   gratitude  →  a single data-driven player.

   USAGE
   -----
   new CIPlayer("#stage", {
     mode: "visualization",        // "visualization" | "meditation" | "gratitude"
     durationSec: 180,             // total session length
     images: ["a.jpg", "b.jpg"],   // visualization backgrounds (cycled)
     affirmations: ["I AM ...."],  // visualization / shown text
     gratitude: ["my health"],     // gratitude items → "I am grateful for ..."
     meditationFocus: "the breath",// meditation centering line
     slideMs: 5000, fadeMs: 800,
     voice: false,                 // speak each line (browser TTS)
     bell: false,                  // start/end chime (meditation)
     onEnd: null,                  // callback when the session completes
   });

   API: play() / pause() / toggle() / end() / destroy()
   ============================================================ */

class CIPlayer {
  constructor(target, options = {}) {
    this.root = typeof target === "string" ? document.querySelector(target) : target;
    if (!this.root) throw new Error("CIPlayer: target not found");

    this.opts = Object.assign({
      mode: "visualization",
      durationSec: 180,
      slideMs: 5000,
      fadeMs: 800,
      images: [],
      affirmations: [],
      gratitude: [],
      meditationFocus: "the breath",
      voice: false,
      bell: false,
      autoplay: true,
      onEnd: null,
    }, options);

    this.items   = this._items();          // the text lines for this mode
    this.idx     = 0;
    this.imgIdx  = 0;
    this.remain  = this.opts.durationSec;   // seconds left
    this.playing = false;
    this._slideTimer = null;
    this._tick = null;

    this._build();
    if (this.opts.autoplay) this.play();
  }

  /* ---- per-mode content ---- */
  _items() {
    const o = this.opts;
    if (o.mode === "gratitude") {
      return (o.gratitude.length ? o.gratitude : ["this moment", "the journey", "my own effort"])
        .map(g => `I am grateful for ${g}.`);
    }
    if (o.mode === "meditation") {
      // breathing cadence cues, looped under the countdown
      return ["Breathe in…", "Hold…", "Breathe out…", "Settle into " + (o.meditationFocus || "the breath")];
    }
    return o.affirmations.length ? o.affirmations : ["I AM BECOMING WHO I WAS BORN TO BE"];
  }

  /* ---- DOM ---- */
  _build() {
    this.root.classList.add("cip");
    this.root.dataset.mode = this.opts.mode;
    this.root.innerHTML = `
      <div class="cip__bg"></div>
      <div class="cip__scrim"></div>
      <div class="cip__top">
        <span class="cip__mode">${this.opts.mode.toUpperCase()}</span>
        <span class="cip__time"></span>
      </div>
      <div class="cip__center">
        <div class="cip__timer"></div>
        <div class="cip__text"></div>
        <div class="cip__breath"></div>
      </div>
      <div class="cip__bottom">
        <div class="cip__bar"><span></span></div>
        <div class="cip__controls">
          <button data-act="toggle" title="Play/Pause">⏸</button>
          <button data-act="close" title="End session">✕</button>
        </div>
      </div>
      <div class="cip__done">
        <div class="cip__done-check">✓</div>
        <div class="cip__done-label">SESSION COMPLETE</div>
      </div>`;

    this.bgEl     = this.root.querySelector(".cip__bg");
    this.timeEl   = this.root.querySelector(".cip__time");
    this.timerEl  = this.root.querySelector(".cip__timer");
    this.textEl   = this.root.querySelector(".cip__text");
    this.breathEl = this.root.querySelector(".cip__breath");
    this.barEl    = this.root.querySelector(".cip__bar > span");
    this.toggleBtn= this.root.querySelector('[data-act="toggle"]');

    this.root.querySelector('[data-act="close"]').addEventListener("click", () => this.end(true));
    this.toggleBtn.addEventListener("click", () => this.toggle());

    this._renderTime();
    this._renderSlide(0);
  }

  /* ---- rendering ---- */
  _renderTime() {
    const m = Math.floor(this.remain / 60), s = this.remain % 60;
    const str = `${m}:${String(s).padStart(2, "0")}`;
    if (this.timeEl)  this.timeEl.textContent  = str;
    if (this.opts.mode === "meditation") this.timerEl.textContent = str;
    const pct = 100 * (1 - this.remain / this.opts.durationSec);
    if (this.barEl) this.barEl.style.width = pct + "%";
  }

  _renderSlide(i) {
    const total = this.items.length;
    this.idx = ((i % total) + total) % total;
    const line = this.items[this.idx];

    if (this.opts.mode === "meditation") {
      this.breathEl.style.opacity = "0";
      setTimeout(() => { this.breathEl.textContent = line; this.breathEl.style.opacity = ".85"; }, 200);
    } else {
      this.textEl.style.opacity = "0";
      setTimeout(() => { this.textEl.textContent = line; this.textEl.style.opacity = "1"; }, this.opts.fadeMs / 2);
    }

    // visualization cycles its background images
    if (this.opts.mode === "visualization" && this.opts.images.length) {
      this.imgIdx = (this.imgIdx + 1) % this.opts.images.length;
      this.bgEl.style.opacity = "0";
      setTimeout(() => {
        this.bgEl.style.backgroundImage = `url("${this.opts.images[this.imgIdx]}")`;
        this.bgEl.style.opacity = "1";
      }, this.opts.fadeMs / 2);
    }

    this._speak(line);
  }

  /* ---- playback ---- */
  play() {
    if (this.root.classList.contains("is-done")) return;
    this.playing = true;
    this.toggleBtn.textContent = "⏸";
    if (this.opts.bell && this.remain === this.opts.durationSec) this._chime();

    clearInterval(this._slideTimer);
    this._slideTimer = setInterval(() => this._renderSlide(this.idx + 1), this.opts.slideMs);

    clearInterval(this._tick);
    this._tick = setInterval(() => {
      this.remain--;
      this._renderTime();
      if (this.remain <= 0) this.end(false);
    }, 1000);
  }

  pause() {
    this.playing = false;
    this.toggleBtn.textContent = "▶";
    clearInterval(this._slideTimer);
    clearInterval(this._tick);
  }

  toggle() { this.playing ? this.pause() : this.play(); }

  end(userInitiated) {
    this.pause();
    if (this.opts.bell && !userInitiated) this._chime();
    this.root.classList.add("is-done");
    if (typeof this.opts.onEnd === "function") this.opts.onEnd(userInitiated);
  }

  destroy() {
    clearInterval(this._slideTimer);
    clearInterval(this._tick);
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
    this.root.classList.remove("cip", "is-done");
    this.root.innerHTML = "";
  }

  /* ---- optional voice + bell (guarded; no-ops where unsupported) ---- */
  _speak(text) {
    if (!this.opts.voice || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9; u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  _chime() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 528;          // soft "bell"
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);
      o.start(); o.stop(ctx.currentTime + 2.3);
    } catch (e) {}
  }
}

if (typeof module !== "undefined" && module.exports) module.exports = CIPlayer;
if (typeof window !== "undefined") window.CIPlayer = CIPlayer;
