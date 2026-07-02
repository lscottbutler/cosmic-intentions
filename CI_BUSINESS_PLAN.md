# COSMIC INTENTIONS — The Founder's Playbook
### A Brutally Honest Strategic Plan: Launch → Growth → Exit
*Prepared for Scott | 2026 | Public launch: September 2026*

---

## 1. EXECUTIVE SUMMARY & HONEST VERDICT

**The verdict: a $10M exit is possible but improbable on a 3-year horizon. A $1M–$3M exit is genuinely achievable, and the same playbook gets you there. Play the ladder, not the lottery.**

### Reverse-engineering the $10M

Small consumer-subscription apps sell for **3–6x ARR** at the high end — but only with strong retention, growth, and a strategic buyer. Sub-$5M deals on Acquire.com/Flippa more often clear at **2.5–4x ARR** (or 3–5x seller's discretionary earnings).

| Exit price | Multiple | Required ARR | Paying subs @ $10/mo blended ARPU |
|---|---|---|---|
| $10M | 6x (heroic) | $1.67M | ~14,000 |
| $10M | 4x (realistic-strategic) | $2.5M | ~21,000 |
| $10M | 3x (financial buyer) | $3.3M | ~28,000 |
| $3M | 3.5x | ~$860K | ~7,200 |
| $1M | 3x | ~$330K | ~2,800 |

**Note on ARPU:** your planned $75/year works out to $6.25/mo — a 58% discount vs. monthly. Too generous. Fix pricing and blended ARPU lands around $10–$11/mo.

To hit ~20,000 paying subscribers with typical consumer-wellness churn (6–10%/month), you need roughly **2,000–2,500 net-new payers per month at steady state** — at 3–5% visitor→paid conversion that's **50,000–80,000 engaged visitors/month**. A real content/paid-acquisition business, not a side project.

**Base case (execute well, solo, bootstrapped):** 400–1,200 paying subs by Sept 2027 → $60K–$150K ARR → asset worth $150K–$500K. **Stretch case (a viral channel catches + retention >6 months median):** 4,000–8,000 subs by late 2028 → $500K–$1M ARR → $1.5M–$3.5M exit. **$10M case:** the stretch case *plus* 2 more years of compounding, or a strategic acquirer who wants your audience/brand.

**The single hardest constraint: retention.** Manifestation/habit apps bleed users (category 30-day retention often <10%). Every section bends toward one number: *do users still open Cosmic Intentions in month 3?*

The inspiring part: you built a real, differentiated product with near-zero fixed costs. Your burn is coffee money. You can play a 3–4 year game funded competitors can't.

---

## 2. COMPREHENSIVE PRODUCT REVIEW

### Strengths
1. **The Mind Loop is the product.** ElevenLabs-voiced, personalized subliminal-style audio of *your own goals in "I AM" form*, sleep mode + impressions counter — nothing mainstream does this. Your moat, demo, and TikTok hook.
2. **Full-loop design.** Intention → AI roadmap → daily rings → evening AI story recap = a complete ritual. The "story, not dashboard" Wrap-Up is novel and shareable.
3. **Cost structure.** Vanilla JS + Netlify + Supabase + gpt-4o-mini + cached ElevenLabs = gross margins that can exceed 85%. Acquirers love this.
4. **Identity framing.** "I AM" + identity tiers aligns with the Atomic-Habits zeitgeist.

### Weaknesses
1. **No mobile app.** Your use case (bedtime audio, morning rings, streaks) is phone-in-hand. Ship a proper **PWA** (installable, offline audio, web push) — #1 product risk.
2. **Feature sprawl for a solo founder.** Breadth is the enemy of the $10M exit; depth of one habit loop is the friend.
3. **The health tracker is off-thesis and on-liability** (glucose/BP/meds).
4. **No analytics / retention instrumentation.** Can't fix what you can't see.
5. **Single-founder, AI-built codebase** — a diligence risk at exit.

### Competitive wedge
Not a content library (Calm/Headspace), not a habit pet (Finch), not productivity (Sunsama). True category = manifestation (To Be Magnetic, Mindvalley) — **none generate a personalized, AI-voiced subliminal loop from your own stated identity.**

**The wedge in one sentence:** *"Cosmic Intentions turns your goals into your own voice-of-the-future audio ritual — the manifestation app that says YOUR words back to you."*

### DOUBLE DOWN
Mind Loop (market the counter as "reps for your mind") · the daily ritual loop · PWA + audio reliability · shareable artifacts (Wins Wall, Wrap-Up story cards, streak milestones).

### CUT or FREEZE
Health-metric fields (liability >> value) · kids theme (COPPA risk) · Pegboard (freeze) · any feature that isn't Mind Loop / ritual loop / sharing. **Rule: new features require a one-sentence retention or acquisition hypothesis first.**

### Missing to be acquisition-grade
Analytics (PostHog), <5-min onboarding to first Mind Loop ("aha"), email lifecycle automation, documented metrics history.

---

## 3. POSITIONING & BUSINESS MODEL

### Ideal customer (one persona)
**"Manifestation Melissa," 28–45, ~70% female.** Listens to Mel Robbins/Jay Shetty, read *Atomic Habits* and *The Secret*, follows manifestation TikTok, disposable income, tried Headspace and quit, buys *transformation with structure*. Market to her (men will use it too).

### Pricing — fix the annual plan
- **$15/mo is right.**
- **$75/yr is wrong** (58% off craters ARPU/multiple). Price annual at **$119/yr ($9.92/mo, ~34% off)**.
- **Free trial, not freemium.** 7-day, card required (~40–60% trial→paid). Cardless "3-day taste" only if top-of-funnel stalls.
- **Founder's Deal for launch cash:** 200 "Founding Member" lifetime seats at **$199** (or $79/yr locked). Up to $40K runway + 200 evangelists. Number seats publicly, close after launch month.

### Unit economics
- **Gross margin:** ElevenLabs is the real COGS (~$0.30–$1.50 TTS/goal). Cap free-trial audio (e.g., 2 goals), regenerate only on edit, cache forever. Target **≥85% margin**.
- **LTV:** $11 ARPU, 8% churn → ~$135. At 5% churn → ~$220. Your whole business is that gap.
- **CAC:** organic-first ≈ $0 year one. When paid, cap CAC at **LTV/3 ≈ $45**; don't spend until churn is known (3+ months cohort data).

### Revenue beyond subscriptions
Annual prepay push · one-time "Premium Voice Pack" ($19–$29) · $27 "90-Day Intention Reset" program · affiliate (later) · B2B/coach tier ($49/mo/10 seats, after 1,000 consumer subs). **No ads** (kills trust + acquirability).

---

## 4. THE 12-MONTH GAME PLAN

### July 2026 — Foundation
- Wk1: Install PostHog (6 events: signup, first goal, first Mind Loop, ritual day complete, day-7 return, subscription). Form LLC + business bank account.
- Wk2: Payments (Paddle/Lemon Squeezy merchant-of-record). Waitlist landing page: one headline ("Your goals. Your voice. On loop."), 30-sec demo audio, email capture.
- Wk3: Short-form video 3x/week (8 weeks of reps before launch).
- Wk4: 25 beta users, instrument everything. ToS/Privacy drafted.

### August — Beta & sharpen
- Cut onboarding to **<5 min to first personalized audio** (month's only product goal).
- Ship PWA install + offline audio.
- 5x/week video + weekly build-in-public email.
- Open Founding Member pre-orders mid-Aug (target 50 = ~$5–10K).
- Prep launch assets: Product Hunt, 10 pre-recorded videos, 5 seeded micro-influencers.

### September — LAUNCH
- Wk1: Soft-open to waitlist, fix breakage.
- Wk2: Launch week — Product Hunt Tuesday, daily videos, daily emails, influencers post, Founding Member countdown close.
- Wk3–4: Personally onboard every paying customer (3-line email).
- **Target: 100–150 paying by Sept 30.**

### Q4 2026 — Retention quarter
- North star: **Day-30 retention ≥ 25%.** Ship only retention features (streak-repair, weekly Wins recap email, web push).
- Build referral loop into product.
- 5x/wk video, 1x/wk email, 1 SEO article/wk.
- Prep **"2027 Intentions Challenge"** (free 7-day, launches Dec 26).
- Target: 300–400 paying, churn <10%/mo.

### Q1 2027 — Growth quarter
- Ride January wave (Challenge = top-of-funnel → 20%-off annual on day 7).
- Double down on winning content format (kill losers via PostHog).
- Launch affiliate program (30% first-year rev share) for coaches/YouTubers.
- If churn <7% + 3 months data: test $500/mo paid (TikTok Spark Ads on best organic).
- Target: 700–1,000 paying (~$100–140K ARR).

### Q2 2027 — Systemize
- Hire part-time video editor ($500–800/mo).
- Document SOPs (exit prep + sanity).
- Ship the ONE retention feature data demands.
- At **$150K+ ARR** you own a sellable asset (~$400–500K). Decide: sell or compound.

---

## 5. MARKETING PLAYBOOK

### Best starting channel: short-form video (TikTok + Reels + Shorts, same content)
Your audience lives there; the product demos in 15 seconds (*press play → hear YOUR goal → jaw drop*); $0 cost; audio products convert from audio-first platforms.

### The stack (activation order)
1. **Short-form video** (now): 3x/wk → 5x/wk. Batch Sundays. Formats: demo screen-records, POV skits, founder talking-head, user wins, "listen before you sleep" audio posts.
2. **Build in public** (now): weekly X/Threads + email diary with real numbers. Becomes your acquisition story for buyers.
3. **Email** (now): the channel you own. 7-email onboarding keyed to product events.
4. **SEO** (Oct): 1 long-tail article/wk + a free **"I AM Statement Generator"** tool page (free-tool SEO = highest ROI).
5. **Referral loop IN product** (Nov): "give a month, get a month" + one-tap share cards on Wins/Wrap-Up (watermarked).
6. **Influencer/affiliate** (Jan): 30% rev-share for coaches; seed 20 micro-creators.
7. **Paid** (only after churn <7%): Spark Ads on proven winners, $500/mo test, scale at CAC <$45.

### Solo cadence
5 videos + 1 email + 1 SEO article/wk ≈ 8–10 hrs. Sustainable.

### 5 viral hooks
1. **"I made an app that whispers your goals to you while you sleep."** (run 10 variants)
2. **"POV: your 2027 self left you a voicemail."** (type goal → play voice → duet-bait)
3. **The impressions counter flex:** "This is what 10,000 reps of your affirmation looks like."
4. **"My app writes a bedtime story about YOUR day."** (read a real Wrap-Up)
5. **Founder arc: "Non-technical guy vibe-coded a manifestation app with AI. Goal: sell it for $10M. Day 1."** (public countdown series — the audacity is the hook)

---

## 6. LEGAL & FOUNDATION ROADMAP

**Correction, gently: legal minimums land BEFORE anyone pays you or hands you data — in parallel with marketing.** ~$1,000–$1,500 all-in, ~2 weeks part-time. A checklist, not a project.

### MUST do before launch / payments (July–Aug)
1. **LLC (July wk1).** Home state (single-member LLCs get little from Delaware/Wyoming). EIN (free) → business bank account → all revenue/expenses through it (clean books protect the multiple).
2. **ToS + Privacy Policy (July).** Termly/iubenda (~$120–300/yr) + 1 hr lawyer review (~$300). Include arbitration, liability cap, subscription/refund, AI-content license.
3. **Health & "not medical advice" disclaimer (July, load-bearing).** Prominent disclaimer at signup + on tracker; never generate AI text that *advises on* health metrics; strongly consider cutting glucose/BP/meds fields. Not HIPAA, but **Washington My Health My Data Act & similar state laws reach consumer health data.**
4. **Payments (Aug).** Paddle/Lemon Squeezy (merchant of record handles global tax) or Stripe + Stripe Tax. Refund policy visible.
5. **Cookie/GDPR/CCPA basics (Aug).** Consent banner, data export + delete (build the delete flow — it's required), privacy@ email, one-page data map.
6. **Security hygiene (Aug, one afternoon).** **Verify Supabase Row Level Security on every table** (test user A can't read user B), API keys server-side only, 2FA everywhere, daily backups, rate-limit AI endpoints.

### Can wait (but calendar it)
Trademark "Cosmic Intentions" (~month 3, USPTO ~$350/class, classes 9 & 42 — do a knockout search now) · business insurance (month 3–6, or at launch if keeping health fields) · accountant (first tax season) · vendor DPAs (pre-diligence).

---

## 7. THE EXIT: PATH TO $10M

### What makes it acquirable
(1) Recurring revenue with 12+ months clean history · (2) **retention** — churn <6%, flattening cohorts (this sets 2.5x vs 5x) · (3) diversified, documented channels (not "the founder's face") · (4) clean everything (single-member LLC, IP assigned, clean books) · (5) transferable ops (SOPs, contractor, documented AI pipelines) · (6) low founder-dependence. Mitigation for #6: from month 6, grow non-Scott channels so ≤40% of new users come from founder-face content by exit.

### Likely acquirers
- **Financial/marketplace ($150K–$2M):** Acquire.com (natural home), Flippa, Empire Flippers. 2.5–4x ARR, diligence churn hard.
- **Micro-PE / studios ($1M–$5M):** Tiny, XO Capital, wellness-app aggregators.
- **Strategic ($3M–$10M+):** mid-size wellness/ed-tech wanting the Mind Loop tech + audience; a creator/media brand (a manifestation influencer buying instead of building) — **your most plausible $10M path** (strategics pay for *fit*).
- **Brokers:** <$2M direct on Acquire.com; $2M–$10M use a micro-M&A advisor (FE International, Quiet Light).

### Metrics to SHOW (dashboard now)
MRR/ARR since launch · gross + net churn by cohort · LTV, CAC by channel, LTV:CAC · trial→paid · DAU/MAU (>25%) · gross margin with AI COGS · organic vs paid mix · email list + open rate. **"Show me the cohort chart" is the first question — one click.**

### Valuation ladder
| Rung | ARR | Subs | Requires | Earliest |
|---|---|---|---|---|
| $300–500K | $100–150K | ~1,000 | Launch done, churn <8%, 12mo history | Late 2027 |
| $1M | ~$300K | ~2,500 | One repeatable channel + referral loop, churn <7% | Mid 2028 |
| $3M | ~$850K | ~7,000 | Two channels, net churn <5%, contractor-run content, SOPs | Late 2029 |
| $10M | $2–2.5M | ~20,000 | All above + strategic competition or 3 more years compounding | 2030–31 |

### Don't get lowballed
Sell on an up-slope (not from burnout) · create buyer competition (3+ IOIs, deadline) · know your floor · 12 months clean books · **≥70–80% cash at close** (beware earnouts) · your public MRR thread = verifiable track record.

---

## 8. PITFALLS, TRICKS & AWARD-WINNING PLAYS

### Top 10 mistakes (+ your exposure)
1. **Building instead of selling** (your #1 risk). From July, 50% of hours = marketing, tracked.
2. **No analytics.** PostHog week 1.
3. **Ignoring churn while celebrating signups.** Cohort chart on the wall.
4. **Health-data liability drift.** Cut/quarantine the fields.
5. **Single-channel dependence.** Build email + SEO as insurance.
6. **Mispricing from fear.** $119/yr.
7. **Founder burnout.** One day off/week, batch content, editor at $2K MRR, "minimum viable week" plan.
8. **Outcome promises** ("changes your life" → FTC/refunds). Sell the *ritual and reps*, never guaranteed outcomes.
9. **Legal as afterthought.** Section 6 order, ~2 wks, ~$1,200.
10. **Falling in love with $10M.** Decide now what number changes your life; write it; honor it.

### 10 award-winning plays
1. **"Day 1 to $10M" public countdown series.**
2. **Free "I AM Statement Generator" tool page** (SEO honeypot).
3. **Voicemail-from-your-future-self onboarding** (trial day 1).
4. **Streak-insurance paywall** (loss aversion, Duolingo-style).
5. **10,000-Impressions shareable certificate** (proof-of-work virality).
6. **Annual "Intentions Challenge"** (Dec 26–Jan 7, compounds yearly).
7. **Coach seeding** (25 free pro + 30% affiliate = aggregated distribution).
8. **Wrap-Up story as UGC engine** (templated share cards, watermark rides along).
9. **Annual-plan winback on churn** (pause → 40%-off annual).
10. **Quarterly public "investor update"** (discipline + diligence trail + audience of future acquirers).

---

## 9. THE 90-DAY PRIORITY STACK (Jul 1 – Sep 30)

1. **PostHog + 6 core events** (Jul wk1).
2. **LLC + EIN + business bank account** (Jul wk1–2).
3. **Cut/quarantine health fields + ship "not medical advice" disclaimer** (Jul).
4. **Rebuild onboarding → first Mind Loop audio in <5 min** (Jul–Aug, main product work).
5. **Short-form video 3x→5x/wk** incl. "Day 1 to $10M" series (start now).
6. **Waitlist page + weekly email** (target 1,000 emails by Sep 1).
7. **ToS, Privacy, cookie consent, RLS security audit** (~$1,200).
8. **Payments (merchant of record) + fix pricing** — $15/mo, $119/yr, 7-day card trial, 200-seat $199 Founding Member.
9. **25-person beta; fix top 3 drop-off points** the data shows.
10. **Launch week** — Product Hunt Tuesday, daily emails, 10 videos, 5 influencers, Founding Member countdown. **Target: 100 paying by Sep 30.**

---

### Closing
$10M is a 2030 number, not 2027 — but every rung of the ladder is a win. A $400K exit changes your year; a $1.5M exit changes your life. The asset you'd sell at $10M is built with the same 90 days: instrument it, tighten the ritual, tell the story 5x/week, and guard the churn number like it's the whole company — because it is. You did the improbable part; you built it. Now go sell it — one video, one email, one Founding Member at a time.
