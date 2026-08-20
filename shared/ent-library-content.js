/* ── ENTREPRENEUR LIBRARY — fixed, community-shared card content ──────────────
   The first Identity Library. Content here is AI-authored ONCE and FROZEN: every
   Cosmic member sees the SAME affirmations, beliefs, roadmap and directive per
   card, so the community has common reference points to discuss in the forum.
   (NOT per-user, NOT regenerated at runtime.)

   Card order + labels mirror netlify/functions/_entrepreneur-library.js. */

export const ENT_CARD_TYPE = 'ENTREPRENEUR LIBRARY';

export const ENT_CARDS = [
  { n: 1, key: 'DISCIPLINED', title: 'I AM DISCIPLINED',
    directive: 'Discipline is not what you do — it is who you are. Never negotiate with discomfort; run the protocol.',
    affirmations: ['I am disciplined. My routine is non-negotiable.', 'I keep my promises to myself first.', 'Consistency is my compound interest.', 'I do the work whether I feel like it or not.', 'Zero exceptions, zero excuses.'],
    beliefs: ['Discipline is freedom, not restriction.', 'Every streak day is proof of who I am becoming.', 'Motivation is optional; the protocol is not.', 'I never negotiate with discomfort.'],
    roadmap: ['Define three daily non-negotiables and lock the times.', 'Track each day as a streak — never miss twice.', 'Remove one friction point that keeps becoming an excuse.', 'Prep tomorrow’s first task the night before.', 'Review the streak weekly as your scoreboard.', 'Add a new non-negotiable only after 30 clean days.'],
    resources: {
      youtube:  [{ label: 'Jocko Willink — Discipline', url: 'https://www.youtube.com/@JockoPodcastOfficial' }, { label: 'Huberman Lab — Discipline', url: 'https://www.youtube.com/@hubermanlab' }],
      podcasts: [{ label: 'The Jocko Podcast', url: 'https://jockopodcast.com' }, { label: 'Huberman Lab', url: 'https://www.hubermanlab.com/podcast' }],
      articles: [{ label: 'James Clear — Habits', url: 'https://jamesclear.com/articles' }, { label: 'Farnam Street', url: 'https://fs.blog' }],
    } },

  { n: 2, key: 'RISK TAKER', title: 'I AM A RISK TAKER',
    directive: 'Staying safe is the real risk. Make the calculated bet before the crowd can see it.',
    affirmations: ['I am a risk taker. I move when others hesitate.', 'I make calculated bets with a capped downside.', 'I run toward asymmetric upside.', 'Fear is a signal I am near the edge that matters.', 'I would rather act and adjust than wait and wonder.'],
    beliefs: ['The biggest risk is standing still.', 'Every bold move has a defined downside and unlimited upside.', 'Courage is a muscle I train daily.', 'First movers earn the asymmetric reward.'],
    roadmap: ['Name one bold move you have been avoiding.', 'Define its worst realistic downside — then cap it.', 'Take the smallest real version of the bet this week.', 'Log what you learned, not just what happened.', 'Increase the bet size as conviction grows.', 'Review your bets monthly for the asymmetric winners.'] },

  { n: 3, key: 'STRATEGIC THINKER', title: 'I AM A STRATEGIC THINKER',
    directive: 'See what others miss and move before the crowd catches up. That gap is your edge.',
    affirmations: ['I am a strategic thinker. I play ten moves ahead.', 'I find the leverage point in every situation.', 'I think in second-order effects.', 'I build moats, not just moments.', 'I win the long game on purpose.'],
    beliefs: ['Strategy beats effort when effort has no direction.', 'The best move is often the one no one else sees.', 'Leverage multiplies everything I touch.', 'Thinking time is the highest-paid work I do.'],
    roadmap: ['Write the ten-move sequence toward your goal.', 'Identify the single highest-leverage point in it.', 'Map the second-order effects of your next big decision.', 'Protect one weekly block for pure strategic thinking.', 'Name your competitive moat and deepen it.', 'Review the plan monthly against how the field is moving.'] },

  { n: 4, key: 'EXECUTING STRATEGY', title: 'I EXECUTE STRATEGY',
    directive: 'A great strategy dies in a meeting room without follow-through. Deploy it — owner, deadline, metric.',
    affirmations: ['I execute strategy with ruthless precision.', 'Every initiative has an owner, a deadline, and a metric.', 'I close the gap between vision and reality.', 'I never let a great plan die unused.', 'Green light or red light — nothing ambiguous.'],
    beliefs: ['Execution is the strategy people actually see.', 'Vision without follow-through is just a wish.', 'What gets a deadline gets done.', 'Discipline in deployment is my edge.'],
    roadmap: ['Turn your strategy into a list of owned initiatives.', 'Give each one an owner, a deadline, and a metric.', 'Kill or park anything without a clear next action.', 'Run a weekly execution review — green/red only.', 'Remove one bottleneck slowing deployment.', 'Ship the smallest complete version before adding scope.'] },

  { n: 5, key: 'SELF CONFIDENT', title: 'I AM SELF-CONFIDENT',
    directive: 'Your confidence is internally sourced. Move without waiting for permission — the proof arrives after the step, never before it.',
    affirmations: ['I am self-confident. My certainty is earned, not borrowed.', 'I trust myself to figure it out as I go.', 'I do not need anyone’s permission to move.', 'My confidence is the signal, not the noise.', 'I was built for exactly this.'],
    beliefs: ['Confidence is a decision I make daily, not a feeling I wait for.', 'Every win is confirmation of what I already knew about myself.', 'Doubt is a visitor, not a resident.', 'I act first; the evidence follows.'],
    roadmap: ['Name one thing today you’ll do without asking permission.', 'Start a daily proof log — one line of evidence you’re capable.', 'Take the step before you feel ready; ready comes after.', 'Replace “I hope” with “I know” when you speak about your goals.', 'Surround your space with visible evidence of past wins.', 'Review the proof log weekly and watch the certainty compound.'],
    resources: {
      youtube:  [{ label: 'Mel Robbins — Confidence', url: 'https://www.youtube.com/@melrobbins' }, { label: 'TED — Self-confidence talks', url: 'https://www.youtube.com/@TED' }],
      podcasts: [{ label: 'The Mel Robbins Podcast', url: 'https://www.melrobbins.com/podcast' }, { label: 'The Tony Robbins Podcast', url: 'https://www.tonyrobbins.com/podcasts' }],
      articles: [{ label: 'Psychology Today — Confidence', url: 'https://www.psychologytoday.com/us/basics/confidence' }, { label: 'James Clear — Self-belief', url: 'https://jamesclear.com/articles' }],
    } },

  { n: 6, key: 'PASSIONATE', title: 'I AM PASSIONATE',
    directive: 'Your passion is the one ingredient no competitor can replicate. Reignite the why every single day.',
    affirmations: ['I am passionate. My fire fuels the work.', 'I love this enough to make quitting unthinkable.', 'My obsession is my superpower.', 'I bring my whole heart to the goal.', 'Every milestone deepens the fire.'],
    beliefs: ['Passion outlasts talent when the work gets hard.', 'My why is the fuel; the plan is just the engine.', 'Obsession is a gift, not a flaw.', 'People follow energy, and I have it.'],
    roadmap: ['Write, in one sentence, why this work matters to you.', 'Put that sentence where you’ll see it every morning.', 'Do the part you love most first, to prime the day.', 'Cut one obligation that drains your fire.', 'Share your why out loud with one person this week.', 'Revisit the why whenever motivation dips — then act.'] },

  { n: 7, key: 'PROFITABLE', title: 'I AM PROFITABLE',
    directive: 'Profit is freedom, not greed. Think in margins and cash flow, not just passion.',
    affirmations: ['I am profitable. I build an economic engine.', 'I think in revenue, margin, and cash flow.', 'Financial strength is my responsibility.', 'Every decision moves a number I can name.', 'I create real value and capture a fair share of it.'],
    beliefs: ['Profit is the oxygen that keeps the mission alive.', 'A business that doesn’t make money is a hobby.', 'Margins reveal the truth of the model.', 'Money follows value I actually create.'],
    roadmap: ['Write down your top revenue stream and its margin.', 'Identify one lever that improves margin this month.', 'Track cash flow weekly, not just at month end.', 'Cut one cost that isn’t creating value.', 'Raise price or value on your best offer.', 'Review a simple P&L every week as your dashboard.'] },

  { n: 8, key: 'GREAT SALES PERSON', title: 'I AM A GREAT SALESPERSON',
    directive: 'The greatest salespeople are the most genuinely helpful people. Serve through selling.',
    affirmations: ['I am a great salesperson. I sell by serving.', 'I turn objections into understanding.', 'I build trust before I ask for anything.', 'I love helping people make a decision that changes their life.', 'My pipeline is a discipline, not a hope.'],
    beliefs: ['Selling is helping someone decide.', 'People buy trust before they buy the product.', 'Every no gets me closer to the right yes.', 'Follow-up is where most deals are won.'],
    roadmap: ['Write the value narrative for your offer in three lines.', 'List your top three objections and a helpful response to each.', 'Define your pipeline stages and a follow-up rule.', 'Reach out to three of the right people today.', 'Ask for the decision clearly, without apology.', 'Review conversion weekly and fix the leakiest stage.'] },

  { n: 9, key: 'SKILLFUL COMMUNICATOR', title: 'I AM A SKILLFUL COMMUNICATOR',
    directive: 'Your words move people. Make the message land — clarity is a leadership instrument.',
    affirmations: ['I am a skillful communicator. My words carry weight.', 'I make people feel genuinely heard.', 'I say the true thing simply.', 'I frame the message so it lands.', 'I listen more than I speak.'],
    beliefs: ['Clarity is kindness.', 'The message is only as good as what the listener receives.', 'Precision in language creates precision in action.', 'Great communicators are great listeners first.'],
    roadmap: ['Write your core message in one clear sentence.', 'Cut every word the listener doesn’t need.', 'Ask one clarifying question before you respond today.', 'Practice active listening in your next conversation.', 'Get feedback: did the message land as intended?', 'Write for ten minutes daily to sharpen the instrument.'] },

  { n: 10, key: 'EMPATHETIC', title: 'I AM EMPATHETIC',
    directive: 'Empathy is not a soft skill — it is your sharpest edge. Understand the human first.',
    affirmations: ['I am empathetic. I lead with understanding.', 'I listen to understand, not to reply.', 'I win through connection, not force.', 'I see the human behind the request.', 'People open up to me because they feel safe.'],
    beliefs: ['Understanding people is my sharpest edge.', 'Trust is built one genuine moment at a time.', 'People remember how I made them feel.', 'Empathy converts to loyalty and insight.'],
    roadmap: ['In your next talk, restate the other person’s point first.', 'Ask “what’s hard about this for you?” and wait.', 'Notice one unspoken need this week and meet it.', 'Reduce reactive noise so you can be present.', 'Follow up on something personal someone shared.', 'Review your key relationships — are they deepening?'] },

  { n: 11, key: 'STRONG WORK ETHIC', title: 'I HAVE A STRONG WORK ETHIC',
    directive: 'Effort is your differentiator. Show up every single day — especially when no one is watching.',
    affirmations: ['I have a strong work ethic. I outwork the field.', 'I put in the hours when no one is watching.', 'I show up daily, no exceptions.', 'My effort is my signature.', 'I turn hours in the dark into results in the light.'],
    beliefs: ['Nobody outworks me and keeps my standards.', 'Effort compounds silently, then all at once.', 'The work is the meditation.', 'Consistency beats intensity over time.'],
    roadmap: ['Set a daily minimum output you never skip.', 'Protect a deep-work window and defend it fiercely.', 'Log hours invested and output produced daily.', 'Remove one distraction from your workspace.', 'Do the hardest task first, before the noise starts.', 'Review the week: did effort match ambition?'] },

  { n: 12, key: 'SELF STARTER', title: 'I AM A SELF-STARTER',
    directive: 'You are always the spark, never waiting to be ignited. Move before permission arrives.',
    affirmations: ['I am a self-starter. I create my own momentum.', 'I never wait for perfect conditions.', 'I have a bias to action.', 'I begin before I feel ready.', 'I generate momentum from nothing.'],
    beliefs: ['Permission is overrated; initiative is everything.', 'Motion creates clarity that thinking alone can’t.', 'I don’t wait to be picked — I start.', 'The first step is always mine to take.'],
    roadmap: ['Pick the thing you’re waiting on and start it today.', 'Take one action before you have full clarity.', 'Remove one approval loop you don’t actually need.', 'Set your own deadline and make it public.', 'Ship a rough first version this week.', 'Review: where are you still waiting to be told?'] },

  { n: 13, key: 'SELF PROMOTER', title: 'I PROMOTE MYSELF BOLDLY',
    directive: 'Bold self-promotion is service, not ego. Your work deserves to be seen.',
    affirmations: ['I promote myself boldly. My work deserves to be seen.', 'Visibility is my opportunity engine.', 'I own my narrative.', 'I show up consistently where it matters.', 'Being seen is not ego — it is service.'],
    beliefs: ['Invisibility is the only real failure.', 'If I don’t tell the story, no one will.', 'Consistency of presence builds authority.', 'The right people can’t choose me if they can’t see me.'],
    roadmap: ['Choose one platform and a realistic posting cadence.', 'Share one win or lesson publicly this week.', 'Write your one-line story of what you do and for whom.', 'Reach out to one person who should know your work.', 'Repurpose your best idea into three formats.', 'Track reach and inbound — double down on what works.'] },

  { n: 14, key: 'RESPECTED MANAGER', title: 'I AM A RESPECTED MANAGER',
    directive: 'You earn respect through consistency and the relentless development of your people.',
    affirmations: ['I am a respected manager. I multiply my people.', 'I set clear standards and hold them fairly.', 'My impact lives inside other people’s growth.', 'I build culture on purpose.', 'I lead by embodying what I ask for.'],
    beliefs: ['Respect is earned through consistency, not title.', 'My job is to grow people, not just tasks.', 'Culture is what I tolerate and reward.', 'A great manager makes themselves replaceable.'],
    roadmap: ['Define three clear standards for your team.', 'Give one person specific, developmental feedback this week.', 'Establish a simple weekly team rhythm.', 'Model the behavior you want to see, publicly.', 'Remove one obstacle blocking your team’s output.', 'Review morale and output monthly, honestly.'] },

  { n: 15, key: 'LIVING THE BRAND', title: 'I AM LIVING THE BRAND',
    directive: 'People follow the living proof of what you sell. Close the gap between brand and reality to zero.',
    affirmations: ['I am living the brand. I am the proof.', 'Who I am and what I represent are the same.', 'My private standards match my public promise.', 'I don’t perform the brand — I live it.', 'Authenticity is my competitive advantage.'],
    beliefs: ['People follow living proof, not marketing.', 'The brand is my daily behavior, not my logo.', 'Integrity is doing it when no one checks.', 'Alignment builds trust that ads can’t buy.'],
    roadmap: ['Write your brand promise in one sentence.', 'List three daily behaviors that prove it.', 'Find one place your actions contradict the promise — fix it.', 'Align your environment with what you represent.', 'Audit your public presence for consistency.', 'Review weekly: did my actions match my message?'] },

  { n: 16, key: 'MANAGING TIME WISELY', title: 'I MANAGE TIME WISELY',
    directive: 'How you spend time is the clearest signal of who you are. Invest every hour; never spend it.',
    affirmations: ['I manage time wisely. Every hour is invested.', 'I protect my highest-leverage work.', 'My calendar reflects my priorities.', 'I say no to guard my yes.', 'Time is my most valuable asset.'],
    beliefs: ['Time is the only resource I can never recover.', 'What’s on my calendar is what I actually value.', 'Busy is not the same as productive.', 'Ruthless prioritization is self-respect.'],
    roadmap: ['Name your three highest-leverage activities.', 'Time-block them into your week first, before anything else.', 'Audit yesterday: where did the hours actually go?', 'Cut or delegate one low-value recurring task.', 'Set hard boundaries around deep-work windows.', 'Review the calendar weekly against your priorities.'] },

  { n: 17, key: 'SUCCESSFUL NEGOTIATOR', title: 'I AM A SUCCESSFUL NEGOTIATOR',
    directive: 'Everything of value is a negotiation. Prepare, anchor on value, and know your walk-away.',
    affirmations: ['I am a successful negotiator. I create durable wins.', 'I prepare before every important conversation.', 'I know my walk-away and honor it.', 'I anchor on value, not price.', 'I turn conversations into mutual wins.'],
    beliefs: ['Everything of value is ultimately a negotiation.', 'Preparation beats improvisation every time.', 'Leverage comes from options, so I build them.', 'The best deals are durable, not just favorable.'],
    roadmap: ['Before your next deal, research the other side’s interests.', 'Define your BATNA — your best alternative.', 'Decide your walk-away number in advance.', 'Anchor the conversation on value delivered.', 'Aim for a win the other side will keep honoring.', 'Debrief each negotiation: what would you do differently?'] },

  { n: 18, key: 'QUALITY PEOPLE', title: 'I ATTRACT QUALITY PEOPLE',
    directive: 'Your results are the average of your closest relationships. Invest in the circle.',
    affirmations: ['I attract quality people. My circle is my destiny.', 'I invest in relationships intentionally.', 'I raise the standard of every room I enter.', 'A-players want to be in my orbit.', 'My greatest output is the people I develop.'],
    beliefs: ['I am the average of my closest relationships.', 'Talent density beats individual brilliance.', 'Relationships are an investment, not a transaction.', 'Great people are drawn to clear standards.'],
    roadmap: ['List the five people you spend the most time with.', 'Identify one A-player to build a relationship with.', 'Give value to someone in your circle this week.', 'Raise your own standard so you attract higher standards.', 'Have one honest, deepening conversation.', 'Review your circle monthly — is it getting stronger?'] },

  { n: 19, key: 'EXECUTING CONCEPT', title: 'I EXECUTE MY CONCEPTS',
    directive: 'Ideas that never launch die slowly. You are known for what you ship, not what you imagine.',
    affirmations: ['I execute my concepts. I ship what I imagine.', 'I close the loop from idea to reality.', 'I prototype fast and launch on time.', 'A launched idea beats a perfect one.', 'I am known for shipping.'],
    beliefs: ['An unexecuted idea is worth nothing.', 'Shipping teaches what planning can’t.', 'Done and improving beats perfect and stuck.', 'The world rewards builders, not dreamers.'],
    roadmap: ['Pick one concept and define “launched” for it.', 'Break it into ideation → prototype → launch gates.', 'Set a deadline for the first shippable version.', 'Remove the biggest blocker to completion.', 'Ship the minimum complete version this month.', 'Review: what stops your ideas from reaching launch?'] },

  { n: 20, key: 'FACILITATOR', title: 'I AM A FACILITATOR',
    directive: 'You unlock outcomes no individual could reach alone. Multiply the room’s intelligence.',
    affirmations: ['I am a facilitator. I unlock collective genius.', 'I design the process, and the group produces.', 'I read the room and guide it forward.', 'My wins are the breakthroughs I make possible in others.', 'I turn conversation into collaboration.'],
    beliefs: ['A group can see what no individual can.', 'Good process beats good luck.', 'My job is to enable, not to dominate.', 'The best facilitation feels effortless to the group.'],
    roadmap: ['Design your next meeting around a single outcome.', 'Prepare three questions that move the group forward.', 'Talk less; draw out the quiet voices.', 'Capture decisions and owners in real time.', 'End every session with a clear next step.', 'Ask the group how to make the process better.'] },

  { n: 21, key: 'OUTSIDE BOX', title: 'I THINK OUTSIDE THE BOX',
    directive: 'Find the third door — it exists precisely because everyone else is fighting over the first two.',
    affirmations: ['I think outside the box. I find the third door.', 'I break patterns others accept without question.', 'I see angles others miss.', 'Unconventional is my advantage.', 'I feed my mind diverse inputs.'],
    beliefs: ['The rules everyone accepts are usually just assumptions.', 'Creativity is a competitive advantage, not a style.', 'The best idea is often the one no one tried.', 'Different inputs create different outputs.'],
    roadmap: ['Question one “rule” in your field this week.', 'Brainstorm ten approaches before choosing one.', 'Borrow a solution from a completely different field.', 'Protect time for undirected idea generation.', 'Test one unconventional approach in the real world.', 'Track which novel bets actually pay off.'] },

  { n: 22, key: 'FAIRNESS', title: 'I LEAD WITH FAIRNESS',
    directive: 'Doing right by people is both the ethical choice and the superior strategy. Fairness is your foundation.',
    affirmations: ['I lead with fairness. My word is my bond.', 'I make principled decisions, consistently.', 'I hold clear, transparent standards.', 'People trust me without reservation.', 'Fairness is my foundation, not my constraint.'],
    beliefs: ['Trust is my greatest business asset.', 'Doing right by people is also the smart play.', 'Consistency removes bias before it takes root.', 'A fair reputation compounds for a lifetime.'],
    roadmap: ['Write the principles behind your key decisions.', 'Apply the same standard to everyone this week.', 'Make one process more transparent.', 'Keep every small promise you make.', 'Address one unfairness you’ve been ignoring.', 'Ask: are my decisions perceived as fair?'] },

  { n: 23, key: 'GOOD LISTENER', title: 'I AM A GOOD LISTENER',
    directive: 'Be the rare person others trust enough to tell the whole truth. Listening changes people.',
    affirmations: ['I am a good listener. I hear the whole truth.', 'I listen without rushing to reply.', 'I ask deeper questions.', 'People feel fully heard with me.', 'Silence is a tool I use well.'],
    beliefs: ['Deep listening earns trust money can’t buy.', 'Most people wait to talk; I choose to hear.', 'The best insight comes after the pause.', 'Understanding precedes influence.'],
    roadmap: ['In your next talk, don’t interrupt once.', 'Ask one follow-up question before responding.', 'Put the screen away during conversations.', 'Summarize what you heard before you reply.', 'Notice what someone didn’t say, and ask about it.', 'Review: are people opening up more to you?'] },

  { n: 24, key: 'METICULOUS PLANNER', title: 'I AM A METICULOUS PLANNER',
    directive: 'Never improvise when preparation was possible. Your airtight plans are why you win.',
    affirmations: ['I am a meticulous planner. My plans are airtight.', 'I anticipate what others overlook.', 'I map phases, dependencies, and contingencies.', 'Preparation is my superpower.', 'I leave almost nothing to surprise.'],
    beliefs: ['Preparation is where victories are actually won.', 'A clear plan removes fear and friction.', 'Contingencies turn surprises into checklists.', 'Detail today prevents disaster tomorrow.'],
    roadmap: ['Break your goal into phases and dependencies.', 'For each phase, write one thing that could go wrong.', 'Prepare a contingency for the top two risks.', 'Document the plan so anyone could follow it.', 'Schedule a weekly plan-vs-reality check.', 'Adjust the plan the moment reality diverges.'] },

  { n: 25, key: 'AWARE OF LIMITATIONS', title: 'I AM AWARE OF MY LIMITATIONS',
    directive: 'Self-awareness is your sharpest edge. Be honest about your gaps and build brilliantly around them.',
    affirmations: ['I am aware of my limitations. I build around them.', 'I am radically honest about my gaps.', 'I hire and partner where I’m weakest.', 'I execute from my strengths.', 'Knowing my edges is strategic clarity.'],
    beliefs: ['Self-awareness is strength, not weakness.', 'The best founders build around honest constraints.', 'I don’t have to be great at everything.', 'Delegation begins with knowing what to delegate.'],
    roadmap: ['Write an honest inventory of your strengths and gaps.', 'Pick the biggest gap and name who fills it.', 'Delegate or partner on one thing you shouldn’t be doing.', 'Double down on the one thing only you can do.', 'Ask a trusted person for a blind-spot check.', 'Revisit the inventory quarterly as you grow.'] },

  { n: 26, key: 'BALANCE IN LIFE', title: 'I HAVE BALANCE IN LIFE',
    directive: 'Achievement without balance is a hollow win. Define success as a full, richly lived life.',
    affirmations: ['I have balance in life. Success is fully lived, not just achieved.', 'I protect health, relationships, and recovery.', 'I work hard and rest on purpose.', 'One area never burns the others.', 'I win the whole life, not just the work.'],
    beliefs: ['Balance is sustainable performance.', 'Rest is part of the work, not the enemy of it.', 'A hollow win costs everything that matters.', 'Energy managed beats hours maximized.'],
    roadmap: ['List the life areas that matter beyond work.', 'Put one non-negotiable for health into your week.', 'Set a hard stop time for work and honor it.', 'Schedule real recovery, not just collapse.', 'Protect one relationship with dedicated time.', 'Review weekly: is any area quietly burning the rest?'] },

  { n: 27, key: 'CHARMING', title: 'I AM CHARMING',
    directive: 'Charm is not manipulation — it is the genuine love of people made operational. Make everyone feel important.',
    affirmations: ['I am charming. People are drawn to me.', 'I make everyone I meet feel important.', 'I build rapport quickly and genuinely.', 'My presence warms the room.', 'Charm is a daily practice for me.'],
    beliefs: ['Genuine interest in people is magnetic.', 'Charm opens doors that credentials can’t.', 'People help those they like and trust.', 'Warmth is a skill I can grow.'],
    roadmap: ['Learn and use one person’s name today, warmly.', 'Ask a genuine question and truly listen to the answer.', 'Give one specific, honest compliment this week.', 'Put yourself in one new room of the right people.', 'Follow up with someone you connected with.', 'Notice which rooms get warmer when you enter.'] },

  { n: 28, key: 'COMFORTABLE DELEGATING', title: 'I AM COMFORTABLE DELEGATING',
    directive: 'Your highest-value job is to own the outcome, not to personally execute the work. Trust and release.',
    affirmations: ['I am comfortable delegating. I multiply through others.', 'I own the outcome, not every task.', 'I trust capable people and release control.', 'I build a business that runs without me.', 'Leverage through others is real leverage.'],
    beliefs: ['I am a multiplier, not a bottleneck.', 'Doing it all myself caps the whole business.', 'Clear ownership makes delegation stick.', 'Trust, given well, is repaid with capability.'],
    roadmap: ['List tasks only you can do — and everything else.', 'Hand off one “everything else” task this week.', 'Document the process so it transfers cleanly.', 'Define the outcome and the deadline, then step back.', 'Resist re-taking the task when it’s uncomfortable.', 'Track how much output now comes from your team.'] },

  { n: 29, key: 'COMPETITIVE', title: 'I AM COMPETITIVE',
    directive: 'Play to win, not just to participate. The drive to be the best is your most renewable resource.',
    affirmations: ['I am competitive. I play to win.', 'I know the score and I chase it.', 'I improve relentlessly.', 'I measure myself against the best.', 'The drive to win is my renewable fuel.'],
    beliefs: ['Competition sharpens me.', 'What gets measured gets won.', 'Second place is just first loser to the version of me I’m building.', 'Relentless improvement compounds into dominance.'],
    roadmap: ['Define what winning specifically looks like this quarter.', 'Pick a benchmark or rival to measure against.', 'Track a weekly score you can’t argue with.', 'Improve one metric by 1% every week.', 'Study the best in your field and steal what works.', 'Review the scoreboard weekly and adjust.'] },

  { n: 30, key: 'DETERMINED TO SUCCEED', title: 'I AM DETERMINED TO SUCCEED',
    directive: 'Failure is not an option on the table. Burn the boats and keep moving forward.',
    affirmations: ['I am determined to succeed. Quitting is not an option.', 'I keep moving forward, always.', 'Obstacles are identity tests I pass.', 'My commitment deepens under pressure.', 'I have already decided.'],
    beliefs: ['Determination is the load-bearing wall of my life.', 'Pressure reveals commitment; mine grows.', 'I don’t need a plan B that tempts me to quit.', 'The finish line is not optional.'],
    roadmap: ['Make one decision final — remove the exit ramp.', 'Tell one person your commitment out loud.', 'Define the next obstacle and your response to it.', 'When tested this week, choose forward.', 'Remove one temptation that pulls you off course.', 'Review: is your commitment deepening or softening?'] },

  { n: 31, key: 'ORGANIZATIONAL SKILLS', title: 'I HAVE STRONG ORGANIZATIONAL SKILLS',
    directive: 'Operational clarity is your most underrated edge. Everything has a system, a place, and a process.',
    affirmations: ['I have strong organizational skills. Everything has a system.', 'Nothing important falls through the cracks.', 'My mind is clear because my systems are clean.', 'I turn chaos into order.', 'Structure sets me free.'],
    beliefs: ['Organization is a competitive advantage.', 'A clear system is freedom, not bureaucracy.', 'What’s captured gets done.', 'Order compounds into speed.'],
    roadmap: ['Choose one system to capture every task and idea.', 'Do a full brain-dump into that system today.', 'Give every project one clear next action.', 'Set a weekly review to keep the system clean.', 'Label and organize one messy area of your work.', 'Trust the system, then act from it — not from memory.'] },
];

