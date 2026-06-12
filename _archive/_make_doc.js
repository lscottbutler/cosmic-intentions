const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LevelFormat
} = require('docx');
const fs = require('fs');

const BLUE = "1B3A6B";
const LIGHT_BLUE = "D6E4F0";
const GOLD = "B8860B";
const GRAY = "F5F5F5";
const TEXT = "1A1A1A";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, color: BLUE, font: "Arial" })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, color: BLUE, font: "Arial" })]
  });
}

function heading3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [new TextRun({ text, bold: true, size: 22, color: GOLD, font: "Arial" })]
  });
}

function body(runs) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: runs
  });
}

function run(text, opts = {}) {
  return new TextRun({ text, font: "Arial", size: 22, color: TEXT, ...opts });
}

function bold(text) {
  return run(text, { bold: true });
}

function bullet(runs) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: runs
  });
}

function numbered(runs) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { before: 40, after: 40 },
    children: runs
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } },
    children: []
  });
}

function stackTable() {
  const headerStyle = { bold: true, color: "FFFFFF", font: "Arial", size: 20 };
  const cellStyle = { font: "Arial", size: 20, color: TEXT };

  const rows = [
    ["Layer", "Technology", "Role"],
    ["Hosting", "Netlify", "Static file hosting. No server-side code."],
    ["Auth + Database", "Supabase (postgres)", "User auth, personal data storage"],
    ["Data Source", "Google Sheets", "Content libraries via Sheets API / Apps Script"],
    ["Frontend", "Vanilla HTML/CSS/JS", "No build step. No bundler. Pure files."],
    ["AI Voice", "OpenAI TTS", "Text-to-speech for all player VO scripts"],
    ["AI Content", "OpenAI + Claude API", "Content generation via serverless functions"],
    ["Vision Board Images", "Pexels API", "Keyword image search for Digital Vision Boards"],
    ["Deployment", "GitHub → Netlify", "Push to main → auto-deploys to cosmicintentions.com"],
  ];

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 2400, 4960],
    rows: rows.map((row, i) =>
      new TableRow({
        children: row.map((cell, j) =>
          new TableCell({
            borders,
            width: { size: [2000, 2400, 4960][j], type: WidthType.DXA },
            shading: { fill: i === 0 ? BLUE : (i % 2 === 0 ? GRAY : "FFFFFF"), type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              children: [new TextRun({ text: cell, ...(i === 0 ? headerStyle : cellStyle), bold: i === 0 || j === 0 })]
            })]
          })
        )
      })
    )
  });
}

function playersTable() {
  const headerStyle = { bold: true, color: "FFFFFF", font: "Arial", size: 20 };
  const cellStyle = { font: "Arial", size: 20, color: TEXT };

  const rows = [
    ["Player", "What It Does"],
    ["Visual Countdown", "Full-screen immersive timer with goal text, rotating background images, VO narration, eye open/close icon synced to TTS timing"],
    ["Countdown", "Focused countdown timer. 60 / 30 / 15 minute options. Launches Visual Countdown with goal + duration."],
    ["Visualization Quick", "Short guided visualization session"],
    ["Visualization 10-Min", "Full 10-minute guided visualization"],
    ["Meditation", "Guided meditation player with background imagery"],
    ["Meditation Select", "Library selector for meditation sessions"],
    ["Meditation Timer", "Standalone timer for self-guided meditation"],
    ["Gratitude", "Guided gratitude session"],
    ["Video", "Video player for visualization and motivation content"],
  ];

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: rows.map((row, i) =>
      new TableRow({
        children: row.map((cell, j) =>
          new TableCell({
            borders,
            width: { size: [2400, 6960][j], type: WidthType.DXA },
            shading: { fill: i === 0 ? BLUE : (i % 2 === 0 ? GRAY : "FFFFFF"), type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              children: [new TextRun({ text: cell, ...(i === 0 ? headerStyle : cellStyle), bold: i === 0 })]
            })]
          })
        )
      })
    )
  });
}

