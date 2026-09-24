// Keep completed reference players in the Admin workspace.
// Player internals remain separate and unchanged.
export function mountAdminPlayerSamples(root = document) {
  const samplesRoot = root.getElementById('ciAdminPlayerSamples');
  if (!samplesRoot || samplesRoot.querySelector('[data-ci-sample="gratitude"]')) return false;

  const samples = [
    { id: 'gratitude', title: 'Gratitude Player Sample', src: '/players/gratitude.html', extraHeight: '64px' },
    { id: 'meditation', title: 'Meditation Player Sample', src: '/players/meditation.html?t=15', extraHeight: '0px' }
  ];

  const fragment = root.createDocumentFragment();
  for (const sample of samples) {
    const holder = root.createElement('div');
    holder.dataset.ciSample = sample.id;
    holder.style.cssText = `position:relative;width:100%;min-width:0;padding-top:56.25%;height:${sample.extraHeight};box-sizing:content-box;`;

    const frame = root.createElement('iframe');
    frame.src = sample.src;
    frame.title = sample.title;
    frame.loading = 'lazy';
    frame.allow = 'fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'no-referrer';
    frame.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;border:0;border-radius:0;background:#111;';
    holder.append(frame);
    fragment.append(holder);
  }

  // Preserve the approved reference order:
  // Gratitude, Meditation, Quote Reveal, Digital Vision Board.
  samplesRoot.prepend(fragment);
  return true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mountAdminPlayerSamples(), { once: true });
} else {
  mountAdminPlayerSamples();
}
