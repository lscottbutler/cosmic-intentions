# Cosmic Intentions — 1000-User Readiness

## Capacity Verdict
- 1000 users is comfortable
- Stack scales to tens of thousands
- Static (Netlify CDN) + Supabase + serverless
- Capacity is NOT the risk

## 🔴 Top Risks — fix before scaling
### Open AI endpoints = uncapped cost/abuse
- CORS *, no auth, no rate limit
- Endpoint is a free proxy to your OpenAI account
- Scraper or buggy loop = runaway bill
- Can trip OpenAI rate limits = outage for all
- No per-user throttle
- FIX: require Supabase auth token on functions
- FIX: per-user / per-day generation cap
- FIX: OpenAI hard spend limit + alert
### Failures are invisible to a solo operator
- This week: deploys frozen for days
- This week: Map silently returned errors
- FIX: Netlify deploy-failure notifications
- FIX: Uptime monitor (UptimeRobot) — site + /api
- FIX: OpenAI billing alert

## 🟡 Confirm for 1000
### Supabase security + tier
- Verify RLS enabled on every table
  - intentions
  - profiles
  - user_scores
  - activity_log
- No RLS = users can read each other's data
- Consider Pro ($25/mo) — connections + backups
- activity_log grows forever — prune periodically
### Data sync = last-write-wins
- Multi-device / cleared storage can clobber data
- OK at current size — just know it's there

## 🟢 Maintainability — not capacity
### 401 KB index.html monolith
- Won't fail at 1000 (static, CDN-cached)
- Slows YOU down, error-prone edits
- Split eventually, carefully — not urgent

## Bottom Line
### Stable for 1000? YES — after two things
- Lock down the AI endpoints
- Add failure alerts
- Everything else is comfortable at this scale

## Recommended Next Step
- Add Supabase-auth + daily cap to AI functions (code)
### 5-min checklist for dashboard alerts (you click)
- Netlify deploy alerts
- OpenAI spend cap
- UptimeRobot monitor