/* STOIC PRINCIPLES + WINNING ATTITUDES, authored per card from its identity.
   Frozen + shared across all members (same reference points for everyone), keyed
   by ENT_CARDS[].key. Rendered as two extra green sections on the ent-lib page.
   Attitudes are "LABEL — statement" strings so they render in the same numbered box. */
export const ENT_MINDSET = {
  'DISCIPLINED': {
    stoic: ['I control my effort and my habits; outcomes are not mine to command.', 'The obstacle to today’s work is today’s work — I begin anyway.', 'I do not wait to feel ready; I act, and readiness follows.', 'Comfort is a poor master; I answer to my standards, not my moods.'],
    attitudes: ['RELENTLESS — I show up whether or not I feel like it.', 'NON-NEGOTIABLE — my routine is not up for daily debate.', 'PROOF-DRIVEN — every clean day is evidence of who I’m becoming.', 'UNSHAKEABLE — I never miss twice.'] },
  'RISK TAKER': {
    stoic: ['I fear only what is in my power to avoid: inaction and cowardice.', 'I prepare for the worst outcome, then act without dread of it.', 'Fortune favors the one who has already accepted the loss.', 'What I risk, I risk on purpose; what I cannot control, I release.'],
    attitudes: ['BOLD — I move while others hesitate.', 'ASYMMETRIC — I take capped downside for uncapped upside.', 'DECISIVE — I would rather act and adjust than wait and wonder.', 'FEARLESS — fear is a signal I’m near the edge that matters.'] },
  'STRATEGIC THINKER': {
    stoic: ['I see things as they are, not as I wish them to be.', 'The wise look past the moment to the second and third effect.', 'I spend my best hours thinking, for a clear mind is my greatest asset.', 'I do not chase every opportunity; I choose the one that matters.'],
    attitudes: ['FAR-SIGHTED — I play ten moves ahead.', 'LEVERAGED — I find the point where small effort moves great weight.', 'PATIENT — I win the long game on purpose.', 'CLEAR-EYED — I act on what is, not on what I hope.'] },
  'EXECUTING STRATEGY': {
    stoic: ['Knowing the good and not doing it is the same as not knowing it.', 'I finish what I begin; an unfinished plan is only a wish.', 'The task before me deserves my full and immediate attention.', 'I judge myself by what I ship, not by what I intend.'],
    attitudes: ['RUTHLESS — I close the gap between vision and reality.', 'ACCOUNTABLE — every initiative has an owner, a deadline, a metric.', 'DECISIVE — green light or red light, nothing ambiguous.', 'RELIABLE — I never let a great plan die unused.'] },
  'SELF CONFIDENT': {
    stoic: ['I need no one’s approval to know my own worth.', 'My certainty rests on what I control, so it cannot be taken.', 'I act first; the evidence of my ability follows.', 'Doubt is a visitor I acknowledge and do not house.'],
    attitudes: ['CERTAIN — my confidence is earned, not borrowed.', 'SELF-RELIANT — I trust myself to figure it out as I go.', 'UNAPOLOGETIC — I don’t wait for permission to move.', 'PROVEN — every win confirms what I already knew.'] },
  'PASSIONATE': {
    stoic: ['I pour myself fully into work worthy of my one life.', 'My fire is fuel, not a fever; I let it drive, not rule me.', 'I love the labor itself, not only the reward it may bring.', 'A life spent on what matters cannot be a life wasted.'],
    attitudes: ['OBSESSED — I love this enough to make quitting unthinkable.', 'WHOLEHEARTED — I bring my full heart to the goal.', 'MAGNETIC — people follow the energy I carry.', 'DEVOTED — every milestone deepens the fire.'] },
  'PROFITABLE': {
    stoic: ['I steward resources as a trust, not a plaything.', 'I measure the model by its truth: the numbers do not flatter.', 'I create value first; a fair reward is the natural echo.', 'Waste offends me; I spend where it builds and cut where it drains.'],
    attitudes: ['VALUE-DRIVEN — I create real value and capture a fair share.', 'NUMERATE — I think in revenue, margin, and cash flow.', 'RESPONSIBLE — financial strength is my duty, not my hope.', 'DECISIVE — every choice moves a number I can name.'] },
  'GREAT SALES PERSON': {
    stoic: ['I serve first; the sale is the byproduct of genuine help.', 'A “no” costs me nothing I was owed; I meet it with grace.', 'I speak the truth plainly, for trust is the only real close.', 'I control my preparation and my follow-up, not the answer.'],
    attitudes: ['SERVANT — I sell by serving, not by pushing.', 'TRUSTED — I build trust before I ask for anything.', 'PERSISTENT — follow-up is where most deals are won.', 'RESILIENT — every no gets me closer to the right yes.'] },
  'SKILLFUL COMMUNICATOR': {
    stoic: ['I say the true thing simply; ornament is the enemy of clarity.', 'I listen more than I speak, for I learn nothing while talking.', 'My words are seeds; I choose them knowing what they grow.', 'I speak to be understood, not to be admired.'],
    attitudes: ['CLEAR — I say the true thing simply.', 'PRESENT — I make people feel genuinely heard.', 'PRECISE — clarity is kindness.', 'ATTUNED — I listen more than I speak.'] },
  'EMPATHETIC': {
    stoic: ['I remember that every person carries a burden I cannot see.', 'I seek first to understand, treating others as I would be treated.', 'I lead with understanding, for force wins compliance, not hearts.', 'Patience with people is patience with myself.'],
    attitudes: ['UNDERSTANDING — I listen to understand, not to reply.', 'CONNECTED — I win through connection, not force.', 'PERCEPTIVE — I see the human behind the request.', 'SAFE — people open up because they feel secure with me.'] },
  'STRONG WORK ETHIC': {
    stoic: ['The work itself is the reward; I need no witness to do it well.', 'I rise and labor, for that is what I was made to do.', 'No task is beneath me if it serves the mission.', 'I earn my rest by the honest weight of my effort.'],
    attitudes: ['TIRELESS — I outwork the room, quietly.', 'HUMBLE — no job is beneath me.', 'CONSISTENT — I do the unglamorous work every day.', 'EARNEST — I let the effort speak.'] },
  'SELF STARTER': {
    stoic: ['I do not wait for a signal; the need itself is my command.', 'I am the author of my own motion.', 'Where others see permission, I see responsibility.', 'The first step is always mine to take.'],
    attitudes: ['PROACTIVE — I begin before I’m told.', 'OWNING — where others wait, I see responsibility.', 'INITIATING — the first step is always mine.', 'DRIVEN — I am the author of my own motion.'] },
  'SELF PROMOTER': {
    stoic: ['I speak of my work honestly, neither shrinking nor inflating.', 'False modesty serves no one; I let my results be known.', 'I value my worth rightly, and so can name it aloud.', 'I seek to be useful more than to be liked.'],
    attitudes: ['VISIBLE — I let the right people know what I’ve built.', 'UNSHRINKING — I don’t hide my results out of false modesty.', 'CONFIDENT — I name my worth without apology.', 'STRATEGIC — I put my work where it will be seen.'] },
  'RESPECTED MANAGER': {
    stoic: ['I lead by example, for authority without character is hollow.', 'I am fair to all and a slave to none; respect is earned, not demanded.', 'I own the failures and share the credit.', 'I serve those I lead, and so they follow willingly.'],
    attitudes: ['EXEMPLARY — I lead by example, not by title.', 'FAIR — I hold everyone, including myself, to the standard.', 'ACCOUNTABLE — I own the failures and share the credit.', 'TRUSTED — my word is reliable, so my team follows.'] },
  'LIVING THE BRAND': {
    stoic: ['What I preach, I practice; hypocrisy is a debt that always comes due.', 'My character is the brand; all else is packaging.', 'I am the same in private as in public.', 'I embody the values I ask others to trust.'],
    attitudes: ['AUTHENTIC — I am the same in private as in public.', 'CONSISTENT — I practice what I preach.', 'EMBODIED — my character is the brand.', 'TRUSTWORTHY — I keep the promise the brand makes.'] },
  'MANAGING TIME WISELY': {
    stoic: ['Time is the only wealth I cannot earn back; I spend it deliberately.', 'I guard my hours as a miser guards gold, then give them to what matters.', 'It is not that I have too little time, but that I waste too much.', 'I do the important thing first, before the urgent devours the day.'],
    attitudes: ['DELIBERATE — I spend my hours on purpose.', 'FOCUSED — I do the important before the urgent.', 'PROTECTIVE — I guard my best hours fiercely.', 'PRESENT — I give each task my full attention, then move on.'] },
  'SUCCESSFUL NEGOTIATOR': {
    stoic: ['I hold my aim firmly and my ego loosely.', 'The one who can walk away holds the real power.', 'I seek what is fair, for a deal built on loss will not last.', 'I listen twice as much as I argue.'],
    attitudes: ['PREPARED — I know my number and my walk-away.', 'COMPOSED — I stay calm while others react.', 'FAIR — I seek a deal that lasts, not one that wins once.', 'PATIENT — the one who can wait, wins.'] },
  'QUALITY PEOPLE': {
    stoic: ['I become the person I wish to attract.', 'I am known by the company I keep, so I choose it with care.', 'I give before I ask, and the right people notice.', 'Character calls to character.'],
    attitudes: ['MAGNETIC — I become who I wish to attract.', 'SELECTIVE — I choose my circle with care.', 'GENEROUS — I give before I ask.', 'DISCERNING — I invest in character, not convenience.'] },
  'EXECUTING CONCEPT': {
    stoic: ['An idea unbuilt is merely a daydream; I give mine hands.', 'I test in reality, not in my imagination.', 'I would rather ship the imperfect than polish the unseen.', 'The concept proves itself only in the doing.'],
    attitudes: ['BUILDER — I give my ideas hands.', 'SHIPPING — I’d rather launch imperfect than hoard perfect.', 'GROUNDED — I test in reality, not in my head.', 'DECISIVE — I move the concept from mind to market.'] },
  'FACILITATOR': {
    stoic: ['I serve the group’s aim above my own voice.', 'I make the path smooth so others can carry the load.', 'The best leader is the one whose people say, “we did it ourselves.”', 'I draw out the best in others rather than impose my own.'],
    attitudes: ['ENABLING — I make it easy for others to do great work.', 'SELFLESS — I serve the aim above my own voice.', 'UNIFYING — I turn a room of individuals into a team.', 'STEADY — I keep the group moving toward the goal.'] },
  'OUTSIDE BOX': {
    stoic: ['I question the assumptions others accept without thought.', 'The rule is a tool, not a master; I use it or set it aside.', 'I seek the truth, even when it lives outside the usual road.', 'A fresh eye sees what habit has made invisible.'],
    attitudes: ['INVENTIVE — I find the door where others see a wall.', 'QUESTIONING — I challenge the assumptions everyone accepts.', 'ORIGINAL — I seek the answer no one else has tried.', 'CURIOUS — I look where habit has stopped others from looking.'] },
  'FAIRNESS': {
    stoic: ['Justice is giving each their due; I weigh without favor.', 'I hold myself to the harshest standard I set for others.', 'I would rather be just than be liked.', 'Fairness is the foundation on which trust is built.'],
    attitudes: ['JUST — I give each person their due.', 'IMPARTIAL — I weigh without favor.', 'PRINCIPLED — I’d rather be fair than popular.', 'CONSISTENT — the standard is the same for everyone, including me.'] },
  'GOOD LISTENER': {
    stoic: ['Nature gave me two ears and one mouth for a reason.', 'I listen to understand, not to wait for my turn.', 'In silence I learn what noise would have hidden.', 'The person before me deserves my whole attention.'],
    attitudes: ['ATTENTIVE — I give my whole attention to the speaker.', 'PATIENT — I listen to understand, not to reply.', 'CURIOUS — I ask one more question before I respond.', 'PRESENT — I quiet my own voice to hear theirs.'] },
  'METICULOUS PLANNER': {
    stoic: ['I plan for the storm while the sky is clear.', 'Foresight spares me the panic of the unprepared.', 'I map the road, then walk it one deliberate step at a time.', 'What I anticipate, I can absorb.'],
    attitudes: ['THOROUGH — I leave no detail to chance.', 'PREPARED — I plan for the storm in clear weather.', 'DELIBERATE — I map the road before I walk it.', 'CALM — foresight spares me the panic of the unready.'] },
  'AWARE OF LIMITATIONS': {
    stoic: ['I know what is mine to do and what is not, and I am at peace with both.', 'Wisdom begins in admitting what I do not know.', 'I ask for help without shame, for no one masters everything.', 'I build my strengths and hire my gaps.'],
    attitudes: ['HONEST — I know what I do and don’t do well.', 'HUMBLE — wisdom starts in admitting what I don’t know.', 'RESOURCEFUL — I hire my gaps and build my strengths.', 'SECURE — I ask for help without shame.'] },
  'BALANCE IN LIFE': {
    stoic: ['I labor hard and rest well; both are part of a whole life.', 'A bow always bent will break; I know when to unstring it.', 'I tend to body, mind, and spirit, for one neglected undoes the rest.', 'Enough is a feast; I do not sacrifice my life to build one.'],
    attitudes: ['WHOLE — I tend to body, mind, and spirit.', 'SUSTAINABLE — I rest so I can labor for the long run.', 'PRESENT — I am fully at work, then fully at home.', 'GROUNDED — I know when enough is a feast.'] },
  'CHARMING': {
    stoic: ['I make others feel their own worth, and they remember me for it.', 'Warmth costs nothing and returns much.', 'I am genuinely interested in people, and it shows.', 'Grace in small moments builds trust in large ones.'],
    attitudes: ['WARM — I make people feel their own worth.', 'INTERESTED — I am genuinely curious about people.', 'GRACIOUS — I bring ease to every room I enter.', 'MEMORABLE — I leave people better than I found them.'] },
  'COMFORTABLE DELEGATING': {
    stoic: ['I trust others to carry what need not be mine alone.', 'To do everything myself is pride, not virtue.', 'I give the task and the authority to match it.', 'I free my hands for the work only I can do.'],
    attitudes: ['TRUSTING — I hand off the task and the authority with it.', 'SECURE — letting go is strength, not loss of control.', 'FOCUSED — I keep only the work only I can do.', 'EMPOWERING — I grow others by giving them real weight.'] },
  'COMPETITIVE': {
    stoic: ['My truest rival is the person I was yesterday.', 'I compete to become excellent, not merely to defeat.', 'I honor a worthy opponent, for they sharpen me.', 'I control my effort; the standings are not mine to command.'],
    attitudes: ['HUNGRY — I play to win, every time.', 'SELF-MEASURING — my real rival is yesterday’s me.', 'RELENTLESS — I raise my game against the best.', 'GRACIOUS — I honor the opponent who sharpens me.'] },
  'DETERMINED TO SUCCEED': {
    stoic: ['The obstacle is the way; what blocks the path becomes the path.', 'I persist not from stubbornness but from purpose.', 'Defeat is a lesson, never a verdict.', 'I bend, but I do not break.'],
    attitudes: ['UNSTOPPABLE — the obstacle is the way.', 'PERSISTENT — I bend but I do not break.', 'RESILIENT — defeat is a lesson, never a verdict.', 'PURPOSEFUL — I persist from purpose, not pride.'] },
  'ORGANIZATIONAL SKILLS': {
    stoic: ['Order in my affairs makes room for order in my mind.', 'A place for everything, and my attention freed for what matters.', 'I master the small systems so the large ones cannot master me.', 'Clarity outside creates calm within.'],
    attitudes: ['ORDERLY — a place for everything, everything in its place.', 'SYSTEMATIC — I build systems so nothing slips.', 'CLEAR — order outside creates calm within.', 'EFFICIENT — I remove friction before it costs me.'] },
};

