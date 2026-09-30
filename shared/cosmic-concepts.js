import './cosmic-concepts.css';
import { COSMIC_CONCEPT_THEMES } from './cosmic-concepts-content.js';

const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const numberLabel = number => String(number).padStart(3, '0');
const normalize = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’‘]/g, "'").replace(/[—–-]/g, ' ');

export function mountCosmicConceptLibrary(host) {
  if (!host || host.dataset.conceptsReady === 'true') return;
  host.dataset.conceptsReady = 'true';
  host.setAttribute('aria-labelledby', 'cosmicConceptTitle');
  host.innerHTML = `
    <header class="cl-concepts-header">
      <p class="cl-concepts-eyebrow">500 CONCEPTS · 20 THEMES</p>
      <h2 id="cosmicConceptTitle">Personal Growth Library</h2>
      <p>Ideas, frameworks and practices for everyday life. Open a theme to explore each concept and what it means.</p>
    </header>
    <div class="cl-concepts-controls">
      <label class="cl-concepts-search" for="cosmicConceptSearch">Find a concept
        <input id="cosmicConceptSearch" type="search" maxlength="120" placeholder="Search title, explanation or number…" autocomplete="off">
      </label>
      <label for="cosmicConceptTheme">Theme
        <select id="cosmicConceptTheme"><option value="">All 20 themes</option>${COSMIC_CONCEPT_THEMES.map(theme => `<option value="${theme.id}">${esc(theme.title)}</option>`).join('')}</select>
      </label>
      <button type="button" class="cl-concepts-reset" aria-label="Clear search and filters" disabled>Reset</button>
    </div>
    <p class="cl-concepts-count" role="status" aria-live="polite" aria-atomic="true">500 concepts · 20 themes</p>
    <div class="cl-concepts-themes">${COSMIC_CONCEPT_THEMES.map((theme, index) => `
      <details class="cl-concept-theme" data-concept-theme="${theme.id}" style="--concept-color:${theme.color};--concept-tint:${theme.color}12">
        <summary>
          <span class="cl-concept-theme-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
          <span class="cl-concept-theme-heading"><span class="cl-concept-theme-title">${esc(theme.title)}</span><span class="cl-concept-theme-meta"><span data-theme-count>25 concepts</span> · ${numberLabel(theme.items[0].number)}–${numberLabel(theme.items.at(-1).number)}</span></span>
          <span class="cl-concept-chevron" aria-hidden="true">⌄</span>
        </summary>
        ${theme.note ? `<p class="cl-concept-theme-note">${esc(theme.note)}</p>` : ''}
        <ol class="cl-concept-grid" start="${theme.items[0].number}">${theme.items.map(item => `
          <li class="cl-concept-item" id="cosmic-concept-${item.number}" value="${item.number}" data-concept-number="${item.number}">
            <span class="cl-concept-number" aria-label="Concept ${item.number}">${numberLabel(item.number)}</span>
            <div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></div>
          </li>`).join('')}
        </ol>
      </details>`).join('')}</div>
    <p class="cl-concepts-empty" hidden>No concepts found. Try another word, a concept number, or a different theme.</p>
    <p class="cl-concepts-footnote">Numbers are for reference, not a ranking. These concepts have different levels of research support.</p>`;

  const search = host.querySelector('#cosmicConceptSearch');
  const select = host.querySelector('#cosmicConceptTheme');
  const reset = host.querySelector('.cl-concepts-reset');
  const status = host.querySelector('.cl-concepts-count');
  const empty = host.querySelector('.cl-concepts-empty');
  const groups = COSMIC_CONCEPT_THEMES.map(theme => ({
    theme,
    element: host.querySelector(`[data-concept-theme="${theme.id}"]`),
    items: theme.items.map(item => ({
      number: item.number,
      text: normalize(`${item.title} ${item.description}`),
      element: host.querySelector(`[data-concept-number="${item.number}"]`),
    })),
  }));
  let filtering = false;
  let browsingOpen = new Set();

  function filterConcepts() {
    const query = normalize(search.value.trim());
    const terms = query.split(/\s+/).filter(Boolean);
    const exactNumber = query.match(/^#?0*(\d+)$/);
    const nextFiltering = Boolean(query || select.value);
    if (nextFiltering && !filtering) browsingOpen = new Set(groups.filter(g => g.element.open).map(g => g.theme.id));
    filtering = nextFiltering;
    let total = 0, themeCount = 0;
    for (const group of groups) {
      const inTheme = !select.value || group.theme.id === select.value;
      let matches = 0;
      for (const item of group.items) {
        const found = inTheme && (exactNumber ? item.number === Number(exactNumber[1]) : terms.every(term => item.text.includes(term)));
        item.element.hidden = !found;
        if (found) matches++;
      }
      group.element.hidden = matches === 0;
      group.element.open = filtering ? matches > 0 : browsingOpen.has(group.theme.id);
      group.element.querySelector('[data-theme-count]').textContent = `${matches} ${matches === 1 ? 'concept' : 'concepts'}`;
      if (matches) themeCount++;
      total += matches;
    }
    status.textContent = `${total} ${total === 1 ? 'concept' : 'concepts'} · ${themeCount} ${themeCount === 1 ? 'theme' : 'themes'}`;
    empty.hidden = total !== 0;
    reset.disabled = !filtering;
  }

  search.addEventListener('input', filterConcepts);
  select.addEventListener('change', filterConcepts);
  reset.addEventListener('click', () => {
    search.value = '';
    select.value = '';
    filterConcepts();
    search.focus();
  });
}
