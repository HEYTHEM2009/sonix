const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DIST = path.join(__dirname, 'dist');
const PORT = 4182;
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.map': 'application/json'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  let filePath = path.join(DIST, urlPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(DIST, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

const API = 'https://sonix-api.runsite.app/api';

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  const apiCalls = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('request', r => { if (r.url().includes('runsite.app')) apiCalls.push('REQ ' + r.method() + ' ' + r.url().replace(API,'')); });
  page.on('response', r => { if (r.url().includes('runsite.app')) apiCalls.push('RES ' + r.status() + ' ' + r.url().replace(API,'') + ' -> ' + (r.request().method())); });

  const log = (...a) => console.log(...a);

  // 1) Load app
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  log('1) APP LOADED. Text:', JSON.stringify((await page.evaluate(() => document.body.innerText)).slice(0, 120)));

  // 2) Login (register a fresh test account since seed user may not exist)
  const ts = Date.now();
  const testEmail = 'pw' + ts + '@test.com';
  const testUser = 'pwtest' + ts;
  // Click "create account" to switch to register form
  const createLink = page.getByText(/إنشاء حساب|create account|register/i).first();
  if (await createLink.count()) { await createLink.click(); await page.waitForTimeout(1500); }
  const email = page.locator('input[type="email"], input[placeholder*="Email" i]').first();
  const pass = page.locator('input[type="password"]').first();
  const userF = page.locator('input[placeholder*="User" i], input[placeholder*="اسم" i], input[name*="user" i]').first();
  if (await userF.count()) await userF.fill(testUser);
  await email.fill(testEmail);
  await pass.fill('password123');
  // fill confirm password if present
  const confirm = page.locator('input[placeholder*="confirm" i], input[name*="password_confirmation" i]').first();
  if (await confirm.count()) await confirm.fill('password123');
  const submit = page.getByText(/إنشاء حساب|register|sign up|تسجيل/i).last();
  await submit.click();
  await page.waitForTimeout(6000);
  const afterLogin = await page.evaluate(() => document.body.innerText.slice(0, 400));
  log('2) AFTER REGISTER/LOGIN TEXT:', JSON.stringify(afterLogin));

  // Check if still on login (failed)
  const stillLogin = /تسجيل الدخول|login/i.test(afterLogin) && /كلمة المرور|password/i.test(afterLogin);
  if (stillLogin) {
    log('!! LOGIN FAILED — backend likely still 500');
  } else {
    log('3) LOGIN OK — navigated past auth');
    // Try to reach Reels
    const reels = page.locator('text=/reel/i').first();
    if (await reels.count()) {
      await reels.click();
      await page.waitForTimeout(2500);
      log('4) REELS SCREEN TEXT:', JSON.stringify((await page.evaluate(() => document.body.innerText)).slice(0, 300)));
      await page.screenshot({ path: 'verify-reels.png' });
    } else {
      log('4) No reels tab visible');
    }
  }

  // 5) Direct API CORS check via browser
  const cors = await page.evaluate(async (api) => {
    try {
      const r = await fetch(api + '/reels', { method: 'GET', headers: { 'Accept': 'application/json' } });
      const txt = await r.text();
      return { status: r.status, body: txt.slice(0, 200), cors: r.headers.get('access-control-allow-origin') };
    } catch (e) { return { error: String(e) }; }
  }, API);
  log('5) DIRECT API (browser):', JSON.stringify(cors));

  log('CONSOLE ERRORS:', errors.length);
  errors.slice(0, 10).forEach(e => log('  - ' + e));
  log('API CALLS:'); apiCalls.forEach(c => log('  ' + c));

  await browser.close();
  server.close();
})();
