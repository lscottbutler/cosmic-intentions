# COSMIC INTENTIONS — AGENT OPERATING MANUAL

## Authority and scope

Cosmic Intentions is Scott's seven-year professional product-design project. Scott is the solo creator and a visual, creative thinker with no coding background. Scott supplies creative direction, references, decisions, feedback, and approval. The agent handles implementation, repository work, testing, verification, documentation, and preservation whenever access permits.

This file is mandatory operating policy for every agent working in this repository. Read it before making changes. Also read any closer `AGENTS.md` in the target folder; closer instructions may specialize but may not weaken privacy, production safety, verification, or preservation rules here.

## Non-negotiable principles

### Delivery amendment — Scott, 2026-10-11 and 2026-10-12

Scott explicitly requested publication of all current work and then instructed: when he makes a revision, make it permanent rather than leaving it on disconnected branches. For requested site revisions, his standing authorization covers implementation, verification, recovery checkpoints, merging the reviewed change to `main`, and deploying to the existing password-protected production site. Do not ask him to repeat that authorization for each routine revision. A later explicit preview-only or do-not-publish instruction overrides this default for that task.

Use one active integration branch while doing the work, then finish the authorized release. `main` and its verified production deploy are the durable delivery; a preview branch alone is unfinished work. Prefer the stable member URL https://cosmicintentions.com/standalone/member-design-test.html and editor URL https://cosmicintentions.com/standalone/module-editor.html after verifying the deployed commit. Do not substitute old numbered preview URLs. Preserve history and recovery points; never merge obsolete competing prototypes just because they are open.

This later instruction supersedes the earlier per-revision approval and review-only defaults below. It does not authorize weakening privacy, changing the locked player design, destructive operations, or claiming untested behavior works. Read `CI-SESSION-CHECKPOINT.md` at session start and update it after material work. The comprehensive audit on October 12 was explicitly requested; subsequent focused revisions should remain focused.

1. Never guess. Treat approved screens, uploaded references, specifications, assets, videos, and recorded decisions as authoritative.
2. If an asset, filename, route, database field, connection, timing, interaction, or design decision cannot be verified, state the exact unknown and stop before inventing a substitute.
3. Reproduce visual references faithfully unless Scott explicitly requests redesign.
4. Keep production private and untouched during experimentation.
5. Work on a review branch and provide one persistent, playable review link—not a source-code page.
6. Never call work fixed, complete, working, deployed, or final until the rendered experience has been visually and functionally verified.
7. Preserve recoverability, privacy, security, intellectual-property records, and legal-review status throughout development.

## Communication with Scott

Lead with the practical result, blocker, or exact next action. Use plain language and avoid unexplained technical terms.

Complete technical actions directly through available connections. Do not make Scott coordinate ChatGPT, VS Code, GitHub, Supabase, Netlify, terminals, or multiple browser tabs when the agent can do the work.

When Scott must act because authentication, account ownership, security, or access prevents direct execution, give one action at a time:

1. Exact application or website.
2. Exact button, menu, tab, or field and its screen location.
3. Exact text to enter, when required.
4. Whether the action is inspection or change.
5. What must remain untouched.
6. Expected result.
7. Ask for a screenshot before the next action when the interface cannot be verified.

Never request that Scott paste secrets into chat. Never send code or terminal commands without stating exactly where they go, what they do, and why they are unavoidable.

When reporting completed work, state: what changed; what was verified; what remains unknown; whether Supabase, Netlify, or production changed; branch and checkpoint; backup/Bible status; and the one link Scott should open.

## Before changing anything

1. Confirm this is the authoritative private Cosmic Intentions repository.
2. Read this file and all applicable folder-level instructions.
3. Inspect the current branch, status, recent history, relevant files, current implementation, and assets.
4. Recover applicable decisions from the current Cosmic Intentions Bible and approved references.
5. Inspect the latest deployed state when deployment is relevant.
6. Define exact scope, acceptance criteria, known unknowns, and what remains untouched.
7. Confirm the private review method and recovery point.
8. Use a dedicated `review/<feature>` branch. Never experiment on `main`.
9. Check for unrelated user changes and preserve them.

