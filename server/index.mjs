// Dedicated server mode for pen-sheet (zero external dependencies, Node 22+).
// Supports BOTH:
//   - mode: "agent" (Option B): saves submissions + PNGs in <file>.inbox/ and lets a live coding agent grade via wait/reply.
//   - mode: "api"   (Option A): grades submissions directly via Anthropic, Gemini, or OpenAI vision APIs.
// Also works as a CORS-enabled /grade endpoint for static HTML worksheets hosted anywhere.

import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIST_BUNDLE = fileURLToPath(new URL("../dist/pen-sheet.js", import.meta.url));
const MAX_BODY_BYTES = 25 * 1024 * 1024;

function atomicWriteJson(file, data) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, file);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function lanAddresses() {
  const out = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const addr of list ?? []) {
      if (addr.family === "IPv4" && !addr.internal) out.push(addr.address);
    }
  }
  return out;
}

export function inboxDirFor(pagePath) {
  const abs = resolve(pagePath);
  const name = basename(abs).replace(/\.html?$/i, "");
  return join(dirname(abs), `${name}.inbox`);
}

/** Inject dedicated endpoint config + local /pen-sheet.js rewrite into a served HTML file. */
export function prepareServedHtml(html, { endpoint, agentName, scriptUrl = "/pen-sheet.js" }) {
  const cfg = JSON.stringify({ endpoint, agentName }).replace(/<\//g, "<\\/");
  const inject = `<script>window.penSheetConfig=${cfg};</script>`;
  // Rewrite local or relative pen-input.js / pen-sheet.js references to the server's bundle,
  // while leaving explicit CDN URLs intact unless offline.
  let out = html.replace(
    /<script([^>]*?)\bsrc=["'](?:\.\/)?(?:pen-input|pen-sheet)\.js["']([^>]*)><\/script>/gi,
    `<script$1src="${scriptUrl}"$2></script>`,
  );
  if (/<\/head>/i.test(out)) return out.replace(/<\/head>/i, `${inject}\n</head>`);
  return `${inject}\n${out}`;
}

/** Inline the pen-sheet bundle into an HTML file so it works as a standalone file or Claude Artifact. */
export function inlinePenSheet(html, bundlePath = DIST_BUNDLE) {
  const bundle = readFileSync(bundlePath, "utf8").replace(/<\/script/gi, "<\\/script");
  const scriptRe = /<script[^>]*\bsrc=["'][^"']*(?:pen-sheet|pen-input)(?:\.esm)?\.js["'][^>]*><\/script>/i;
  if (!scriptRe.test(html)) {
    throw new Error('HTML must include <script src="...pen-sheet.js"></script> or <script src="pen-input.js"></script>');
  }
  return html.replace(scriptRe, () => `<script>\n${bundle}\n</script>`);
}

/** Grade a submission via Anthropic, Gemini, or OpenAI vision APIs (Option A dedicated API mode). */
export async function gradeViaApi(payload, { provider, apiKey, model, answerKey } = {}) {
  const resolvedProvider =
    provider ||
    (process.env.ANTHROPIC_API_KEY ? "anthropic" : process.env.GEMINI_API_KEY ? "gemini" : process.env.OPENAI_API_KEY ? "openai" : null);
  const key =
    apiKey ||
    (resolvedProvider === "anthropic"
      ? process.env.ANTHROPIC_API_KEY
      : resolvedProvider === "gemini"
        ? process.env.GEMINI_API_KEY
        : resolvedProvider === "openai"
          ? process.env.OPENAI_API_KEY
          : null);
  if (!resolvedProvider || !key) {
    throw new Error("API grading requires ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY");
  }
  const blocks = Array.isArray(payload?.content) ? [...payload.content] : [];
  if (answerKey) {
    blocks.unshift({ type: "text", text: `Teacher answer key (keep private, use for grading):\n${answerKey}` });
  }

  if (resolvedProvider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || process.env.PEN_SHEET_MODEL || "claude-sonnet-4-5",
        max_tokens: 4096,
        messages: [{ role: "user", content: blocks }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error (${res.status}): ${await res.text()}`);
    const data = await res.json();
    const reply = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("");
    return { reply };
  }

  if (resolvedProvider === "gemini") {
    const parts = blocks.map((b) =>
      b.type === "image" || b.type === "document"
        ? { inline_data: { mime_type: b.source?.media_type || (b.type === "document" ? "application/pdf" : "image/png"), data: b.source?.data } }
        : { text: String(b.text ?? "") },
    );
    const chosenModel = model || process.env.PEN_SHEET_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(chosenModel)}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts }] }),
    });
    if (!res.ok) throw new Error(`Gemini API error (${res.status}): ${await res.text()}`);
    const data = await res.json();
    const reply = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    return { reply };
  }

  if (resolvedProvider === "openai") {
    const content = blocks.map((b) =>
      b.type === "image"
        ? { type: "image_url", image_url: { url: `data:${b.source?.media_type || "image/png"};base64,${b.source?.data}` } }
        : { type: "text", text: String(b.text ?? "") },
    );
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: model || process.env.PEN_SHEET_MODEL || "gpt-4o",
        messages: [{ role: "user", content }],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error (${res.status}): ${await res.text()}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "";
    return { reply };
  }

  throw new Error(`Unsupported provider: ${resolvedProvider}`);
}

function writeAgentRequest(inboxDir, payload) {
  mkdirSync(inboxDir, { recursive: true });
  const id = `${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
  const images = [];
  const blocks = Array.isArray(payload?.content) ? payload.content : [];
  let imgIndex = 0;
  let docIndex = 0;
  const textParts = [];
  for (const b of blocks) {
    if (b?.type === "text" && typeof b.text === "string") {
      textParts.push(b.text);
    } else if (b?.type === "image" && b.source?.data) {
      imgIndex++;
      const ext = b.source.media_type === "image/jpeg" ? "jpg" : b.source.media_type === "image/webp" ? "webp" : "png";
      const imgFile = join(inboxDir, `req-${id}-img-${imgIndex}.${ext}`);
      writeFileSync(imgFile, Buffer.from(b.source.data, "base64"));
      images.push(imgFile);
      textParts.push(`[Image ${imgIndex}: ${imgFile}]`);
    } else if (b?.type === "document" && b.source?.data) {
      docIndex++;
      const docFile = join(inboxDir, `req-${id}-doc-${docIndex}.pdf`);
      writeFileSync(docFile, Buffer.from(b.source.data, "base64"));
      images.push(docFile);
      textParts.push(`[Document ${docIndex}: ${docFile}]`);
    }
  }
  const reqFile = join(inboxDir, `req-${id}.json`);
  atomicWriteJson(reqFile, {
    id,
    createdAt: new Date().toISOString(),
    prompt: textParts.join("\n\n"),
    images,
    submission: payload?.submission ?? null,
    expects: payload?.expects ?? null,
  });
  return { id, reqFile, images };
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error("Payload too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res, status, data, corsOrigin = "*") {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": corsOrigin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
  });
  res.end(body);
}

/**
 * Start a dedicated pen-sheet server.
 * - Serves the HTML worksheet at /<token>/ (if pagePath is given) and /pen-sheet.js.
 * - Exposes POST /<token>/grade (and POST /grade in api-only mode) + GET /<token>/poll/<id>.
 */
export async function startPenSheetServer({
  pagePath = null,
  mode = "agent",
  host = "0.0.0.0",
  port = 8765,
  token = randomBytes(4).toString("hex"),
  agentName = mode === "api" ? "Teacher" : "Agent",
  provider = null,
  apiKey = null,
  model = null,
  answerKeyPath = null,
  corsOrigin = "*",
} = {}) {
  const absPage = pagePath ? resolve(pagePath) : null;
  const inboxDir = absPage ? inboxDirFor(absPage) : resolve(".pen-sheet.inbox");
  if (mode === "agent") mkdirSync(inboxDir, { recursive: true });
  const prefix = `/${token}`;

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      const pathname = url.pathname;

      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "access-control-allow-origin": corsOrigin,
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "content-type, authorization",
        });
        res.end();
        return;
      }

      if (req.method === "GET" && (pathname === "/pen-sheet.js" || pathname === `${prefix}/pen-sheet.js`)) {
        const js = readFileSync(DIST_BUNDLE, "utf8");
        res.writeHead(200, { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store" });
        res.end(js);
        return;
      }

      if (req.method === "GET" && absPage && (pathname === prefix || pathname === `${prefix}/`)) {
        const raw = readFileSync(absPage, "utf8");
        const html = prepareServedHtml(raw, {
          endpoint: `${prefix}/grade`,
          agentName,
          scriptUrl: `${prefix}/pen-sheet.js`,
        });
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
        res.end(html);
        return;
      }

      if (req.method === "POST" && (pathname === `${prefix}/grade` || (!absPage && pathname === "/grade"))) {
        const payload = JSON.parse((await readBody(req)) || "{}");
        if (mode === "api") {
          const answerKey = answerKeyPath && existsSync(answerKeyPath) ? readFileSync(answerKeyPath, "utf8") : "";
          const result = await gradeViaApi(payload, { provider, apiKey, model, answerKey });
          sendJson(res, 200, result, corsOrigin);
          return;
        }
        const { id } = writeAgentRequest(inboxDir, payload);
        sendJson(res, 200, { id, status: "pending", pollUrl: `${prefix}/poll/${encodeURIComponent(id)}` }, corsOrigin);
        return;
      }

      const pollMatch = req.method === "GET" && pathname.match(new RegExp(`^${prefix}/poll/([a-z0-9-]+)$`, "i"));
      if (pollMatch) {
        const id = pollMatch[1];
        const reqFile = join(inboxDir, `req-${id}.json`);
        if (!existsSync(reqFile)) return sendJson(res, 404, { error: "Unknown request" }, corsOrigin);
        const replyFile = join(inboxDir, `reply-${id}.json`);
        if (existsSync(replyFile)) {
          const reply = readJson(replyFile);
          return sendJson(res, 200, reply, corsOrigin);
        }
        return sendJson(res, 200, { id, status: "pending" }, corsOrigin);
      }

      sendJson(res, 404, { error: "Not found" }, corsOrigin);
    } catch (err) {
      sendJson(res, 500, { error: String(err?.message || err) }, corsOrigin);
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(port, host, resolveListen);
  });

  const addr = server.address();
  const actualPort = typeof addr === "object" && addr ? addr.port : port;
  const urls = lanAddresses().map((ip) => `http://${ip}:${actualPort}${prefix}/`);
  return {
    server,
    port: actualPort,
    token,
    prefix,
    inboxDir,
    urls,
    gradeEndpoint: `http://127.0.0.1:${actualPort}${prefix}/grade`,
    close: () => new Promise((r) => server.close(r)),
  };
}

/** Find the next unanswered request in an inbox (for Option B agent mode). */
export function nextPendingRequest(pagePath) {
  const dir = inboxDirFor(pagePath);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => /^req-[a-z0-9-]+\.json$/i.test(f))
    .sort();
  for (const file of files) {
    const id = file.slice(4, -5);
    if (!existsSync(join(dir, `reply-${id}.json`))) {
      return readJson(join(dir, file));
    }
  }
  return null;
}

/** Write a teacher grading reply for an Option B agent request. */
export function writeAgentReply(pagePath, id, replyObj) {
  const dir = inboxDirFor(pagePath);
  const reqFile = join(dir, `req-${id}.json`);
  if (!existsSync(reqFile)) throw new Error(`No request ${id} in ${dir}`);
  const normalized =
    typeof replyObj === "string"
      ? { reply: replyObj }
      : replyObj?.reply || replyObj?.grades || replyObj?.questions
        ? replyObj
        : { reply: JSON.stringify(replyObj) };
  const replyFile = join(dir, `reply-${id}.json`);
  atomicWriteJson(replyFile, normalized);
  return replyFile;
}
