// A signed-in top-level visit enters the current member interface. Embedded
// workspaces and explicit links keep their own route to avoid iframe loops.
export function memberEntryUrl({ pathname, search, hash, topLevel, user }) {
  if (!topLevel || !user || user.id === 'preview') return null;
  if (!['/', '/index.html'].includes(pathname) || search || hash) return null;
  return '/standalone/member-design-test.html';
}

export function memberToolUrl(id) {
  const routes = { dashboard:'home', setup:'goals', habits:'daily-habits', runthroughs:'daily-habits',
    dailyfocus:'favorites', notes:'thoughts', mynotes:'journal', tasknotes:'task-notes',
    goalworkspace:'goal-workspace', myroadmap:'action-plan', vizlibrary:'visualization',
    meditation:'meditation', gratitude:'gratitude', wins:'wins', cosmiclibrary:'cosmic-library',
    entrepreneurlibrary:'entrepreneur-library', entcard:'ent-card', admin:'admin' };
  return Object.hasOwn(routes, id) ? '/standalone/member-design-test.html?feature=' + encodeURIComponent(routes[id]) : null;
}
