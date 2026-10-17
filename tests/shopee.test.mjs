import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../netlify/edge-functions/shopee.js', import.meta.url), 'utf8');
function importer(fetch) {
  const context = vm.createContext({ URL, Response, AbortSignal, fetch, console });
  vm.runInContext(source.replace('export default async (req) =>', 'globalThis.handler = async (req) =>').replace('export const config =', 'const config ='), context);
  return context;
}
const original = 'https://shopee.co.th/opaanlp/1058886847/52956167515?__mobile__=1&exp_group=rollout';
const canonical = 'https://shopee.co.th/product/1058886847/52956167515';

test('ad landing URLs use the product route without tracking parameters', () => {
  assert.equal(importer().canonicalProductUrl(original, original), canonical);
});

test('embedded recommendations from the same shop do not replace the requested item', () => {
  const context = importer();
  const ids = { shopId: '1058886847', itemId: '52956167515' };
  assert.equal(context.objectProductCandidate({ shopid: ids.shopId, itemid: '999', name: 'Other item', price: 5000000 }, ids, original, canonical), null);
  assert.equal(context.objectProductCandidate({ shopid: ids.shopId, itemid: ids.itemId, name: 'Requested item', price: 5000000 }, ids, original, canonical).price, 50);
});

test('blocked APIs and empty app shells return an actionable error without URL diagnostics', async () => {
  const requests = [];
  const context = importer(async (url) => {
    requests.push(url);
    if (url.includes('/api/v4/')) return new Response('{}', { status: 403 });
    return new Response('<html><title>Shopee</title><script>{"app":"shell"}</script></html>');
  });
  const response = await context.handler(new Request('https://example.test/api/shopee?url=' + encodeURIComponent(original)));
  const body = await response.json();
  assert.equal(response.status, 502);
  assert.equal(body.code, 'SHOPEE_DATA_UNAVAILABLE');
  assert.match(body.error, /กรอกชื่อและราคาเอง/);
  assert.ok(requests.includes(canonical));
  assert.ok(requests.every(url => !url.includes('opaanlp') && !url.includes('exp_group')));
});

const browserSource = await readFile(new URL('../ads.js', import.meta.url), 'utf8');
function browserImporter(fetch, legacy) {
  const context = vm.createContext({ fetch, AbortSignal, extractProductDataLegacy: legacy });
  const start = browserSource.indexOf('async function extractProductData(url)');
  const end = browserSource.indexOf('function extractMeta', start);
  vm.runInContext(browserSource.slice(start, end), context);
  return context;
}

test('browser avoids a second proxy timeout after a definitive no-data response', async () => {
  let legacyCalls = 0;
  const context = browserImporter(async () => Response.json({ code: 'SHOPEE_DATA_UNAVAILABLE', error: 'กรอกชื่อและราคาเอง' }, { status: 502 }), async () => { legacyCalls++; });
  const result = await context.extractProductData(original);
  assert.equal(result.ok, false);
  assert.equal(legacyCalls, 0);
});

test('browser retains legacy fallback when the server route is unavailable', async () => {
  const context = browserImporter(async () => { throw new Error('Network error'); }, async () => ({ title: 'Product', price: 25 }));
  const result = await context.extractProductData(original);
  assert.equal(result.ok, true);
  assert.equal(result.data.price, 25);
});
