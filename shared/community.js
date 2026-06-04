/* ── COMMUNITY MODULE ───────────────────────────────────
   Depends on globals: LS, esc, currentUser, getPB, toast
───────────────────────────────────────────────────────── */

const COMM_KEY = 'ci_community_posts';

function loadCommunityFeed() {
  const feed = document.getElementById('communityFeed');
  if (!feed) return;
  const posts = LS.get(COMM_KEY) || getDefaultPosts();
  if (posts.length === 0) {
    feed.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted);font-size:13px">No posts yet. Be the first to share!</div>`;
    return;
  }
  feed.innerHTML = posts.map((p, i) => renderCommunityPost(p, i)).join('');
}

function getDefaultPosts() {
  return [
    { name: 'Sarah M.',  type: 'breakthrough', text: 'Just completed my 30-day visualization streak. The shift in my mindset is real — I actually believe I AM the person in my intentions now.', time: '2h ago', likes: 14, liked: false },
    { name: 'Marcus T.', type: 'risk',         text: "Sent the cold email to the CEO I had been putting off for 3 months. Got a reply in 2 hours. Taking action before you're ready is everything.", time: '5h ago', likes: 22, liked: false },
    { name: 'Jen K.',    type: 'win',          text: 'Closed my first $5,000 client today. I AM a successful freelance designer — and now I have proof.', time: '1d ago', likes: 31, liked: false },
  ];
}

function renderCommunityPost(p, i) {
  const badgeClass = p.type === 'win' ? 'badge-win' : p.type === 'breakthrough' ? 'badge-breakthrough' : 'badge-risk';
  const badgeText  = p.type === 'win' ? '🏆 Win' : p.type === 'breakthrough' ? '💡 Breakthrough' : '🎯 Risk';
  const initials   = p.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  const colors     = ['#E8524A','#E8893A','#88B83A','#52B896','#4A9EAD'];
  const avatarBg   = colors[i % colors.length];
  return `<div class="community-post">
    <div class="community-post-meta">
      <div class="community-post-avatar" style="background:${avatarBg}">${initials}</div>
      <div>
        <div class="community-post-name">${esc(p.name)}</div>
        <span class="community-post-badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="community-post-time">${esc(p.time)}</div>
    </div>
    <div class="community-post-text">${esc(p.text)}</div>
    <div class="community-post-heart">
      <button class="btn-heart ${p.liked ? 'liked' : ''}" onclick="toggleLike(${i})">
        ${p.liked ? '❤️' : '🤍'} ${p.likes}
      </button>
    </div>
  </div>`;
}

function toggleLike(i) {
  const posts = LS.get(COMM_KEY) || getDefaultPosts();
  if (posts[i]) {
    posts[i].liked  = !posts[i].liked;
    posts[i].likes += posts[i].liked ? 1 : -1;
    LS.set(COMM_KEY, posts);
    loadCommunityFeed();
  }
}

function submitCommunityPost() {
  const text = document.getElementById('communityPostText')?.value.trim();
  const type = document.getElementById('communityPostType')?.value;
  if (!text) { toast('Write something first.', 'error'); return; }
  const pb   = getPB();
  const name = pb['pb-name'] || (currentUser?.user_metadata?.full_name) || 'Member';
  const posts = LS.get(COMM_KEY) || getDefaultPosts();
  posts.unshift({ name, type, text, time: 'just now', likes: 0, liked: false });
  LS.set(COMM_KEY, posts);
  document.getElementById('communityPostText').value = '';
  loadCommunityFeed();
  toast('Posted to the community ✓', 'success');
}
