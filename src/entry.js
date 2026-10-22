// Keep invisible legacy players and intentionally empty note frames off the
// application startup path. The approved player itself is unchanged.
const params = new URLSearchParams(location.search);
const note = params.get('masterInline') === 'citadel-note';
let relocatedOpening = false;
try {
  relocatedOpening = note && window.frameElement?.id === 'citadelNoteFrame'
    && !!window.parent.parent.document.getElementById('header-admin-note-frame');
} catch (_) { /* Standalone or cross-origin embedding uses the normal note UI. */ }

if (note && (params.get('box') === '2' || relocatedOpening)) {
  // Closing notes already render nothing. The private member wrapper displays
  // the opening note in its header, so its original frame is also just a spacer.
  document.body.replaceChildren();
  document.documentElement.style.cssText = 'background:transparent;overflow:hidden';
  document.body.style.cssText = 'margin:0;background:transparent;overflow:hidden';
  window.parent.postMessage({ type: 'ci-citadel-note-height', height: 0,
    pageId: params.get('notePage') || 'dashboard' }, location.origin);
} else {
  const fonts = document.createElement('link');
  fonts.rel = 'stylesheet'; fonts.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;600;800;900&family=Lora:wght@400;500;600&family=Nunito:wght@400;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Roboto+Condensed:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap";
  document.head.append(fonts);
  const frames = [...document.querySelectorAll('iframe[data-ci-player-src]')];
  // Embedded tools already live inside the master player; starting another
  // dashboard or meditation shell inside them creates a hidden load cascade.
  const candidates = frames.filter(frame => !params.has('masterInline')
    || !['ciMasterPlayerFrame', 'ciMeditationMasterPlayerFrame'].includes(frame.id));
  const load = frame => {
    const src = frame.dataset.ciPlayerSrc;
    if (src && !frame.getAttribute('src')) frame.src = src;
    observer?.unobserve(frame);
  };
  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) load(entry.target);
    }, { rootMargin: '200px' });
    candidates.forEach(frame => observer.observe(frame));
  } else {
    // Older browsers still get usable players, without the embedded recursion.
    candidates.forEach(load);
  }
  try {
    if (!window.supabase?.createClient) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Application connection unavailable'));
        document.head.append(script);
      });
    }
    await import('./main.js');
  } catch (error) {
    console.error('[entry] Application could not start.');
    const loader = document.getElementById('loadingScreen');
    if (loader) { loader.setAttribute('role', 'alert'); loader.textContent = 'The application could not connect. Please reload to try again.'; }
  }
}
