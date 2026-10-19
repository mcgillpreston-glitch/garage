// Home Stock + Garage Stock storage — Cloudflare Worker backed by Workers KV.
// Bindings:  PHOTOS (KV namespace "garage-stock-photos")
// Secret:    UPLOAD_KEY (the same key you paste into the apps' Settings)
//
// Photos
//   GET    /photos/<key>  -> the photo (public link, cached for a year)
//   PUT    /photos/<key>  -> store a JPEG/PNG/WebP (needs the key)
//   DELETE /photos/<key>  -> remove it (needs the key)
// Synced app data (needs the key)
//   GET    /data/<name>   -> {version, updatedAt, doc}
//   PUT    /data/<name>   -> body {baseVersion, doc}; 409 with the current copy if someone saved first
// Other
//   GET    /ping          -> {"ok":true,"auth":true|false,"data":true}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};
const KEY_RE = /^[A-Za-z0-9_-]{1,120}$/;
const NAME_RE = /^[a-z0-9_-]{1,40}$/;
const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DOC = 20 * 1024 * 1024;

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store", ...extra } });

function authorized(req, env) {
  const h = req.headers.get("Authorization") || "";
  return !!env.UPLOAD_KEY && h === "Bearer " + env.UPLOAD_KEY;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (!env.PHOTOS) return json({ error: "KV binding PHOTOS is missing" }, 500);

    if (url.pathname === "/ping") return json({ ok: true, auth: authorized(req, env), data: true });
    if (url.pathname === "/") return new Response("Home Stock / Garage Stock storage is running.", { headers: CORS });

    // ---- synced app data ----
    const d = url.pathname.match(/^\/data\/([^/]+)$/);
    if (d) {
      const name = d[1];
      if (!NAME_RE.test(name)) return json({ error: "Not found" }, 404);
      if (!authorized(req, env)) return json({ error: "Wrong or missing upload key" }, 401);
      const kvKey = "data:" + name;
      const current = (await env.PHOTOS.get(kvKey, { type: "json" })) || { version: 0, updatedAt: 0, doc: null };
      if (req.method === "GET") return json(current);
      if (req.method === "PUT") {
        const text = await req.text();
        if (text.length > MAX_DOC) return json({ error: "Data is too large" }, 413);
        let body; try { body = JSON.parse(text); } catch (e) { return json({ error: "Send JSON" }, 400); }
        if (!body || typeof body.doc !== "object" || body.doc === null) return json({ error: "Missing doc" }, 400);
        if ((body.baseVersion || 0) !== current.version) return json(current, 409);
        const next = { version: current.version + 1, updatedAt: Date.now(), doc: body.doc };
        await env.PHOTOS.put(kvKey, JSON.stringify(next));
        return json({ version: next.version, updatedAt: next.updatedAt });
      }
      return json({ error: "Method not allowed" }, 405);
    }

    // ---- photos ----
    const m = url.pathname.match(/^\/photos\/([^/]+)$/);
    if (!m || !KEY_RE.test(m[1])) return json({ error: "Not found" }, 404);
    const key = m[1];

    if (req.method === "GET" || req.method === "HEAD") {
      const { value, metadata } = await env.PHOTOS.getWithMetadata(key, { type: "arrayBuffer" });
      if (!value) return json({ error: "Not found" }, 404);
      return new Response(req.method === "HEAD" ? null : value, {
        headers: { ...CORS, "Content-Type": (metadata && metadata.type) || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
      });
    }

    if (!authorized(req, env)) return json({ error: "Wrong or missing upload key" }, 401);

    if (req.method === "PUT") {
      const type = (req.headers.get("Content-Type") || "").split(";")[0].trim();
      if (!TYPES.includes(type)) return json({ error: "Send a JPEG, PNG or WebP image" }, 415);
      const body = await req.arrayBuffer();
      if (!body.byteLength || body.byteLength > MAX_BYTES) return json({ error: "Image must be under 5 MB" }, 413);
      await env.PHOTOS.put(key, body, { metadata: { type, size: body.byteLength, at: Date.now() } });
      return json({ ok: true, url: `${url.origin}/photos/${key}` }, 201);
    }

    if (req.method === "DELETE") {
      await env.PHOTOS.delete(key);
      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, 405);
  },
};
