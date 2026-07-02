# COSMIC INTENTIONS — BUSINESS PLAN & 3-YEAR FINANCIAL MODEL

**Prepared:** July 1, 2026 | **Entity:** Cosmic Intentions (cosmicintentions.com) | **Founder:** Scott (solo, bootstrapped)
**Status:** Pre-revenue, pre-launch. Public launch target: **September 2026.**
**Companion document:** CI_BUSINESS_PLAN.md (Strategy & GTM Playbook) and CI_LAUNCH_KIT.md (execution).

---

## 1. COMPANY OVERVIEW

### Mission
Help people become who they intend to be — by turning written goals into a daily, multi-sensory identity practice (voice, visualization, habit, and reflection) powered by AI.

### Vision
The default daily companion for the manifestation / intentional-living audience: the app you open when you wake, the audio you fall asleep to, and the story you read about your own day each evening.

### Value Proposition
Manifestation content is everywhere; a manifestation **system** is not. Cosmic Intentions converts a user's "I AM…" intention into (a) a concrete 10-step AI roadmap, (b) a personalized mindset library, and (c) — the differentiator — a **personalized, ElevenLabs-voiced "Mind Loop"** the user hears in their own chosen voice, on repeat, at night and during the day. Competitors sell generic libraries; Cosmic Intentions manufactures **personal** audio at near-zero marginal cost.

### Current-State Snapshot (July 1, 2026)

| Item | State |
|---|---|
| Revenue | $0 (pre-launch) |
| Product | Working web app: intentions + dates/categories, AI 10-step roadmaps, mindset library, Mind Loop player (sleep + daytime, impressions counter), visualization workspace, gamified rings, streaks/momentum/identity tiers, AI Evening Wrap-Up, reorderable Daily Habit Tracker, Wins Wall, themes, Pegboard |
| Platform | Web only (responsive). No native app. |
| Assets owned | Codebase (100% founder-owned), domain, brand, Supabase schema + cached audio, pre-launch social accounts |
| Monthly cost today | ~$70–120 |
| Debt / investors | None. 100% founder equity. |
| Team | 1 |
| Stage | Pre-launch: hardening product, building waitlist, preparing Founding Member offer |

### Business Model
Consumer subscription SaaS. **$15/month or $119/year (~34% off)**, 7-day card-required free trial. Launch offer: **Founding Member lifetime, $199, capped at 200 seats.** Target gross margin floor 85% (modeled ~89–90%).

---

## 2. MARKET ANALYSIS

| Layer | Definition | Size (est. 2026) | Growth |
|---|---|---|---|
| **TAM** | Global mental-wellness & self-improvement app spend | ~$10–12B/yr (within ~$45B self-improvement industry) | ~14–16% CAGR |
| **SAM** | English-speaking 25–50 already paying for mindset/manifestation digital products (~15M × ~$120/yr) | ~$1.8B/yr | ~15% CAGR |
| **SOM** | Realistic 3-yr capture: ~5,000 paying subs | ~$800K ARR by mid-2029 = 0.04% of SAM | — |

The SOM is deliberately tiny — this plan converts a rounding error of a huge, high-intent, underserved niche.

**Target segment:** "Manifestation Melissa," 28–45, ~70% female, US/UK/CA/AU, Atomic Habits + The Secret crowd, already pays for Calm/journals/courses, wants structure + belief. WTP proven (To Be Magnetic $27/mo; Mindvalley $399/yr).

**Why now:** (1) AI cost collapse makes personalized audio viable (~$0.70/user/mo cached); (2) manifestation went mainstream but tooling is stuck at journals/PDFs; (3) meditation-app fatigue; (4) solo-founder viability via static hosting + serverless + AI-assisted dev.

---

## 3. COMPETITIVE ANALYSIS

| Competitor | Price | Model | Strength | Gap CI exploits |
|---|---|---|---|---|
| Calm | $70/yr | Content library | Brand, sleep, celebrity voices | Generic; no goal system |
| Headspace | $70/yr | Content library | Clinical, B2B | Meditation-only; avoids manifestation |
| Finch | Free/~$40–70/yr | Gamified pet | Viral Gen-Z | No goal/identity engine, no audio, younger |
| Fabulous | ~$40–80/yr | Habit journeys | Behavioral science | Rigid, no personalization |
| To Be Magnetic | $27/mo | Manifestation workshops | Niche trust | Static content, no app mechanics, pricier |
| Mindvalley | $399/yr | Courses | Production, gurus | Expensive; courses ≠ daily practice |
| Generic manifestation apps | $10–20/mo | Templates | Cheap, App Store | Low quality, no AI personalization — set the price anchor |

