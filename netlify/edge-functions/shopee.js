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

function allowedShopeeHost(hostname = "") {
  const host = String(hostname).toLowerCase();
  return host === "shopee.co.th"
    || host.endsWith(".shopee.co.th")
    || host === "shopee.com"
    || host.endsWith(".shopee.com");
}

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

function extractProductIds(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const path = decodeURIComponent(u.pathname);
    const patterns = [
      /\/product\/(\d+)\/(\d+)/i,
      /(?:^|[-/])i\.(\d+)\.(\d+)(?:$|[/?#])/i,
      /\/opaanlp\/(\d+)\/(\d+)/i
    ];
    for (const re of patterns) {
      const m = path.match(re);
      if (m) return { shopId: m[1], itemId: m[2] };
    }
    const shopId = u.searchParams.get('shopid') || u.searchParams.get('shop_id') || u.searchParams.get('shopId');
    const itemId = u.searchParams.get('itemid') || u.searchParams.get('item_id') || u.searchParams.get('itemId');
    if (/^\d+$/.test(shopId || '') && /^\d+$/.test(itemId || '')) return { shopId, itemId };
  } catch (_) {}
  return null;
}

function apiPrice(value) {
  const n = Number(String(value ?? '').replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n >= 100000 ? n / 100000 : n;
}

function apiImage(value) {
  if (!value) return '';
  if (typeof value === 'object') value = value.image || value.image_id || value.url || value.image_url || '';
  if (!value) return '';
  const s = String(value);
  return /^https?:\/\//i.test(s) ? s : 'https://down-th.img.susercontent.com/file/' + s;
}

function normalizeApiProduct(payload, originalUrl, finalUrl) {
  const data = payload?.data || payload || {};
  const item = data.item || payload?.item || data;
  const productPrice = data.product_price?.price || {};
  const before = data.product_price?.price_before_discount || {};
  const title = item.title || item.name || data.name || '';
  const price = apiPrice(productPrice.single_value ?? productPrice.range_min ?? item.price ?? data.price);
  const originalRaw = apiPrice(before.single_value ?? before.range_min ?? item.price_before_discount ?? data.price_before_discount);
  let image = item.image || data.image || '';
  const images = data.product_images?.images || item.images || data.images;
  if (!image && Array.isArray(images) && images.length) image = images[0];
  if (!title || !price) return null;
  return {
    title: String(title).trim(),
    image: apiImage(image),
    price,
    originalPrice: originalRaw > price ? originalRaw : null,
    url: originalUrl,
    category: categoryFromTitle(String(title)),
    highlight: String(item.description || data.description || ''),
    reason: '',
    source: 'shopee-api',
    resolvedUrl: finalUrl
  };
}

function unwrapOriginLink(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const origin = u.searchParams.get('origin_link');
    if (origin) return decodeURIComponent(origin);
  } catch (_) {}
  return rawUrl;
}

function decodePossibleUrl(value = '') {
  let s = decodeHtml(String(value))
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/')
    .replace(/\\u0026/gi, '&')
    .replace(/&amp;/gi, '&')
    .trim();
  try { s = decodeURIComponent(s); } catch (_) {}
  return s;
}

function shoPeeCandidateFromHtml(html, baseUrl) {
  const candidates = [];
  const refresh = html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]+content=["'][^"']*url\s*=\s*([^"'>]+)["']/i)
    || html.match(/<meta[^>]+content=["'][^"']*url\s*=\s*([^"'>]+)["'][^>]+http-equiv=["']?refresh["']?/i);
  if (refresh?.[1]) candidates.push(refresh[1]);

  for (const m of html.matchAll(/(?:https?:\\\/\\\/|https?:\/\/)[^"'<>\s]+/gi)) candidates.push(m[0]);
  for (const m of html.matchAll(/(?:origin_link|target_url|targetUrl|redirect_url|redirectUrl|deep_link|deepLink)["']?\s*[:=]\s*["']([^"']+)["']/gi)) candidates.push(m[1]);
  const canonical = meta(html, 'og:url') || (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] || '');
  if (canonical) candidates.unshift(canonical);

  for (const raw of candidates) {
    try {
      const decoded = decodePossibleUrl(raw);
      const absolute = new URL(decoded, baseUrl).toString();
      const u = new URL(absolute);
      if (allowedShopeeHost(u.hostname) && (extractProductIds(absolute) || u.hostname !== 's.shopee.co.th')) return absolute;
    } catch (_) {}
  }
  return '';
}

async function resolveViaMicrolink(rawUrl) {
  try {
    const response = await fetch('https://api.microlink.io?url=' + encodeURIComponent(rawUrl), {
      signal: AbortSignal.timeout(3200),
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) return '';
    const payload = await response.json();
    const candidates = [payload?.data?.url, payload?.data?.publisher?.url, payload?.data?.author?.url].filter(Boolean);
    for (const candidate of candidates) {
      try {
        const decoded = decodePossibleUrl(candidate);
        const u = new URL(decoded);
        if (allowedShopeeHost(u.hostname) && u.hostname !== 's.shopee.co.th') return decoded;
      } catch (_) {}
    }
  } catch (_) {}
  return '';
}

async function resolveViaDomainee(rawUrl) {
  try {
    const endpoint = 'https://api.domainee.dev/v1/tools/redirect-checker?url=' + encodeURIComponent(rawUrl);
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(3200), headers: { 'Accept': 'application/json' } });
    if (!response.ok) return '';
    const payload = await response.json();
    const candidates = [payload?.data?.finalUrl, ...(payload?.data?.hops || []).map(h => h?.url)].filter(Boolean).reverse();
    for (const candidate of candidates) {
      try {
        const decoded = decodePossibleUrl(candidate);
        const u = new URL(decoded);
        if (allowedShopeeHost(u.hostname) && u.hostname !== 's.shopee.co.th') return decoded;
      } catch (_) {}
    }
  } catch (_) {}
  return '';
}

async function resolveViaRedirectCheck(rawUrl) {
  try {
    const endpoint = 'https://www.redirectcheck.org/api/check?url=' + encodeURIComponent(rawUrl) + '&ua=Googlebot';
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(3200), headers: { 'Accept': 'application/json' } });
    if (!response.ok) return '';
    const payload = await response.json();
    const candidates = [
      payload?.final_result?.final_url,
      payload?.final_result?.canonical,
      ...(payload?.redirects || []).flatMap(r => [r?.to, r?.from])
    ].filter(Boolean);
    for (const candidate of candidates) {
      try {
        const decoded = decodePossibleUrl(candidate);
        const u = new URL(decoded);
        if (allowedShopeeHost(u.hostname) && u.hostname !== 's.shopee.co.th') return decoded;
      } catch (_) {}
    }
  } catch (_) {}
  return '';
}

