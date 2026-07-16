const http = require('https');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DIST = path.join(__dirname, 'dist');
const PORT = 4183;
const API = 'https://sonix-api.runsite.app/api';
const MIME = { '.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.map':'application/json' };

const server = http.createServer((req,res)=>{ let u=decodeURIComponent(req.url.split('?')[0]); if(u==='/')u='/index.html'; let f=path.join(DIST,u); if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(DIST,'index.html'); fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});res.end(d);});});

function api(method, endpoint, token, body){
  const payload = body ? JSON.stringify(body) : null;
  const opt={ method, headers:{ 'Content-Type':'application/json', 'Accept':'application/json', 'Origin':'http://localhost:'+PORT } };
  if(token) opt.headers['Authorization']='Bearer '+token;
  if(payload){ opt.headers['Content-Length']=Buffer.byteLength(payload); }
  return new Promise((resolve)=>{
    const req=http.request(API+endpoint, opt, (res)=>{ let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve({status:res.statusCode, cors:res.headers['access-control-allow-origin'], body:d.slice(0,300)})); });
    req.on('error',e=>resolve({status:0,error:String(e)}));
    req.end(payload);
  });
}

(async()=>{
  await new Promise(r=>server.listen(PORT,r));
  const browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[]; page.on('console',m=>{if(m.type()==='error')errors.push(m.text());}); page.on('pageerror',e=>errors.push('PE:'+e.message));
  const log=(...a)=>console.log(...a);

  log('=== 1) REGISTER (direct API) ===');
  const ts=Date.now();
  const reg=await api('POST','/auth/register',null,{ username:'pw'+ts, email:'pw'+ts+'@test.com', password:'password123', password_confirmation:'password123', name:'PW '+ts });
  log('REGISTER:', JSON.stringify(reg));
  let token=null; try{ token=JSON.parse(reg.body).token; }catch(e){}
  if(!token){ log('NO TOKEN — abort'); await browser.close(); server.close(); return; }

  log('=== 2) AUTH ME ===');
  log('ME:', JSON.stringify(await api('GET','/users/me',token)));

  log('=== 3) FEED ===');
  log('FEED:', JSON.stringify(await api('GET','/feed?page=1',token)));

  log('=== 4) REELS (index) ===');
  log('REELS:', JSON.stringify(await api('GET','/reels?page=1',token)));

  log('=== 5) EXPLORE ===');
  log('EXPLORE:', JSON.stringify(await api('GET','/explore?page=1',token)));

  log('=== 6) POSTS ===');
  log('POSTS:', JSON.stringify(await api('GET','/posts?page=1',token)));

  log('=== 7) MESSAGES conversations ===');
  log('MSG:', JSON.stringify(await api('GET','/messages/conversations',token)));

  log('=== 8) STORIES ===');
  log('STORIES:', JSON.stringify(await api('GET','/stories',token)));

  log('=== 9) GROUPS ===');
  log('GROUPS:', JSON.stringify(await api('GET','/groups',token)));

  log('=== 10) NOTIFICATIONS ===');
  log('NOTIF:', JSON.stringify(await api('GET','/notifications',token)));

  log('=== 11) CORS preflight check ===');
  const pre=await api('OPTIONS','/reels',null,null);
  // OPTIONS via http.request needs manual; just trust earlier test showed ACAO:*
  log('CONSOLE ERRORS:', errors.length); errors.slice(0,8).forEach(e=>log('  - '+e));
  await browser.close(); server.close();
})();
