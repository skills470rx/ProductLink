function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function meta(html, property) {
  const safe = property.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${safe}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${safe}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${safe}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${safe}["']`, "i")
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtml(m[1]).trim();
  }
  return "";
}

function firstPrice(html) {
  const candidates = [];
  for (const m of html.matchAll(/฿\s*([\d,]+(?:\.\d+)?)/g)) candidates.push(Number(m[1].replace(/,/g, "")));
  for (const m of html.matchAll(/"price"\s*:\s*"?([\d,.]+)/g)) candidates.push(Number(m[1].replace(/,/g, "")));
  for (const m of html.matchAll(/"price"\s*:\s*(\d+)/g)) {
    const n = Number(m[1]);
    candidates.push(n > 100000 ? n / 100000 : n);
  }
  const valid = candidates.filter(n => Number.isFinite(n) && n > 0 && n < 10000000);
  return valid.length ? Math.min(...valid) : 0;
}

function categoryFromTitle(title) {
  const t = title.toLowerCase();
  if (/ทาง|รถ|มอเตอร์|รถยนต์|รถกระบะ|ล้อใหญ่|สเปรย์|ยาง/.test(t)) return "auto";
  if (/แฟชั่น|เสื้อ|กระเป๋า|รองเท้า|มือถือ|หูของ|ร้องเท้า/.test(t)) return "fashion";
  if (/หูฟัง|ลำโพง|มอนิเตอร์|มือถือ|แล็ปท็อป|คอม|เกม/.test(t)) return "tech";
  if (/เครื่องของใช้|ม่าน|นอน|ของใช้|ห้อง|บ้าน/.test(t)) return "home";
  return "beauty";
}

async function fetchShopee(url) {
  const attempts = [
    { headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "th-TH,th;q=0.9,en;q=0.8" } },
    { headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" } }
  ];

  let lastError = "";
  for (let i = 0; i < attempts.length; i++) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
        ...attempts[i]
      });
      if (!response.ok) throw new Error(`Shopee HTTP ${response.status}`);
      const html = await response.text();
      if (html.length < 1000) throw new Error("Shopee returned an incomplete page");
      return { html, finalUrl: response.url || url };
    } catch (e) {
      lastError = e?.message || "Fetch failed";
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }

  // Last-resort server-side proxy. The browser never talks to this proxy directly,
  // so the import flow no longer depends on browser CORS.
  try {
    const proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
    const response = await fetch(proxy, {
      signal: AbortSignal.timeout(15000),
      headers: { "Accept": "text/html,application/xhtml+xml" }
    });
    if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);
    const html = await response.text();
    if (html.length < 1000) throw new Error("Proxy returned an incomplete page");
    return { html, finalUrl: url };
  } catch (e) {
    lastError = `${lastError}; fallback: ${e?.message || "failed"}`;
  }

  throw new Error(lastError || "ไม่สามารถดึงหน้า Shopee ได้");
}

export default async (req) => {
  try {
    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

    const requestUrl = new URL(req.url);
    const url = requestUrl.searchParams.get("url")?.trim();
    if (!url || !/^https?:\/\/(?:[^/]+\.)?shopee\.(?:co\.th|com)(?:\/|$)/i.test(url)) {
      return json({ error: "ลิงก์ Shopee ไม่ถูกต้อง" }, 400);
    }

    const { html, finalUrl } = await fetchShopee(url);
    const rawTitle = meta(html, "og:title") || meta(html, "twitter:title") || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "");
    const title = decodeHtml(rawTitle).replace(/\s*\|\s*Shopee.*$/i, "").trim();
    const image = meta(html, "og:image") || meta(html, "twitter:image");
    const description = meta(html, "og:description") || meta(html, "description");
    const price = firstPrice(html);

    const originalMatches = [...html.matchAll(/"price_before_discount"\s*:\s*(\d+)/g)]
      .map(m => Number(m[1]) > 1000 ? Number(m[1]) / 100000 : Number(m[1]))
      .filter(n => n > price && n < 10000000);
    const originalPrice = originalMatches.length ? Math.max(...originalMatches) : null;

    if (!title || !price) {
      throw new Error("Shopee page ไม่มีชื่อหรือราคาในรูปแบบที่อ่านได้");
    }

    return json({
      title,
      image: image || "",
      price,
      originalPrice,
      url: finalUrl || url,
      category: categoryFromTitle(title),
      highlight: description || "",
      reason: ""
    });
  } catch (error) {
    console.error("shopee import error", error);
    return json({ error: error?.message || "ดึงข้อมูล Shopee ไม่สำเร็จ" }, 502);
  }
};