/* Card art path for a key. Files live in images/entrepreneur-library/ and mostly
   follow "ENT <KEY>.PNG", with a few naming quirks handled here. */
const _IMG_OVERRIDE = {
  'FAIRNESS': 'ENT - FAIRNESS.PNG',
  'GOOD LISTENER': 'ENT - GOOD LISTENER.PNG',
  'METICULOUS PLANNER': 'ENT - METICULOUS PLANNER.PNG',
  'CHARMING': 'ENT CHARMING copy.PNG',
  'ORGANIZATIONAL SKILLS': 'ORGANIZATIONAL SKILLS.JPG',
};
export function entCardImg(key) {
  const file = _IMG_OVERRIDE[key] || ('ENT ' + key + '.PNG');
  return 'images/entrepreneur-library/' + encodeURIComponent(file);
}

/* Look up a card by key (case-insensitive) or by number. */
export function getEntCard(idOrKey) {
  if (idOrKey == null) return null;
  if (typeof idOrKey === 'number') return ENT_CARDS.find(c => c.n === idOrKey) || null;
  const k = String(idOrKey).toUpperCase().trim();
  return ENT_CARDS.find(c => c.key === k) || null;
}

/* Has this card been authored with its frozen content yet? */
export function entCardHasContent(c) {
  return !!(c && c.directive && c.affirmations && c.roadmap);
}
