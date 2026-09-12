function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36";
const ACCEPT_LANGUAGE = "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7";
const SHOPEE_HOSTS = new Set([
  "s.shopee.co.th",
  "shopee.co.th",
  "www.shopee.co.th",
  "shopee.com",
  "www.shopee.com"
]);

function decodeHtml(value = "") {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(value = "") {
  return decodeHtml(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function isShopeeUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && SHOPEE_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function parseAttributes(tag) {
  const attributes = {};
  const attributePattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(attributePattern)) {
    attributes[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function meta(html, key) {
  const expected = key.toLowerCase();
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    if ((attributes.property || attributes.name)?.toLowerCase() === expected && attributes.content) {
      return cleanText(attributes.content);
    }
  }
  return "";
}

function link(html, rel) {
  const expected = rel.toLowerCase();
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    const relations = (attributes.rel || "").toLowerCase().split(/\s+/);
    if (relations.includes(expected) && attributes.href) return attributes.href.trim();
  }
  return "";
}

function findJsonLdProduct(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const product = findJsonLdProduct(item, seen);
      if (product) return product;
    }
    return null;
  }

  const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
  if (types.some(type => String(type).toLowerCase() === "product")) return value;

  for (const nested of Object.values(value)) {
    const product = findJsonLdProduct(nested, seen);
    if (product) return product;
  }
  return null;
}

function jsonLdProduct(html) {
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]).trim());
      const product = findJsonLdProduct(parsed);
      if (product) return product;
    } catch {}
  }
  return null;
}

function numberValue(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;
  const normalized = value.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  return normalized ? Number(normalized) : Number.NaN;
}

function normalizePrice(value, scaledShopeeInteger = false) {
  const raw = numberValue(value);
  if (!Number.isFinite(raw) || raw <= 0) return 0;

  let normalized = raw;
  if (scaledShopeeInteger && Number.isInteger(raw) && raw >= 1_000_000 && raw <= 500_000_000_000) {
    const scaled = raw / 100_000;
    if (scaled >= 1 && scaled <= 5_000_000) normalized = scaled;
  }

  if (normalized <= 0 || normalized > 20_000_000) return 0;
  return Number(normalized.toFixed(2));
}