function agentsTable() {
  const headerStyle = { bold: true, color: "FFFFFF", font: "Arial", size: 20 };
  const cellStyle = { font: "Arial", size: 20, color: TEXT };

  const rows = [
    ["Agent", "Used For"],
    ["Claude", "All code writing, file editing, debugging, Supabase/Netlify logic, memory across sessions"],
    ["Gemini", "Google Sheets, Apps Script, YouTube API, NewsAPI, Google Workspace, real-time web search, marketing strategy"],
  ];

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 7360],
    rows: rows.map((row, i) =>
      new TableRow({
        children: row.map((cell, j) =>
          new TableCell({
            borders,
            width: { size: [2000, 7360][j], type: WidthType.DXA },
            shading: { fill: i === 0 ? BLUE : (i % 2 === 0 ? GRAY : "FFFFFF"), type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              children: [new TextRun({ text: cell, ...(i === 0 ? headerStyle : cellStyle), bold: i === 0 || j === 0 })]
            })]
          })
        )
      })
    )
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      },
      {
        reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: TEXT } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 280, after: 80 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
      }
    },
    children: [

      // TITLE
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 120 },
        children: [new TextRun({ text: "COSMIC INTENTIONS", bold: true, size: 52, font: "Arial", color: BLUE })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: "How It Works", size: 32, font: "Arial", color: GOLD, bold: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 480 },
        children: [new TextRun({ text: "June 2, 2026  •  cosmicintentions.com", size: 20, font: "Arial", color: "888888" })]
      }),

      divider(),

      // EXECUTIVE SUMMARY
      heading1("Executive Summary"),
      body([run("Cosmic Intentions is a behavioral masterstroke — hacking the human psyche’s intention-action gap by leveraging the simple truth: "), bold("We move toward what we think about most.")]),
      body([run("Built on Humanistic Psychology principles, C.I. empowers users as creative beings, turning limiting beliefs into unbreakable momentum via AI-enhanced dashboards, visualization players, and guided sessions.")]),
      new Paragraph({ spacing: { before: 120, after: 60 }, children: [] }),
      bullet([bold("Target: "), run("Lifelong learners like “Jane” — frustrated by fragmented self-help, craving a unified space for missions, goals, and visualizations.")]),
      bullet([bold("Success vision: "), run("A worldwide phenomenon, donating 100K+ subs to nonprofits, praised by A-listers, proving “this shit works” through measurable wins.")]),
      bullet([bold("Launch strategy: "), run("Killer VSL first for traction, then partnerships for scale.")]),
      bullet([bold("Market fit: "), run("In a $50B+ personal dev boom, C.I.’s AI personalization closes the 96% failure rate in goals, aiming for 10M users (1/10 Headspace size) via habit loops and belief shifts.")]),

      divider(),

      // PART 1 — STACK
      heading1("Part 1: The Stack"),
      body([run("Cosmic Intentions is a pure, modern web app — no plugins, no platform lock-in, no bloat. Just fast, clean code deployed globally.")]),
      new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }),
      stackTable(),
      new Paragraph({ spacing: { before: 120, after: 60 }, children: [] }),
      body([bold("Live at: "), run("cosmicintentions.com")]),

      divider(),

      // PART 2 — ARCHITECTURE
      heading1("Part 2: How It Works — The Architecture"),

      heading2("The Two Dashboards"),
      body([bold("Main Portal (index.html) — "), run("The primary dashboard. The user’s hub for all content: their goals, affirmations, beliefs, visualization access, and AI-generated content. This is the entry point after login — the heart of the app.")]),
      new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }),
      body([bold("Gallery White Dashboard (arsenal.html) — "), run("A premium, high-end alternate experience. Aesthetic: pure white backgrounds, black text, luxury boutique feel. Built as a bolt-on to the main portal — same data, elevated presentation.")]),

      heading2("The Players (Content Experiences)"),
      body([run("All players are standalone experiences launched from the main dashboard. Each one is a purpose-built session: visual, audio, and guided — designed to lock the user’s mind onto their goal.")]),
      new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }),
      playersTable(),

      heading2("Daily Rotating Images"),
      body([run("Each player has a unique rotating background image system. Images cycle daily — each player gets a different image on the same day, so the experience always feels fresh. Image library: 14MB of premium visuals.")]),

      heading2("The Content Pipeline (3-Pass)"),
      body([run("All AI-generated content runs through a 3-pass filter before reaching the user:")]),
      numbered([bold("Raw — "), run("initial AI output")]),
      numbered([bold("Refine — "), run("cleaned and tightened")]),
      numbered([bold("Belief System Filter — "), run("checked against C.I. values: positive, empowering, no toxic positivity")]),

      divider(),

      // PART 3 — VISUALIZATION
      heading1("Part 3: The Visualization Experience (Rolex Build)"),
      body([run("The current build milestone is the "), bold("Rolex / Arsenal phase"), run(" — the most premium, immersive expression of C.I.")]),
      new Paragraph({ spacing: { before: 100, after: 60 }, children: [] }),
      heading2("Visual Countdown Flow"),
      numbered([run("User sets their goal and duration")]),
      numbered([run("Full-screen experience launches: rotating background image, goal text overlay, AI voice narration")]),
      numbered([run("Eye open/closed icon fades in sync with the voice timing")]),
      numbered([run("Bell chimes at completion, returns user to the app")]),
      new Paragraph({ spacing: { before: 100, after: 60 }, children: [] }),
      body([bold("Visualization scenes: "), run("13 scenes at 300-frame intervals — e.g., the Rolex sequence, seeing yourself achieving the goal in vivid detail.")]),
      body([bold("Aesthetic rule: "), run("Gallery White — pure white, black text, luxury boutique. No clutter. No noise.")]),

      divider(),

      // PART 4 — USER JOURNEY
      heading1("Part 4: User Journey"),
      numbered([bold("Landing Page "), run("→ VSL (video sales letter) → CTA: “Sign Up Now”")]),
      numbered([bold("Sign Up "), run("→ Secure auth via email and password")]),
      numbered([bold("Main Dashboard "), run("→ User enters Mission Statement, Life Goal, individual goals, affirmations, beliefs, traits")]),
      numbered([bold("Aha! Moment "), run("→ AI generates personalized content, vision board populates, players become available")]),
      numbered([bold("Core Loop "), run("→ Daily return: launch a visualization or meditation player, review AI roadmap, update goals")]),
      numbered([bold("Premium Experience "), run("→ Gallery White dashboard for the Rolex-level presentation")]),

      divider(),

      // PART 5 — AI AGENTS
      heading1("Part 5: Division of Labor (AI Agents)"),
      body([run("Two AI agents power C.I. — each with a defined lane.")]),
      new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }),
      agentsTable(),

      divider(),

      // PART 6 — GROWTH
      heading1("Part 6: Growth Vision"),
      bullet([bold("Market: "), run("$50–65B personal development industry, ripe for AI integration")]),
      bullet([bold("Edge: "), run("Unifies fragmented self-help, closes the 96% goal failure gap")]),
      bullet([bold("Launch: "), run("VSL first (5–15 min, story-driven, urgency CTA) — bootstrap, test conversions")]),
      bullet([bold("Then: "), run("Influencer partnerships, nonprofits, B2B corporate development programs")]),
      bullet([bold("Goal: "), run("10M users, $35M revenue, $300M valuation in 3–5 years")]),
      new Paragraph({ spacing: { before: 160, after: 80 }, children: [] }),
      new Paragraph({
        spacing: { before: 80, after: 80 },
        indent: { left: 720 },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 1 } },
        children: [new TextRun({ text: "C.I. is built on the fact that we are all creative beings. It erodes doubt via proof, turning thoughts into empires.", font: "Arial", size: 22, color: TEXT, italics: true })]
      }),

      divider(),

      // FOOTER NOTE
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 0 },
        children: [new TextRun({ text: "cosmicintentions.com  •  Document reflects build as of June 2, 2026", font: "Arial", size: 18, color: "999999" })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("CI_HOW_IT_WORKS_JUNE2_2026.docx", buffer);
  console.log("Done: CI_HOW_IT_WORKS_JUNE2_2026.docx");
});
