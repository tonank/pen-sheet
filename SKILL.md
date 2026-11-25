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

- **`<pen-input>`**:
  - `name` (required): stable id used for autosave, PDF box tagging, and grading.
  - `label`: human-readable title shown on Answer Sheets and sent to the grader.
  - `paper`: `"ruled"` (default), `"grid"`, or `"blank"`.
  - `height`: paper height in units (width is always `1000`; `360`–`550` is comfortable and auto-grows as you write near the bottom).
  - An inline `<svg viewBox="...">` inside `<pen-input>` becomes the drawable diagram background.
- **`<pen-submit>`**:
  - `mode`: `"coach"` (**default** — open educational coaching with rich Markdown, custom badges, collapsible `nudge` & `solution`, and follow-up tutor chat), `"free"` (pure narrative Markdown teacher letter), or `"strict"` (classic 4-verdict `correct | partial | incorrect | blank` scoring).
  - `prompt`: optional per-worksheet pedagogy or rubric instructions (e.g. `prompt="Use Socratic hints first; never reveal the final formula unless the student is completely stuck."`).
  - `endpoint`: optional HTTPS grading server URL (or `<meta name="pen-endpoint">`).
  - `agent`: optional tutor display name (`"Coach"`, `"Prof. Ada"`, etc.).
- **E-ink & Dark mode**: add `class="hwq-eink"` on `<html>` for e-ink tablets (Onyx Boox, reMarkable, Supernote). Users can also toggle E-ink, Dark mode, Finger-scroll, Download PDF, Copy for AI, and Grader Setup from the floating `⚙` rail.

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