async function resolveDirect(rawUrl) {
  try {
    const response = await fetch(rawUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(3200),
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8'
      }
    });
    const finalUrl = unwrapOriginLink(response.url || rawUrl);
    try {
      const u = new URL(finalUrl);
      if (allowedShopeeHost(u.hostname) && u.hostname !== 's.shopee.co.th') return finalUrl;
    } catch (_) {}
    const html = await response.text();
    return shoPeeCandidateFromHtml(html, rawUrl);
  } catch (_) {
    return '';
  }
}

async function resolveShopeeUrl(rawUrl) {
  const unwrapped = unwrapOriginLink(rawUrl);
  if (extractProductIds(unwrapped)) return unwrapped;
  try {
    const u = new URL(unwrapped);
    if (allowedShopeeHost(u.hostname) && u.hostname !== 's.shopee.co.th') return unwrapped;
  } catch (_) {}

  const results = await Promise.allSettled([
    resolveDirect(unwrapped),
    resolveViaDomainee(unwrapped),
    resolveViaRedirectCheck(unwrapped),
    resolveViaMicrolink(unwrapped)
  ]);

  const candidates = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
  for (const candidate of candidates) if (extractProductIds(candidate)) return candidate;
  for (const candidate of candidates) {
    try {
      const u = new URL(candidate);
      if (allowedShopeeHost(u.hostname) && u.hostname !== 's.shopee.co.th') return candidate;
    } catch (_) {}
  }
  return unwrapped;
}
async function fetchApiProduct(ids, originalUrl, finalUrl) {
  if (!ids) return null;
  const endpoints = [
    'https://shopee.co.th/api/v4/pdp/get_pc?shop_id=' + ids.shopId + '&item_id=' + ids.itemId + '&tz_offset_minutes=420&detail_level=0',
    'https://shopee.co.th/api/v4/item/get?shopid=' + ids.shopId + '&itemid=' + ids.itemId
  ];
  const tasks = endpoints.map(async endpoint => {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(4500),
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
        'Referer': finalUrl,
        'x-api-source': 'pc',
        'x-requested-with': 'XMLHttpRequest'
      }
    });
    if (!response.ok) throw new Error('Shopee API HTTP ' + response.status);
    const payload = await response.json();
    const product = normalizeApiProduct(payload, originalUrl, finalUrl);
    if (!product) throw new Error('Shopee API returned no usable product');
    return product;
  });
  const results = await Promise.allSettled(tasks);
  for (const result of results) if (result.status === 'fulfilled' && result.value) return result.value;
  return null;
}

