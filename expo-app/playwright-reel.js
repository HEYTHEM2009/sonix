const https = require('https');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DIST = path.join(__dirname, 'dist');
const PORT = 4184;
const API = 'https://sonix-api.runsite.app/api';
const MIME = { '.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.map':'application/json' };

const server = http_srv();
function http_srv(){
  const http = require('http');
  return http.createServer((req,res)=>{ let u=decodeURIComponent(req.url.split('?')[0]); if(u==='/')u='/index.html'; let f=path.join(DIST,u); if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(DIST,'index.html'); fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});res.end(d);});});
}

function req(method, endpoint, token, body, isForm, boundary){
  return new Promise((resolve)=>{
    const opt={ method, headers:{ 'Accept':'application/json', 'Origin':'http://localhost:'+PORT } };
    if(token) opt.headers['Authorization']='Bearer '+token;
    let payload;
    if(isForm){ opt.headers['Content-Type']='multipart/form-data; boundary='+boundary; payload=body; opt.headers['Content-Length']=Buffer.byteLength(payload); }
    else if(body){ const p=JSON.stringify(body); opt.headers['Content-Type']='application/json'; opt.headers['Content-Length']=Buffer.byteLength(p); payload=p; }
    const r=https.request(API+endpoint, opt, (res)=>{ let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve({status:res.statusCode, body:d.slice(0,400)})); });
    r.on('error',e=>resolve({status:0,error:String(e)}));
    r.end(payload);
  });
}

function makeMp4(){
  // minimal valid mp4 (ftyp+mdat) so validation passes
  const ftyp = Buffer.from('000000186674797069736f6d0000000169736f6d','hex');
  const mdat = Buffer.concat([Buffer.from('000000086d646174','hex'), Buffer.from('testvideo')]);
  return Buffer.concat([ftyp, mdat]);
}

(async()=>{
  await new Promise(r=>server.listen(PORT,r));
  const browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[]; page.on('console',m=>{if(m.type()==='error')errors.push(m.text());}); page.on('pageerror',e=>errors.push('PE:'+e.message));
  const log=(...a)=>console.log(...a);

  const ts=Date.now();
  const reg=await req('POST','/auth/register',null,{ username:'reel'+ts, email:'reel'+ts+'@test.com', password:'password123', password_confirmation:'password123', name:'Reel '+ts });
  log('REGISTER:', reg.status);
  let token=JSON.parse(reg.body).token;

  // Build multipart form for reel upload
  const boundary='----sonixtest'+ts;
  const video=makeMp4();
  let body='';
  body+='--'+boundary+'\r\n';
  body+='Content-Disposition: form-data; name="video"; filename="test.mp4"\r\n';
  body+='Content-Type: video/mp4\r\n\r\n';
  const head=Buffer.from(body,'utf8');
  const mid=Buffer.from('\r\n--'+boundary+'\r\nContent-Disposition: form-data; name="caption"\r\n\r\nMy first reel test\r\n--'+boundary+'--\r\n','utf8');
  const payload=Buffer.concat([head, video, mid]);

  log('=== UPLOAD REEL ===');
  const up=await req('POST','/reels',token, payload, true, boundary);
  log('REEL UPLOAD:', up.status, up.body);

  log('=== GET REELS AFTER UPLOAD ===');
  const list=await req('GET','/reels?page=1',token,null);
  log('REELS LIST:', list.status, list.body.slice(0,300));

  log('CONSOLE ERRORS:', errors.length); errors.slice(0,5).forEach(e=>log('  - '+e));
  await browser.close(); server.close();
})();
