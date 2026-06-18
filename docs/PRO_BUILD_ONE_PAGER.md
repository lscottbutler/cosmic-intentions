# Cosmic Intentions — The Pro Build (one page)

**What it is:** the same app, rebuilt on a real software foundation — a *build pipeline* instead of one hand-edited file.

**Stack (unchanged — already pro-grade):** Netlify (hosting + serverless) · Supabase (auth + database) · Vite (build) · GitHub.

---

## Old build → Pro build

| | OLD (v1, being redone) | PRO (now / in progress) |
|---|---|---|
| **Structure** | one `index.html`, ~9,900 lines (HTML+CSS+JS jammed together) | separated: `index.html` (HTML) · `src/styles` (CSS) · `app.js` + `shared/*` (logic) |
| **Build** | none — raw files served as-is | **Vite**: bundles, minifies, fingerprints |
| **Cache-busting** | manual `?v=` by hand (error-prone) | **automatic** content-hashing |
| **Local dev** | edit + refresh, hope | `npm run dev` — live reload |
| **Events** | 175 inline `onclick=""` in the HTML | `addEventListener` + delegation *(next step)* |
| **Code health** | dead pages, dead players, orphaned CSS | stripped to lean core, dead code gone |
| **Images** | 79 MB tracked → bloated, slow, credit cap | **14 MB** — optimized |
| **Safety net** | none (break it = users find out) | smoke tests + error monitoring *(planned)* |

---

## Scope of the app (it's small — that's a strength)
3 working surfaces — **Home/Auth · Dashboard · My Pegboard (+ The Map)** — plus Admin and the Affirmation player. ~72 distinct buttons. Small enough to test exhaustively.

## What's DONE
Lean core · Vite build live · CSS extracted/minified/hashed · JS extracted · images 79→14 MB.

## What's NEXT
1. ES modules + move inline handlers to listeners (clean separation)
2. Playwright smoke tests (auto-verify core flows on every deploy)
3. Sentry (errors) + PostHog (usage/replays)

**The point:** v1 was a single fragile file you edited live. The pro build is a *system* — built, tested, monitored — that one person can safely run and grow.