## Approved player template — Scott's direction, 2026-09-24

The only approved player template for every page is the current Master Player shown at:
https://deploy-preview-41--gilded-profiterole-47a2eb.netlify.app/players/master-player.html?start=meditation

Canonical implementation: `players/master-player.html`. Approved recovery checkpoint: `9303e792da586df777e06a7c9347c61c3148bc8d`.

Every page that displays a player must use this shared template. Do not introduce, restore, substitute, or show a different player template on another page. Keep page-specific content and behavior inside the canonical template instead of duplicating or redesigning its shell.

Preserve the approved square outer charcoal-grey top corners, square outer charcoal-grey bottom, aligned charcoal-grey side borders, curved grey inner troughs, matching grey meditation controls area, and working hamburger menu. A request to change page content does not authorize a template change. Scott must explicitly request the particular template feature to be changed; preserve the rest and retain the integrity guard.

Color amendment — Scott explicitly requested on 2026-09-30: replace Dodger Blue with dark grey on all players. The shared outer frame and matching Meditation borders now use charcoal `#292929`, replacing `#1e90ff`. The grey `#747474` inner troughs, white Entrepreneur trough, geometry and controls remain protected. Earlier blue styling remains recoverable at `dd9db0f3376b0849b68880cb7db488cf0b1b6395`.

Work one requested revision at a time. For a focused edit, inspect and verify the affected component and necessary dependencies; do not restart a whole-site audit or rework unrelated pages. This is Scott's later, specific scope direction for incremental revisions.

## Product and player architecture

Keep every player separate. Shared foundations do not authorize mixing player content, stages, instructions, timing, or behavior.

Build shared, reusable components for the approved frame, curved rail/crossbar, moving marker, typography, timers, icons, instruction cards, image stages, transition engine, phase labels, playback controls, completion states, and reduced-motion behavior. Once Scott approves a shared component, treat it as locked unless he explicitly authorizes a change.

Maintain a private Component Lab showing shared components in all important states, including desktop/mobile, start/midpoint/completion, light/dark stages, marker positions, timer states, icons, phase labels, controls, focus/hover/disabled states, and reduced motion.

For each player:

1. Identify the authoritative design sheet, screenshot, video, and assets.
2. Translate the reference into explicit visual, content, timing, motion, responsive, control, and completion criteria.
3. Separate shared-system behavior from player-specific behavior.
4. Build the complete experience on its review branch.
5. Use one permanent private review URL throughout revisions.
6. Apply Scott's natural visual feedback without requiring engineering terminology.
7. Reverify the full experience after every meaningful revision.
8. Merge and deploy only after Scott says it is approved for deployment.

## Verification standard

Before presenting work:

1. Build and run the complete requested experience.
2. Verify every required asset loads and has the correct source.
3. Verify every control, transition, timer, synchronization point, animation, phase, instruction, label, and completion/replay state.
4. Verify first-load, pause, resume, finish, replay, error, and reduced-motion behavior when applicable.
5. Render and inspect desktop and mobile sizes.
6. Compare the rendered result directly with Scott's reference for composition, proportions, typography, colors, spacing, imagery, controls, sequence, timing, motion, and text.
7. Correct visible defects before handoff.
8. Verify no content or behavior from another player was inserted.
9. Check the browser console and relevant logs for errors without exposing private data.
10. Open and verify the actual private review link.

Source validity, compilation, or automated tests alone do not prove the product works. Scott must not be the primary tester or discover failures through repeated production testing.

## GitHub and production safety

The repository must remain private. GitHub is the authoritative code source; Netlify is not a code backup.

Use descriptive checkpoints on the active review branch. Do not commit directly to `main`, force-push, rewrite important history, delete unmerged branches, change site privacy, merge, or deploy without explicit authorization and a verified recovery point.

