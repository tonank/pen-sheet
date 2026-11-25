# pen-sheet

**Turn any AI into a real handwritten notebook tutor.**

Zero-dependency **e-ink & stylus worksheet Web Components** (`<pen-toolbar>`, `<pen-input>`, `<pen-submit>`) engineered for **Onyx Boox**, **iPad + Apple Pencil**, **Surface**, and any browser — with **educational Socratic coaching**, progressive-disclosure hints & solutions, interactive follow-up Q&A, red-pen markup, native PDF/Notes round-trip, and cross-AI compatibility (**Claude, ChatGPT, Gemini, Codex**).

👉 **Live HTTPS e-ink demos & Worksheet Studio (try on Onyx Boox, iPad, or desktop right now):**
- **[✨ No-Code Worksheet Studio](https://tonank.github.io/pen-sheet/examples/builder.html)** — build & download a custom stylus exam (with starter SVG diagrams, rubrics, hints & timer) in 60 seconds
- **[Interactive Stylus Showcase](https://tonank.github.io/pen-sheet/)** — algebra, explanation, number-line SVG, rubrics, hints, confidence calibration, Focus mode, private Scratchpad & `.pen.json` backup
- **[Algorithms & Recurrences Midterm](https://tonank.github.io/pen-sheet/examples/algorithms-midterm.html)** — 25-min timed mock exam with Merge Sort tree, Coin Change DP table SVG & binary search bug hunt
- **[Calculus & Mechanics Practice](https://tonank.github.io/pen-sheet/examples/calculus-physics.html)** — chain rule, inclined-plane Free-Body Diagram SVG & integration misconception
- **[German A2/B1 Writing Journal](https://tonank.github.io/pen-sheet/examples/language-journal.html)** — target-language writing with English coaching (`data-feedback-lang="en"`)

---

## Why `pen-sheet`?

Typing math, proofs, diagrams, and language drills into chat boxes hides how a learner actually thinks. `pen-sheet` lets any AI — or any teacher — ship a single HTML file where students **write naturally with a pen** and get **thoughtful, educational coaching** right on their work:

- **🎓 Pedagogical freedom & test authoring:** Declare `points`, `rubric` criteria checklists, offline progressive `hint`s, and optional exam `timer`s directly on HTML tags. By default (`mode="coach"`), the AI teaches however helps best — Socratic guiding questions, misconception diagnosis, rich Markdown (`$math$`, `$$display math$$`, code blocks, tables, lists), custom mastery badges, rubric ticks, collapsible **💡 Hint** and **📖 Worked solution** toggles, and an **interactive follow-up tutor box** right under the feedback. (Prefer classic 4-verdict scoring? Set `<pen-submit mode="strict">`, or `<pen-submit mode="free">` for pure teacher letters.)
- **🧭 Exam-taker & post-exam review workflow:** Dockable left/right floating toolbar (with live ink color dot, nib sizes, and per-pad `Ruled / Grid / Blank` switcher), Question Navigator with progress bar and quick-jump (`Next flagged / unanswered / to review`), `⚑` question flags, inline pre-submit guard for unanswered/flagged items, post-grading scorecard (`pts`, `%`, elapsed time), `All / Needs work / ⚑ Flagged` review filters, **`↻ Retry missed`** (keeps correct work locked while revising only missed items with previous feedback tucked neatly underneath), and 1-tap **`📝 Copy study notes`** / **`⬇ Save report (.md)`**.
- **✍️ Hardware-grade stylus & e-ink engine:** Pure black-on-white e-ink mode (`html.hwq-eink`), zero animations/ghosting, `pointerrawupdate` + `navigator.ink` low-latency trails over HTTPS, batched single-call rendering, palm rejection (fingers scroll automatically once a stylus is seen), barrel/eraser button, scribble-to-erase, draw-and-hold straight lines, auto-growing paper, and drawable inline SVG diagrams.
- **📄 Native PDF / Notes app round-trip:** Prefer writing in **Onyx Boox NeoReader/Notes**, **iPad GoodNotes**, or **reMarkable**? Tap **📄 Download PDF** (pure JS, zero deps, crisp Unicode + SVG + grid/ruled A4 PDF), write natively with zero latency, then tap **📎 Upload PDF / PNG** to grade it right back on the page.
- **🤖 Works with every AI (Claude, ChatGPT, Gemini, Codex):**
  - **Claude Artifacts:** In-page grading works out of the box with built-in **>4-image auto-batching** (handles 6–12+ handwritten boxes or multi-page PNG uploads automatically).
  - **BYOK zero-backend mode:** Open any HTML worksheet locally or on GitHub Pages, tap **⚙ → 🤖 Grader setup**, and connect your own **OpenAI (ChatGPT)**, **Google Gemini**, **Anthropic (Claude)** API key, or custom endpoint URL — keys stay strictly in browser `localStorage`.
  - **One-tap `📋 Copy for AI`:** Export a crisp combined Answer Sheet PNG + ready-to-paste coaching prompt from any sheet (even inside a Claude Artifact) to hand off to ChatGPT, Gemini, or Claude.
  - **ChatGPT Custom GPT / Project:** Copy-paste [examples/chatgpt-instructions.md](./examples/chatgpt-instructions.md) into a ChatGPT Project or Gemini Gem.
- **🖍 Red-pen markup & misread recovery:** SVG ticks, crosses, circles, underlines, and notes placed directly on the student's strokes, plus verbatim *"I read:"* transcription with one-click *"That's not what I wrote"* re-checking.

---

## Quick start (CDN — 10 lines of HTML)

```html
<!doctype html>
<html lang="en" class="hwq-eink">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Linear Equations Practice</title>
</head>
<body>
  <pen-toolbar></pen-toolbar>
  <h1>Linear Equations Practice</h1>

  <p>1. Solve 3(x − 4) = 15 and show every step:</p>
  <pen-input name="q1" label="Solve 3(x - 4) = 15" paper="grid" height="420"></pen-input>

  <pen-submit prompt="Use Socratic hints first before showing the worked solution.">Hand in for coaching</pen-submit>
  <script src="https://cdn.jsdelivr.net/gh/tonank/pen-sheet@main/dist/pen-sheet.js"></script>
</body>
</html>
```

## Install as an Agent Skill (Claude Code, Codex, Antigravity, Gemini CLI)

```sh
npx skills add tonank/pen-sheet
```

Or copy [SKILL.md](./SKILL.md) into `~/.claude/skills/pen-sheet/SKILL.md` (or `~/.codex/skills/pen-sheet/SKILL.md`).
Using ChatGPT or Gemini? Paste [examples/chatgpt-instructions.md](./examples/chatgpt-instructions.md) into a Project / Custom GPT / Gem.

---

## Grading Modes & Connections

| Mode / Connection | How to use |
|---|---|
| **Coaching mode (default)** | `<pen-submit>` or `<pen-submit mode="coach" prompt="...">` — rich Markdown, custom badges, collapsible `nudge` & `solution`, follow-up Q&A. Accepts flexible JSON **or** free-form Markdown. |
| **Free-form teacher letter** | `<pen-submit mode="free">` — pure Markdown coaching with no JSON wrapper. |
| **Classic strict scoring** | `<pen-submit mode="strict">` — 4 verdicts (`correct`, `partial`, `incorrect`, `blank`). |
| **BYOK (OpenAI / Gemini / Claude)** | Tap **⚙ → 🤖 Grader setup** in any browser (or `PenSheet.configure({ provider: "openai", apiKey: "sk-..." })`). |
| **Hosted HTTPS API (Option A)** | `<pen-submit endpoint="https://your-grader.workers.dev/grade">` — drop-in Cloudflare Worker in [examples/cloudflare-worker.js](./examples/cloudflare-worker.js), or local: `ANTHROPIC_API_KEY=sk-... npx pen-sheet serve sheet.html --mode api`. |
| **Live Agent Server (Option B)** | `npx pen-sheet serve sheet.html --mode agent` → `npx pen-sheet wait sheet.html` → `npx pen-sheet reply sheet.html <id> reply.json`. |
| **Standalone / Claude Artifact** | `npx pen-sheet inline sheet.html -o standalone.html` — embeds the entire runtime into one self-contained HTML file. |
| **Custom JS Grader** | `PenSheet.configure({ agentName: "Teacher", grader: async ({ submission }) => ({ summary: "...", grades: { ... } }) })`. |

## Server JSON Contract

`POST <endpoint>` receives `{ content, submission }`. Respond with **any** of:
- Flexible coaching grades: `{ "summary": "...", "grades": { "q1": { "badge": "Strong intuition", "verdict": "partial", "readAs": "...", "feedback": "...", "nudge": "...", "solution": "...", "marks": [...] } } }`
- Raw model reply (JSON or plain Markdown): `{ "reply": "..." }`
- Async polling job: `{ "id": "...", "pollUrl": "/.../poll/..." }`

## License

MIT
