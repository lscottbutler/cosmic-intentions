/* ── ENTREPRENEUR IDENTITY LIBRARY (Object-Oriented Schema) ───────────────
   32-card matrix. Each card owns: label, lexicon[], strategy_rules{}.
   strategy_rules has one directive sentence per each of the 6 strategy blocks.
   The Pass 4 pipeline ingests the active card + live danger zones and uses
   these rules to calibrate every coaching paragraph it writes.
──────────────────────────────────────────────────────────────────────────── */
const ENTREPRENEUR_LIBRARY = {
  'DISCIPLINED': {
    label: 'DISCIPLINED',
    lexicon: ['iron routine', 'non-negotiable', 'compound consistency', 'zero exceptions', 'deliberate restraint'],
    strategy_rules: {
      vivid_vision: 'Paint the achieved life as the earned reward of daily discipline — the version of reality only consistent people can access.',
      compelling_why: 'Frame the emotional fuel as freedom earned through sacrifice — the hunger that makes iron routine feel like personal power.',
      credible_plan: 'Present the plan as locked daily protocols where each week is proof of identity, not just a checklist completed.',
      feedback_loops: 'Make tracking feel like a championship scoreboard — every streak day is concrete evidence of the disciplined operator they are becoming.',
      environment_design: 'Design the environment to make discipline the default path — remove every friction point that could become an excuse.',
      identity_alignment: 'Drive home that discipline is not what they do — it is who they are; a disciplined entrepreneur never negotiates with discomfort.'
    }
  },
  'RISK TAKER': {
    label: 'RISK TAKER',
    lexicon: ['calculated bet', 'asymmetric upside', 'bold move', 'conviction play', 'first mover'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as the audacious life that only someone who made the bold move when others hesitated gets to live.',
      compelling_why: 'Frame the emotional fuel as the specific hunger that makes staying safe feel more dangerous than leaping forward.',
      credible_plan: 'Frame the plan as a sequence of calculated bets — each with defined downside exposure and unlimited upside potential.',
      feedback_loops: 'Make tracking feel like reading the early signals of a winning thesis — every data point confirms the bet was well-placed.',
      environment_design: 'Design an environment that rewards courageous action and removes the comfort traps that quietly breed hesitation.',
      identity_alignment: 'Cement the identity of someone who runs toward asymmetric opportunities — risk is their primary competitive advantage.'
    }
  },
  'STRATEGIC THINKER': {
    label: 'STRATEGIC THINKER',
    lexicon: ['leverage points', 'second-order effects', 'competitive moat', 'long game', 'game theory'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as the result of brilliant strategic positioning — the future only someone playing ten moves ahead could see and build.',
      compelling_why: 'Frame the emotional fuel as the deep love of the game — the specific satisfaction of outthinking the field over time.',
      credible_plan: 'Frame the plan as a strategic map with sequenced phases, leverage points, and clear decision forks already anticipated.',
      feedback_loops: 'Make tracking feel like reading a strategic dashboard — metrics reveal whether the thesis is playing out exactly as designed.',
      environment_design: 'Design an environment for deep strategic thinking — protected time blocks, no noise, only high-signal inputs.',
      identity_alignment: 'Lock in the identity of someone who sees what others miss and moves before the crowd catches up — that gap is their edge.'
    }
  },
  'EXECUTING STRATEGY': {
    label: 'EXECUTING STRATEGY',
    lexicon: ['operational excellence', 'flawless execution', 'initiative velocity', 'zero drift', 'deployment discipline'],
    strategy_rules: {
      vivid_vision: 'Paint the achieved state as the direct result of ruthless operational precision — a vision that became reality through relentless follow-through.',
      compelling_why: 'Frame the emotional fuel as the pride of someone who never lets a great strategy die unused in a meeting room.',
      credible_plan: 'Frame the plan as a fully deployed operating system — every initiative has an owner, a deadline, and a measurable metric.',
      feedback_loops: 'Make tracking feel like an execution dashboard — green lights and red lights, nothing ambiguous, no excuses accepted.',
      environment_design: 'Design an environment for zero-friction execution — systems, checklists, and accountability structures already in place before action begins.',
      identity_alignment: 'Cement the identity of the rare person who permanently closes the gap between vision and reality through relentless follow-through.'
    }
  },
  'SELF CONFIDENT': {
    label: 'SELF CONFIDENT',
    lexicon: ['unshakeable certainty', 'quiet authority', 'deep conviction', 'self-trust', 'earned confidence'],
    strategy_rules: {
      vivid_vision: 'Paint the end state from a place of absolute certainty — describe it as already real, already earned, already completely theirs.',
      compelling_why: 'Frame the emotional fuel as the deep knowing that they were built for exactly this — confidence is the signal, not the noise.',
      credible_plan: 'Frame the plan as a confident march forward — each step taken with unshakeable certainty, never waiting for external permission.',
      feedback_loops: 'Make tracking feel like accumulating proof of what they already knew — every win is confirmation of their capacity, never a surprise.',
      environment_design: 'Design an environment that continuously reinforces their self-belief — visible evidence of capability surrounding them daily.',
      identity_alignment: 'Lock in the identity of someone who does not require external validation to move — their confidence is internally sourced and inexhaustible.'
    }
  },
  'PASSIONATE': {
    label: 'PASSIONATE',
    lexicon: ['burning obsession', 'intrinsic fire', 'deep conviction', 'unstoppable drive', 'relentless love'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as the full expression of their deepest passion — a life that feels like purpose completely and finally unleashed.',
      compelling_why: 'Frame the emotional fuel as the specific love they carry for this work — the feeling that makes the idea of quitting unthinkable.',
      credible_plan: 'Frame the plan as a love letter to the goal — each step an act of devotion to what they care about most, not mere obligation.',
      feedback_loops: 'Make tracking feel like stoking a fire — every milestone adds fuel that deepens the obsession rather than satisfying it.',
      environment_design: 'Design an environment saturated with their passion — visuals, reminders, and spaces that reignite their deepest why every single day.',
      identity_alignment: 'Cement the identity of someone whose passion is their singular superpower — the secret ingredient no competitor can replicate or outlast.'
    }
  },
  'PROFITABLE': {
    label: 'PROFITABLE',
    lexicon: ['revenue clarity', 'margin discipline', 'value creation', 'cash flow mastery', 'economic engine'],
    strategy_rules: {
      vivid_vision: 'Paint the end state in concrete economic terms — what full profitability feels like, looks like, and provides in their actual daily life.',
      compelling_why: 'Frame the emotional fuel as the freedom that profit creates — not greed, but the irreplaceable options that financial strength provides.',
      credible_plan: 'Frame the plan as a profit architecture — revenue streams, margin levers, and cash flow milestones mapped with complete precision.',
      feedback_loops: 'Make tracking feel like reading a live P&L that proves the business model works — every positive number is strategic validation.',
      environment_design: 'Design an environment that keeps economic thinking front and center — revenue metrics visible daily, never buried or ignored.',
      identity_alignment: 'Lock in the identity of a founder who thinks in profit, not just passion — financial strength is a personal leadership responsibility.'
    }
  },
  'GREAT SALES PERSON': {
    label: 'GREAT SALES PERSON',
    lexicon: ['value narrative', 'objection mastery', 'trust architecture', 'pipeline discipline', 'closing conviction'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a life built on the compounding power of world-class selling — influence, income, and impact all amplified.',
      compelling_why: 'Frame the emotional fuel as the love of connection — the specific satisfaction of helping someone make a decision that changes their life.',
      credible_plan: 'Frame the plan as a complete sales system — pipeline stages, follow-up protocols, and closing routines locked in as daily practice.',
      feedback_loops: 'Make tracking feel like a sales scoreboard — conversion rates, pipeline velocity, and revenue signal mastery actively growing.',
      environment_design: 'Design an environment that puts them consistently in front of the right people — access is the primary infrastructure of great selling.',
      identity_alignment: 'Cement the identity of a master persuader who serves through selling — the greatest salespeople are simply the most genuinely helpful people.'
    }
  },
  'SKILLFUL COMMUNICATOR': {
    label: 'SKILLFUL COMMUNICATOR',
    lexicon: ['narrative mastery', 'precision language', 'resonant framing', 'message clarity', 'active listening'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a life where every word carries weight — relationships, deals, and movements all built on communication mastery.',
      compelling_why: 'Frame the emotional fuel as the specific power of being deeply understood — and the responsibility to make others feel genuinely heard.',
      credible_plan: 'Frame the plan as a communication architecture — key messages, audiences, and channels all mapped with deliberate precision.',
      feedback_loops: 'Make tracking feel like calibrating a signal — is the message landing? Are people responding with the right understanding and action?',
      environment_design: 'Design an environment that sharpens communication daily — deliberate writing practice, feedback loops, and speaking as a trained discipline.',
      identity_alignment: 'Lock in the identity of someone whose words move people — communication is their primary leadership instrument and primary competitive asset.'
    }
  },
  'EMPATHETIC': {
    label: 'EMPATHETIC',
    lexicon: ['deep listening', 'emotional intelligence', 'human-first', 'radical understanding', 'trust building'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a life where deep human connection is simultaneously the method and the greatest reward of their success.',
      compelling_why: 'Frame the emotional fuel as the specific love they have for understanding people — empathy is not a soft skill, it is their sharpest edge.',
      credible_plan: 'Frame the plan as a relationship-first roadmap — every major milestone involves understanding the humans who matter most.',
      feedback_loops: 'Make tracking feel like a trust thermometer — are people opening up more? Are relationships deepening? Is empathy converting to results?',
      environment_design: 'Design an environment that enables genuine presence and listening — less reactive noise, more intentional human contact and attention.',
      identity_alignment: 'Cement the identity of a leader who wins not through force but through the irreplaceable power of being truly, completely understood.'
    }
  },
  'STRONG WORK ETHIC': {
    label: 'STRONG WORK ETHIC',
    lexicon: ['outwork everyone', 'hours in the dark', 'grind with purpose', 'show up daily', 'relentless output'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as the earned life of someone who put in the hours when absolutely no one was watching and never stopped.',
      compelling_why: 'Frame the emotional fuel as the specific pride of knowing they outworked the entire field — effort is their primary differentiator.',
      credible_plan: 'Frame the plan as a daily work commitment with specific hours, specific outputs, and zero tolerance for excuses or gaps.',
      feedback_loops: 'Make tracking feel like a work ethic ledger — hours invested, output produced, and compound progress made visibly undeniable.',
      environment_design: 'Design an environment that protects work time fiercely — distractions engineered out, deep work windows locked and defended daily.',
      identity_alignment: 'Lock in the identity of someone whose work ethic is their permanent signature — the one who shows up every single day, no exceptions.'
    }
  },
  'SELF STARTER': {
    label: 'SELF STARTER',
    lexicon: ['bias to action', 'initiative', 'zero waiting', 'first mover energy', 'self-generated momentum'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as the life built entirely by someone who never once waited for permission, invitation, or perfect conditions to arrive.',
      compelling_why: 'Frame the emotional fuel as the specific restlessness of someone who sees possibility everywhere and physically cannot stand still.',
      credible_plan: 'Frame the plan as a sequence of entirely self-initiated moves — no dependencies on others, no waiting for external green lights.',
      feedback_loops: 'Make tracking feel like a momentum dashboard — are they moving? Initiating? Creating real output without being asked or prompted?',
      environment_design: 'Design an environment that minimizes approval loops and maximizes autonomy — self-starters need infrastructure for independent execution.',
      identity_alignment: 'Cement the identity of someone who creates their own momentum from nothing — they are always the spark, never waiting to be ignited.'
    }
  },
  'SELF PROMOTER': {
    label: 'SELF PROMOTER',
    lexicon: ['visible authority', 'strategic visibility', 'brand amplification', 'narrative ownership', 'market presence'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a life where their name is known in the rooms that matter — visibility is their primary revenue and opportunity engine.',
      compelling_why: 'Frame the emotional fuel as the conviction that their work deserves to be seen — bold self-promotion is service, not ego.',
      credible_plan: 'Frame the plan as a visibility roadmap — platforms, target audiences, content cadence, and frequency all mapped with disciplined precision.',
      feedback_loops: 'Make tracking feel like a brand dashboard — reach, engagement, and inbound opportunities all signaling whether the strategy is actually working.',
      environment_design: 'Design an environment that supports consistent content creation and strategic networking — sustained presence requires purpose-built infrastructure.',
      identity_alignment: 'Lock in the identity of someone who shows up boldly and owns their narrative — invisibility is the only true failure they refuse to accept.'
    }
  },
  'RESPECTED MANAGER': {
    label: 'RESPECTED MANAGER',
    lexicon: ['earned authority', 'culture builder', 'servant leadership', 'performance standards', 'team excellence'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a thriving team and organization performing at its absolute peak because of their specific leadership choices.',
      compelling_why: 'Frame the emotional fuel as the specific satisfaction of multiplying human potential — their real impact lives inside other people\'s growth.',
      credible_plan: 'Frame the plan as a leadership operating system — team rhythms, performance standards, and culture rituals all clearly defined and implemented.',
      feedback_loops: 'Make tracking feel like a team performance dashboard — output, morale, and retention all signaling the effectiveness of their leadership.',
      environment_design: 'Design an environment that models the culture they want to build — a respected manager must personally embody what they are trying to create.',
      identity_alignment: 'Cement the identity of a leader who earns genuine respect through consistency, fairness, and the relentless development of every person around them.'
    }
  },
  'LIVING THE BRAND': {
    label: 'LIVING THE BRAND',
    lexicon: ['authentic embodiment', 'brand integrity', 'walking the talk', 'identity consistency', 'living proof'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a life where who they are and what they represent are perfectly unified — the gap between brand and reality is zero.',
      compelling_why: 'Frame the emotional fuel as the specific power of authenticity — people follow those who are the undeniable living proof of what they sell.',
      credible_plan: 'Frame the plan as a personal brand architecture — daily behaviors, public presence, and private standards all fully aligned with the brand promise.',
      feedback_loops: 'Make tracking feel like a brand integrity audit — are their daily actions perfectly consistent with what they publicly represent and profess?',
      environment_design: 'Design an environment that reinforces complete brand alignment — everything they surround themselves with should reflect their deepest brand truth.',
      identity_alignment: 'Lock in the identity of someone who IS the brand — not performing it for an audience, not marketing it, simply living it fully every day.'
    }
  },
  'MANAGING TIME WISELY': {
    label: 'MANAGING TIME WISELY',
    lexicon: ['time sovereignty', 'highest leverage', 'calendar architecture', 'deep work windows', 'ruthless prioritization'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a life of complete time sovereignty — where every single hour is deliberately invested, never carelessly spent.',
      compelling_why: 'Frame the emotional fuel as the specific rage against wasted potential — time is the only resource that can never, under any circumstances, be recovered.',
      credible_plan: 'Frame the plan as a time-blocked operating schedule — deep work windows, protected high-leverage priorities, and absolute zero calendar drift.',
      feedback_loops: 'Make tracking feel like a time audit — are the most important hours actually going to the highest-leverage activities or bleeding elsewhere?',
      environment_design: 'Design an environment that defends their time fiercely — hard boundaries, automated systems, and defaults that eliminate low-value interruptions completely.',
      identity_alignment: 'Cement the identity of someone who treats time as their most valuable asset — how they spend it is the clearest real-time signal of who they truly are.'
    }
  },
  'SUCCESSFUL NEGOTIATOR': {
    label: 'SUCCESSFUL NEGOTIATOR',
    lexicon: ['leverage awareness', 'win-win architecture', 'BATNA clarity', 'value anchoring', 'deal mastery'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a life shaped by deals, agreements, and partnerships that were deliberately structured in their favor through raw skill.',
      compelling_why: 'Frame the emotional fuel as the specific satisfaction of turning every important conversation into a mutual, durable win — negotiation as high artistry.',
      credible_plan: 'Frame the plan as a negotiation preparation system — research, leverage mapping, and walk-away positions clearly defined before every single conversation.',
      feedback_loops: 'Make tracking feel like a negotiation scorecard — terms secured, value created, and deals closed all signaling mastery actively compounding.',
      environment_design: 'Design an environment that supports rigorous preparation and deliberate practice — negotiation excellence is built in rehearsal, never in improvisation.',
      identity_alignment: 'Lock in the identity of a master deal-maker who understands one immovable truth: everything of value in business is ultimately a negotiation.'
    }
  },
  'QUALITY PEOPLE': {
    label: 'QUALITY PEOPLE',
    lexicon: ['talent density', 'A-player network', 'human capital', 'relationship equity', 'elite circle'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a life elevated by extraordinary people who chose to be in their orbit — the company they keep is their destiny.',
      compelling_why: 'Frame the emotional fuel as the conviction that their results are the direct average of their closest relationships — people are the primary investment.',
      credible_plan: 'Frame the plan as a talent and relationship development strategy — specific people to recruit, build, and invest in with complete intentionality.',
      feedback_loops: 'Make tracking feel like a relationship quality audit — is their circle getting consistently stronger, more capable, and more aligned with the mission?',
      environment_design: 'Design an environment that continuously attracts and retains top-tier talent — culture, standards, and energy that A-players actively seek out.',
      identity_alignment: 'Cement the identity of someone who builds powerful teams as their primary act of leadership — their greatest output lives in the people they develop.'
    }
  },
  'EXECUTING CONCEPT': {
    label: 'EXECUTING CONCEPT',
    lexicon: ['concept-to-reality', 'prototype velocity', 'idea shipping', 'launch discipline', 'concept closure'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as the concrete, tangible reality of an idea fully and completely executed — from original vision to product to real-world impact.',
      compelling_why: 'Frame the emotional fuel as the specific satisfaction of closing the loop — ideas that never get launched die slowly inside a mind that deserved better.',
      credible_plan: 'Frame the plan as a concept execution timeline — ideation to prototype to launch with defined gates, deadlines, and accountability at every phase.',
      feedback_loops: 'Make tracking feel like a launch dashboard — is the concept actively moving? What stage is it in? What specific thing is blocking completion right now?',
      environment_design: 'Design an environment for rapid concept execution — minimum approval layers, maximum protected maker time, and zero tolerance for endless ideation.',
      identity_alignment: 'Lock in the identity of a builder who ships — they are known specifically for turning concepts into reality, not for the quality of their unexecuted ideas.'
    }
  },
  'FACILITATOR': {
    label: 'FACILITATOR',
    lexicon: ['group intelligence', 'process design', 'enabling others', 'collaborative output', 'room reading'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a life where their unique ability to unlock collective potential creates outcomes no individual working alone could ever produce.',
      compelling_why: 'Frame the emotional fuel as the specific love of watching a group arrive at a breakthrough they could not see or reach without skilled facilitation.',
      credible_plan: 'Frame the plan as a facilitation and collaboration roadmap — key sessions, critical stakeholder groups, and collective milestones all clearly mapped.',
      feedback_loops: 'Make tracking feel like a group output dashboard — are the people they facilitate producing meaningfully better work because of their direct involvement?',
      environment_design: 'Design an environment that supports and invites collaborative thinking — physical and digital spaces built specifically for genuine co-creation.',
      identity_alignment: 'Cement the identity of someone who multiplies collective human intelligence — their greatest personal wins are always the ones they made possible in others.'
    }
  },
  'OUTSIDE BOX': {
    label: 'OUTSIDE BOX',
    lexicon: ['unconventional thinking', 'creative disruption', 'pattern breaking', 'lateral leap', 'novel approach'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as the life that became fully possible because they refused to play by the unquestioned rules everyone else silently accepted.',
      compelling_why: 'Frame the emotional fuel as the specific thrill of seeing what others cannot — creative thinking is not a style, it is their core competitive advantage.',
      credible_plan: 'Frame the plan as a series of deliberately unconventional moves — approaches others have not tried, angles others have never seriously considered.',
      feedback_loops: 'Make tracking feel like a novelty signal — are they consistently doing things differently? Are the unconventional bets actually paying forward?',
      environment_design: 'Design an environment that continuously feeds creative and lateral thinking — diverse inputs, exposure across different fields, and protected ideation time.',
      identity_alignment: 'Lock in the identity of a creative disruptor — the one who always finds the third door that exists precisely because everyone else was fighting over the first two.'
    }
  },
  'FAIRNESS': {
    label: 'FAIRNESS',
    lexicon: ['principled decisions', 'equitable leadership', 'transparent standards', 'moral clarity', 'trust foundation'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a business and life built on the bedrock of earned trust — where their reputation for fairness is their single greatest asset.',
      compelling_why: 'Frame the emotional fuel as the specific conviction that doing right by people is simultaneously the ethical choice and the superior strategic one.',
      credible_plan: 'Frame the plan as a system of clear, equitable standards — decision frameworks that guarantee consistency and eliminate bias before it can take root.',
      feedback_loops: 'Make tracking feel like a trust audit — are their decisions genuinely perceived as fair? Is their word their absolute bond in every situation?',
      environment_design: 'Design an environment with fully transparent processes and unambiguous expectations — fairness requires purpose-built systems, not only good intentions.',
      identity_alignment: 'Cement the identity of a leader people trust without reservation — fairness is the indestructible foundation every other strength is permanently built upon.'
    }
  },
  'GOOD LISTENER': {
    label: 'GOOD LISTENER',
    lexicon: ['deep presence', 'active absorption', 'silence mastery', 'unfiltered understanding', 'conversational patience'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a life and business built on being the rare person everyone in the room trusts enough to tell the complete truth to.',
      compelling_why: 'Frame the emotional fuel as the specific power of truly hearing people — deep understanding creates loyalty and insight that money can simply never buy.',
      credible_plan: 'Frame the plan as a deliberate listening practice — intentional conversations, dramatically fewer interruptions, deeper questions, and sharper recall of what matters.',
      feedback_loops: 'Make tracking feel like a relationship depth signal — are people opening up more? Are insights sharpening? Is trust visibly growing in every direction?',
      environment_design: 'Design an environment that enables real deep listening — less reactive screen time during conversations, and more genuine presence and full attention.',
      identity_alignment: 'Lock in the identity of the rarest person in any room — the one who actually listens with full presence, and whose quality of listening permanently changes people.'
    }
  },
  'METICULOUS PLANNER': {
    label: 'METICULOUS PLANNER',
    lexicon: ['precision mapping', 'scenario thinking', 'zero ambiguity', 'contingency architecture', 'iron preparation'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a future that was designed in exacting detail, anticipated in full, and executed with almost no unpleasant surprises.',
      compelling_why: 'Frame the emotional fuel as the specific confidence that comes from knowing the plan is absolutely airtight — preparation is their defining superpower.',
      credible_plan: 'Frame the plan as a masterwork of meticulous planning — phases, dependencies, risk maps, and contingencies all documented with exact precision and care.',
      feedback_loops: 'Make tracking feel like plan validation against reality — are events unfolding as designed? Where specifically does the plan require calibration or adjustment?',
      environment_design: 'Design an environment built specifically for deep planning — tools, rituals, and dedicated preparation time before every significant decision or move.',
      identity_alignment: 'Cement the identity of someone who never improvises when preparation was genuinely possible — their meticulous plans are ultimately why they consistently win.'
    }
  },
  'AWARE OF LIMITATIONS': {
    label: 'AWARE OF LIMITATIONS',
    lexicon: ['radical self-honesty', 'growth edge clarity', 'productive humility', 'constraint leverage', 'honest inventory'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as the life of someone who won precisely because they were completely honest about what they were not — and built brilliantly around it.',
      compelling_why: 'Frame the emotional fuel as the specific strength in knowing your own edges — self-awareness is not weakness, it is the sharpest form of strategic clarity.',
      credible_plan: 'Frame the plan as a constraints-first architecture — identify every gap honestly, hire or partner to fill them completely, then execute entirely from personal strength.',
      feedback_loops: 'Make tracking feel like a personal gap analysis — where are the real constraints? Where is delegation urgently needed? What specific capabilities must still grow?',
      environment_design: 'Design an environment that actively compensates for known limitations — deliberate systems and trusted people in place precisely where they are currently weakest.',
      identity_alignment: 'Lock in the identity of someone whose self-awareness is their sharpest competitive edge — they build lasting empires on honest, unshakeable foundations.'
    }
  },
  'BALANCE IN LIFE': {
    label: 'BALANCE IN LIFE',
    lexicon: ['sustainable pace', 'whole-life design', 'energy management', 'intentional recovery', 'integrated success'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a life where business success and genuine richness in relationships, health, and joy are completely unified — never in competition.',
      compelling_why: 'Frame the emotional fuel as the specific love for the full human life — achievement without balance is a hollow win that costs everything that actually matters.',
      credible_plan: 'Frame the plan as a whole-life design — business goals alongside non-negotiable health, relationship, and recovery commitments all living in the same plan.',
      feedback_loops: 'Make tracking feel like a life portfolio review — are all critical dimensions being genuinely invested in, or is one sector quietly burning all the others?',
      environment_design: 'Design an environment that protects balance structurally — work hours with hard, defended stops and recovery time that is genuinely non-negotiable.',
      identity_alignment: 'Cement the identity of someone who defines success as a fully and richly lived life — professional excellence is one vital chapter, not the entire book.'
    }
  },
  'CHARMING': {
    label: 'CHARMING',
    lexicon: ['magnetic presence', 'social intelligence', 'instant rapport', 'likability leverage', 'room command'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a life where doors open effortlessly because people are genuinely drawn to them — charm is their invisible and irreplaceable infrastructure.',
      compelling_why: 'Frame the emotional fuel as the specific joy of human connection — authentic charm is not manipulation, it is the genuine love of people made operational.',
      credible_plan: 'Frame the plan as a relationship-building cadence — key people to connect with, important events to attend, and authentic rapport to build with discipline.',
      feedback_loops: 'Make tracking feel like a network quality signal — are people engaging, referring, and returning? Is every room they enter measurably getting warmer?',
      environment_design: 'Design an environment that consistently puts them in contact with the right people — charm and presence require regular exposure, never prolonged isolation.',
      identity_alignment: 'Lock in the identity of someone who makes every single person they meet feel genuinely important — charisma is not a gift they were given, it is a daily practice.'
    }
  },
  'COMFORTABLE DELEGATING': {
    label: 'COMFORTABLE DELEGATING',
    lexicon: ['trust and release', 'leverage through others', 'ownership transfer', 'accountability architecture', 'force multiplier'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a business that runs and scales freely because they built it to function without them as the operational bottleneck.',
      compelling_why: 'Frame the emotional fuel as the specific freedom of a founder who built a team fully capable of carrying the vision forward without constant supervision.',
      credible_plan: 'Frame the plan as a delegation roadmap — which specific tasks to hand off, to whom exactly, by when precisely, and with what accountability structures in place.',
      feedback_loops: 'Make tracking feel like a leverage dashboard — what percentage of total output is now being generated by capable people they empowered and trusted?',
      environment_design: 'Design an environment with clear ownership structures, documented processes, and the trust architecture that allows real delegation to actually stick.',
      identity_alignment: 'Cement the identity of a multiplier rather than a doer — their highest-value job is to own the outcome with full accountability, not to personally execute the work.'
    }
  },
  'COMPETITIVE': {
    label: 'COMPETITIVE',
    lexicon: ['win orientation', 'score awareness', 'relentless improvement', 'market dominance', 'beat the field'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as the undeniable and fully-earned market position of someone who simply outcompeted everyone else who showed up.',
      compelling_why: 'Frame the emotional fuel as the specific and relentless hunger to be the best — competitiveness is the core engine of their progress, not merely an attitude.',
      credible_plan: 'Frame the plan as a competitive strategy — who they are measuring themselves against, what winning specifically looks like, and precisely how they take the lead.',
      feedback_loops: 'Make tracking feel like a live scoreboard — relative performance signals, market share indicators, and weekly wins that prove they are continuously gaining ground.',
      environment_design: 'Design an environment that actively stokes competitive fire — clear metrics, visible competitors, and a specific score to chase every single day.',
      identity_alignment: 'Lock in the identity of someone who plays entirely to win, never merely to participate — the competitive drive is their most renewable and abundant internal resource.'
    }
  },
  'DETERMINED TO SUCCEED': {
    label: 'DETERMINED TO SUCCEED',
    lexicon: ['unstoppable resolve', 'burn the boats', 'relentless forward motion', 'no alternative', 'unwavering commitment'],
    strategy_rules: {
      vivid_vision: 'Paint the end state with the absolute certainty of someone for whom failure was genuinely never a real option — they simply, relentlessly kept moving forward.',
      compelling_why: 'Frame the emotional fuel as the specific fire that makes quitting feel like a complete betrayal of everything they have ever believed about themselves.',
      credible_plan: 'Frame the plan as a commitment architecture — decisions already finalized, bridges already burned, and every alternative path already deliberately eliminated.',
      feedback_loops: 'Make tracking feel like a resolve signal — is their commitment deepening under pressure or softening when tested? Every obstacle encountered is a direct identity test.',
      environment_design: 'Design an environment that removes every available exit ramp — accountability partners, public commitments, and environments that structurally demand follow-through.',
      identity_alignment: 'Cement the identity of someone for whom giving up simply does not exist as an available option — determination is the load-bearing infrastructure of their entire life.'
    }
  },
  'ORGANIZATIONAL SKILLS': {
    label: 'ORGANIZATIONAL SKILLS',
    lexicon: ['systematic clarity', 'operational order', 'structured thinking', 'clean architecture', 'zero ambiguity'],
    strategy_rules: {
      vivid_vision: 'Paint the end state as a life and business running at peak efficiency because absolutely everything has a system, a place, and a defined process.',
      compelling_why: 'Frame the emotional fuel as the specific peace of a mind that is never searching frantically for what it needs — flawless organization is genuine freedom.',
      credible_plan: 'Frame the plan as a structured operational system — every project, task, and initiative captured, organized, and immediately visible at all times.',
      feedback_loops: 'Make tracking feel like an operational health check — is the system actually working as designed? Is anything of importance falling through the cracks?',
      environment_design: 'Design a physical and digital environment of complete order — everything organized, properly labeled, and immediately findable without friction or search.',
      identity_alignment: 'Lock in the identity of someone whose organizational excellence creates direct competitive advantage — operational clarity is their most underrated leadership edge.'
    }
  }
};