function collectJsonFieldPrices(html, field) {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:["']|\\\\["'])${escapedField}(?:["']|\\\\["'])\\s*:\\s*(?:["']|\\\\["'])?(-?\\d+(?:\\.\\d+)?)`, "gi");
  const prices = [];
  for (const match of html.matchAll(pattern)) {
    const price = normalizePrice(match[1], true);
    if (price) prices.push(price);
  }
  return prices;
}

function jsonLdOffers(product) {
  if (!product?.offers) return [];
  return Array.isArray(product.offers) ? product.offers : [product.offers];
}

function extractPrice(html, product) {
  const strongCandidates = [];
  const metaPrice = normalizePrice(meta(html, "product:price:amount"));
  if (metaPrice) strongCandidates.push(metaPrice);

  for (const offer of jsonLdOffers(product)) {
    for (const value of [offer?.price, offer?.lowPrice, offer?.highPrice]) {
      const price = normalizePrice(value);
      if (price) strongCandidates.push(price);
    }
  }

  for (const match of html.matchAll(/฿\s*([\d,]+(?:\.\d{1,2})?)/g)) {
    const price = normalizePrice(match[1]);
    if (price) strongCandidates.push(price);
  }

  if (strongCandidates.length) return Math.min(...strongCandidates);

  for (const field of ["price", "price_min", "price_max"]) {
    const candidates = collectJsonFieldPrices(html, field);
    if (candidates.length) return Math.min(...candidates);
  }
  return 0;
}

function extractOriginalPrice(html, product, price) {
  const candidates = collectJsonFieldPrices(html, "price_before_discount");
  for (const offer of jsonLdOffers(product)) {
    const highPrice = normalizePrice(offer?.highPrice);
    if (highPrice) candidates.push(highPrice);
  }
  const valid = candidates.filter(value => value > price && value <= 20_000_000);
  return valid.length ? Math.max(...valid) : null;
}

function productTitleFromUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.hostname.toLowerCase() === "s.shopee.co.th") return "";
    const segment = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).at(-1) || "");
    const slug = segment.replace(/-i\.\d+\.\d+.*$/i, "").replace(/[-_]+/g, " ").trim();
    return /[\p{L}]/u.test(slug) && slug.length >= 4 ? cleanText(slug) : "";
  } catch {
    return "";
  }
}

function extractImage(product) {
  const image = product?.image;
  if (typeof image === "string") return image;
  if (Array.isArray(image)) return image.find(item => typeof item === "string") || image[0]?.url || "";
  return image?.url || "";
}

function categoryFromTitle(title) {
  const lowerTitle = title.toLowerCase();
  if (/ทาง|รถ|มอเตอร์|รถยนต์|รถกระบะ|ล้อใหญ่|สเปรย์|ยาง/.test(lowerTitle)) return "auto";
  if (/แฟชั่น|เสื้อ|กระเป๋า|รองเท้า|มือถือ|หูของ|ร้องเท้า/.test(lowerTitle)) return "fashion";
  if (/หูฟัง|ลำโพง|มอนิเตอร์|มือถือ|แล็ปท็อป|คอม|เกม/.test(lowerTitle)) return "tech";
  if (/เครื่องของใช้|ม่าน|นอน|ของใช้|ห้อง|บ้าน/.test(lowerTitle)) return "home";
  return "beauty";
}

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function fetchWithRetry(target, source, attempts, timeout) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(target, {
        redirect: "follow",
        signal: AbortSignal.timeout(timeout),
        headers: {
          "User-Agent": UA,
          "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "Accept-Language": ACCEPT_LANGUAGE
        }
      });
      if (!response.ok) throw new Error(`${source} HTTP ${response.status}`);
      const html = await response.text();
      if (html.trim().length < 200) throw new Error(`${source} returned an incomplete page`);
      return { html, responseUrl: response.url || target };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(400 * attempt);
    }
  }
  throw lastError || new Error(`${source} fetch failed`);
}

function finalProductUrl(html, responseUrl, requestedUrl) {
  for (const candidate of [meta(html, "og:url"), link(html, "canonical"), responseUrl, requestedUrl]) {
    if (candidate && isShopeeUrl(candidate)) return candidate;
  }
  return requestedUrl;
}

async function fetchShopee(url) {
  const failures = [];
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

  try {
    const result = await fetchWithRetry(proxyUrl, "AllOrigins", 1, 8_000);
    return { html: result.html, finalUrl: finalProductUrl(result.html, "", url) };
  } catch (error) {
    failures.push(error?.message || "AllOrigins failed");
  }

  try {
    const result = await fetchWithRetry(url, "Shopee", 2, 7_000);
    return { html: result.html, finalUrl: finalProductUrl(result.html, result.responseUrl, url) };
  } catch (error) {
    failures.push(error?.message || "direct fetch failed");
  }

  throw new Error(`ไม่สามารถดึงหน้า Shopee ได้ (${failures.join("; ")})`);
}

export default async (req) => {
  try {
    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

    const requestUrl = new URL(req.url);
    const url = requestUrl.searchParams.get("url")?.trim();
    if (!url || !isShopeeUrl(url)) return json({ error: "ลิงก์ Shopee ไม่ถูกต้อง" }, 400);

    const { html, finalUrl } = await fetchShopee(url);
    const product = jsonLdProduct(html);
    const titleElement = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
    const rawTitle = meta(html, "og:title")
      || meta(html, "twitter:title")
      || cleanText(titleElement)
      || cleanText(product?.name)
      || productTitleFromUrl(finalUrl)
      || productTitleFromUrl(url);
    const title = cleanText(rawTitle).replace(/\s*[|｜-]\s*Shopee.*$/i, "").trim();
    const image = meta(html, "og:image") || meta(html, "twitter:image") || extractImage(product);
    const description = meta(html, "og:description") || meta(html, "description") || cleanText(product?.description);
    const price = extractPrice(html, product);
    const originalPrice = price ? extractOriginalPrice(html, product, price) : null;

    if (!title && !price) return json({ error: "ไม่พบชื่อและราคาสินค้าในหน้า Shopee" }, 502);
    if (!title) return json({ error: "ไม่พบชื่อสินค้าในหน้า Shopee" }, 502);
    if (!price) return json({ error: "ไม่พบราคาสินค้าในหน้า Shopee" }, 502);

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
