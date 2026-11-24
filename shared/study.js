/* ── MY STUDY (Scott 24 Nov 2026) ─────────────────────────────────────────────
   The member's saved videos, articles, sites and podcasts — grouped by goal — to come
   back to, watch/read, and tick off. Kept OUT of the to-do list on purpose.
   Storage: player_personal_notes, page 'study', body = {"items":[{id,goalId,goal,type,
   title,subtitle,url,thumbnail,done,savedAt}]} — per member, same row-level security as
   personal notes, so it's the same on every device.
   FIND MORE asks the same AI source finder the Goal Page used (roadmap-videos). */
import { sb, currentUser, intentions } from '../app.js';

const PAGE = 'study';

async function read() {
  if (!currentUser) return { items: [], signedIn: false };
  const { data, error } = await sb.from('player_personal_notes').select('body')
    .eq('user_id', currentUser.id).eq('page_id', PAGE).maybeSingle();
  if (error) throw error;
  let v = {}; try { v = JSON.parse(data?.body || '{}'); } catch (_) {}
  const items = Array.isArray(v.items) ? v.items : [];
  if (!v.migrated) { await migrateHearts(items); await write({ items, migrated: true }); }
  return { items, signedIn: true };
}

async function write(st) {
  const { error } = await sb.from('player_personal_notes').upsert({
    user_id: currentUser.id, page_id: PAGE, title: 'MY STUDY',
    body: JSON.stringify({ items: st.items || [], migrated: true }), updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,page_id' });
  if (error) throw error;
}

// One time: items hearted in LEARN FROM THE GREATS (saved in this browser) move into My Study.
async function migrateHearts(items) {
  let favs = []; try { favs = JSON.parse(localStorage.getItem('ci_favorites') || '[]'); } catch (_) {}
  favs.filter(f => f && f.type === 'video' && f.target).forEach(f => {
    if (items.some(x => x.url === f.target)) return;
    const g = (intentions || []).find(it => (it.roadmapAI?.resources || []).some(r => r && r.url === f.target));
    const r = g ? (g.roadmapAI.resources || []).find(x => x && x.url === f.target) : null;
    items.push({ id: 's' + Date.now() + Math.random().toString(36).slice(2, 6), goalId: g ? String(g.id) : '', goal: g ? g.title : '',
      type: r?.type || 'video', title: f.title || f.target, subtitle: f.subtitle || r?.subtitle || '', url: f.target,
      thumbnail: r?.thumbnail || '', done: false, savedAt: Date.now() });
  });
}

function goals() { return (intentions || []).map((it, i) => ({ id: String(it.id), title: it.title || '', n: i + 1 })); }

async function find(goalTitle) {
  const it = (intentions || []).find(g => g.title === goalTitle);
  const userActions = (it?.roadmapAI?.userTasks || []).map(u => u && u.text).filter(Boolean);
  const data = await window.ciApiJson('roadmap-videos', { intention: goalTitle || '', userActions });
  return (data && data.resources) || [];
}

async function save(goalTitle, r) {
  const st = await read();
  if (st.items.some(x => x.url === r.url)) return st;
  const g = (intentions || []).find(x => x.title === goalTitle);
  st.items.push({ id: 's' + Date.now() + Math.random().toString(36).slice(2, 6), goalId: g ? String(g.id) : '', goal: goalTitle || '',
    type: r.type || 'video', title: r.title || r.url, subtitle: r.subtitle || '', url: r.url, thumbnail: r.thumbnail || '', done: false, savedAt: Date.now() });
  await write(st); return st;
}

async function update(id, patch) {
  const st = await read(); const x = st.items.find(i => i.id === id);
  if (x) Object.assign(x, patch);
  await write(st); return st;
}

async function remove(id) {
  const st = await read(); st.items = st.items.filter(i => i.id !== id);
  await write(st); return st;
}

if (typeof window !== 'undefined') window.ciStudy = { read, find, save, update, remove, goals };
