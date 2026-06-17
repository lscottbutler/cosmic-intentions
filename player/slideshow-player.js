/* ============================================================
   SlideshowPlayer — a small, dependency-free slideshow engine
   modeled on "92 SLIDES.mp4": still slides, fixed-duration,
   hard cuts. Data-driven so you can build many "players".

   USAGE
   -----
   const player = new SlideshowPlayer("#myStage", {
     slideMs: 3500,            // ms per slide (original cadence)
     fadeMs: 0,                // 0 = hard cut; e.g. 400 for crossfade
     loop: true,
     autoplay: true,
     controls: true,
     progress: true,
     slides: [
       { type: "image", src: "frames/slide_01.png", fit: "contain" },
       { type: "affirmation", text: "I AM FEARLESS", bg: "#ffffff", color: "#111" },
       { type: "quote", text: "Waste no more time arguing what a good person should be. Be one.",
         attribution: "Marcus Aurelius", bg: "#253D75", color: "#fff" },
       { type: "html", html: "<h1>Anything custom</h1>", bg: "#000", color: "#fff" },
     ],
   });

   API: player.play() / pause() / toggle() / next() / prev()
        player.goto(i) / player.destroy()
   ============================================================ */

class SlideshowPlayer {
  constructor(target, options = {}) {
    this.root = typeof target === "string" ? document.querySelector(target) : target;
    if (!this.root) throw new Error("SlideshowPlayer: target element not found");

    this.opts = Object.assign({
      slideMs: 3500,
      fadeMs: 0,
      loop: true,
      autoplay: true,
      controls: true,
      progress: true,
      aspect: null,             // e.g. "1 / 1" for square art; null = stylesheet default (16/9)
      slides: [],
    }, options);

    this.slides = this.opts.slides;
    this.index = 0;
    this.timer = null;
    this.rafStart = null;
    this.playing = false;

    this._build();
    this.goto(0);   // show the first slide immediately
    if (this.opts.autoplay && this.slides.length) this.play();
  }

  /* ---- DOM construction ---- */
  _build() {
    this.root.classList.add("ssp");
    if (this.opts.aspect) this.root.style.aspectRatio = this.opts.aspect;
    this.root.innerHTML = "";

    this.slideEls = this.slides.map((s) => this._buildSlide(s));
    this.slideEls.forEach((el) => this.root.appendChild(el));

    if (this.opts.progress) {
      this.progressEl = document.createElement("div");
      this.progressEl.className = "ssp__progress";
      this.root.appendChild(this.progressEl);
    }
    if (this.opts.controls) this._buildHud();

    // Keyboard nav when the player (or anything inside) has focus
    this.root.tabIndex = 0;
    this._onKey = (e) => {
      if (e.key === "ArrowRight") { this.next(true); }
      else if (e.key === "ArrowLeft") { this.prev(true); }
      else if (e.key === " ") { e.preventDefault(); this.toggle(); }
    };
    this.root.addEventListener("keydown", this._onKey);
  }

  _buildSlide(s) {
    const el = document.createElement("div");
    el.className = "ssp__slide";

    if (s.type === "image") {
      el.classList.add("ssp__slide--image");
      el.style.backgroundImage = `url("${s.src}")`;
      if (s.fit) el.dataset.fit = s.fit;
      if (s.bg) el.style.backgroundColor = s.bg;
      // Optional text laid OVER the artwork (affirmation/goal caption).
      if (s.text) {
        el.classList.add("ssp__slide--captioned");
        const ov = document.createElement("div");
        ov.className = "ssp__overlay";
        if (s.pos) ov.dataset.pos = s.pos;          // "top" | "center" (default) | "bottom"
        if (s.scrim === false) ov.dataset.scrim = "off";
        if (s.color) ov.style.color = s.color;
        if (s.font) ov.style.fontFamily = s.font;
        const t = document.createElement("div");
        t.className = "ssp__overlay-text";
        t.textContent = s.text;
        ov.appendChild(t);
        if (s.sub) {
          const sub = document.createElement("div");
          sub.className = "ssp__overlay-sub";
          sub.textContent = s.sub;
          ov.appendChild(sub);
        }
        el.appendChild(ov);
      }
    } else if (s.type === "html") {
      el.classList.add("ssp__slide--text");
      if (s.bg) el.style.background = s.bg;
      if (s.color) el.style.color = s.color;
      const wrap = document.createElement("div");
      wrap.className = "ssp__text";
      wrap.innerHTML = s.html || "";
      el.appendChild(wrap);
    } else {
      // text card: "affirmation" or "quote"
      const kind = s.type === "quote" ? "quote" : "affirmation";
      el.classList.add("ssp__slide--text", `ssp__slide--${kind}`);
      el.style.background = s.bg || "#ffffff";
      el.style.color = s.color || "#111111";
      if (s.font) el.style.fontFamily = s.font;
      const wrap = document.createElement("div");
      wrap.className = "ssp__text";
      wrap.textContent = s.text || "";
      if (kind === "quote" && s.attribution) {
        const attr = document.createElement("div");
        attr.className = "ssp__attr";
        attr.textContent = s.attribution;
        wrap.appendChild(attr);
      }
      el.appendChild(wrap);
    }

    // per-slide opacity transition duration follows fadeMs
    el.style.transitionDuration = (this.opts.fadeMs || 0) + "ms";
    return el;
  }

