# Cosmic Intentions — Data Model (single source of truth)

> Why this file exists: the Map's shape changed but nothing tracked what consumed
> the old shape, so **Weekly Focus + Progress silently broke** (they still read the
> dead `the_map.components`). This doc is the contract. **When you change an AI
> output shape or a table, update this file and grep for every consumer.**

Last verified against code: 2026-06-11. Columns inferred from the client sync code
(`syncIntentionsToSupabase` / `syncFromSupabase`) — confirm against the Supabase
dashboard, and capture the real schema in `docs/schema.sql` (see bottom).

---

## Supabase tables (Postgres)

### `profiles`  (one row per user; `id` = auth user id)
`id` · `is_member` (bool) · pegboard fields `pb_name, pb_beliefs, pb_mission,
pb_values, pb_attitudes, pb_stoicism, pb_traits` · behind-the-scenes `bts_tone,
bts_authors, bts_obstacles, bts_why, bts_context` · `openai_voice` · `spirituality`

### `intentions`  (one row per goal; key `id`, owned by `user_id`)
`id` · `user_id` · `title` · `words` (jsonb) · `mindset` · `achievers` (jsonb) ·
`start_date` · `target_date` · `the_map` (jsonb) · `bbfw` (jsonb) · `updated_at`
- Upserted on `id`. **Last-write-wins** (no conflict/merge on `updated_at`).
- Client-only fields **NOT** stored here: `imageUrl, imageOptions, imageIdx,
  _imgLoading` (preserved across sync from localStorage).

### `user_scores`  — `user_id` · `total_score`
### `activity_log` — `user_id` · `event_type` · `points` · `created_at`  (grows forever → prune)
### `content_blocks` — `slug` · `body`  (the "My Notes" editable blocks, e.g. `home-video-1`)
### `session_logs` — **referenced but not yet created** (TODO in meditation-timer.html)

---

## Client object shapes (in-memory + localStorage)

### `intention` object
```
{
  id, title, words, mindset, start/targetDate,
  achievers: {
    commitments:    [ { text, checks: { 'YYYY-MM-DD': true }, streak } ],   // → Daily Commitments / TODAY
    missionControl: { items: [ { action, why, category, flag, deepDive } ], generatedAt }
  },
  theMap:  { …see below… },
  bbfw:    { …see below… },
  fullPlan:{ …generate-content output… },
  // client-only (not synced):
  imageUrl, imageOptions, imageIdx, _imgLoading
}
```

### `theMap`  (produced by `/api/map-ai`)
```
{
  thisWeek:    [ { text, isJournal, j } ],
  dangerZones: [ { title, pitfall, warning, ifTrigger, thenAction, j, journalText } ],
  mindset:     { currentAttitudes[], toInstall[], recitations[], prayer },
  thisMonth:   [ { text, isJournal, j } ],
  terrain:     [ { text, isJournal, j } ],
  practice:    { vizAffirmations[], gratitudeItems[], meditationFocus, weeklyQuestion },
  checks:      { 'thisWeek-0': true, ... }   // keyed by section-index
}
```
> ⚠️ **DEAD SHAPE — do not rely on:** `theMap.components` / `comp.todos`.
> This was the *old* Map (9 components × todos). It no longer exists.
> Still wrongly read by **`weekly-focus.js` (`_wfBuildPool`)** and
> **`progress-dashboard.js` ("Maps built" + per-goal bar)** → both silently empty/zero.
> FIX PENDING: point them at thisWeek/thisMonth/terrain, or retire Weekly Focus.

### `bbfw`  (produced by `/api/bbfw` — the "Backbone")
```
{ eternal_problems: [ { insight, action } ] x6,
  components:       [ { action, quote } ] x9 }
```

---

## Which function writes which field

| Endpoint | Provider | Writes to | Notes |
|---|---|---|---|
| `/api/map-ai` | OpenAI | `intention.the_map` | 2 parallel calls |
| `/api/bbfw` | OpenAI | `intention.bbfw` | 6 problems + 9 components |
| `/api/generate-content` | OpenAI | `intention.fullPlan` (+ Supabase) | achievers/affirmations/beliefs/10-min script |
| `/api/claude` | OpenAI | varies → `{ text }` | Mission Control items, deep dives, roadmap player, arsenal |
| `/api/tts` | OpenAI | audio (base64) | un-gated; called from players w/o session |
| `/api/image-generate` | OpenAI | `intention.imageUrl` (client-only) | base64, NOT synced |
| `/api/image-search` | Pexels | image results | |

All client calls now go through `ciApi()` in `shared/api.js`.

---

## localStorage keys
`ci_intentions_<userId>` · `ci_pegboard` · `ci_streak` · `ci_best_streak` ·
`ci_viz_plays` · `ci_med_plays` · `ci_gratitude_plays` · `ci_colb_order` ·
`ci_goal_affirmations` · `ci_goal_gratitude` · `ci_goal_meditation` ·
`openai_voice` · `ci_spirituality`

---

## TODO to make this airtight
- [ ] Export real Supabase schema → `docs/schema.sql` (Supabase ▸ SQL Editor ▸
      `pg_dump`-style, or the dashboard's "Schema" export). Schema currently lives
      ONLY in the dashboard — not recoverable from this repo.
- [ ] Confirm RLS enabled on every table above (see readiness mind map).
- [ ] Fix the dead `the_map.components` consumers (Weekly Focus + Progress).
