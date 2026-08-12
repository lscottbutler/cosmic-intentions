/* ── REUSABLE QUOTE FRAME ─────────────────────────────────────────────────────
   Renders a quote in the teal-framed "screen" style (see the .quote-frame CSS
   in src/styles/main.css, modelled on the 10-minute-manifestation quote card).

   quoteFrameHTML('the quote', 'Marcus Aurelius', 'images/....png')
     text   – the quote (required)
     author – attribution, shown as "– Author" (optional)
     imgUrl – backdrop image; falls back to a colourful gradient (optional)

   Exposed on window so inline HTML / other modules can use it directly. */

function _esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function quoteFrameHTML(text, author, imgUrl) {
  const style = imgUrl ? ` style="--qf-img:url('${_esc(imgUrl)}')"` : '';
  return `<div class="quote-frame"${style}>
    <div class="quote-frame__bg"></div>
    <div class="quote-frame__screen">
      <span class="quote-frame__mark">&#8220;</span>
      <p class="quote-frame__text">${_esc(text)} <span class="quote-frame__mark quote-frame__mark--close">&#8221;</span></p>
      ${author ? `<div class="quote-frame__by">&ndash; ${_esc(author)}</div>` : ''}
    </div>
  </div>`;
}

if (typeof window !== 'undefined') window.quoteFrameHTML = quoteFrameHTML;
