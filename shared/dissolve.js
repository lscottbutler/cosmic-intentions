// Slow crossfade slideshow. Stacks the given image URLs inside `el` and gently
// dissolves from one to the next, looping forever. Safe to call repeatedly on
// the same element (it clears any prior slideshow first).
//
//   mountDissolve(el, urls, { hold: 5000, fade: 2000 })
//
// hold = ms each image is fully visible; fade = ms of the crossfade.
export function mountDissolve(el, urls, opts = {}) {
  if (!el) return;
  const list = (urls || []).filter(Boolean);
  // Nothing / single image → just a static background, no slideshow overhead.
  if (list.length <= 1) {
    stopDissolve(el);
    el.style.backgroundImage = list[0] ? `url("${list[0]}")` : '';
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    return;
  }
  const hold = Math.max(1000, opts.hold || 5000);
  const fade = Math.max(300, opts.fade || 2000);

  stopDissolve(el);
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.style.overflow = 'hidden';
  el.style.backgroundImage = '';   // layers replace the single bg
  el.innerHTML = '';

  const layers = list.map((u, i) => {
    const d = document.createElement('div');
    d.style.cssText =
      `position:absolute;inset:0;background:#000 url("${u}") center/cover no-repeat;` +
      `opacity:${i === 0 ? 1 : 0};transition:opacity ${fade}ms ease-in-out;`;
    el.appendChild(d);
    return d;
  });

  let cur = 0;
  const timer = setInterval(() => {
    const next = (cur + 1) % layers.length;
    layers[cur].style.opacity = '0';
    layers[next].style.opacity = '1';
    cur = next;
  }, hold + fade);
  el._dissolveTimer = timer;
}

// Stop and clean up a slideshow previously mounted on `el`.
export function stopDissolve(el) {
  if (el && el._dissolveTimer) { clearInterval(el._dissolveTimer); el._dissolveTimer = null; }
}
