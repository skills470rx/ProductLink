import test from 'node:test';
import assert from 'node:assert/strict';
import edge, { config } from '../netlify/edge-functions/shopee.js';
import fn from '../netlify/functions/shopee.mjs';
import { importShopee, publicProduct, handleShopee } from '../lib/shopee-import.js';
import { shopeeUrl, productIds } from '../product-model.js';

// Synthetic fixtures for parser tests only; never saved to a catalog.
const short = 'https://s.shopee.co.th/test-link';
const full = 'https://shopee.co.th/product/123/456';
const html = text => new Response(text, { headers: { 'Content-Type': 'text/html' } });
const meta = `<meta property="og:title" content="Fixture &#43; &quot;A&quot; | Shopee Thailand">
  <meta content="//down-th.img.susercontent.com/file/test-image" property="og:image">
  <meta property="og:description" content="Parser fixture, not a real product">`;
const request = value => new Request('https://example.net/api/shopee?url=' + encodeURIComponent(value));

test('allows short and full HTTPS links, rejects misleading hosts and credentials', () => {
  for (const u of [short, full, 'https://shopee.co.th/title-i.123.456']) assert.ok(shopeeUrl(u));
  for (const u of ['http://shopee.co.th/product/1/2', 'https://shopee.co.th.evil.test/product/1/2', 'https://evil.test/?shopee.co.th', 'https://user:pass@shopee.co.th/a', 'https://shopee.co.th:444/a', 'javascript:alert(1)', 'https://127.0.0.1/a']) assert.equal(shopeeUrl(u), null);
  assert.deepEqual(productIds(full), { shopId: '123', itemId: '456' });
  assert.deepEqual(productIds('https://shopee.co.th/title-i.123.456'), { shopId: '123', itemId: '456' });
});

