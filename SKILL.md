---
name: pen-sheet
description: Build notebook-style stylus and e-ink interactive worksheets (<pen-toolbar>, <pen-input>, <pen-submit>) with real pressure-sensitive handwriting, native PDF/Notes round-trip, Socratic educational AI coaching, progressive-disclosure hints/solutions, red-pen markup, and interactive follow-up Q&A. Works across Claude Artifacts, ChatGPT, Gemini, Codex, Onyx Boox, iPad, and Surface. Use whenever someone asks for a handwritten test, practice sheet, study worksheet, diagram exercise, or shareable stylus page.
---

# pen-sheet

Turn any topic into a **real handwritten learning sheet** — tuned for **Onyx Boox / e-ink tablets**, **iPad + Apple Pencil**, **Surface**, and desktop browsers, with **educational AI coaching** instead of sterile multiple-choice boxes.

Writing by hand reveals *how* a learner thinks. `pen-sheet` gives you three zero-dependency Web Components (`<pen-toolbar>`, `<pen-input>`, `<pen-submit>`) that handle pressure ink, palm rejection, scribble-to-erase, draw-on-SVG diagrams, native PDF/Notes export + re-upload, red-pen markup, and live Socratic coaching.

## 1. Design worksheets that genuinely teach

Before writing HTML, design prompts where **handwriting pays off**:
- **Show working & proofs** (`paper="grid"` or `"blank"`, `height="420"`–`600`): math derivations, algorithm traces, chemical equations, free-body diagrams.
- **Draw directly on a figure**: place an inline `<svg viewBox="...">` inside `<pen-input>` — students plot curves, label anatomy, trace trees/heaps, or fill in DP tables directly on the diagram.
- **High-leverage learning formats**:
  - *Find the mistake*: show a flawed solution built on a common misconception; ask the student to circle the wrong step, explain why it fails, and fix it.
  - *Faded worked examples*: show steps 1–2 and leave step 3 blank before giving a full problem.
  - *Compare two methods*: put two solutions side by side and ask when each wins.
  - *Teach a classmate*: "Explain *why* this works to someone who missed class."
  - *Brain dump*: a big blank canvas to write everything recalled from memory before reviewing.
- **Keep answer keys out of the HTML** — the source is visible to the student.

## 2. Write the worksheet HTML

```html
<!doctype html>
<html lang="en" class="hwq-eink">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Algorithms & Recurrences Practice</title>
</head>
<body>
  <pen-toolbar></pen-toolbar>
  <h1>Algorithms & Recurrences Practice</h1>

  <h2>1. Trace Merge Sort on [7, 2, 9, 4]</h2>
  <p>Draw the split-and-merge tree and state the time complexity.</p>
  <pen-input name="q1" label="Merge Sort trace" paper="grid" height="440"></pen-input>

  <h2>2. Fill in the DP table</h2>
  <p>Coins {1, 3, 4}: write the minimum coins for each target sum.</p>
  <pen-input name="q2" label="Coin Change DP table">
    <svg viewBox="0 0 640 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Clean black-on-white diagram/table SVG -->
    </svg>
  </pen-input>

  <pen-submit>Hand in for coaching</pen-submit>
  <script src="https://cdn.jsdelivr.net/gh/tonank/pen-sheet@main/dist/pen-sheet.js"></script>
</body>
</html>
```

### Component attributes

- **`<pen-header>`** (optional zero-boilerplate exam cover strip):
  - Automatically renders the title (`title="..."` or `<title>`), `subtitle="..."`, live metadata chips (`3 questions`, `10 pts`, `⏱ 15 min`), a **`🎯 Focus mode`** toggle (one question at a time for zero e-ink scroll ghosting), and an optional `student-name` input (persisted across reloads, automatically stamped into exported PDFs and Markdown Study Notes, never treated as a graded question). Also applies clean, low-specificity editorial page typography so you don't even need a `<style>` block.
- **`<pen-toolbar>`**:
  - Compact floating rail (dockable to **right or left** via `⚙`) with live **Question Navigator** (`2/6` progress bar, total points, flag & verdict indicators, and 1-tap `Next flagged / unanswered / to review →` jump), live **Exam Timer pill** (when `timer="N"` is set, auto-starts gently on the first pen stroke!), Pen (with live active ink color dot) / Eraser / Undo / Redo, and compact sectioned `⚙` menu (Writing: ink colors, nib sizes, paper switcher, **📝 Scratchpad**, Clear; Display: E-ink, Dark mode, **🎯 Focus mode**, **Aa Easy read**, Left/Right rail, Finger-scroll; Exam & Share: Timer, Download PDF, Copy for AI, **💾 Save / 📂 Load `.pen.json`**, Grader setup).
  - `timer`: optional exam countdown in minutes (e.g. `<pen-toolbar timer="30">` pre-loads a 30:00 countdown that starts automatically on first writing; omit for an optional count-up stopwatch). Elapsed time is automatically captured on hand-in and shown in the post-exam scorecard.
