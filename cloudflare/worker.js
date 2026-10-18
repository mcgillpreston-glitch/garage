// Garage Stock photo storage — Cloudflare Worker backed by Workers KV.
// Bindings:  PHOTOS (KV namespace "garage-stock-photos")
// Secret:    UPLOAD_KEY (the same key you paste into the app's Settings)
//
// GET    /photos/<key>  -> the photo (public link, cached for a year)
// PUT    /photos/<key>  -> store a JPEG/PNG/WebP (needs Authorization: Bearer <UPLOAD_KEY>)
// DELETE /photos/<key>  -> remove it (needs the key)
// GET    /ping          -> {"ok":true,"auth":true|false} to test the connection and key

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};
const KEY_RE = /^[A-Za-z0-9_-]{1,120}$/;
const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function authorized(req, env) {
  const h = req.headers.get("Authorization") || "";
  return !!env.UPLOAD_KEY && h === "Bearer " + env.UPLOAD_KEY;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (!env.PHOTOS) return json({ error: "KV binding PHOTOS is missing" }, 500);

    if (url.pathname === "/ping") return json({ ok: true, auth: authorized(req, env) });
    if (url.pathname === "/") return new Response("Garage Stock photo storage is running.", { headers: CORS });

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
