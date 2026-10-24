/* Owner-only visual inventory. No user data or tracking is saved. */
export function installOwnerLabels(ownerWindow) {
  if (ownerWindow.__ciLabelsInstalled) return;
  ownerWindow.__ciLabelsInstalled = true;
  let enabled = true, timer;
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
      style.textContent += 'html.ci-admin-owner-view [data-ci-admin-number]{position:relative;border:10px dashed #8e44ad!important;box-sizing:border-box}html.ci-admin-owner-view [data-ci-admin-number]::after{content:attr(data-ci-admin-number);position:absolute;right:3px;top:3px;z-index:8;min-width:22px;padding:3px 5px;background:#8e44ad;color:#fff;font:700 11px/1.2 Arial,sans-serif;text-align:center;border-radius:3px;pointer-events:none}';
      style.textContent += 'html.ci-admin-owner-view [data-ci-rotation-label]:not([data-ci-admin-number]){outline:10px dotted #159447!important;outline-offset:3px}html.ci-admin-owner-view [data-ci-rotation-label]:not([data-ci-admin-number])::after{content:attr(data-ci-rotation-label);position:absolute;left:7px;top:7px;z-index:99;padding:4px 7px;background:#159447;color:white;font:700 11px/1.25 Arial,sans-serif;pointer-events:none}html.ci-admin-owner-view [data-ci-rotation-label]:not([data-ci-admin-number]){position:relative}';
      // Make the labeled outer header shells unmistakable, without changing their content or sizing.
      style.textContent += 'html.ci-admin-owner-view #header-admin-note{outline:10px dashed #8e44ad!important;outline-offset:2px}html.ci-admin-owner-view #header-calendar,html.ci-admin-owner-view #header-encouragement{outline:10px dotted #159447!important;outline-offset:2px}';
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
    label(doc,'p', 'Text paragraph');
    label(doc,'h1,h2,h3,h4', 'Heading');
    label(doc,'.card,.pb-goal-card,.ent-panel,.ent-resource-card,.cosmic-concept-card,.cl-concept-item,.habit-drop', 'Card');
    label(doc,'.orientation',()=> 'Shared player control card');
    label(doc,'.member-player-columns',()=> 'Page content / player card');
    label(doc,'#feature-title',()=> 'Page title — letter tiles');
    label(doc,'#header-admin-note',()=> 'Header admin text and artwork');
    label(doc,'#header-calendar',()=> 'Date / day-of-year card');
    label(doc,'#header-encouragement,.welcome-vo-encouragement,.encourage-band',()=> 'VO encouragement');
    label(doc,'.setup-page,.pg-screen,.wins-screen', 'Page workspace');
    label(doc,'.home-info-block,.ci-ph-card,.ci-habit-mindset,.habit-checklist-card,.habit-orientation-card,.cl-section-drop', 'Content card');
    label(doc,'.ent-slideshow,.ci-carousel', 'Image / affirmation slideshow');
    label(doc,'.home-vid-block', 'Video player');
    label(doc,'.goal-workspace-goal-title,.pb-goal-title,.card-goal-statement', 'Goal header');
    label(doc,'.wcard', 'To Do card');
    label(doc,'.home-col-left>h2,.home-info-block>div:first-child', 'Section heading');
    label(doc,'.ci-admin-page-box',el=>'Admin text box '+el.dataset.pageBox);
    label(doc,'[data-block]',el=>{
      const slug=el.getAttribute('data-block');
      const shell=el.closest('.ci-admin-page-box');
      return 'Admin text box '+(shell?.dataset.pageBox || doc.defaultView.BLOCK_NUM?.[slug] || slug)+' · '+slug;
    });
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
      if(!top.getElementById('ci-label-switch')){
        const button=top.createElement('button');button.id='ci-label-switch';button.type='button';
        button.onclick=()=>{enabled=!enabled;refresh()};top.body.append(button);
      }
      const button=top.getElementById('ci-label-switch');
      button.textContent=enabled?'Labels ON':'Labels OFF';button.setAttribute('aria-pressed',String(enabled));
    }catch(_){}
  }
  function stop(){
    documents.forEach(({style,observer},doc)=>{observer.disconnect();style.remove();doc.documentElement.classList.remove('ci-labels-on','ci-admin-owner-view');doc.querySelectorAll('[data-ci-admin-number]').forEach(el=>delete el.dataset.ciAdminNumber);doc.querySelectorAll('[data-ci-rotation-label]').forEach(el=>delete el.dataset.ciRotationLabel);doc.getElementById('ci-label-switch')?.remove();doc.querySelectorAll('[data-ci-part]').forEach(el=>delete el.dataset.ciPart)});
    documents.clear();clearTimeout(timer);clearInterval(recheck);ownerWindow.__ciLabelsInstalled=false;
  }
  const recheck=setInterval(()=>{if(!ownerWindow.ciOwnerAccess)stop()},1000);
  refresh();
}
