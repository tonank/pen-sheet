---
name: pen-sheet
description: Build notebook-style stylus and e-ink interactive tests (<pen-toolbar>, <pen-input>, <pen-submit>) that anyone can answer with a pen on Onyx Boox, iPad, or Surface and submit for teacher feedback with red-pen marks on their handwriting. Use whenever the user asks to prepare a stylus/handwritten test or shareable worksheet URL.
---

# pen-sheet

Build clean, notebook-style interactive worksheets that work on **Onyx Boox / e-ink tablets**, iPads, and Windows/Android stylus devices.

## 1. Write the worksheet HTML

Include `<pen-toolbar>` for a single sticky notebook bar, one `<pen-input>` per handwritten answer, and `<pen-submit>` at the bottom. Add `class="hwq-eink"` on `<html>` when the student uses an e-ink tablet (pure black-on-white, batched fast-draw ink, no animations or ghosting).

```html
<!doctype html>
<html lang="en" class="hwq-eink">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Linear Equations Check</title>
</head>
<body>
  <pen-toolbar></pen-toolbar>
  <h1>Linear Equations Check</h1>

  <p>1. Solve 3(x - 4) = 15 and show your steps:</p>
  <pen-input name="q1" label="Solve 3(x - 4) = 15" paper="grid" height="420"></pen-input>

  <p>2. Label the midpoint on the segment:</p>
  <pen-input name="q2" label="Midpoint"><svg viewBox="0 0 400 120">...</svg></pen-input>

  <pen-submit agent="Teacher">Ready — grade my test</pen-submit>
  <!-- Works over HTTPS on any hosted page (or swap for npm CDN once published) -->
  <script src="https://cdn.jsdelivr.net/gh/tonank/pen-sheet@main/dist/pen-sheet.js"></script>
</body>
</html>
```

Attributes on `<pen-input>`:
- `name` (required): stable field id for saving and grading.
- `paper`: `"ruled"` (default), `"grid"`, or `"blank"`.
- `height`: paper height in units (paper width is always `1000`; `300`–`500` is a comfortable box, auto-grows when writing near the bottom).
- An inline `<svg viewBox="...">` inside `<pen-input>` becomes the drawable diagram background.

## 2. Choose how grading connects (Dedicated Server Modes)

- **Hosted HTTPS web artifact (Option A):** add `endpoint="https://your-grader.workers.dev/grade"` on `<pen-submit>` (or `<meta name="pen-endpoint" content="...">`). The server receives `{ content, submission }` and returns `{ summary, grades }` or `{ reply }`.
- **Live local/Tailscale agent (Option B):** run `npx pen-sheet serve test.html --mode agent`, share the printed URL (or expose over HTTPS with `tailscale funnel 8765`), then grade with `npx pen-sheet wait test.html` and `npx pen-sheet reply test.html <id> reply.json`.
- **Dedicated local API server:** run `npx pen-sheet serve test.html --mode api` with `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, or `OPENAI_API_KEY` set.
- **Standalone / Claude Artifact (zero external scripts):** run `npx pen-sheet inline test.html -o standalone.html` so the runtime is embedded in one file.

## 3. Grading contract (Teacher feedback + red-pen marks)

Always transcribe the student's handwriting **verbatim before judging** (`readAs`, mistakes included, `[?]` if illegible). Return JSON:

```json
{
  "summary": "2 of 2 solid — clean algebra steps!",
  "grades": {
    "q1": {
      "verdict": "correct",
      "readAs": "3(x-4)=15 -> x-4=5 -> x=9",
      "comment": "Dividing both sides by 3 first kept the numbers simple.",
      "marks": [
        { "image": "q1", "kind": "tick", "x": 0.78, "y": 0.65, "w": 0.14, "h": 0.22, "note": "Nice step!" }
      ]
    }
  }
}
```
