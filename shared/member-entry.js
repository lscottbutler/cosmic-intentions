// A signed-in top-level visit enters the current member interface. Embedded
// workspaces and explicit links keep their own route to avoid iframe loops.
export function memberEntryUrl({ pathname, search, hash, topLevel, user }) {
  if (!topLevel || !user || user.id === 'preview') return null;
  if (!['/', '/index.html'].includes(pathname) || search || hash) return null;
  return '/standalone/member-design-test.html';
}
