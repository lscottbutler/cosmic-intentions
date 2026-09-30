import { LESSON_RESEARCH, RESEARCH_SOURCES, RESEARCH_GUIDE } from './cosmic-concepts-research-content.js';

const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const numberLabel = number => String(number).padStart(3, '0');
const paragraph = (label, text) => `<p><strong>${esc(label)}</strong> ${esc(text)}</p>`;
const sourceLink = key => {
  const source = RESEARCH_SOURCES[key];
  return `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} <span>(${esc(source.year)}) ↗</span></a>`;
};
const sourceCard = key => {
  const source = RESEARCH_SOURCES[key];
  return `<li class="cl-research-source" data-research-source="${esc(key)}">${sourceLink(key)}
    ${paragraph('Evidence design:', source.design)}${paragraph('Finding:', source.finding)}
    ${paragraph('Limitation:', source.limit)}${paragraph('Content accessed:', source.access)}</li>`;
};
const sourceList = keys => `<ul class="cl-research-sources">${keys.map(sourceCard).join('')}</ul>`;

function lessonBody(lesson) {
  return `<div class="cl-research-action"><h4>One practical first step</h4><p>${esc(lesson.action)}</p></div>
    <h4>Research interpretation and limit</h4><p>${esc(lesson.interpretation)}</p>
    <dl class="cl-research-facts">
      <div><dt>Suggested study order</dt><dd>${lesson.studyOrder} of 500</dd></div>
      <div><dt>Priority band</dt><dd>${esc(lesson.priority)}</dd></div>
      <div><dt>Evidence basis</dt><dd>${esc(lesson.evidence)}</dd></div>
      <div><dt>How directly it applies</dt><dd>${esc(lesson.directness)}</dd></div>
      <div><dt>Latest linked year</dt><dd>${esc(lesson.latestYear)}</dd></div>
    </dl>
    <p class="cl-research-caption">Study order is a suggested learning sequence. A source’s publication year is not proof that this exact practice was tested that year.</p>
    <h4>Research sources and limitations</h4>${sourceList(lesson.sourceKeys)}`;
}

function startGuide() {
  return `<p>Choose one problem and a few practices. You do not need to master 500 terms.</p>
    <p>The order below is a learning sequence, not a global scientific ranking.</p>
    <ol class="cl-research-start">${RESEARCH_GUIDE.start.map(number => {
      const lesson = LESSON_RESEARCH[number];
      return `<li><button type="button" data-open-lesson="${number}"><span>${lesson.studyOrder}.</span> ${esc(lesson.title)} <small>Lesson ${numberLabel(number)} →</small></button></li>`;
    }).join('')}</ol>
    <h3>Your first four weeks</h3><div class="cl-research-guide-grid">${RESEARCH_GUIDE.weeks.map(week => `<article class="cl-research-guide-card">
      <h4>Week ${week.week} · ${esc(week.focus)}</h4>${paragraph('Try:', week.experiment)}${paragraph('Review:', week.question)}</article>`).join('')}</div>
    <h3>Begin reading the research</h3><div class="cl-research-guide-grid">${RESEARCH_GUIDE.reading.map(item => `<article class="cl-research-guide-card">
      <h4>${item.order}. ${esc(item.topic)}</h4>${paragraph('Researchers:', item.researchers)}<p>${esc(item.instruction)}</p>
      <ul class="cl-research-links">${item.sourceKeys.map(key => `<li>${sourceLink(key)}</li>`).join('')}</ul></article>`).join('')}</div>
    <h3>Make one concept part of a real story</h3><div class="cl-research-guide-card">${paragraph('Situation:', RESEARCH_GUIDE.story.situation)}${paragraph('Concept:', RESEARCH_GUIDE.story.concept)}${paragraph('A usable response:', RESEARCH_GUIDE.story.response)}</div>`;
}

function highlightsGuide() {
  return `<div class="cl-research-guide-grid">${RESEARCH_GUIDE.highlights.map(item => `<article class="cl-research-guide-card">
    <h3>${esc(item.title)}</h3>${paragraph('What the research adds:', item.finding)}${paragraph('Everyday application:', item.action)}
    ${paragraph('What it does not establish:', item.limit)}${paragraph('Publication period:', item.period)}${paragraph('Researchers:', item.researchers)}
    <ul class="cl-research-links">${item.sourceKeys.map(key => `<li>${sourceLink(key)}</li>`).join('')}</ul></article>`).join('')}</div>`;
}

function methodsGuide() {
  return `<p>This research map uses 97 selected sources. Of the 500 lessons, 62 are labeled “Direct topic”, 388 “Related component / program”, and 50 “Context only; no direct test”.</p>
    <dl class="cl-research-methods">${RESEARCH_GUIDE.methods.map(item => `<div><dt>${esc(item.title)}</dt><dd>${esc(item.text)}</dd></div>`).join('')}</dl>`;
}

export function mountConceptResearch(host, openLesson) {
  if (host.dataset.researchReady === 'true') return;
  const guideHost = host.querySelector('.cl-research-guides');
  const guides = [
    ['start', 'Start here', '20 starting lessons · a four-week guide', startGuide],
    ['highlights', 'Research highlights', '20 findings, applications and limits', highlightsGuide],
    ['sources', 'Research sources', '97 selected publications and resources', () => sourceList(Object.keys(RESEARCH_SOURCES))],
    ['method', 'About the research and study order', 'How to read the evidence and its limits', methodsGuide],
  ];
  guideHost.innerHTML = `<p class="cl-research-intro">Research notes and first steps are included with all 500 lessons. The suggested study order is a learning sequence, not a scientific ranking.</p>
    <p class="cl-research-caption">From the supplied research workbook · evidence map dated 30 September 2026. Read each finding alongside its limitations.</p>
    ${guides.map(([key, title, subtitle]) => `<details class="cl-research-guide" data-research-guide="${key}"><summary><span>${title}<small>${subtitle}</small></span></summary><div class="cl-research-guide-body"></div></details>`).join('')}`;
  for (const [key, , , render] of guides) {
    const details = guideHost.querySelector(`[data-research-guide="${key}"]`);
    details.addEventListener('toggle', () => {
      if (details.open && !details.dataset.loaded) {
        details.querySelector('.cl-research-guide-body').innerHTML = render();
        details.dataset.loaded = 'true';
      }
    });
  }
  const ensureLesson = new Map();
  for (const item of host.querySelectorAll('.cl-concept-item')) {
    const lesson = LESSON_RESEARCH[item.dataset.conceptNumber];
    const details = document.createElement('details');
    details.className = 'cl-lesson-research';
    details.innerHTML = `<summary>Research &amp; first step</summary><div class="cl-lesson-research-body"></div>`;
    const render = () => {
      if (details.dataset.loaded) return;
      details.querySelector('.cl-lesson-research-body').innerHTML = lessonBody(lesson);
      details.dataset.loaded = 'true';
    };
    details.addEventListener('toggle', () => { if (details.open) render(); });
    item.querySelector(':scope > div').append(details);
    ensureLesson.set(lesson.number, () => { render(); details.open = true; return details; });
  }
  guideHost.addEventListener('click', event => {
    const button = event.target.closest('[data-open-lesson]');
    if (!button) return;
    const number = Number(button.dataset.openLesson);
    openLesson(number);
    const details = ensureLesson.get(number)();
    details.querySelector('summary').focus();
    details.scrollIntoView({ block: 'start' });
  });
  host.dataset.researchReady = 'true';
}