Before merge/deployment, confirm the exact branch, commit, changed files, absence of unrelated changes and secrets, complete verification, current backup, rollback point, and Scott's explicit approval. Record the approval in the Bible. Merge the exact reviewed commit and verify the deployed page afterward.

## Supabase rules

Before any Supabase instruction or change, confirm the exact project and exact table, field, function, trigger, policy, bucket, Edge Function, webhook, extension, authentication setting, or configuration involved. Explain the effect in plain language, whether production data is affected, and what remains untouched. Confirm a recovery point first.

Preserve schema, necessary data, migrations, Row Level Security policies, functions, triggers, authentication configuration, storage definitions and policies, Edge Functions, cron jobs, webhooks, required extensions, non-secret environment-variable names, and restore instructions.

After a change, verify the intended behavior, existing authorized access, continued blocking of unauthorized access, and record the change in the Bible and next backup. Restoration must be tested safely outside production before backups are considered proven.

## Netlify rules

Keep production private unless Scott explicitly authorizes a privacy change. Never weaken authentication or privacy to simplify review. Never use production as the design-testing environment.

Preserve site identity, repository connection, production branch, build command, publish directory, redirects, headers, functions, domains, access control, non-secret environment-variable names, deployment commit, and rollback procedure.

Before directing Scott in Netlify, identify the exact site, deployment/branch, setting, effect on production/previews/authentication/domains/privacy, and expected result. Give one click at a time.

## Preservation and backup policy

Follow the 3-2-1 principle: at least three copies, two independent systems, and one protected copy separate from production. GitHub, Drive, Netlify, and Supabase are not substitutes for one another.

Authoritative sources:

- Code: private Cosmic Intentions GitHub repository.
- Designs and project documents: designated private Cosmic Intentions Google Drive folder.
- Production data: verified Cosmic Intentions Supabase project.
- Decisions and recovery state: current Cosmic Intentions Bible.

Each backup record must identify source, project, branch/version, commit where applicable, date/time/time zone, included and excluded content, destination, and verification result.

### Hourly active-work checkpoints

During active work, create a recoverable checkpoint at least hourly when material work changed. Material work includes code, assets, player behavior, schema/policies/functions, Netlify settings, environment-variable names, decisions, specifications, prompts, or privacy/legal/payment changes.

For code, use a descriptive commit on the review branch. Do not create empty commits, commit secrets, or put broken work on `main`.

### Six-hour private Drive snapshots

Every six active-development hours, preserve a timestamped, non-overwriting snapshot in the designated private Drive backup folder. Include applicable repository archive/checkpoint, brief, Bible, decision log, asset and route manifests, schema/policy/function definitions, storage inventory, Netlify/deployment configuration, dependency/build information, recovery instructions, verification report, and a list of intentionally excluded secrets.

Use chronologically sortable names such as `CI BACKUP 2026-09-10 1800 ICT`.

### Daily Bible

On every active workday, create a dated historical Bible and update the clearly identified current version. Record architecture, approved visual system/shared components, player and route inventory, repository/branch/production commits, Supabase schema map, Netlify configuration, asset rights inventory, integrations, environment-variable names without values, backup locations, privacy/legal decisions, policy status, decisions and approvals, known defects, blockers, next steps, and recovery procedure.

Mark each item Approved, Proposed, In Review, Rejected, Deprecated, Unknown, or Blocked. Never silently replace decisions; record what changed, why, when, and the previous decision.

### End of every material work session

Save work; create a descriptive review-branch checkpoint; confirm repository state; update decisions and Bible; create required Drive snapshot; verify privacy; confirm production was not changed without approval; record unresolved issues and next steps; and provide Scott a plain-language report.

### Retention and verification

Unless Scott approves another policy, preserve hourly checkpoints 7 days, six-hour snapshots 30 days, daily Bibles 1 year, weekly full backups 1 year, and monthly milestones plus pre-deployment/pre-migration backups indefinitely.

Never delete the only copy or perform bulk deletion, history rewriting, rotation, or permanent purge without exact targets and explicit authorization.