- **`<pen-input>`**:
  - `name` (required): stable id used for autosave, PDF box tagging, and grading.
  - `label`: human-readable title shown in the Question Navigator, Answer Sheets, Study Notes, and sent to the grader.
  - `points`: optional point weight (e.g. `points="4"` displays a crisp `4 pts` pill, sums into total exam points, renders `[4 pts]` + `Score: ___ / N` in exported PDFs, and scores earned points in the post-exam review bar).
  - `rubric`: optional grading criteria separated by `|` or `;` (e.g. `rubric="State base case | Prove inductive step | Conclude"`). Shown upfront as scannable checklist chips above the pad (raises performance), included in PDF exports, passed to the AI grader, and ticked (`✓`) when met!
  - `hint`: optional progressive hint hidden inside a collapsed **💡 Need a hint?** disclosure below the pad (supports Markdown + `$math$`, works 100% offline, hidden in print). Omit on closed-book exams.
  - `solution`: optional offline self-check model solution (use **ONLY** on self-study practice sheets, never on closed-book graded exams!). Renders a collapsed **📖 Check my answer** disclosure with `✓ Got it / ◐ Almost / ✗ Review again` self-rating chips that feed directly into the Question Navigator, Study Notes, and `⚡ Practice weak spots` — 100% offline with zero API key.
  - `say` / `say-lang`: optional dictation phrase read aloud via **🔊 Listen** (Web Speech API, never shown in text — ideal for language listening & spelling drills).
  - `confidence`: boolean attribute (or set `confidence` on `<pen-submit>` to enable on all pads) adding quiet `Guess / Unsure / Sure` calibration chips below the pad. Sent to the grader to highlight **confident mistakes** (the highest-value learning moments) and surfaced in the post-exam review bar.
  - `placeholder`: optional custom empty-canvas prompt (defaults to `"Write here…"`).
  - `paper`: `"ruled"` (default), `"grid"`, or `"blank"`.
  - `height`: paper height in units (width is always `1000`; `360`–`550` is comfortable and auto-grows as you write near the bottom).
  - An inline `<svg viewBox="...">` inside `<pen-input>` becomes the drawable diagram background.
  - Built-in corner actions: **`⚑` Flag for review** (persisted across reloads, surfaced in the Question Navigator, readiness pill, pre-submit exam guard, and post-exam `⚑ Flagged` filter), **`📌` Pin task**, and **`+` More room**.
- **`<pen-submit>`**:
  - Built-in **pre-submit exam guard**: if questions are unanswered or flagged, tapping Hand in opens a calm inline warning (`Jump to #N` or `Hand in anyway`) instead of locking the sheet prematurely.
  - Built-in **post-exam review & spaced-repetition suite**: total score & percentage (`7.5 / 10 pts · 75%`), **attempt progression** across retries (`📈 60% → 90% (+30%)`), elapsed time, confident-mistake calibration alert, `All / Needs work / ⚑ Flagged` filters, **`👁 Hide/Show marks`** toggle, **`↻ Retry missed (N)`** (keeps `✓ Correct` answers locked while revising only missed items!), **`🧹 Fresh retake`** (clean slate while keeping Attempt History for pre-final retakes), **`⚡ Practice weak spots`** (copies a surgical follow-up worksheet prompt targeting ONLY missed/flagged/confident-mistake gaps), per-question **`💭 My takeaway`** reflection notes, **`📝 Copy study notes`**, **`⬇ Save report (.md)`**, **`🖨 Print / Save review`**, and interactive follow-up tutor chat.
  - `mode`: `"coach"` (**default** — open educational coaching with rich Markdown, custom badges, collapsible `nudge` & `solution`, and follow-up tutor chat), `"free"` (pure narrative Markdown teacher letter), or `"strict"` (classic 4-verdict `correct | partial | incorrect | blank` scoring).
  - `prompt`: optional per-worksheet pedagogy or rubric instructions (e.g. `prompt="Use Socratic hints first; never reveal the final formula unless the student is completely stuck."`).
  - `endpoint`: optional HTTPS grading server URL (or `<meta name="pen-endpoint">`).
  - `agent`: optional tutor display name (`"Coach"`, `"Prof. Ada"`, etc.).
- **E-ink & Dark mode**: add `class="hwq-eink"` on `<html>` for e-ink tablets (Onyx Boox, reMarkable, Supernote). Users can also toggle E-ink, Dark mode, Left/Right rail, Finger-scroll, Download PDF, Copy for AI, and Grader Setup from the floating `⚙` rail.

## 2b. Worksheet Design Blueprints (pick the right structure for the user's goal)

