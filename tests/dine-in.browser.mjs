// Isolated fixtures: this is not a production or PostgreSQL acceptance test.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
const port=5187, origin="http://127.0.0.1:"+port;
const server=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port",String(port)],{stdio:"pipe",windowsHide:true});
let logs="", browser;
server.stdout.on("data",d=>{logs+=d;});server.stderr.on("data",d=>{logs+=d;});
try {
  let up=false;
  for(let i=0;i<60;i++){
    try{const r=await fetch(origin+"/",{signal:AbortSignal.timeout(2000)});if(r.ok){up=true;break;}}catch{/* still starting */}
    if(server.exitCode!==null)throw Error(logs);
    await new Promise(r=>setTimeout(r,500));
  }
  assert(up,"Vite did not start: "+logs);
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:375,height:812},reducedMotion:"reduce"});
  const page=await context.newPage(), failures=[];
  page.on("pageerror",e=>failures.push(e.message));
  const tokens=new Map(Array.from({length:17},(_,i)=>{const c=String(i+1).padStart(2,"0");return ["test-token-"+c+"-"+"a".repeat(32),c];}));
  const urlFor=c=>origin+"/v/xoxo/t/"+c+"/test-token-"+c+"-"+"a".repeat(32);
  const productId="11111111-1111-4111-8111-111111111111";
  let profile=null, round="round-1", quotesN=0, ordersN=0, loseResponse=false, expireNext=false, lastInput;
  const quotes=new Map(), orders=new Map(), submissions=[];
  await page.route("**/api/guest/v1/**",async route=>{
    const req=route.request(),u=new URL(req.url()),p=u.pathname.replace("/api/guest/v1","");
    const send=(body,status=200)=>route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
    if(p==="/profile")return profile?send({guest:profile,reservations:[]}):send({error:{code:"SESSION_REQUIRED",message:"Войдите"}},401);
    if(p==="/bootstrap"){const b=req.postDataJSON();assert.equal(b.consent,true);profile={id:"guest-1",name:b.name,phone:b.phone,provisional:true};return send({guestId:profile.id},201);}
    if(p==="/logout"){profile=null;return send({ok:true});}
    if(p==="/ownership")return send({claimCode:"c".repeat(43)});
    if(p.startsWith("/dine-in/tables/")){
      const code=tokens.get(decodeURIComponent(p.split("/").at(-1)));
      return code?send({venue:{id:"venue-1",slug:"xoxo",name:"XOXO",currency:"KZT"},table:{resourceId:"resource-"+code,code,name:"Стол "+code,zoneName:"Главный зал"}}):send({error:{code:"QR_INVALID",message:"QR недействителен"}},410);
    }
    if(p==="/dine-in/menu")return send({generatedAt:new Date().toISOString(),status:"ok",currentRound:{id:round,endsAt:new Date(Date.now()+600000).toISOString()},products:[{id:productId,name:"Напиток XOXO",price:1590,originalPrice:1700,changePercent:-6.5,isAvailable:true,category:"Напитки"},{id:"disabled",name:"Нет в наличии",price:1000,isAvailable:false}]});
    if(p==="/loyalty/wallet")return profile?send({balance:1000,expiringAmount:1000,nextExpiresAt:new Date(Date.now()+86400000).toISOString(),lots:[{id:"lot-1",remaining:1000,expiresAt:new Date(Date.now()+86400000).toISOString()}]}):send({error:{code:"SESSION_REQUIRED"}},401);
    if(p==="/loyalty/transactions")return send({transactions:[],nextCursor:null});
    if(p==="/dine-in/quotes"){
      const b=req.postDataJSON();lastInput=b;assert(!("guestId" in b));assert(!("payable" in b));
      const lines=b.items.map(x=>({...x,productName:"Напиток XOXO",unitPrice:1590,total:x.quantity*1590}));
      const subtotal=lines.reduce((n,l)=>n+l.total,0),discount=profile?Math.min(1000,b.redeemAmount,subtotal):0;
      const q={id:"quote-"+(++quotesN),roundId:round,expiresAt:new Date(Date.now()+(expireNext?-1000:120000)).toISOString(),lines,subtotal,discount,payable:subtotal-discount,cashback:profile?Math.floor((subtotal-discount)*0.03):0,checkoutToken:"opaque-binding"};
      expireNext=false;quotes.set(q.id,q);return send(q);
    }
    if(p==="/dine-in/orders"&&req.method()==="POST"){
      const b=req.postDataJSON();submissions.push(b);let o=orders.get(b.idempotencyKey);
      if(!o){
        const q=quotes.get(b.quoteId);assert(q);
        if(Date.parse(q.expiresAt)<=Date.now()||q.roundId!==round)return send({error:{code:"REQUOTE",message:"Обновите цену"}},409);
        o={...q,id:"00000000-0000-4000-8000-"+String(++ordersN).padStart(12,"0"),orderNumber:String(ordersN),venueCode:"xoxo",tableCode:"03",status:"new",paymentStatus:"assumed_paid",createdAt:new Date().toISOString(),cashbackExpiresAt:new Date(Date.now()+14*86400000).toISOString(),receiptToken:"opaque-receipt"};
        orders.set(b.idempotencyKey,o);
        if(loseResponse){loseResponse=false;return send({error:{code:"UNAVAILABLE",message:"lost after commit"}},503);}
      }
      return send({order:o});
    }
    if(p==="/dine-in/orders")return send({orders:profile?[...orders.values()]:[],nextCursor:null});
    if(p.startsWith("/dine-in/orders/")){const o=[...orders.values()].find(x=>p.endsWith(x.id));return o?send({order:o}):send({error:{code:"NOT_FOUND"}},404);}
    throw Error("Unexpected fixture route "+req.method()+" "+p);
  });
  for(let n=1;n<=17;n++){
    const c=String(n).padStart(2,"0");await page.goto(urlFor(c));await page.getByText("Стол №"+c,{exact:true}).waitFor();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"horizontal overflow "+c);
  }
  await page.goto(urlFor("03"));
  await page.getByRole("button",{name:"Добавить Напиток XOXO",exact:true}).click();
  await page.reload();await page.getByRole("button",{name:/Корзина · 1/}).waitFor();
  await page.goto(urlFor("04"));assert(await page.getByRole("button",{name:/Корзина · 0/}).isDisabled());
  await page.goto(urlFor("03"));
  assert(await page.getByRole("button",{name:"Добавить Нет в наличии",exact:true}).isDisabled());
  await page.getByRole("button",{name:/Корзина · 1/}).click();
  await page.getByRole("button",{name:"Проверить сумму",exact:true}).click();
  loseResponse=true;await page.getByRole("button",{name:/^Заказать ·/}).click();
  await page.getByRole("button",{name:"Проверить заказ",exact:true}).waitFor();
  await page.reload();await page.getByRole("button",{name:"Проверить заказ",exact:true}).click();
  await page.getByRole("heading",{name:"Заказ #1 принят"}).waitFor();
  assert.equal(ordersN,1);assert.deepEqual(submissions[0],submissions[1]);
  await page.getByRole("button",{name:"Заказать ещё",exact:true}).click();
  for(let n=0;n<3;n++)await page.getByRole("button",{name:"Добавить Напиток XOXO",exact:true}).click();
  await page.getByRole("button",{name:/Корзина · 3/}).click();
  await page.getByRole("button",{name:"Создать гостевой профиль",exact:true}).click();
  await page.getByLabel("Имя",{exact:true}).fill("Тестовый гость");
  await page.getByLabel("Телефон",{exact:true}).fill("+77001234567");
  await page.getByRole("checkbox").check();
  await page.getByRole("button",{name:"Продолжить с бонусами",exact:true}).click();
  await page.getByLabel("Списать бонусы",{exact:true}).fill("1000");
  expireNext=true;await page.getByRole("button",{name:"Проверить сумму",exact:true}).click();
  await page.getByText("Цена обновилась — проверьте новую сумму",{exact:true}).waitFor();assert.equal(ordersN,1);
  await page.getByRole("button",{name:"Проверить сумму",exact:true}).click();
  await page.getByRole("button",{name:/^Заказать ·/}).waitFor();
  assert.equal(lastInput.items[0].quantity,3);assert.equal(lastInput.redeemAmount,1000);
  await page.getByRole("button",{name:/^Заказать ·/}).click();
  await page.getByRole("heading",{name:"Заказ #2 принят"}).waitFor();
  const o=[...orders.values()].at(-1);assert.equal(o.payable,3770);assert.equal(o.cashback,113);
  await page.getByRole("button",{name:"Мои заказы и бонусы",exact:true}).click();
  await page.getByText("Тестовый гость",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Выйти из гостевого аккаунта",exact:true}).click();
  await page.getByText("Сохранить бонусы",{exact:true}).waitFor();
  assert.equal(await page.getByText("Тестовый гость",{exact:true}).count(),0);
  assert.deepEqual(failures,[]);
  console.log("Mobile QR UI PASS: 17 tables, direct load/reload, cart isolation, disabled item, anonymous checkout, interrupted response retry, bootstrap, expired quote, redemption, receipt, logout.");
}finally{if(browser)await browser.close();server.kill();}
