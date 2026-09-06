import { getStore } from "@netlify/blobs";

const STORE_NAME = "productlink-products";
const KEY = "catalog";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function normalizeProduct(p) {
  if (!p || typeof p !== "object") return null;
  const title = String(p.title || "").trim();
  const price = Number(p.price) || 0;
  const url = String(p.url || "").trim();
  if (!title || price <= 0 || !url) return null;

  return {
    id: Number(p.id) || 0,
    title,
    price,
    originalPrice: p.originalPrice == null ? null : Number(p.originalPrice) || null,
    image: String(p.image || ""),
    url,
    category: String(p.category || "beauty"),
    tags: Array.isArray(p.tags) ? p.tags : [],
    clicks: Number(p.clicks) || 0,
    highlight: String(p.highlight || ""),
    reason: String(p.reason || "")
  };
}

export default async (req) => {
  try {
    const store = getStore(STORE_NAME);

    if (req.method === "GET") {
      const products = (await store.get(KEY, { type: "json", consistency: "strong" })) || [];
      return json({ products: Array.isArray(products) ? products : [] });
    }

    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const body = await req.json();
    const incoming = Array.isArray(body?.products) ? body.products : [];
    if (!incoming.length) return json({ error: "No products supplied" }, 400);

    const current = (await store.get(KEY, { type: "json", consistency: "strong" })) || [];
    const existing = Array.isArray(current) ? current : [];

    const byUrl = new Map();
    for (const p of existing) {
      const n = normalizeProduct(p);
      if (n) byUrl.set(n.url, n);
    }

    let maxId = existing.reduce((max, p) => Math.max(max, Number(p?.id) || 0), 0);

    for (const raw of incoming) {
      const p = normalizeProduct(raw);
      if (!p) continue;
      if (byUrl.has(p.url)) continue;
      if (!p.id || p.id <= maxId) p.id = ++maxId;
      else maxId = p.id;
      byUrl.set(p.url, p);
    }

    const products = [...byUrl.values()];
    await store.setJSON(KEY, products);

    return json({
      ok: true,
      saved: products.length - existing.length,
      total: products.length
    });
  } catch (error) {
    console.error("products function error", error);
    return json({ error: "Storage error", detail: error?.message || "Unknown error" }, 500);
  }
};
