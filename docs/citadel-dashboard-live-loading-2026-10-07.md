# Live Citadel dashboard loading — 2026-10-07 ICT

Scott's screenshot shows the live same-origin member wrapper's Notes dialog stuck at Loading your existing list. Root cause: shared/citadel-dashboard-review.js registers the data adapter only on localhost and deploy-preview hosts, excluding cosmicintentions.com.

Correction: permit the verified live domain and its www variant while retaining identical-origin and exact /standalone/member-design-test.html checks. Keep existing store and save behavior; no Supabase change, no new storage or permissions. Add a 20-second visible connection failure message and cancel it when data loads or the dialog closes. Preserve layout and player files.

Six isolated hostname/origin/path tests passed: live domains and preview allowed; unrelated path, unrelated host and cross-origin parent blocked. Wrapper syntax passed. Rendered and authenticated live behavior remain unverified behind the password wall. No claim of visually verified completion.

Review branch: review/live-citadel-dashboard-loading. Pre-fix recovery: production a1a35f59d32ae79e08eeea491b49a3112e6c2c36. Existing explicit requests to publish this member build persist; this is a focused correction to that published build. Password protection remains unchanged. Current Bible/Drive update pending; this record is supplementary.
