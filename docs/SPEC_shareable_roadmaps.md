# Spec — Shareable Roadmaps (launch-safe community step)

Status: **PROPOSED / not built.** Authored 2026-08-23.
The small, low-risk first step toward community — before any real forum. Lets a member turn
one of their goal roadmaps into a **read-only public link** others can view. No comments, no
open posting, so almost none of the moderation/legal risk of a forum. On-thesis: "see how
someone else is chasing this identity." Full discussion comes later via a **managed** platform
(Skool / Circle / hosted Discourse) — see [[project_library_pattern]].

Acronyms: **RLS** = Row-Level Security (database rule deciding who can read/write a row).
**PII** = Personally Identifiable Information. **UGC** = User-Generated Content.
**ToS** = Terms of Service. **anon key** = the public Supabase key the browser already ships.

---

## 1. What it is (and is NOT)
**IS:** a member flips a "Share" switch on one roadmap → gets a link like
`cosmicintentions.com/r/ab12cd` → anyone with the link sees that roadmap **read-only**
(the identity line + the steps). Owner can un-share anytime.

**IS NOT (v1):** no comments, no replies, no likes, no public directory/browse, no editing by
others, no real-time. Those are forum features — deliberately excluded to stay low-risk.

## 2. Privacy design (non-negotiable — priority #1)
- **Opt-in per roadmap.** Nothing is shareable until the member explicitly turns it on. Default OFF.
- **Snapshot, not live.** Sharing copies the roadmap AT THAT MOMENT into a separate row. Their
  private goals/notes/future edits are never exposed through the link. Re-share to update.
- **No PII in the shared row.** Store ONLY: the goal's identity line ("I AM…"/title), the steps,
  category, and an optional **pseudonymous handle** (default "Anonymous"). NEVER email, name,
  user id shown publicly, or their other goals.
- **Revocable instantly.** Un-share = delete the row (link 404s immediately).
- **Unguessable link.** Random token (≥10 chars), not a sequential id. Link-only access — not indexed/browsable.
- **Age + ToS gate** already covers this once community exists.

## 3. Data model (Supabase)
New table `shared_roadmaps`:

| column | type | notes |
|---|---|---|
| `token` | text (PK) | random slug in the URL, e.g. `ab12cd34ef` |
| `owner_id` | uuid | = auth user; used only for owner writes, never shown |
| `title` | text | the "I AM…" identity line (snapshot) |
| `category` | text | optional, for styling |
| `handle` | text | pseudonymous display name; default 'Anonymous' |
| `steps` | jsonb | snapshot array of roadmap step strings |
| `created_at` | timestamptz | default now() |

**RLS policies:**
- `INSERT/UPDATE/DELETE`: only where `owner_id = auth.uid()` (members manage their own shares).
- `SELECT`: **allow anon read of ANY row** (link-only access; rows contain no PII by design).
  → this is what lets a logged-out visitor view the link.
- Grant `select` on the table to the `anon` role.

## 4. User flow
1. On **My Roadmap** (`page-myroadmap`), each goal's roadmap gets a **"Share" toggle**.
2. ON → generate token, upsert a snapshot row, show the copyable link + a "Copy link" button
   and a one-line "Anyone with this link can view these steps (no personal info shared)."
3. OFF → delete the row; link dies.
4. Optional: a small text field to set the pseudonymous **handle** (default Anonymous).

## 5. Public view page
- Route: `/r/:token` (add a Netlify redirect so `/r/*` serves the viewer page, or reuse the SPA
  with `?roadmap=<token>`).
- Loads with the **anon key**, reads the row by token via the public SELECT policy — **no login
  required**.
- Renders read-only: identity line, category chip, the numbered steps, handle, and a
  **"Make your own at Cosmic Intentions" call-to-action** (this is the growth loop).
- If token not found → clean "This roadmap is no longer shared" page.

## 6. Build phases
- **P1 (core):** table + RLS, Share toggle on My Roadmap (snapshot upsert/delete), copy-link UI.
- **P2 (viewer):** the `/r/:token` read-only page + CTA.
- **P3 (polish):** pseudonymous handle field, "shared" badge on shared goals, un-share confirm.

Small feature. P1+P2 are the MVP (minimum viable product). No new server code required —
it's Supabase table + client JS + one Netlify redirect.

## 7. Security checklist (before shipping)
- [ ] `shared_roadmaps` row contains ZERO PII (verify columns).
- [ ] anon SELECT returns only the safe columns (no `owner_id` leakage to the UI).
- [ ] Write policies scoped to `owner_id = auth.uid()` (a user can't share/edit another's).
- [ ] Token is random + long; not enumerable.
- [ ] Rate-limit share creation (avoid abuse) — or cap shares per user.
- [ ] Un-share truly deletes; viewer 404s.
- [ ] Copy says plainly what is/ isn't shared.

## 8. Explicitly deferred (NOT this feature)
Comments/replies, public browse/search, likes/follows, real-time chat — i.e. the **forum**.
When that time comes: use a **managed community platform**, organized around the Libraries,
with pseudonymous handles + ToS + report/block. Do not hand-build UGC before launch.

---
_Decision recap: launch WITHOUT a forum; shareable read-only roadmaps are the only community
step worth building now; full community is post-launch via a managed platform._