  _buildHud() {
    const hud = document.createElement("div");
    hud.className = "ssp__hud";
    hud.innerHTML =
      '<button data-act="prev" title="Previous (←)">◀</button>' +
      '<button data-act="toggle" title="Play/Pause (space)">⏸</button>' +
      '<button data-act="next" title="Next (→)">▶</button>' +
      '<span class="ssp__counter"></span>';
    hud.addEventListener("click", (e) => {
      const act = e.target.closest("button")?.dataset.act;
      if (act === "prev") this.prev(true);
      else if (act === "next") this.next(true);
      else if (act === "toggle") this.toggle();
    });
    this.root.appendChild(hud);
    this.hud = hud;
    this.counterEl = hud.querySelector(".ssp__counter");
    this.toggleBtn = hud.querySelector('[data-act="toggle"]');
  }

  /* ---- playback ---- */
  goto(n) {
    if (!this.slides.length) return;
    const total = this.slides.length;
    this.slideEls[this.index]?.classList.remove("is-active");
    this.index = ((n % total) + total) % total;
    this.slideEls[this.index].classList.add("is-active");
    if (this.counterEl) this.counterEl.textContent = `${this.index + 1} / ${total}`;
    this._restartProgress();
  }

  next(userAction = false) { this.goto(this.index + 1); if (userAction && this.playing) this.play(); }
  prev(userAction = false) { this.goto(this.index - 1); if (userAction && this.playing) this.play(); }

  play() {
    this.playing = true;
    this.root.classList.remove("is-paused");
    if (this.toggleBtn) this.toggleBtn.textContent = "⏸";
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.opts.loop && this.index === this.slides.length - 1) { this.pause(); return; }
      this.goto(this.index + 1);
    }, this.opts.slideMs);
    this._restartProgress();
  }

  pause() {
    this.playing = false;
    this.root.classList.add("is-paused");
    if (this.toggleBtn) this.toggleBtn.textContent = "▶";
    clearInterval(this.timer);
    this._freezeProgress();
  }

  toggle() { this.playing ? this.pause() : this.play(); }

  /* ---- progress bar animation ---- */
  _restartProgress() {
    if (!this.progressEl) return;
    cancelAnimationFrame(this.rafStart);
    this.progressEl.style.transition = "none";
    this.progressEl.style.width = "0%";
    if (!this.playing) return;
    // next frame: animate to 100% over slideMs
    this.rafStart = requestAnimationFrame(() => requestAnimationFrame(() => {
      this.progressEl.style.transition = `width ${this.opts.slideMs}ms linear`;
      this.progressEl.style.width = "100%";
    }));
  }
  _freezeProgress() {
    if (!this.progressEl) return;
    const w = getComputedStyle(this.progressEl).width;
    this.progressEl.style.transition = "none";
    this.progressEl.style.width = w;
  }

  /* ---- teardown ---- */
  destroy() {
    clearInterval(this.timer);
    cancelAnimationFrame(this.rafStart);
    this.root.removeEventListener("keydown", this._onKey);
    this.root.classList.remove("ssp", "is-paused");
    this.root.innerHTML = "";
  }
}

// Expose for both module and plain-script usage
if (typeof module !== "undefined" && module.exports) module.exports = SlideshowPlayer;
if (typeof window !== "undefined") window.SlideshowPlayer = SlideshowPlayer;