test('short redirect resolves IDs and only sends public requests without credentials', async () => {
  const calls = [];
  const p = await importShopee(short, { fetcher: async (u, init) => {
    calls.push(u);
    assert.equal(init.credentials, 'omit');
    assert.equal(init.redirect, 'manual');
    assert.ok(!Object.keys(init.headers).some(k => /cookie|token|authorization/i.test(k)));
    assert.match(init.headers['User-Agent'], /^ProductLink\//);
    return u === short ? new Response(null, { status: 302, headers: { location: full + '?tracking=not-returned' } }) : html(meta);
  }});
  assert.deepEqual(calls, [short, full + '?tracking=not-returned']);
  assert.equal(p.url, short);
  assert.equal(p.resolvedUrl, full);
  assert.equal(p.shopId, '123');
  assert.equal(p.itemId, '456');
  assert.equal(p.title, 'Fixture + "A"');
  assert.equal(p.image, 'https://down-th.img.susercontent.com/file/test-image');
  assert.equal(p.status, 'partial');
  assert.equal(p.price, null);
  assert.equal(p.stock, null);
});

test('does not follow an external or credentialed redirect', async () => {
  for (const target of ['https://evil.test/', 'http://127.0.0.1/', 'https://u:p@shopee.co.th/a']) {
    let calls = 0;
    const p = await importShopee(short, { fetcher: async () => { calls++; return new Response(null, { status:302, headers:{ location:target } }); } });
    assert.equal(p.warning, 'UNSAFE_REDIRECT');
    assert.equal(calls, 1);
  }
});

test('bounds redirect loops', async () => {
  let calls = 0;
  const p = await importShopee(short, {fetcher: async () => { calls++; return new Response(null, { status:302, headers:{location:short} }); }});
  assert.equal(p.warning, 'TOO_MANY_REDIRECTS');
  assert.equal(calls, 6);
});

test('JSON-LD price remains THB, including decimals and large unscaled values', () => {
  for (const price of ['88.50', '200000']) {
    const p = publicProduct(`<script type="application/ld+json">${JSON.stringify({ '@type':'Product', url:full, name:'Parser fixture', image:{url:'//down-th.img.susercontent.com/file/test'}, offers:{ '@type':'Offer', priceCurrency:'THB', price } })}</script>`, full, full);
    assert.equal(p.price, Number(price));
    assert.equal(p.status, 'success');
  }
});

test('Open Graph price requires explicit THB and never scans unrelated prices', () => {
  const p = publicProduct(meta + '<meta property="product:price:amount" content="19.95"><meta property="product:price:currency" content="THB">', full, full);
  assert.equal(p.price,19.95);
  for (const suffix of ['"price":8800000 ฿1 shipping', '<meta property="product:price:amount" content="88">', '<meta property="product:price:amount" content="88"><meta property="product:price:currency" content="USD">']) {
    assert.equal(publicProduct(meta+suffix, full, full).price,null);
  }
});

test('ignores another product, conflicting offers and malformed JSON-LD', () => {
  const other = { '@type':'Product', url:'https://shopee.co.th/product/123/999', name:'Other fixture', offers:{price:'1',priceCurrency:'THB'} };
  assert.equal(publicProduct(meta+`<script type="application/ld+json">${JSON.stringify(other)}</script>`,full,full).price,null);
  const multi = { ...other, url:full, offers:[{price:'1',priceCurrency:'THB'},{price:'2',priceCurrency:'THB'}] };
  assert.equal(publicProduct(meta+`<script type="application/ld+json">${JSON.stringify(multi)}</script>`,full,full).price,null);
  assert.equal(publicProduct(meta+'<script type="application/ld+json">{broken</script>',full,full).title,'Fixture + "A"');
});

test('normalizes protocol-relative images and rejects executable image URLs', () => {
  const p = publicProduct(meta+'<meta property="og:image" content="javascript:alert(1)"><meta property="og:image" content="data:image/png;base64,AA">',full,full);
  assert.deepEqual(p.images,['https://down-th.img.susercontent.com/file/test-image']);
});

test('HTML application shell does not become a fake product or HTTP success', async () => {
  const r = await handleShopee(request(full), {fetcher:async () => html('<title>Shopee</title><script>const price=1</script>')});
  const p = await r.json();
  assert.equal(r.status,502);
  assert.equal(p.code,'PUBLIC_DATA_UNAVAILABLE');
  assert.equal(p.price,null);
  assert.equal(p.image,'');
  assert.equal(p.title,'');
  assert.equal(p.url,full);
});

test('403/429 are not retried or bypassed; 404 is reported correctly', async () => {
  for (const status of [403,429,404]) {
    let calls=0;
    const r = await handleShopee(request(full),{fetcher:async () => {calls++; return new Response('{}',{status});}});
    assert.equal(calls,1);
    assert.equal(r.status,status===404?404:502);
    assert.equal((await r.json()).code,status===404?'NOT_FOUND':'UPSTREAM_BLOCKED');
  }
});

test('temporary 5xx is retried once, then surfaced as unavailable', async () => {
  let calls=0;
  const r=await handleShopee(request(full),{wait:async()=>{},fetcher:async()=>{calls++;return new Response('unavailable',{status:503});}});
  assert.equal(calls,2);
  assert.equal(r.status,503);
  assert.equal((await r.json()).code,'UPSTREAM_UNAVAILABLE');
});

test('timeout is bounded and surfaced; response size is bounded', async () => {
  let calls=0;
  const r=await handleShopee(request(full),{wait:async()=>{},fetcher:async()=>{calls++;throw new DOMException('timeout','TimeoutError');}});
  assert.equal(calls,2);
  assert.equal(r.status,504);
  assert.equal((await r.json()).code,'TIMEOUT');
  const large=await handleShopee(request(full),{fetcher:async()=>html('x'.repeat(1500001))});
  assert.equal((await large.json()).code,'RESPONSE_TOO_LARGE');
});

test('Edge and Functions routes have matching response contracts',async()=>{
  assert.equal(config.path,'/api/shopee');
  for(const handler of [edge,fn]) {
    const r=await handler(request('https://evil.test/x'));
    assert.equal(r.status,400);
    assert.equal((await r.json()).code,'INVALID_URL');
    assert.equal((await handler(new Request('https://example.net/api/shopee',{method:'POST'}))).status,405);
  }
});