async function fetchJinaProduct(finalUrl, originalUrl) {
  try {
    const response = await fetch('https://r.jina.ai/' + finalUrl, {
      signal: AbortSignal.timeout(3800),
      headers: { 'Accept': 'text/plain' }
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (!text || text.length < 100) return null;

    const titleRaw = text.match(/^Title:\s*(.+)$/mi)?.[1] || '';
    const title = decodeHtml(titleRaw).replace(/\s*[|｜-]\s*Shopee.*$/i, '').trim();
    const prices = [...text.matchAll(/฿\s*([\d,]+(?:\.\d+)?)/g)]
      .map(m => Number(m[1].replace(/,/g, '')))
      .filter(n => Number.isFinite(n) && n > 0 && n < 10000000);
    const price = prices.length ? Math.min(...prices) : 0;
    const image = text.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i)?.[1] || '';
    if (!title || !price) return null;
    return {
      title,
      image,
      price,
      originalPrice: null,
      url: originalUrl,
      category: categoryFromTitle(title),
      highlight: '',
      reason: '',
      source: 'jina-reader',
      resolvedUrl: finalUrl
    };
  } catch (_) {
    return null;
  }
}
async function fetchShopee(url) {
  const finalUrl = await resolveShopeeUrl(url);
  const ids = extractProductIds(finalUrl) || extractProductIds(url);

  const apiTask = fetchApiProduct(ids, url, finalUrl);
  const jinaTask = fetchJinaProduct(finalUrl, url);
  const htmlTasks = [
    fetch(finalUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(3800),
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8' }
    }).then(async r => { if (!r.ok) throw new Error('Shopee HTTP ' + r.status); return r.text(); }),
    fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(finalUrl), {
      signal: AbortSignal.timeout(3800),
      headers: { 'Accept': 'text/html,application/xhtml+xml' }
    }).then(async r => { if (!r.ok) throw new Error('Proxy HTTP ' + r.status); return r.text(); })
  ];

  const [apiResult, jinaResult, htmlResults] = await Promise.all([
    apiTask,
    jinaTask,
    Promise.allSettled(htmlTasks)
  ]);
  if (apiResult) return { product: apiResult, finalUrl };
  if (jinaResult) return { product: jinaResult, finalUrl };
  for (const result of htmlResults) {
    if (result.status === 'fulfilled' && result.value && result.value.length >= 500) {
      return { html: result.value, finalUrl };
    }
  }
  const resolved = finalUrl !== url ? finalUrl : 'unresolved';
  throw new Error('Shopee import failed after resolver/API/page fallbacks; resolved=' + resolved);
}
export default async (req) => {
  try {
    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

    const requestUrl = new URL(req.url);
    const url = requestUrl.searchParams.get("url")?.trim();
    if (!url || !/^https?:\/\/(?:[^/]+\.)?shopee\.(?:co\.th|com)(?:\/|$)/i.test(url)) {
      return json({ error: "ลิงก์ Shopee ไม่ถูกต้อง" }, 400);
    }

    const fetched = await fetchShopee(url);
    if (fetched.product) return json(fetched.product);
    const { html, finalUrl } = fetched;
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


export const config = { path: "/api/shopee" };
