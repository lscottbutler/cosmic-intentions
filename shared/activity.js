import { LS, currentUser, esc, getPB, sb } from '../app.js';
/* ── ACTIVITY & PROGRESS MODULE ─────────────────────────
   Depends on globals: currentUser, sb, getPB, LS, esc,
   setEl (defined in index.html)
───────────────────────────────────────────────────────── */

const ACTIVITY_LABELS = {
  viz:        { icon: '👁', label: 'Visualization session' },
  meditation: { icon: '🧘', label: 'Meditation session'    },
  countdown:  { icon: '⏱', label: 'Countdown session'     },
  map_todo:   { icon: '✅', label: 'Map todo completed'    },
  login:      { icon: '⚡', label: 'Daily check-in'        },
};

export async function logActivity(type, metadata, points) {
  if (!currentUser) return;
  try {
    await sb.from('activity_log').insert({
      user_id:    currentUser.id,
      event_type: type,
      metadata:   metadata || {},
      points:     points,
      created_at: new Date().toISOString(),
    });
    const pb   = getPB();
    const name = (pb['pb-name'] || '').split(' ')[0] || 'Member';
    await sb.from('user_scores').upsert({
      user_id:      currentUser.id,
      display_name: name,
      total_score:  0,
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'user_id', ignoreDuplicates: true });
    await sb.rpc('increment_user_score', { uid: currentUser.id, pts: points });
  } catch(e) {
    console.warn('logActivity failed:', e);
  }
}

export async function logDailyLogin() {
  if (!currentUser) return;
  const key   = `ci_last_login_${currentUser.id}`;
  const last  = LS.get(key);
  const today = new Date().toDateString();
  if (last === today) return;
  LS.set(key, today);
  logActivity('login', {}, 2);
}

async function loadMyProgress() {
  if (!currentUser) return;
  const panel = document.getElementById('myProgressPanel');
  if (panel) panel.style.display = 'block';

  try {
    const { data: events } = await sb
      .from('activity_log')
      .select('event_type, metadata, points, created_at')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: myScore } = await sb
      .from('user_scores')
      .select('total_score')
      .eq('user_id', currentUser.id)
      .single();

    const score = myScore?.total_score || 0;
    const { count: above } = await sb
      .from('user_scores')
      .select('user_id', { count: 'exact', head: true })
      .gt('total_score', score);
    const { count: total } = await sb
      .from('user_scores')
      .select('user_id', { count: 'exact', head: true });

    const rank = (above || 0) + 1;
    const scoreEl = document.getElementById('myScoreNum');
    const rankEl  = document.getElementById('myCommunityRank');
    if (scoreEl) scoreEl.textContent = score.toLocaleString();
    if (rankEl)  rankEl.textContent  = `#${rank} / ${total || 1}`;
    renderActivityFeed(events || []);
  } catch(e) {
    console.warn('loadMyProgress failed:', e);
    const feedEl = document.getElementById('myActivityFeed');
    if (feedEl) feedEl.innerHTML =
      '<div style="padding:16px;color:#505058;font-size:12px;text-align:center;">Could not load activity.</div>';
  }
}

function renderActivityFeed(events) {
  const feed = document.getElementById('myActivityFeed');
  if (!feed) return;
  if (!events.length) {
    feed.innerHTML = '<div style="padding:20px;color:#404048;font-size:13px;text-align:center;">No activity yet — complete your first session to start tracking.</div>';
    return;
  }

  // Deduplicate: collapse same event_type within same minute into one entry (sum points)
  const deduped = [];
  const seen    = {};
  events.forEach(e => {
    const minKey = `${e.event_type}|${new Date(e.created_at).toISOString().slice(0,16)}`;
    if (seen[minKey]) {
      seen[minKey].points += e.points;
      seen[minKey].count  = (seen[minKey].count || 1) + 1;
    } else {
      const copy     = { ...e, count: 1 };
      seen[minKey]   = copy;
      deduped.push(copy);
    }
  });

  const rows = deduped.map(e => {
    const def    = ACTIVITY_LABELS[e.event_type] || { icon: '◈', label: e.event_type };
    const d      = new Date(e.created_at);
    const date   = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const time   = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // For map_todo: show the actual todo text instead of generic label
    let label = def.label;
    if (e.event_type === 'map_todo' && e.metadata?.todo) {
      label = esc(e.metadata.todo.slice(0, 55)) + (e.metadata.todo.length > 55 ? '…' : '');
    } else if (e.metadata?.intention) {
      label += `<span style="color:#505058"> · ${esc(e.metadata.intention.slice(0,40))}</span>`;
    }

    const countBadge = e.count > 1
      ? `<span style="font-family:var(--vault-mono);font-size:9px;color:#505058;margin-left:4px;">×${e.count}</span>`
      : '';

    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1A1A1A;">
      <span style="font-size:16px;flex-shrink:0;">${def.icon}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:12px;color:#C0C0C8;line-height:1.4;">${label}${countBadge}</div>
        <div style="font-size:10px;color:#404048;font-family:var(--vault-mono);margin-top:1px;">${date} · ${time}</div>
      </div>
      <span style="font-family:var(--vault-mono);font-size:11px;color:#F5A623;font-weight:800;flex-shrink:0;">+${e.points}</span>
    </div>`;
  }).join('');
  feed.innerHTML = rows;
}
