#!/usr/bin/env node
// CLI for pen-sheet: serve (Option A API or Option B Agent), wait, reply, inline.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { inlinePenSheet, nextPendingRequest, startPenSheetServer, writeAgentReply } from "../server/index.mjs";

const args = process.argv.slice(2);
const cmd = args[0];

function flag(name, fallback = null) {
  const idx = args.indexOf(`--${name}`);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}

function usage() {
  console.log(`pen-sheet — stylus & e-ink worksheets with teacher feedback

Usage:
  pen-sheet serve <file.html> [--mode agent|api] [--port 8765] [--agent Teacher] [--provider anthropic|gemini|openai] [--key answer-key.txt]
  pen-sheet wait  <file.html> [--timeout 300]
  pen-sheet reply <file.html> <request-id> <reply.json>
  pen-sheet inline <file.html> -o <standalone.html>
`);
}

if (!cmd || cmd === "-h" || cmd === "--help") {
  usage();
  process.exit(0);
}

if (cmd === "inline") {
  const input = args[1];
  const output = flag("o") || args[args.indexOf("-o") + 1];
  if (!input || !output) {
    usage();
    process.exit(1);
  }
  const html = inlinePenSheet(readFileSync(resolve(input), "utf8"));
  writeFileSync(resolve(output), html);
  console.log(`Wrote standalone worksheet to ${resolve(output)} (${(html.length / 1024).toFixed(1)} KB)`);
  process.exit(0);
}

if (cmd === "serve") {
  const page = args[1] && !args[1].startsWith("--") ? args[1] : null;
  const mode = flag("mode", process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY ? "api" : "agent");
  const port = Number(flag("port", "8765"));
  const agentName = flag("agent", "Teacher");
  const provider = flag("provider", null);
  const model = flag("model", null);
  const answerKeyPath = flag("key", null);
  const token = flag("token", undefined);

  const info = await startPenSheetServer({ pagePath: page, mode, port, token, agentName, provider, model, answerKeyPath });
  console.log(`pen-sheet server running in "${mode}" mode (port ${info.port})`);
  if (page) {
    console.log("Open on your stylus tablet (same Wi-Fi):");
    for (const u of info.urls) console.log(`  ${u}`);
    console.log(`Tip: for HTTPS low-latency ink (navigator.ink) + public sharing, run: tailscale funnel ${info.port}`);
  } else {
    console.log(`Grading endpoint: POST http://127.0.0.1:${info.port}/grade`);
  }
  if (mode === "agent" && page) {
    console.log(`Wait for submissions: pen-sheet wait "${resolve(page)}"`);
  }
  process.on("SIGINT", async () => {
    await info.close();
    process.exit(0);
  });
} else if (cmd === "wait") {
  const page = args[1];
  if (!page) {
    usage();
    process.exit(1);
  }
  const timeoutSec = Number(flag("timeout", "300"));
  const deadline = Date.now() + timeoutSec * 1000;
  while (Date.now() < deadline) {
    const req = nextPendingRequest(page);
    if (req) {
      console.log(`Request ${req.id} (${req.images.length} handwriting image(s)):`);
      console.log(req.prompt);
      console.log(`\nReply with: pen-sheet reply "${resolve(page)}" ${req.id} reply.json`);
      process.exit(0);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log("Nothing yet.");
  process.exit(0);
} else if (cmd === "reply") {
  const [, page, id, replyPath] = args;
  if (!page || !id || !replyPath) {
    usage();
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(resolve(replyPath), "utf8"));
  const out = writeAgentReply(page, id, data);
  console.log(`Sent reply to ${out}`);
  process.exit(0);
} else {
  usage();
  process.exit(1);
}