/* ── Helper: look up card from the library ─────────────────────────────── */
function getEntCard(cardName) {
  if (!cardName) return null;
  const key = String(cardName).toUpperCase().trim();
  return ENTREPRENEUR_LIBRARY[key] || null;
}

/* ── Helper: build the Pass 4 strategy-blocks prompt ──────────────────── */
function buildStrategyPrompt(card, dzNames, goal, name) {
  const dzBlock = dzNames.length > 0
    ? `The user has logged these personal danger zones: ${dzNames.join(', ')}. These are real, documented self-sabotage patterns. Weave armor against them naturally inside the relevant blocks — call them out by name without breaking the prose flow.`
    : 'No specific danger zones logged. Write general friction armor appropriate to the goal.';

  const rulesBlock = Object.entries(card.strategy_rules).map(([key, rule]) => {
    const label = key.replace(/_/g, ' ').toUpperCase();
    return `${label}: ${rule}`;
  }).join('\n');

  const system = `You are an elite executive coach writing directly to ${name || 'the entrepreneur'}. You speak in the second person ("You", "Your"). You write in the voice and vocabulary of the "${card.label}" entrepreneur identity. Return only valid JSON — no markdown, no commentary.`;

  const user = `Goal: "${goal}"
Active Entrepreneur Identity Card: ${card.label}
Card Vocabulary — embed these naturally throughout: ${card.lexicon.join(', ')}

${dzBlock}

ABSOLUTE RULES — never break these:
- Every block is ONE single, continuous, unbroken prose paragraph. No bullet points, no numbered lists, no sub-headings, no line breaks within a block.
- Never open with the block name or a generic preamble.
- Never reference external tools, apps, or activities outside this application.
- The closing sentence of every block is short, direct, and launches forward into action.
- Tone: direct mentor — warm but completely unflinching, fully believes in them.

STRATEGIC FRAME FOR EACH BLOCK (apply through the "${card.label}" lens):
${rulesBlock}

Write exactly 6 coaching paragraphs following each block's strategic frame above.

Return this exact JSON:
{
  "strategy_blocks": [
    { "block": "VIVID VISION", "coaching": "..." },
    { "block": "COMPELLING WHY", "coaching": "..." },
    { "block": "CREDIBLE PLAN", "coaching": "..." },
    { "block": "FEEDBACK LOOPS", "coaching": "..." },
    { "block": "ENVIRONMENT DESIGN", "coaching": "..." },
    { "block": "IDENTITY ALIGNMENT", "coaching": "..." }
  ]
}`;

  return { system, user };
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN HANDLER
───────────────────────────────────────────────────────────────────────── */
const { guard } = require('./_guard');

exports.handler = async (event) => {
  const g = await guard(event, { requireAuth: false });
  if (!g.ok) return g.response;
  const headers = g.headers;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { goal, pegboard, entrepreneurCard, dangerZones } = body;
  const apiKey = process.env.OPEN_AI_KEY;

  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };
  }
  if (!goal) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'goal is required' }) };
  }

  const name          = pegboard?.['pb-name']     || 'the user';
  const beliefRaw     = pegboard?.['pb-beliefs']  || '';
  const mission       = pegboard?.['pb-mission']  || '';
  const values        = pegboard?.['pb-values']   || '';
  const beliefSystem  = detectBeliefSystem(beliefRaw);

  const card    = getEntCard(entrepreneurCard);
  const dzList  = Array.isArray(dangerZones) ? dangerZones : [];
  const dzNames = dzList.map(z => (typeof z === 'string' ? z : z?.title)).filter(Boolean);

  try {
    // ── PASS 1: Achiever Wisdom ──────────────────────────────
    const pass1Result = await callOpenAI(apiKey, {
      system: 'You are a world-class research analyst specializing in high-achievement psychology. Return only valid JSON — no markdown, no commentary.',
      user: `Goal: "${goal}"

Identify 3 famous achievers (historical or contemporary) who accomplished something in this exact domain. For each, extract the core identity belief that drove their success, their key system or strategy, and one powerful guiding principle.

Return this exact JSON structure:
{
  "achievers": [
    {
      "name": "Full Name",
      "domain": "their field of achievement",
      "identity_belief": "The core belief they held about themselves",
      "strategy": "Their primary system or method",
      "principle": "One direct principle or quote"
    }
  ]
}`
    });

    let achievers = [];
    try { achievers = JSON.parse(pass1Result).achievers || []; } catch {}

    // ── PASS 2: Sequential Roadmap ───────────────────────────
    const pass2Result = await callOpenAI(apiKey, {
      system: 'You are a precision performance coach who builds measurable, sequential action systems. Return only valid JSON — no markdown, no commentary.',
      user: `Goal: "${goal}"
Name: ${name}
Mission context: "${mission}"
Values: "${values}"

Achiever wisdom foundation:
${JSON.stringify(achievers, null, 2)}

Create a measurable 12-week sequential roadmap. Organize into 3 phases:
- Phase 1 (Weeks 1-4): Foundation & Identity Shift
- Phase 2 (Weeks 5-8): System Build & Momentum
- Phase 3 (Weeks 9-12): Acceleration & Lock-in

Each week needs: a focus theme, one daily action (under 20 words), and one measurable weekly milestone.

Return this exact JSON structure:
{
  "roadmap": {
    "phase1": { "theme": "...", "weeks": [{ "week": 1, "focus": "...", "daily_action": "...", "milestone": "..." }] },
    "phase2": { "theme": "...", "weeks": [...] },
    "phase3": { "theme": "...", "weeks": [...] }
  }
}`
    });

    let roadmap = {};
    try { roadmap = JSON.parse(pass2Result).roadmap || {}; } catch {}

    // ── PASS 3 & 4 run in parallel ───────────────────────────
    // Pass 3: Belief Rewrite → 13 Affirmations + Script
    // Pass 4: Entrepreneur Card Strategy Blocks (only if a valid card is active)
    const pass3Promise = callOpenAI(apiKey, {
      system: `You are a master manifestation architect who speaks directly to the subconscious mind. You write in ${beliefSystem.voice}. Return only valid JSON — no markdown, no commentary.`,
      user: `Goal: "${goal}"
Name: ${name}
Belief system: ${beliefSystem.label} (${beliefSystem.description})
Mission: "${mission}"
Values: "${values}"

Achiever wisdom:
${JSON.stringify(achievers, null, 2)}

12-week roadmap:
${JSON.stringify(roadmap, null, 2)}

Using EVERYTHING above, generate:

1. Exactly 13 "I AM" affirmations — one per visualization scene. Each must:
   - Begin with "I AM"
   - Be written in present tense as if already achieved
   - Be 8-15 words long
   - Escalate in power from scene 1 (grounding) to scene 13 (peak identity)
   - Reflect the ${beliefSystem.label} worldview

2. Exactly 3 mental attitudes — the psychological stances ${name} must adopt. Each must:
   - Have a short label (2-4 words)
   - Have a one-sentence description explaining why this attitude drives the goal
   - Be grounded in the achiever wisdom above

3. Exactly 5 active beliefs — short, declarative present-tense statements (not "I AM") that rewire the self-concept. Each must:
   - Be 8-16 words
   - Feel like an undeniable truth, not a wish
   - Reflect the ${beliefSystem.label} worldview

4. A 10-minute spoken visualization script for ${name} that:
   - Opens with a 60-second breathing/grounding sequence
   - Walks through the achievement as if it's already real
   - Weaves in 2-3 of the achiever principles naturally
   - References the roadmap milestones as already completed memories
   - Closes with an identity lock-in statement
   - Is written in second person ("You are...", "You feel...")
   - Flows at speaking pace for exactly 10 minutes (~1400 words)

Return this exact JSON structure:
{
  "affirmations": [
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ..."
  ],
  "mental_attitudes": [
    { "label": "short label", "description": "one sentence" },
    { "label": "short label", "description": "one sentence" },
    { "label": "short label", "description": "one sentence" }
  ],
  "active_beliefs": [
    "declarative belief statement",
    "declarative belief statement",
    "declarative belief statement",
    "declarative belief statement",
    "declarative belief statement"
  ],
  "script": "Full 10-minute script here..."
}`
    }, 4096);

    const pass4Promise = card
      ? callOpenAI(apiKey, buildStrategyPrompt(card, dzNames, goal, name), 3000)
      : Promise.resolve(null);

    const [pass3Result, pass4Result] = await Promise.all([pass3Promise, pass4Promise]);

    let affirmations = [];
    let mental_attitudes = [];
    let active_beliefs = [];
    let script = '';
    try {
      const parsed = JSON.parse(pass3Result);
      affirmations     = parsed.affirmations     || [];
      mental_attitudes = parsed.mental_attitudes || [];
      active_beliefs   = parsed.active_beliefs   || [];
      script           = parsed.script           || '';
    } catch {}

    // Pad or trim affirmations to exactly 13
    while (affirmations.length < 13) affirmations.push(`I AM aligned with my highest purpose.`);
    affirmations = affirmations.slice(0, 13);

    let strategy_blocks = [];
    if (pass4Result) {
      try { strategy_blocks = JSON.parse(pass4Result).strategy_blocks || []; } catch {}
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        affirmations,
        mental_attitudes,
        active_beliefs,
        script,
        achievers,
        roadmap,
        strategy_blocks,
        entrepreneur_card: card ? card.label : null,
        belief_system: beliefSystem.label,
        goal,
        generated_at: new Date().toISOString()
      })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