**The wedge:** personalized voice audio as a COGS-advantaged practice moat · a closed daily loop (not a library) · positioning nobody big will touch ("manifestation") · price-to-value asymmetry ($15 < TBM's $27). Honest caveat: not patent-grade — the durable moat is accumulated user data + brand + community, which is why retention KPIs dominate.

---

## 4. PRODUCT & ROADMAP

| Window | Ship | Success metric |
|---|---|---|
| Jul–Aug 2026 | Stripe + 7-day card trial; <10-min onboarding to first Mind Loop; trial audio cap (1 loop); waitlist | Trial→paid machinery works; ≥1,500 waitlist |
| Sep 2026 | Public launch + Founding Member (200×$199); FM referral link | ≥100 FM seats in 60 days |
| Oct–Nov 2026 | **PWA**: installable, offline audio, push | Neutralizes "no app"; 30% of actives install |
| Dec 26–Jan 27 | Retention #1: streak-repair, weekly recap email, annual upgrade prompts | D30 +5pts; annual mix ≥25% |
| Feb–Mar 2027 | Retention #2: goal-completion ceremony + "next intention"; Wins Wall share images | Post-completion churn < overall |
| Apr–Jun 2027 | Community-lite Wins feed; more voices; gift subs | Referral ≥15% of signups |

**NOT building (12 mo):** native apps (PWA first, revisit at $30K MRR) · B2B/teams · live coaching/forums · widgets/wearables/AI chat · free tier (breaks trial math + invites voice-COGS abuse).

---

## 5. OPERATIONS PLAN

| Vendor | Role | Now | @~1,000 subs |
|---|---|---|---|
| Netlify Pro | Hosting + functions | $19 | $19–40 |
| Supabase Pro | Auth/DB/storage/audio cache | $25 | $25–75 |
| OpenAI (gpt-4o-mini) | Roadmaps, mindset, Wrap-Up | ~$5 | ~$80 |
| ElevenLabs | Mind Loop voice (cached) | $22 | $99–330 |
| Stripe | Billing | fees | ~4.5% |
| Email (Kit) | List, sequences | $29 | $79 |
| Domain/Workspace/Canva/misc | — | ~$30 | ~$50 |
| **Fixed total** | | **~$130** | **~$250–300** (excl. usage COGS) |

**COGS controls (protect 85%+ margin):** (1) cache everything — generate once, replay forever; (2) gate generation behind payment intent — trials get 1 loop, per-tier regen limits, budget alarm at 2× forecast.

**Solo support:** email-only, batch once daily; in-app FAQ + Looms deflect ~50–60%; Stripe portal for self-serve billing. ~3–4 hrs/wk at 1,000 subs.

**Data/security:** RLS on all tables; no card data on our servers; daily pg_dump via GitHub Action; positioning discipline — goals & habits, NOT health/medical data; ToS+privacy lawyer-reviewed (~$1,200).

**Weekly rhythm (~45–50 hrs):** product/dev 15 · marketing 15 · support 5 · metrics/finance 4 · customer convos 4 · buffer 5. Contract out recurring non-judgment work before burnout.

---

## 6. ORGANIZATION & TEAM

**Now:** Scott — founder/operator, AI-assisted dev (the operating model, not a stopgap).

**Contractor timeline (revenue-triggered):**
| Trigger | Hire | Cost | Buys back |
|---|---|---|---|
| $6K MRR (~Mar '27) | Video editor (10–15 vids/wk) | $400–600/mo | 8–10 hrs/wk |
| $12K MRR | VA (support/admin) | $500–800/mo | 6–8 hrs/wk + burnout task |
| $20K MRR | Fractional dev (5–10 hrs/wk) | $1,000–1,500/mo | Key-person de-risk |
| $35K MRR | Community/content mgr (PT) | $1,500/mo | Retention content loop |

No FTEs through Year 3; contractor spend <12% of revenue. Advisors (by Q4 '26): a subscription operator, a niche creator, a bookkeeper/CPA ($150–250/mo from month 1 of revenue). De-risk founder dependence via ops manual + password-manager emergency access + fractional dev.

---

## 7. FULL FINANCIAL MODEL

### 7.1 Core Assumptions (Base)
Visitor→trial 2.5% · Trial→paid 45% (card-required) · Monthly churn 7% Y1 → 6% Y2 → 5% Y3 · Annual mix 25% · **Blended ARPU $13.70/mo** · FM 150/200 sold @ $199 · Traffic 3,000 (Sep) → 18,000 (Jun-27), ~15%/mo · Variable COGS $0.78/mo/active + $2.50 one-time voice gen/new paid · Payment fees 4.5% · Founder draw $0 → $3K/mo (Feb '27) → $5K (Y2) → $7.5K (Y3).

### 7.2 Year 1 Monthly (Base) — key line

| Month | Active Subs | MRR | FM Cash | Cash Balance |
|---|---|---|---|---|
| Sep-26 | 34 | $466 | $19,900 | $17,336 |
| Dec-26 | 187 | $2,562 | — | $29,167 |
| Mar-27 | 469 | $6,425 | — | $32,087 |
| Jun-27 | 884 | $12,111 | — | $43,564 |

Y1: 1,082 new paid, 884 EOY, $80,924 total revenue (incl. $29,850 FM), $8,860 COGS, +$43,564 net cash. Subscription revenue alone (~$51K) covers all costs incl. founder draw — never needs outside cash. FM cash is acceleration/buffer, not survival.

### 7.3 Years 2–3 (Base)
Y2: 2,756 subs EOY, ~$453K ARR, 89.4% GM. Y3: 4,977 subs EOY, ~$68K MRR, ~$818K ARR, ~90% GM.

### 7.4 Three Scenarios
| Outcome | Conservative | Base | Stretch |
|---|---|---|---|
| ARR @ Jun-29 | ~$296K | ~$818K | ~$1.56M |
| Subs @ Jun-29 | ~1,800 | ~4,977 | ~9,500 |
| Op break-even | Feb 2027 | Nov 2026 | Oct 2026 |
| Cash needed beyond FM | ~$4K savings | $0 | $0 |

Even Conservative = viable lifestyle business (~$296K ARR × ~89% GM ≈ $180K+/yr profit).

### 7.5 P&L Summary (Base)
| Line | Y1 | Y2 | Y3 |
|---|---|---|---|
| Total revenue | $80,924 | $299,500 | $635,500 |
| Total COGS | $8,860 | $31,600 | $64,500 |
| Gross margin | 89.1% | 89.4% | 89.9% |
| Total opex | $13,500 | $46,100 | $98,300 |
| Operating profit (pre-draw) | $58,564 | $221,800 | $472,700 |
| Net after draw | $43,564 | $161,800 | $382,700 |

### 7.6 Cash / Break-even
Max cumulative outflow before revenue: **−$1,800** (Jul–Aug '26) — the entire at-risk capital. Operating break-even **Nov 2026** (month 3); full break-even incl. $3K draw **Feb 2027** (month 6). **Total cash to break-even <$2,000.** Bootstrappable on a credit-card budget.

### 7.7 Unit Economics (Base)
ARPU $13.70 · lifetime 14.3 mo @ 7% churn · LTV (revenue) $196 · **GM-LTV $176** · CAC target ≤$45 · **LTV:CAC 3.9:1** · **payback 3.7 months**.

### 7.8 Sensitivity — churn is everything
| Churn | GM-LTV | Steady-state subs | ARR | Value @3× ARR |
|---|---|---|---|---|
| 5% | $246 | ~7,500 | ~$1.23M | ~$3.7M |
| 8% | $154 | ~4,700 | ~$771K | ~$2.3M |
| 12% | $102 | ~3,100 | ~$514K | ~$1.5M |

Moving churn 8%→5% = ~$450K ARR and ~$1.4M enterprise value on identical spend.

---

## 8. FUNDING STRATEGY
**Bootstrap.** Math doesn't require capital (<$2K at-risk, break-even month 3–6, 89% margins fund growth). Category rewards authenticity over ad spend. FM cash ($16–40K) is the "round" — growth capital, not salary (draw starts when MRR covers it). Raise only if: proven LTV:CAC >4:1 on a spend-constrained channel AND churn ≤5% for 6+ months AND speed genuinely matters. Risk of not raising: speed vs a funded copycat, founder fragility, no war chest for a native-app moment — accepted, reviewed quarterly.

---

## 9. KPI DASHBOARD

**Weekly:** visitors (+10–15% w/w), trial starts (≥2.5%), trial→paid (≥45%), **activation** (intention+loop+ring in 48h ≥60%), support tickets/100 (≤5), email growth (≥150 net/wk).

**Monthly:** MRR growth (≥12% Y1), **gross churn ≤7%→5%** (red line >9% → freeze paid), **D30 retention ≥55%**, annual mix ≥25%, CAC ≤$45, LTV:CAC ≥3:1 (pause paid <2.5:1), **gross margin ≥88%** (audit ElevenLabs <85%), Mind-Loop listens/active/wk ≥4, cash runway ≥6 months.

---

## 10. RISK REGISTER & SWOT

| # | Risk | Score | Mitigation |
|---|---|---|---|
| R1 | High churn (>9%) | 20 | Card trial, retention roadmap, annual push, paid circuit-breaker |
| R2 | Founder key-person/burnout | 15 | Revenue-triggered contractors, ops manual, hour cap, product runs untouched |
| R3 | Platform/algorithm dependence | 12 | Email list (owned), multi-channel, referral/affiliate, SEO |
| R4 | ElevenLabs cost blowout | 12 | Caching, trial cap, budget alarm, cheaper-TTS fallback (2-wk swap) |
| R5 | Competition/copycat | 12 | Speed + niche, switching costs, incumbents can't say "manifestation" |
| R6 | No native app | 12 | PWA + push (Oct–Nov), revisit native at $30K MRR, no 30% tax |
| R7 | Health/claims liability | 8 | Goals not therapy, no outcome claims, disclaimer, LLC shield |
| R8 | Involuntary billing churn | 6 | Stripe Smart Retries + dunning |
| R9 | OpenAI dependence | 4 | Trivial usage; any mini model is a drop-in |

**SWOT —** Strengths: 89–90% margins, personalized voice gap, complete retention loop, full-stack founder speed, tiny at-risk capital. Weaknesses: solo SPOF, no native app, no audience yet, non-technical ceiling, unknown brand. Opportunities: huge under-served niche, falling AI costs, creator/affiliate fit, micro-SaaS acquirers pay 3–4× ARR. Threats: incumbent adds AI audio, algorithm shifts, trend cools/FTC, ElevenLabs pricing power, rising CAC.

---

## 11. MILESTONES

| Date | Milestone | Metric |
|---|---|---|
| Jul '26 | Billing + entity + ToS | Test purchase succeeds |
| Aug '26 | Waitlist + launch content | ≥1,500 emails |
| Sep '26 | LAUNCH + Founding Member | ≥50 FM seats/30d |
| Nov '26 | Operating break-even | Rev > COGS+opex |
| Feb '27 | Break-even incl. draw | Net cash positive w/ draw |
| Jun '27 | Year-1 exit rate | ~880 subs, ~$12K MRR, ~$145K ARR, D30 ≥55% |
| Jun '28 | Year-2; decision gate | ~2,750 subs, ~$38K MRR, ~$453K ARR |
| Jun '29 | Year-3 | ~5,000 subs, ~$68K MRR, ~$818K ARR; asset ~$2–3M |

---

## 12. ONE-PAGE SUMMARY
Bootstrapped consumer-subscription web app for the manifestation audience. Differentiator: personalized ElevenLabs "Mind Loop" wrapped in a complete daily retention loop. $15/mo or $119/yr, 7-day card trial, 200-seat $199 lifetime launch tier (~$30K injection). ~89–90% GM; GM-LTV ~$176; CAC ≤$45 → 3.9:1, 3.7-mo payback. Base: ~$12K MRR by Jun '27 → ~$453K ARR Jun '28 → ~$818K ARR / ~5,000 subs Jun '29 at ~74% op margin (Conservative still ~$296K ARR). At-risk capital <$2,000; op break-even month 3, full break-even month 6; no raise planned. Biggest risk = churn (top of the KPI dashboard and the 12-month retention roadmap). The 2029 asset: ~$800K-ARR, ~90%-margin, low-touch subscription business — 3–4× ARR to a micro-acquirer, or ~$400K+/yr kept.
