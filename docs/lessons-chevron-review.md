# Lessons section chevron ? In Review

Added a top-right collapse/expand chevron to the 500 Lessons for Life header. Initially expanded; all 500 lessons remain present. Mouse and Enter activation passed in installed Edge at 1280 and 390 pixels. Button target: 44 by 44 pixels. Text ends 10 pixels before the button at both widths. No page errors in interaction checks. Build and Master Player integrity check pass.

Review: http://127.0.0.1:8084/standalone/member-design-test.html ? menu, Cosmic Library.
Recovery: c98e864. Only shared/cosmic-concepts.js and .css changed in the app. Root work preserved. Production, Netlify and Supabase unchanged. This record supplements the Bible; Drive Bible sync pending.

Follow-up: Scott reported a missing chevron with meditation choices over the Library. Fresh Chrome checks did not reproduce that combination. Fixed the review direct-link startup race: requested destination now waits for the player frame to load. Direct Library link verified at 1040 and 390 pixels: chevron visible, collapse/reopen passes, meditation menu hidden. Production unchanged.

Matching library headers: In Review. Entrepreneur Library and 50 Things People Want Most now share the Lessons header colours, title sizes, eyebrow type, spacing and chevrons. Added brief descriptions, 31 skills / 4 forces and 50 wants / 7 life areas. Existing sections and cards preserved. Chrome verified at 1040 and 390 pixels: matching 16px eyebrow text, 28px/23px titles, no horizontal overflow, click/Enter toggles pass, no page errors. Build and template guard pass. Local only; Drive Bible sync pending.
