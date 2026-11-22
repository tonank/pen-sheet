/**
 * Option A — Serverless Cloudflare Worker grading endpoint for pen-sheet.
 *
 * Deploy this once (`wrangler deploy`), set secret ANTHROPIC_API_KEY or GEMINI_API_KEY,
 * then point ANY static HTML worksheet anywhere on the web at it:
 *   <pen-submit endpoint="https://pen-grader.<you>.workers.dev/grade">Ready</pen-submit>
 */
export default {
  async fetch(request, env) {
    const cors = {
      "access-control-allow-origin": env.ALLOWED_ORIGIN || "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type, authorization",
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

    if (env.SHARED_SECRET && request.headers.get("authorization") !== `Bearer ${env.SHARED_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });
    }

    const body = await request.json();
    const blocks = Array.isArray(body?.content) ? body.content : [];

    if (env.ANTHROPIC_API_KEY) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: env.MODEL || "claude-sonnet-4-5",
          max_tokens: 4096,
          messages: [{ role: "user", content: blocks }],
        }),
      });
      if (!res.ok) return Response.json({ error: await res.text() }, { status: res.status, headers: cors });
      const data = await res.json();
      const reply = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("");
      return Response.json({ reply }, { headers: cors });
    }

    if (env.GEMINI_API_KEY) {
      const parts = blocks.map((b) =>
        b.type === "image" || b.type === "document"
          ? { inline_data: { mime_type: b.source?.media_type || (b.type === "document" ? "application/pdf" : "image/png"), data: b.source?.data } }
          : { text: String(b.text ?? "") },
      );
      const model = env.MODEL || "gemini-2.5-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts }] }),
        },
      );
      if (!res.ok) return Response.json({ error: await res.text() }, { status: res.status, headers: cors });
      const data = await res.json();
      const reply = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
      return Response.json({ reply }, { headers: cors });
    }

    return Response.json({ error: "Configure ANTHROPIC_API_KEY or GEMINI_API_KEY" }, { status: 500, headers: cors });
  },
};