/* ── Belief system detector ──────────────────────────────── */
function detectBeliefSystem(beliefsText) {
  const t = (beliefsText || '').toLowerCase();

  if (/universe|law of attraction|manifestation|vibration|energy|quantum/i.test(t)) {
    return {
      label: 'Universe / Law of Attraction',
      description: 'belief that thoughts and energy attract matching reality',
      voice: 'the language of universal law, vibrational alignment, and co-creation'
    };
  }
  if (/god|jesus|christ|faith|prayer|scripture|bible|spiritual|holy/i.test(t)) {
    return {
      label: 'Faith / God',
      description: 'belief that purpose is divinely ordained and prayer activates destiny',
      voice: 'the language of faith, divine purpose, and spiritual authority'
    };
  }
  if (/science|neuro|brain|psychology|habit|system|evidence|research|data/i.test(t)) {
    return {
      label: 'Science / Neuroscience',
      description: 'belief that identity change is neurological and measurable',
      voice: 'the language of neuroscience, habit formation, and cognitive identity'
    };
  }
  if (/stoic|stoicism|discipline|control|virtue|marcus|epictetus/i.test(t)) {
    return {
      label: 'Stoicism / Philosophy',
      description: 'belief that virtue and disciplined action determine outcome',
      voice: 'the language of stoic philosophy, disciplined will, and virtue'
    };
  }

  return {
    label: 'Universal Principles',
    description: 'belief in the power of focused intention and consistent action',
    voice: 'direct, conviction-based language that speaks to identity and potential'
  };
}

/* ── OpenAI API caller (gpt-4o-mini, JSON mode) ─────────────────────── */
async function callOpenAI(apiKey, { system, user }, maxTokens = 2048) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}