A backup succeeds only after verifying completion, expected files, readable/openable archive and Bible, identifiable commit, readable database export when applicable, no secrets, private destination, correct timestamp, and recovery instructions. Test a safe non-production restoration monthly and record the result.

Automation failures must be visible. Record success, failure, partial completion, missing source, authentication/storage/verification failure. On failure, preserve the latest checkpoint, state exactly what failed, identify the smallest corrective action, rerun, verify, and record the incident.

## Privacy and security

Privacy is the highest priority. Default to private, least-privilege access and minimum necessary collection, processing, sharing, and retention.

Before adding personal data, analytics/tracking, AI processing, authentication, uploads, sharing, payments, email, or third-party services, document: data collected; purpose; storage; access; recipients; retention; user access/correction/deletion; consent and withdrawal; protection; policy coverage; and legal-review need.

Never expose private user content, goals, intentions, images, recordings, journals, account data, or generated material in URLs, public repositories, review links, logs, analytics events, screenshots, error messages, or unsecured backups. Do not use production personal data in development unless necessary and properly anonymized.

Never commit or document secret values. Secrets include service-role/API keys, passwords, tokens, OAuth/signing/webhook/payment/email credentials, and private encryption keys. Record only purpose, secure storage location, owner, and rotation requirement.

If a secret is exposed: stop; do not repeat it; revoke/rotate it; inspect logs/history; document the incident without the value; assess notification duties; and seek qualified security/legal help when appropriate.

## Legal-risk and intellectual-property controls

The agent is not Scott's attorney and cannot guarantee protection from claims. Flag issues for qualified legal review before launch or material changes, including Terms of Service, Privacy Policy, cookies/tracking, user content, IP/copyright/licensing, AI content, health/wellness claims, testimonials, advertising, subscriptions/renewals/refunds/payments, promotions, age/children, international users, deletion/export/termination, accessibility, integrations, security incidents, and disputes.

Legal drafts remain labeled drafts until Scott approves them and qualified counsel reviews them when appropriate.

Version every Terms and Privacy revision with version/effective/draft dates, author, reason, affected practices, old/new language, review and approval status, user notice/re-consent needs, and publication date. Never silently change policies or claim coverage without comparing policy text to actual product behavior.

Maintain an asset-rights manifest for every production image, font, sound, music track, video, icon, logo, quotation, voice, and third-party design: filename, source, creator/owner, license/purchase record, allowed use, attribution, modification rights, restrictions, approval, and location used. Internet downloads and AI-generated assets are not automatically cleared for commercial use.

Cosmic Intentions includes visualization, gratitude, affirmation, meditation, mindset, and personal-development content. Do not present it as medical or psychological treatment, diagnosis, or guaranteed health, financial, or transformational outcome. Flag claims involving medical conditions, depression, anxiety, trauma, blood pressure, psychological outcomes, or financial results. Never invent scientific support or citations.

## Final rule

Accuracy, privacy, completion, and recoverability take priority over speed. No guessing. No half-finished handoffs. No unnecessary burden on Scott. No unverified production changes. No undocumented product, data, privacy, legal, or infrastructure changes.

## Persistent session continuity — Scott's direction, 2026-10-10

At the start of every session, read CI-SESSION-CHECKPOINT.md before implementation. Treat it as a concise handoff; verify current local state and distinguish historical evidence from current facts. Read relevant Bible sections only when needed, not the entire archive for each small edit.

After every completed material task and before stopping, update CI-SESSION-CHECKPOINT.md with the verified outcome, current branch/checkpoint, local preview URL, open requests, blockers, next action, backup status, and whether production changed. On interruption, save an honest partial checkpoint when possible. Do not rely solely on chat history or imply that another chat's context is automatically present.

Scott is a vibe coder. Keep code, commands, diffs, and routine engineering details out of user-facing responses unless requested. Give plain-language results and clickable previews. Prefer one local preview refreshed after each tweak; do not publish to obtain routine previews. Preserve all existing local work before synchronization. Never claim local setup, backup automation, or a preview is running unless verified in that environment.
