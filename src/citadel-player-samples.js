// Review-only Citadel placement. Do not change player internals here.
// Locked order: Meditation, Gratitude, existing Quote Reveal, existing DVB.
export function mountCitadelPlayerSamples(root = document) {
  const masters = root.getElementById('ciApprovedMasters');
  if (!masters || masters.querySelector('[data-ci-sample="meditation"]')) return false;

  const samples = [
    { id: 'meditation', title: 'Meditation Frame Master', src: '/players/meditation-master.html?t=15', extraHeight: '0px' },
    { id: 'gratitude', title: 'Gratitude Player Sample', src: '/players/gratitude.html', extraHeight: '64px' }
  ];

  const fragment = root.createDocumentFragment();
  for (const sample of samples) {
    const holder = root.createElement('div');
    holder.dataset.ciSample = sample.id;
    holder.style.cssText = `position:relative;width:100%;min-width:0;padding-top:56.25%;height:${sample.extraHeight};box-sizing:content-box;`;

    const frame = root.createElement('iframe');
    frame.src = sample.src;
    frame.title = sample.title;
    frame.loading = 'eager';
    frame.allow = 'fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'no-referrer';
    frame.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;border:0;border-radius:0;background:#111;';
    holder.append(frame);
    fragment.append(holder);
  }

  masters.prepend(fragment);
  return true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mountCitadelPlayerSamples(), { once: true });
} else {
  mountCitadelPlayerSamples();
}