| Goal | Attributes & Structure to Use |
|---|---|
| **Exam Simulation / Midterm Prep** | `<pen-toolbar timer="30">`, explicit `points="..."` on every `<pen-input>` (summing to a clean 10, 20, or 100), concise `rubric="..."` criteria on multi-step proofs/derivations, **no** `hint` attributes, `<pen-submit mode="coach">` or `mode="strict"`. |
| **Guided Practice / Homework** | Omit `timer`, add progressive `hint="..."` on tricky questions (never give away the final number — nudge the first step), include `rubric="..."` for worked solutions, mix a faded worked example + a "Find the mistake" problem + a transfer problem. |
| **Visual / Diagram Worksheet** | Embed clean inline `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H">` inside `<pen-input>`: pure `#000`/`#333` strokes (≥ 2px), legible `font-size >= 16`, generous whitespace for handwriting, and **never** draw the answer inside the SVG. |
| **Language Learning Drill** | Set `<html lang="de" data-feedback-lang="en">` (or student's native language) so prompts stay in the target language while coaching explains grammar/accents/capitals in the learner's home language; use `paper="ruled"`. |

## 3. Pedagogical freedom & educational grading

By default (`mode="coach"`), **`pen-sheet` does not trap the AI in a rigid 4-verdict box**:
- **Always transcribe handwriting verbatim first** (`readAs`, mistakes included, `[?]` if illegible) — never silently fix student errors while reading.
- **Choose the assessment style that teaches best**: Socratic guiding questions, misconception refutation, step-by-step walkthroughs, mastery badges (`"Solid intuition — 1 edge case"`), numeric scores, or comments-only.
- **Rich Markdown + Math**: headings, bullet/numbered steps, fenced code blocks, tables, blockquotes, `$math$`, and `$$display math$$` render natively with zero external dependencies.
- **Progressive disclosure**: return `nudge` (shown collapsed as **💡 Hint / guiding question**) and `solution` (shown collapsed as **📖 Worked solution**) so students think before peeking.
- **Interactive follow-up loop**: after feedback appears, students can ask follow-up questions or test a verbal fix directly under the feedback card.
- **Free-form Markdown fallback**: if the model replies in plain Markdown prose (no JSON), `pen-sheet` renders it cleanly as a teacher coaching letter instead of erroring.
- **Auto-batching (>4 images)**: multi-question sheets (5+ handwritten boxes or 5+ uploaded PNG pages) automatically transcribe in chunks of 4 on image-capped hosts like Claude Artifacts, then grade in one cohesive call.

### Flexible JSON shape (optional — plain Markdown also works)

```json
{
  "questions": [
    {
      "id": "q1",
      "readAs": "split [7,2],[9,4] -> [2,7],[4,9] -> [2,4,7,9]; O(n^2)",
      "badge": "Great trace — check complexity",
      "verdict": "partial",
      "feedback": "Your split-and-merge tree is **completely accurate**! Every merge step preserves sorted order.\n\nFor the complexity, count how many **levels** the tree has when you halve $n$ each time, and how much work happens across each level.",
      "nudge": "If $n = 8$, how many times can you divide by 2 before reaching size 1? Now multiply that by the $O(n)$ merge work per level.",
      "solution": "There are $\\log_2 n$ levels and $O(n)$ work per level, giving $O(n \\log n)$ total time.",
      "nextTime": "Draw a quick level-by-level work table (level count × work per level) for divide-and-conquer recurrences.",
      "marks": [
        { "image": "q1", "kind": "tick", "x": 0.12, "y": 0.15, "w": 0.55, "h": 0.50, "note": "Clean tree!" },
        { "image": "q1", "kind": "circle", "x": 0.68, "y": 0.72, "w": 0.24, "h": 0.18, "note": "Recheck bound" }
      ]
    }
  ],
  "summary": "You clearly understand the mechanics of Merge Sort. Focus next on linking **recursion tree depth** to the $\\log n$ factor."
}
```

## 4. Works across every AI platform & workflow

| Platform / Workflow | How to deliver & grade |
|---|---|
| **Claude Artifacts** | Inline the runtime (`npx pen-sheet inline sheet.html -o artifact.html` or `python scripts/inline_pen.py`). Grades in-page automatically with >4-image auto-batching. |
| **ChatGPT / Gemini (zero-backend BYOK)** | Open the HTML file directly or host on GitHub Pages. Tap **⚙ → 🤖 Grader setup** to paste an OpenAI, Gemini, or Anthropic API key (stored only in browser `localStorage`) — live grading + follow-up chat with no server. |
| **ChatGPT / Gemini (chat copy-paste)** | Tap **📋 Copy for AI** on any worksheet (even inside a Claude Artifact!) to copy the combined Answer Sheet PNG + coaching prompt and paste straight into ChatGPT or Gemini. See `examples/chatgpt-instructions.md` for a ready-to-paste Custom GPT / Project prompt. |
| **Coding Agent (Claude Code / Codex)** | Run `npx pen-sheet serve sheet.html --mode agent` (optionally expose over HTTPS via `tailscale funnel 8765`), then grade with `npx pen-sheet wait` and `npx pen-sheet reply`. |
| **Native PDF / Notes Round-Trip** | Tap **📄 Download PDF** to export an A4 worksheet PDF, write in Boox NeoReader/Notes, GoodNotes, or reMarkable, then tap **📎 Upload PDF / PNG** to grade it right back on the page. |
| **Hosted HTTPS Endpoint** | Set `<pen-submit endpoint="https://your-grader.workers.dev/grade">` (see `examples/cloudflare-worker.js`). |
