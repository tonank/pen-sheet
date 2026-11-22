# pen-sheet

Zero-dependency **e-ink & stylus worksheet Web Components** (`<pen-toolbar>`, `<pen-input>`, `<pen-submit>`) built for Onyx Boox, iPad, Surface, and any browser — with red-pen teacher markup and pluggable server/API/agent grading modes.

## Quick start (CDN — works on any HTTPS web page)

Live HTTPS e-ink demo (try it on an Onyx Boox / iPad / Surface): **https://tonank.github.io/pen-sheet/**

```html
<!doctype html>
<html lang="en" class="hwq-eink">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Quick Math Check</title>
</head>
<body>
  <pen-toolbar></pen-toolbar>
  <h1>Quick Math Check</h1>
  <p>Solve 3(x − 4) = 15:</p>
  <pen-input name="q1" paper="grid" height="420"></pen-input>
  <pen-submit endpoint="https://your-grader.workers.dev/grade" agent="Teacher">Ready</pen-submit>
  <script src="https://cdn.jsdelivr.net/gh/tonank/pen-sheet@main/dist/pen-sheet.js"></script>
</body>
</html>
```

## Install as an Agent Skill

```sh
# Claude Code / Codex / Antigravity (via skills CLI)
npx skills add tonank/pen-sheet
```
Or copy [SKILL.md](./SKILL.md) into `~/.claude/skills/pen-sheet/SKILL.md` (or `~/.codex/skills/pen-sheet/SKILL.md`).

## Features tuned for real stylus & e-ink hardware

- **E-ink / Onyx Boox ready**: pure black-on-white mode (`html.hwq-eink`), no animations/ghosting, batched single-call stroke rendering, and no `desynchronized: true` (which causes invisible ink on Android/Boox EPD compositors).
- **HTTPS low-latency ink**: over HTTPS, automatically uses `navigator.ink` (Delegated Ink Trails) and full-rate `getCoalescedEvents()`.
- **Palm rejection & pen ergonomics**: fingers scroll automatically once a stylus is seen; barrel button / eraser end erases; scribble-to-erase; draw-and-hold to straighten lines; auto-growing paper.
- **Red-pen teacher markup**: SVG ticks, crosses, circles, underlines, and notes rendered directly on top of the student's handwriting.
- **Native Boox NeoReader / Notes PDF round-trip**: tap **`📄 Boox PDF`** to generate a clean multi-page A4 worksheet PDF (100% pure JS, zero dependencies, full Unicode/SVG/grid/ruled support), write directly in Boox's native zero-latency **NeoReader** (which embeds your strokes back into the PDF automatically) or **Notes**, then tap **`📎 Grade Boox PDF / PNG`** to upload the filled file and grade it right on the page.
- **Autosave & recovery**: strokes and typed inputs persist in `localStorage` (or Claude artifact storage) across reloads.

## Dedicated Server Modes

One library powers every grading workflow:

### 1. Hosted API Server (Option A — public URL, zero login)
Point `<pen-submit endpoint="https://...">` (or `PenSheet.configure({ endpoint, headers })`) at any grading endpoint — see [examples/cloudflare-worker.js](./examples/cloudflare-worker.js) for a drop-in Cloudflare Worker (Anthropic or Gemini), or run locally with your API key:

```sh
ANTHROPIC_API_KEY=sk-... npx pen-sheet serve examples/notebook-test.html --mode api
```

### 2. Live Agent Server (Option B — your coding agent acts as the teacher)
Serve any HTML worksheet locally (or expose over HTTPS with `tailscale funnel 8765` to unlock `navigator.ink` on Boox):

```sh
npx pen-sheet serve examples/notebook-test.html --mode agent
npx pen-sheet wait  examples/notebook-test.html
npx pen-sheet reply examples/notebook-test.html <request-id> reply.json
```

### 3. Custom JS Grader
```js
PenSheet.configure({
  agentName: "Teacher",
  grader: async ({ submission }) => ({
    summary: "Nice work!",
    grades: { q1: { verdict: "correct", readAs: "x = 9", comment: "Spot on." } },
  }),
});
```

### 4. Standalone / Claude Artifact (zero external scripts)
```sh
npx pen-sheet inline examples/notebook-test.html -o standalone.html
```

## Server JSON Contract

`POST <endpoint>` receives:
```json
{
  "content": [{ "type": "text", "text": "..." }, { "type": "image", "source": { "type": "base64", "media_type": "image/png", "data": "..." } }],
  "submission": {
    "title": "Notebook Stylus Test",
    "pageText": "...",
    "items": [{ "id": "q1", "label": "...", "images": [{ "id": "q1", "png": "data:image/png;base64,...", "box": [0, 0, 1000, 420] }] }]
  }
}
```

Respond with **any** of:
- Direct grades: `{ "summary": "...", "grades": { "q1": { "verdict": "correct", "readAs": "...", "comment": "...", "marks": [...] } } }`
- Raw model reply: `{ "reply": "{\"questions\":[...],\"summary\":\"...\"}" }`
- Async polling job: `{ "id": "...", "pollUrl": "/.../poll/..." }` (polled until grades/reply are ready)

## License

MIT
