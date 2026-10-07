// Carry sample mode through the locked player's content frames only when the
// explicit member-design-test wrapper is present on a permitted review host.
// The normal app and every production hostname remain unaffected.
const reviewHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  || /^deploy-preview-\d+--gilded-profiterole-47a2eb\.netlify\.app$/.test(location.hostname);
if (reviewHost && window.parent !== window && new URLSearchParams(location.search).has('masterInline')) {
  try {
    const parent = new URL(window.parent.location.href);
    const wrapper = new URL(window.parent.parent.location.href);
    if (parent.origin === location.origin && parent.pathname === '/players/master-player.html'
      && parent.searchParams.get('preview') === '1' && wrapper.origin === location.origin
      && wrapper.pathname === '/standalone/member-design-test.html') {
      const url = new URL(location.href);
      url.searchParams.set('preview', '1');
      history.replaceState(history.state, '', url);
    }
  } catch (_) { /* Cross-origin ancestors cannot authorize sample mode. */ }
}
