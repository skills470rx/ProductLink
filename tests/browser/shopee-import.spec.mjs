import { test, expect } from '@playwright/test';

const target='https://s.shopee.co.th/1W02AohWUt';
const fixtureUrl='https://shopee.co.th/product/123/456';
const fixture={url:fixtureUrl,title:'Parser fixture – not a real Shopee product',image:'https://down-th.img.susercontent.com/file/fixture',price:null,status:'partial',message:'ราคาไม่สามารถดึงอัตโนมัติจาก Shopee ได้'};

test.beforeEach(async({page})=>{
  await page.route('https://down-th.img.susercontent.com/file/fixture', route => route.fulfill({
    contentType:'image/png', body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lS8AAAAASUVORK5CYII=', 'base64'),
  }));
  // No test writes to the existing catalog/database.
  await page.route('**/.netlify/functions/products',async route=>{
    if(route.request().method()==='GET')return route.fulfill({json:{products:[]}});
    return route.fulfill({json:{ok:true,products:[],saved:1}});
  });
});

async function start(page,url=fixtureUrl){
  await page.goto('/');
  await page.locator('#importBtn').click();
  await page.locator('#importUrls').fill(url);
  await page.locator('#importActionBtn').click();
}

test('partial metadata keeps image and title and asks only for missing price',async({page})=>{
  const outbound=[];
  page.on('request',req=>outbound.push(req.url()));
  await page.route('**/api/shopee?**',route=>route.fulfill({json:fixture}));
  await start(page);
  await expect(page.locator('#import-title-0')).toHaveValue(fixture.title);
  await expect(page.locator('#import-price-0')).toHaveValue('');
  await expect(page.locator('#import-status-0')).toHaveText(fixture.message);
  await expect(page.locator('.preview-img')).toHaveAttribute('src',fixture.image);
  expect(outbound.some(url=>url.includes('allorigins'))).toBe(false);
  await page.locator('#import-price-0').fill('88.50');
  const post=page.waitForRequest(r=>r.url().includes('/.netlify/functions/products')&&r.method()==='POST');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('#importSaveAll').click();
  const saved=(await post).postDataJSON().products[0];
  expect(saved.price).toBe(88.5);
  expect(saved.url).toBe(fixtureUrl);
  expect(saved.image).toBe(fixture.image);
});

test('blocked response shows exact error and no success or fake price',async({page})=>{
  await page.route('**/api/shopee?**',route=>route.fulfill({status:502,json:{url:fixtureUrl,title:'',image:'',price:null,status:'manual',error:'Shopee จำกัดการเข้าถึงข้อมูลสินค้า กรุณากรอกข้อมูลเอง'}}));
  await start(page);
  await expect(page.locator('#import-status-0')).toHaveText('Shopee จำกัดการเข้าถึงข้อมูลสินค้า กรุณากรอกข้อมูลเอง');
  await expect(page.locator('#import-price-0')).toHaveValue('');
  await expect(page.locator('#import-title-0')).toHaveValue('');
  await expect(page.locator('.import-preview-card.success')).toHaveCount(0);
});

test('invalid host never calls import endpoint',async({page})=>{
  let calls=0;
  await page.route('**/api/shopee?**',route=>{calls++;return route.abort();});
  await start(page,'https://shopee.co.th.evil.test/product/1/2');
  await expect(page.locator('#import-error-0')).toContainText('ลิงก์ HTTPS');
  expect(calls).toBe(0);
});

test('endpoint HTML/routing failure is not reported as Shopee success',async({page})=>{
  await page.route('**/api/shopee?**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Fallback page</title>'}));
  await start(page);
  await expect(page.locator('#import-error-0')).toContainText('ไม่ตอบกลับเป็น JSON');
});

test('complete parser response displays actual price without unit conversion',async({page})=>{
  await page.route('**/api/shopee?**',route=>route.fulfill({json:{...fixture,price:88.5,status:'success'}}));
  await start(page);
  await expect(page.locator('.preview-price')).toHaveText('฿88.5');
  await expect(page.locator('#import-price-0')).toHaveCount(0);
});

test('failed image load does not leave a success status',async({page})=>{
  await page.route('https://down-th.img.susercontent.com/file/fixture',route=>route.abort());
  await page.route('**/api/shopee?**',route=>route.fulfill({json:{...fixture,price:88.5,status:'success'}}));
  await start(page);
  await expect(page.locator('#import-status-0')).toHaveText('โหลดรูปสินค้าจาก Shopee ไม่สำเร็จ');
  await expect(page.locator('.import-preview-card.success')).toHaveCount(0);
});

test('real Shopee short URL produces an evidenced result through local Netlify Edge',async({page})=>{
  test.skip(process.env.SHOPEE_LIVE_TEST!=='1','Opt in to real public Shopee requests');
  const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/shopee');
  await start(page,target);
  const r=await response,p=await r.json();
  expect(p.url).toBe(target);
  expect(p.shopId).toBe('1113547550');
  expect(p.itemId).toBe('43051457251');
  console.log(JSON.stringify({liveShopee:true,status:r.status(),importStatus:p.status,code:p.code || null,hasImage:!!p.image,price:p.price}));
  if(p.status==='success'){
    expect(p.image).toMatch(/^https:\/\//);
    expect(p.price).toBeGreaterThan(0);
    await expect(page.locator('#import-status-0')).toContainText('สำเร็จ');
  }else{
    await expect(page.locator('.import-preview-card.success')).toHaveCount(0);
    await expect(page.locator('#import-status-0')).toHaveText(p.error || p.message);
    if(p.price===null)await expect(page.locator('#import-price-0')).toHaveValue('');
  }
});
