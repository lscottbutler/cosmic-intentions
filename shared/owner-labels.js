/* Owner-only visual inventory. No user data or tracking is saved. */
export function installOwnerLabels(ownerWindow) {
  if (ownerWindow.__ciLabelsInstalled) return;
  ownerWindow.__ciLabelsInstalled = true;
  let enabled = false, timer;
  const refreshKey = Symbol('ci-labels-refresh');
  let registeredTop = null;
  const documents = new Map();
  function label(doc, selector, name) {
    doc.querySelectorAll(selector).forEach((el, index) => {
      const value = typeof name === 'function' ? name(el,index) : name + ' ' + (index+1);
      if (el.dataset.ciPart !== value) el.dataset.ciPart = value;
    });
  }
  function scan(doc) {
    if (!ownerWindow.ciOwnerAccess) { stop(); return; }
    if (!documents.has(doc)) {
      const style=doc.createElement('style');
      style.textContent='html.ci-labels-on [data-ci-part]::before{content:attr(data-ci-part);display:block;position:relative;z-index:5;width:fit-content;max-width:100%;margin:0 0 5px;padding:3px 6px;background:#292929;color:#fff;font:600 10px/1.4 Arial,sans-serif;letter-spacing:0;text-transform:none;white-space:normal;overflow-wrap:anywhere;pointer-events:none}html.ci-labels-on [data-ci-part]{outline:1px dashed #747474;outline-offset:2px}#ci-label-switch{position:fixed;right:12px;bottom:12px;z-index:2147483646;border:2px solid #fff;border-radius:6px;background:#292929;color:#fff;padding:10px 14px;font:600 13px Arial,sans-serif;min-height:44px;cursor:pointer}';
      style.textContent += 'html.ci-admin-owner-view.ci-labels-on [data-ci-admin-number]{position:relative;border:2.5px dashed #8e44ad!important;box-sizing:border-box}html.ci-admin-owner-view.ci-labels-on [data-ci-admin-number]::after{content:attr(data-ci-admin-number);position:absolute;right:3px;top:3px;z-index:8;min-width:22px;padding:3px 5px;background:#8e44ad;color:#fff;font:700 11px/1.2 Arial,sans-serif;text-align:center;border-radius:3px;pointer-events:none}';
      style.textContent += 'html.ci-admin-owner-view.ci-labels-on [data-ci-rotation-label]:not([data-ci-admin-number]){outline:2.5px dotted #159447!important;outline-offset:3px}html.ci-admin-owner-view.ci-labels-on [data-ci-rotation-label]:not([data-ci-admin-number])::after{content:attr(data-ci-rotation-label);position:absolute;left:7px;top:7px;z-index:99;padding:4px 7px;background:#159447;color:white;font:700 11px/1.25 Arial,sans-serif;pointer-events:none}html.ci-admin-owner-view.ci-labels-on [data-ci-rotation-label]:not([data-ci-admin-number]){position:relative}';
      // Scott 10 Nov 2026: separate cards — the personal note (green) and the admin carousel (purple)
      // sit side-by-side as independent cards rather than inside one outer purple container.
      style.textContent += 'html.ci-admin-owner-view.ci-labels-on #header-calendar,html.ci-admin-owner-view.ci-labels-on #header-encouragement{outline:2.5px dotted #159447!important;outline-offset:2px}';
      // Personal E box: green dashed outline. The label itself uses the generic data-ci-part
      // block rendering (inside the element at the top), so it never overlaps the text below.
      style.textContent += 'html.ci-admin-owner-view.ci-labels-on .ci-player-personal-e-box{outline:2.5px dashed #159447!important;outline-offset:2px}html.ci-admin-owner-view.ci-labels-on .ci-player-personal-e-box[data-ci-part]::before{background:#159447!important}';
      style.textContent += 'html.ci-admin-owner-view.ci-labels-on [data-ci-component-number]{position:relative;margin-top:54px!important}html.ci-admin-owner-view.ci-labels-on .ci-component-number-dot{position:absolute!important;top:-49px;left:4px;z-index:150;display:grid;place-items:center;width:42px;height:42px;border:2px solid #171717;border-radius:50%;box-shadow:0 1px 5px #0005;color:#000!important;font:900 21px/1 Arial,sans-serif!important;letter-spacing:0!important;text-shadow:none!important;pointer-events:none;box-sizing:border-box}html.ci-admin-owner-view.ci-labels-on .ci-carousel[data-ci-component-number],html.ci-admin-owner-view.ci-labels-on .ent-slideshow[data-ci-component-number]{overflow:visible!important}html.ci-admin-owner-view.ci-labels-on .ci-carousel-card{overflow:hidden}html:not(.ci-labels-on) .ci-component-number-dot{display:none!important}';
      // Separate accessible owner markers from the media: both occupy a dedicated top rail.
      style.textContent += 'html.ci-admin-owner-view.ci-labels-on [data-ci-rotation-label][data-ci-component-number]:not([data-ci-admin-number]){margin-top:88px!important}html.ci-admin-owner-view.ci-labels-on [data-ci-rotation-label][data-ci-component-number]:not([data-ci-admin-number]) > .ci-component-number-dot{top:-77px!important;left:4px!important}html.ci-admin-owner-view.ci-labels-on [data-ci-rotation-label][data-ci-component-number]:not([data-ci-admin-number])::after{top:-77px!important;left:58px!important;right:4px!important;max-width:calc(100% - 62px)!important;box-sizing:border-box;white-space:normal!important;overflow-wrap:anywhere!important;line-height:1.3!important}';
      // Shared owner-overlay collision guard: annotations never cover the actual component content.
      style.textContent += 'html.ci-labels-on [data-ci-part]::before{box-sizing:border-box;max-width:100%;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal;line-height:1.4}html.ci-admin-owner-view.ci-labels-on [data-ci-component-number]{isolation:isolate}html.ci-admin-owner-view.ci-labels-on [data-ci-component-number] > .ci-component-number-dot{max-width:42px;min-width:42px;flex-shrink:0}html.ci-admin-owner-view.ci-labels-on [data-ci-rotation-label][data-ci-component-number]:not([data-ci-admin-number])::after{min-height:28px;max-height:none;padding:6px 8px}html.ci-admin-owner-view.ci-labels-on [data-ci-component-number]::before{max-width:100%;overflow-wrap:anywhere}';
      doc.head.append(style);
      const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(refresh,250)});
      observer.observe(doc.body,{childList:true,subtree:true});
      documents.set(doc,{style,observer});
    }
    doc.documentElement.classList.toggle('ci-labels-on',enabled);
    doc.documentElement.classList.add('ci-admin-owner-view');
    doc.querySelectorAll('[data-block]').forEach((el,index)=>{
      const shell=el.closest('.ci-admin-page-box')||el;
      const slug=el.getAttribute('data-block');
      const number=doc.defaultView.BLOCK_NUM?.[slug]||shell.dataset.pageBox||String(index+1);
      if(shell.dataset.ciAdminNumber!==String(number))shell.dataset.ciAdminNumber=String(number);
    });
    // Rotation markers are owner-only and independent of the Labels ON/OFF inventory.
    // Purple always takes precedence for an admin-editable shell.
    const rotatingAreas = [
      ['.ci-carousel', 'ROTATING IMAGES / AFFIRMATIONS / BELIEFS'],
      ['#header-calendar', 'DATE / DAY-OF-YEAR'],
      ['.ent-slideshow', 'ROTATING IMAGES'],
      ['#header-encouragement,.welcome-vo-encouragement,.encourage-band', 'ROTATING VO ENCOURAGEMENTS']
    ];
    rotatingAreas.forEach(([selector,name])=>doc.querySelectorAll(selector).forEach(el=>{
      if(el.dataset.ciRotationLabel!==name)el.dataset.ciRotationLabel=name;
    }));
    // Same eleven hues as GOAL_COLORS in app.js, with black numerals for fast scanning.
    const goalBadgeColors=['#E84040','#E86030','#E88020','#E8A828','#E8C830','#A8C830','#48B860','#38A888','#2898A8','#7888A8','#3878A8'];
    const componentSelector=['.ci-player-personal-e-box','#header-calendar','#header-encouragement','.ci-admin-page-box','.ci-carousel','.ent-slideshow','.welcome-vo-encouragement','.encourage-band','.home-info-block','.home-vid-block','.orientation','.habit-checklist-card','.habit-orientation-card','.ci-habit-mindset','.pb-goal-card','.goal-workspace-goal-title','.wcard','.member-player-columns','.ci-ph-card','.cl-section-drop'].join(',');
    const components=[...doc.querySelectorAll(componentSelector)].filter(el=>el.getClientRects().length && !el.closest('.ci-component-number-dot'));
    const active=new Set(components);
    doc.querySelectorAll('[data-ci-component-number]').forEach(el=>{
      if(active.has(el))return;
      delete el.dataset.ciComponentNumber;
      el.querySelector(':scope > .ci-component-number-dot')?.remove();
    });
    components.forEach((el,index)=>{
      const number=String(index+1);
      el.dataset.ciComponentNumber=number;
      let dot=el.querySelector(':scope > .ci-component-number-dot');
      if(!dot){dot=doc.createElement('span');dot.className='ci-component-number-dot';dot.setAttribute('aria-hidden','true');el.append(dot);}
      if(dot.textContent!==number)dot.textContent=number;
      const color=goalBadgeColors[index%goalBadgeColors.length];
      if(dot.style.backgroundColor!==color)dot.style.backgroundColor=color;
    });
    label(doc,'p', 'Text paragraph');
    label(doc,'h1,h2,h3,h4', 'Heading');
    label(doc,'.card,.pb-goal-card,.ent-panel,.ent-resource-card,.cosmic-concept-card,.cl-concept-item,.habit-drop', 'Card');
    label(doc,'.orientation',()=> 'Shared player control card');
    label(doc,'.member-player-columns',()=> 'Page content / player card');
    label(doc,'#feature-title',()=> 'Page title — letter tiles');
    label(doc,'.ci-player-personal-e-box',()=> 'Member personal note');
    label(doc,'#header-calendar',()=> 'Date / day-of-year card');
    label(doc,'#header-encouragement,.welcome-vo-encouragement,.encourage-band',()=> 'VO encouragement');
    label(doc,'.setup-page,.pg-screen,.wins-screen', 'Page workspace');
    label(doc,'.home-info-block,.ci-ph-card,.ci-habit-mindset,.habit-checklist-card,.habit-orientation-card,.cl-section-drop', 'Content card');
    label(doc,'.ent-slideshow,.ci-carousel', 'Image / affirmation slideshow');
    label(doc,'.home-vid-block', 'Video player');
    label(doc,'.goal-workspace-goal-title,.pb-goal-title,.card-goal-statement', 'Goal header');
    label(doc,'.wcard', 'To Do card');
    label(doc,'.home-col-left>h2,.home-info-block>div:first-child', 'Section heading');
    // Scott 10 Nov 2026: labels on the player page match the captions on the admin page,
    // so Scott knows which admin-page box edits which player-page element.
    label(doc,'.ci-admin-page-box',el=>{
      const pb=el.dataset.pageBox;
      return pb==='1' ? 'BOX 1 — 16:9 ARTWORK + CAPTION' : 'Admin text box '+pb;
    });
    label(doc,'.ci-player-owner-instructions',()=> 'PLAYER INSTRUCTION');
    label(doc,'.ci-page-ab1',()=> 'PAGE QUOTE');
    label(doc,'.ci-page-welcome',()=> 'WELCOME MESSAGE');
    // Scott 11 Nov 2026: removed the generic [data-block] inner label. It was duplicating
    // the shell titles (and polluting them with the raw slug), making the cards look like
    // they had two overlapping captions. Shell labels alone identify every admin box.
    // Form fields retain their own accessible labels; expose their name in owner tooltips.
    doc.querySelectorAll('input,textarea,[contenteditable=true]').forEach(el=>{
      if(!el.title)el.title='Text field · '+(el.getAttribute('aria-label')||el.name||el.id||'Editor');
    });
  }
  function refresh(){
    if(!ownerWindow.ciOwnerAccess){stop();return;}
    scan(ownerWindow.document);
    try{
      const top=ownerWindow.top.document;
      if(top!==ownerWindow.document)scan(top);
      // The Home/header and player iframes each install labels. All instances
      // must follow one toggle state, even after an iframe is replaced.
      const host=top.defaultView;
      if(!host.__ciOwnerLabelControl) host.__ciOwnerLabelControl={enabled:false,refreshers:new Map()};
      const control=host.__ciOwnerLabelControl;
      control.refreshers.set(refreshKey,refresh);
      registeredTop=host;
      enabled=control.enabled;
      documents.forEach((_,documentToUpdate)=>documentToUpdate.documentElement.classList.toggle('ci-labels-on',enabled));
      let button=top.getElementById('ci-label-switch');
      if(!button){
        button=top.createElement('button');button.id='ci-label-switch';button.type='button';
        top.body.append(button);
      }
      // Rebind on each scan: an old iframe must never leave an inert button.
      button.onclick=()=>{
        control.enabled=!control.enabled;
        for(const repaint of [...control.refreshers.values()]) repaint();
      };
      button.textContent=enabled?'Labels ON':'Labels OFF';
      button.setAttribute('aria-pressed',String(enabled));
    }catch(_){}
  }
  function stop(){
    documents.forEach(({style,observer},doc)=>{observer.disconnect();style.remove();doc.documentElement.classList.remove('ci-labels-on','ci-admin-owner-view');doc.querySelectorAll('[data-ci-admin-number]').forEach(el=>delete el.dataset.ciAdminNumber);doc.querySelectorAll('[data-ci-rotation-label]').forEach(el=>delete el.dataset.ciRotationLabel);doc.querySelectorAll('.ci-component-number-dot').forEach(el=>el.remove());doc.querySelectorAll('[data-ci-component-number]').forEach(el=>delete el.dataset.ciComponentNumber);doc.querySelectorAll('[data-ci-part]').forEach(el=>delete el.dataset.ciPart)});
    if(registeredTop?.__ciOwnerLabelControl){
      registeredTop.__ciOwnerLabelControl.refreshers.delete(refreshKey);
      if(registeredTop.__ciOwnerLabelControl.refreshers.size===0)registeredTop.document.getElementById('ci-label-switch')?.remove();
    }
    documents.clear();clearTimeout(timer);clearInterval(recheck);ownerWindow.__ciLabelsInstalled=false;
  }
  const recheck=setInterval(()=>{if(!ownerWindow.ciOwnerAccess)stop()},1000);
  refresh();
}
