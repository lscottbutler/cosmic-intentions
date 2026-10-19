import { COSMIC_CONCEPT_THEMES } from './shared/cosmic-concepts-content.js';
import { ENT_CARDS } from './shared/ent-library-content.js';
import { FIFTY_GROUPS } from './shared/fifty-things-content.js';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

function searchCatalog() {
  return JSON.stringify([
    ...COSMIC_CONCEPT_THEMES.flatMap(theme => theme.items.map(item => ({title:item.title, text:item.description, group:'500 Lessons for Life', action:'cosmic-library', target:'cosmic-concept-'+item.number}))),
    ...ENT_CARDS.map(card => ({title:card.title, text:card.directive, group:'Entrepreneur Library', action:'ent-card', key:card.key})),
    ...FIFTY_GROUPS.flatMap(([group, description, items]) => items.map(title => ({title, text:description, group:'50 Things People Want Most', action:'cosmic-library', want:title})))
  ]);
}

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
      input: {main:'index.html',usage:'usage-board.html'},
    },
  },
  plugins: [
    {
      name: 'public-player-search',
      configureServer(server) {
        const catalog=searchCatalog();
        server.middlewares.use('/player-search-index.json', (_req,res) => {res.setHeader('Content-Type','application/json');res.end(catalog);});
      },
      generateBundle() {this.emitFile({type:'asset',fileName:'player-search-index.json',source:searchCatalog()});}
    },
    viteStaticCopy({
      targets: [
        // app.js + shared/*.js are now ES modules bundled via src/main.js — not copied.
        { src: 'player', dest: '.' },
        { src: 'players', dest: '.' },
        { src: 'standalone', dest: '.' },
        { src: 'images', dest: '.' },
      ],
    }),
  ],
});
