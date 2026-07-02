import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Cosmic Intentions — Vite build.
// Phase 0: real build pipeline (bundle + minify + content-hash the CSS,
// dev server, production dist/). App JS stays as classic global scripts for
// now (behaviour-identical) and is copied verbatim; it gets modularised in
// later, individually-verified phases.
export default defineConfig({
  // We manage static assets explicitly via static-copy (below) instead of a
  // public/ dir, so the large images/ tree isn't pulled through the bundler.
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    // Keep the classic global scripts working: don't let Rollup try to bundle
    // the script tags it finds — they're copied verbatim and load in order.
    rollupOptions: {
      input: 'index.html',
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        // app.js + shared/*.js are now ES modules bundled via src/main.js — not copied.
        { src: 'player', dest: '.' },
        { src: 'players', dest: '.' },
        { src: 'standalone/iam-generator.html', dest: '.' },
        { src: 'images', dest: '.' },
      ],
    }),
  ],
});
