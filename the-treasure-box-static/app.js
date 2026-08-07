/* ============================================================================
   THE TREASURE BOX — static edition
   Everything runs in the browser. Products, cart, accounts and orders are
   stored in localStorage, so the admin can post bags and shoppers can buy
   them with no server. Data persists on this device/browser.
   ========================================================================== */
"use strict";

/* ----------------------------------------------------------- storage ---- */
const KEY="ttb_v1";
const DEFAULT_DB={products:[],users:[],orders:[],session:null,currency:"USD",settings:{},seq:1000,_cart:[]};
let DB=null;
function load(){try{return JSON.parse(localStorage.getItem(KEY))||seed()}catch(e){return seed()}}
function save(){localStorage.setItem(KEY,JSON.stringify(DB))}

function seed(){
  const now=Date.now();
  const db=structuredClone(DEFAULT_DB);
  // admin account (email lowercased on login)
  db.users.push({id:1,email:"csbizcircle18@gmail.com",pass:"cstol89*",first:"Store",last:"Owner",role:"admin",
    phone:"",dob:"",gender:"",address:{},created:now});
  db.settings={bank_name:"",bank_account_name:"",bank_account_number:"",bank_instructions:""};
  // a few example listings so the shop isn't empty on first open (admin can delete them)
  const demo=[
    {name:"Classic Flap Medium",brand:"Chanel",condition:"Excellent",material:"Caviar leather",colour:"Black",price:520000,sale:0,stock:1,cat:"Shoulder Bags",desc:"An icon of the house. Pre-owned in excellent condition with light hardware patina, authenticated by our team. Comes with dust bag."},
    {name:"Birkin 30",brand:"Hermès",condition:"Very Good",material:"Togo leather",colour:"Etoupe",price:1450000,sale:0,stock:1,cat:"Totes",desc:"The most coveted tote in the world. Very good pre-owned condition with even wear to the corners. Palladium hardware."},
    {name:"Neverfull MM",brand:"Louis Vuitton",condition:"Good",material:"Monogram canvas",colour:"Brown",price:145000,sale:120000,stock:2,cat:"Totes",desc:"A versatile everyday tote. Good pre-owned condition, canvas clean, interior shows light use. On private sale this week."},
    {name:"Lady Dior My ABCDior",brand:"Dior",condition:"Pristine",material:"Lambskin",colour:"Powder Pink",price:410000,sale:0,stock:1,cat:"Top Handle",desc:"Cannage-quilted lambskin with charms. Pristine, barely carried, full set included."},
  ];
  demo.forEach((d,i)=>{
    db.products.push({id:db.seq++,slug:slugify(d.name),sku:"TTB-"+(2001+i),status:"active",featured:i<2,isnew:i===2,
      images:[],created:now-i*8.64e7,...d});
  });
  localStorage.setItem(KEY,JSON.stringify(db));return db;
}
DB=load();

/* ------------------------------------------------------------ helpers ---- */
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];
const app=$("#app");
function slugify(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function nextId(){return DB.seq++}
function uid(){return Math.random().toString(36).slice(2,10)}

/* currency */
const CURRENCIES={USD:{s:"$",d:2,r:1},IDR:{s:"Rp ",d:0,r:16200},EUR:{s:"€",d:2,r:.92},
  GBP:{s:"£",d:2,r:.78},JPY:{s:"¥",d:0,r:155},SGD:{s:"S$",d:2,r:1.34}};
function money(cents){const c=CURRENCIES[DB.currency]||CURRENCIES.USD;const v=(cents/100)*c.r;
  return c.s+v.toLocaleString(undefined,{minimumFractionDigits:c.d,maximumFractionDigits:c.d})}
function setCurrency(code){DB.currency=code;save();render()}

/* session */
function currentUser(){return DB.users.find(u=>u.id===DB.session)||null}
function isAdmin(){const u=currentUser();return u&&u.role==="admin"}

/* cart lives in localStorage per-session (guest cart too) */
function cart(){DB._cart=DB._cart||[];return DB._cart}
function cartCount(){return cart().reduce((n,i)=>n+i.qty,0)}
function addToCart(pid,qty){const p=getProduct(pid);if(!p)return;
  const line=cart().find(i=>i.pid===pid);
  const have=line?line.qty:0;
  if(have+qty>p.stock){toast("Only "+p.stock+" in stock.","error");return}
  if(line)line.qty+=qty;else cart().push({pid,qty});
  save();updateBadge();toast(qty+" × "+p.name+" added to your cart.")}
function updateBadge(){const b=$("#cartBadge");const n=cartCount();b.textContent=n;b.classList.toggle("is-empty",n===0)}

function getProduct(id){return DB.products.find(p=>p.id===id)}
function getProductBySlug(s){return DB.products.find(p=>p.slug===s)}
function activeProducts(){return DB.products.filter(p=>p.status==="active")}

/* toast */
function toast(msg,cat="success"){const t=document.createElement("div");t.className="toast toast--"+cat;
  t.innerHTML='<span class="toast__dot">◆</span><div class="toast__msg"></div>';
  t.querySelector(".toast__msg").textContent=msg;$("#toasts").appendChild(t);
  setTimeout(()=>{t.classList.add("is-out");setTimeout(()=>t.remove(),400)},4200)}

/* modal */
function openModal(html){$("#modalPanel").innerHTML='<button class="modal__close" onclick="closeModal()">&times;</button>'+html;$("#modal").classList.add("is-open")}
function closeModal(){$("#modal").classList.remove("is-open")}
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});

/* ------------------------------------------------------------ router ---- */
let route={view:"home",param:null};
function go(view,param=null){route={view,param};window.scrollTo(0,0);$("#navlinks").classList.remove("is-open");render()}

function render(){
  buildCurrencySelect();updateBadge();updateAccountBtn();
  const v=route.view;
  if(v==="home")app.innerHTML=viewHome();
  else if(v==="shop")app.innerHTML=viewShop();
  else if(v==="product")app.innerHTML=viewProduct(route.param);
  else if(v==="cart")app.innerHTML=viewCart();
  else if(v==="checkout")app.innerHTML=viewCheckout();
  else if(v==="confirm")app.innerHTML=viewConfirm(route.param);
  else if(v==="account")app.innerHTML=viewAccount();
  else if(v==="about")app.innerHTML=viewAbout();
  else if(v==="admin")app.innerHTML=isAdmin()?viewAdmin():viewAdminLogin();
  else if(v==="admin-product")app.innerHTML=viewAdminProduct(route.param);
  else app.innerHTML=viewHome();
  afterRender();
}

function buildCurrencySelect(){const sel=$("#currency");if(sel.dataset.built)return;
  sel.innerHTML=Object.keys(CURRENCIES).map(c=>`<option value="${c}">${c}</option>`).join("");
  sel.dataset.built="1";sel.value=DB.currency}

function updateAccountBtn(){
  const u=currentUser();
  $("#accountBtn").onclick=()=>u?go("account"):openAuth("login");
  $("#footerAccount").textContent=u?"My account":"Sign in";
  $("#footerAccount").onclick=()=>u?go("account"):openAuth("login");
}

/* ============================================================ VIEWS ====== */
function productCard(p){
  const img=p.images[0];
  const media=img?`<img class="card__img" src="${img}" alt="${esc(p.name)}">`
    :`<div class="card__ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 8h12l-1.2 11H7.2L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><span style="font-size:.7rem;letter-spacing:.1em">No photo</span></div>`;
  const badges=[];
  if(p.sale)badges.push('<span class="badge badge--sale">Sale</span>');
  if(p.isnew)badges.push('<span class="badge badge--new">New</span>');
  if(p.stock===0)badges.push('<span class="badge badge--out">Sold out</span>');
  else if(p.stock<=2)badges.push('<span class="badge badge--low">Only '+p.stock+' left</span>');
  const price=p.sale?`<span class="price price--now">${money(p.sale)}</span><s class="price price--was">${money(p.price)}</s>`
    :`<span class="price">${money(p.price)}</span>`;
  return `<article class="card">
    <div class="card__media" onclick="go('product','${p.slug}')">${media}<div class="card__badges">${badges.join("")}</div></div>
    <div class="card__body" onclick="go('product','${p.slug}')">
      <p class="card__eyebrow">${esc(p.brand||p.material)} · ${esc(p.condition)}</p>
      <h3 class="card__name">${esc(p.name)}</h3>
      <p>${price}</p>
    </div></article>`;
}

function viewHome(){
  const feat=activeProducts().filter(p=>p.featured).slice(0,4);
  const fresh=[...activeProducts()].sort((a,b)=>b.created-a.created).slice(0,4);
  const featBlock=feat.length?`<section class="section container">
    <div class="section__head"><div><p class="eyebrow">The Edit</p><h2 class="section__title">Featured treasures</h2></div>
    <a onclick="go('shop')">View all →</a></div>
    <div class="grid grid--4">${feat.map(productCard).join("")}</div></section>`:"";
  const freshBlock=fresh.length?`<section class="section container">
    <div class="section__head"><div><p class="eyebrow">Just landed</p><h2 class="section__title">New arrivals</h2></div>
    <a onclick="go('shop')">View all →</a></div>
    <div class="grid grid--4">${fresh.map(productCard).join("")}</div></section>`:
    `<section class="section container"><div class="empty"><span class="empty__mark">◆</span>
    <h2>The vault is being stocked.</h2><p>Sign in to the admin console to post your first bag.</p>
    <button class="btn btn--solid" onclick="go('admin')">Open admin console</button></div></section>`;
  return `<section class="hero"><div class="container hero__inner">
    <div><p class="eyebrow">Est. 2016 · Pre-owned, authenticated</p>
      <h1 class="hero__title">Treasures with<br><em>a second life.</em></h1>
      <p class="hero__sub">Exceptional pre-owned bags from the great houses — Chanel, Hermès, Louis Vuitton and more — each authenticated, condition-graded, and ready for its next chapter.</p>
      <div class="hero__cta"><button class="btn btn--solid btn--lg" onclick="go('shop')">Explore the collection</button>
        <button class="btn btn--ghost btn--lg" onclick="go('about')">Our house</button></div></div>
    <div class="hero__crest"><div class="hero__halo"></div>
      <svg viewBox="0 0 40 40" fill="none"><path d="M20 2 L36 20 L20 38 L4 20 Z" stroke="#a9e8cd" stroke-width="1"/><path d="M20 9 L29 20 L20 31 L11 20 Z" fill="#a9e8cd" opacity=".85"/></svg></div>
  </div></section>
  <div class="strip"><div class="strip__track">${'<span>Every piece expertly authenticated</span><span>◆</span><span>Condition-graded &amp; certified</span><span>◆</span><span>Restored in our atelier</span><span>◆</span>'.repeat(3)}</div></div>
  ${featBlock}${freshBlock}`;
}

let shopState={q:"",brands:new Set(),sort:"featured",saleOnly:false};
function viewShop(){
  const brandCounts={};
  activeProducts().forEach(p=>{if(p.brand)brandCounts[p.brand]=(brandCounts[p.brand]||0)+1});
  const brands=Object.keys(brandCounts).sort();
  let list=activeProducts();
  if(shopState.q){const q=shopState.q.toLowerCase();
    list=list.filter(p=>(p.name+" "+p.brand+" "+p.material+" "+p.colour+" "+p.desc).toLowerCase().includes(q))}
  if(shopState.brands.size)list=list.filter(p=>shopState.brands.has(p.brand));
  if(shopState.saleOnly)list=list.filter(p=>p.sale);
  const s=shopState.sort;
  list=[...list].sort((a,b)=>{
    if(s==="price-asc")return(a.sale||a.price)-(b.sale||b.price);
    if(s==="price-desc")return(b.sale||b.price)-(a.sale||a.price);
    if(s==="newest")return b.created-a.created;
    if(s==="name")return a.name.localeCompare(b.name);
    return(b.featured-a.featured)||(b.created-a.created);
  });
  const brandFilter=brands.length?`<div class="filter glass"><h3 class="filter__title">Brand</h3>
    ${brands.map(b=>`<label class="check"><input type="checkbox" ${shopState.brands.has(b)?"checked":""} onchange="toggleBrand('${esc(b)}')"><span>${esc(b)} <em class="filter__n">${brandCounts[b]}</em></span></label>`).join("")}</div>`:"";
  return `<section class="page-hero"><div class="container"><p class="eyebrow">The boutique</p>
    <h1 class="page-hero__title">The <em>collection.</em></h1></div></section>
  <section class="section container catalog">
    <aside class="filters">
      <div class="filter glass"><h3 class="filter__title">Search</h3>
        <input class="inp" id="search" placeholder="Chanel, Hermès, tote…" value="${esc(shopState.q)}" oninput="shopState.q=this.value;refreshShop()"></div>
      ${brandFilter}
      <div class="filter glass"><h3 class="filter__title">Filter</h3>
        <label class="check"><input type="checkbox" ${shopState.saleOnly?"checked":""} onchange="shopState.saleOnly=this.checked;refreshShop()"><span>On sale</span></label>
        <button class="linklike" style="margin-top:.6rem" onclick="clearFilters()">Clear all</button></div>
    </aside>
    <div>
      <div class="catalog__bar"><p class="catalog__count">${list.length} piece${list.length!==1?"s":""}</p>
        <select class="inp" style="width:auto" onchange="shopState.sort=this.value;refreshShop()">
          ${["featured|Featured","newest|Newest","price-asc|Price: low to high","price-desc|Price: high to low","name|Name A–Z"].map(o=>{const[v,l]=o.split("|");return`<option value="${v}" ${shopState.sort===v?"selected":""}>${l}</option>`}).join("")}
        </select></div>
      ${list.length?`<div class="grid grid--3" id="shopGrid">${list.map(productCard).join("")}</div>`
        :`<div class="empty"><span class="empty__mark">◆</span><h2>Nothing matches.</h2><p>Try a broader search or clear the filters.</p></div>`}
    </div></section>`;
}
function refreshShop(){const cur=$("#search")?.selectionStart;app.innerHTML=viewShop();afterRender();
  const s=$("#search");if(s&&cur!=null){s.focus();s.setSelectionRange(cur,cur)}}
function toggleBrand(b){shopState.brands.has(b)?shopState.brands.delete(b):shopState.brands.add(b);refreshShop()}
function clearFilters(){shopState={q:"",brands:new Set(),sort:"featured",saleOnly:false};refreshShop()}

function viewProduct(slug){
  const p=getProductBySlug(slug);
  if(!p)return `<section class="section container"><div class="empty"><span class="empty__mark">◆</span><h2>Piece not found.</h2><button class="btn btn--ghost" onclick="go('shop')">Back to shop</button></div></section>`;
  const related=activeProducts().filter(x=>x.id!==p.id&&(x.brand===p.brand||x.cat===p.cat)).slice(0,4);
  const gallery=p.images.length?
    `<div class="product__stage"><img id="mainImg" src="${p.images[0]}" alt="${esc(p.name)}"></div>
     ${p.images.length>1?`<div class="product__thumbs">${p.images.map((im,i)=>`<button class="product__thumb ${i===0?"is-active":""}" onclick="swapImg(this,'${im}')"><img src="${im}" alt=""></button>`).join("")}</div>`:""}`
    :`<div class="product__stage"><div class="card__ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M6 8h12l-1.2 11H7.2L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><span>No photo yet</span></div></div>`;
  const price=p.sale?`<span class="price price--now">${money(p.sale)}</span><s class="price price--was">${money(p.price)}</s><span class="badge badge--sale">Save ${money(p.price-p.sale)}</span>`
    :`<span class="price">${money(p.price)}</span>`;
  const stock=p.stock===0?'<span class="stock stock--out">Sold out</span>':
    p.stock<=2?`<span class="stock stock--low">Only ${p.stock} remaining</span>`:'<span class="stock stock--in">In stock</span>';
  const buy=p.stock>0?`<div class="buy">
      <div class="qty"><button onclick="stepQty(-1)">−</button><input id="qty" type="number" value="1" min="1" max="${Math.min(p.stock,10)}"><button onclick="stepQty(1)">+</button></div>
      <button class="btn btn--solid btn--lg" style="flex:1;min-width:200px" onclick="addToCart(${p.id},+$('#qty').value)">Add to cart</button></div>`
    :`<div class="glass" style="padding:1rem 1.3rem;margin-bottom:1rem;color:var(--slate)">This piece is currently sold out.</div>`;
  return `<section class="section container">
    <nav class="crumbs"><a onclick="go('home')">Home</a><span>◆</span><a onclick="go('shop')">Shop</a><span>◆</span><span>${esc(p.name)}</span></nav>
    <div class="product">
      <div>${gallery}</div>
      <div>
        <p class="eyebrow">${esc(p.brand)}${p.cat?" · "+esc(p.cat):""} · ${esc(p.sku)}</p>
        <h1 class="product__name">${esc(p.name)}</h1>
        <p class="product__price">${price}</p>
        <dl class="specs">
          <div><dt>Brand</dt><dd>${esc(p.brand)}</dd></div>
          <div><dt>Condition</dt><dd>${esc(p.condition)} — authenticated pre-owned</dd></div>
          <div><dt>Material</dt><dd>${esc(p.material||"—")}</dd></div>
          <div><dt>Colour</dt><dd>${esc(p.colour||"—")}</dd></div>
          <div><dt>Availability</dt><dd>${stock}</dd></div>
        </dl>
        ${buy}
        <ul class="assurance">
          <li><span>◆</span> Authenticated by our experts before listing</li>
          <li><span>◆</span> Free delivery over $500 · 14-day returns</li>
          <li><span>◆</span> Photographs are of the actual piece</li></ul>
        <div class="desc"><h3 style="font-size:1.2rem;margin-bottom:.5rem">The piece</h3>
          ${esc(p.desc).split("\n").filter(Boolean).map(x=>`<p>${x}</p>`).join("")||"<p>No description provided.</p>"}</div>
      </div></div>
    ${related.length?`<div style="margin-top:4rem"><div class="section__head"><div><p class="eyebrow">Complete the look</p><h2 class="section__title">You may also love</h2></div></div>
      <div class="grid grid--4">${related.map(productCard).join("")}</div></div>`:""}
  </section>`;
}
function swapImg(btn,src){$("#mainImg").src=src;$$(".product__thumb").forEach(t=>t.classList.remove("is-active"));btn.classList.add("is-active")}
function stepQty(d){const i=$("#qty");let v=(+i.value||1)+d;v=Math.max(+i.min,Math.min(+i.max,v));i.value=v}

const PROMOS={WELCOME10:{type:"pct",val:10},TREASURE50:{type:"fixed",val:5000,min:50000}};
let cartPromo="";
function cartTotals(){
  const items=cart().map(l=>({...l,p:getProduct(l.pid)})).filter(l=>l.p);
  const sub=items.reduce((s,l)=>s+(l.p.sale||l.p.price)*l.qty,0);
  let disc=0;const promo=PROMOS[cartPromo];
  if(promo){if(promo.type==="pct")disc=Math.round(sub*promo.val/100);
    else if(sub>=promo.min)disc=promo.val}
  const ship=(sub-disc)>=50000||sub===0?0:1500;
  const tax=Math.round((sub-disc)*0.08);
  return{items,sub,disc,ship,tax,total:sub-disc+ship+tax}
}
function viewCart(){
  const t=cartTotals();
  if(!t.items.length)return `<section class="page-hero"><div class="container"><p class="eyebrow">The vault</p><h1 class="page-hero__title">Your <em>cart.</em></h1></div></section>
    <section class="section container"><div class="empty"><span class="empty__mark">◆</span><h2>Your cart is empty.</h2><p>The vault, however, is full.</p><button class="btn btn--solid" onclick="go('shop')">Explore the collection</button></div></section>`;
  const gap=50000-t.sub;
  return `<section class="page-hero"><div class="container"><p class="eyebrow">The vault</p><h1 class="page-hero__title">Your <em>cart.</em></h1></div></section>
  <section class="section container cart-layout">
    <div class="lines">
      ${gap>0?`<div class="glass" style="padding:.9rem 1.3rem;color:var(--slate)">You're <strong style="color:var(--mint)">${money(gap)}</strong> from complimentary delivery.</div>`:`<div class="glass" style="padding:.9rem 1.3rem;color:var(--mint)">◆ Complimentary delivery unlocked.</div>`}
      ${t.items.map(l=>{const im=l.p.images[0];return`<article class="line glass">
        <div class="line__media" onclick="go('product','${l.p.slug}')">${im?`<img src="${im}">`:`<div class="card__ph" style="aspect-ratio:1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M6 8h12l-1.2 11H7.2L6 8Z"/></svg></div>`}</div>
        <div><p class="card__eyebrow">${esc(l.p.brand)}</p><h3 class="line__name">${esc(l.p.name)}</h3>
          <p>${money(l.p.sale||l.p.price)}</p>
          <button class="linklike linklike--danger" style="margin-top:.4rem" onclick="removeLine(${l.pid})">Remove</button></div>
        <div class="line__side">
          <div class="qty"><button onclick="changeLine(${l.pid},-1)">−</button><input type="number" value="${l.qty}" readonly style="width:40px"><button onclick="changeLine(${l.pid},1)">+</button></div>
          <p style="font-weight:500">${money((l.p.sale||l.p.price)*l.qty)}</p></div>
      </article>`}).join("")}
    </div>
    <aside class="summary glass">
      <h2 class="summary__title">Order summary</h2>
      <div class="promo"><input class="inp" id="promo" placeholder="Promo code" value="${esc(cartPromo)}"><button class="btn btn--ghost btn--sm" onclick="applyPromo()">Apply</button></div>
      ${t.disc?`<p style="color:var(--mint);font-size:.84rem">◆ "${esc(cartPromo)}" applied — ${money(t.disc)} off.</p>`:""}
      <dl class="rows">
        <div><dt>Subtotal</dt><dd>${money(t.sub)}</dd></div>
        ${t.disc?`<div style="color:var(--mint)"><dt>Discount</dt><dd>−${money(t.disc)}</dd></div>`:""}
        <div><dt>Delivery</dt><dd>${t.ship?money(t.ship):"Free"}</dd></div>
        <div><dt>Tax (8%)</dt><dd>${money(t.tax)}</dd></div>
        <div class="total"><dt>Total</dt><dd>${money(t.total)}</dd></div></dl>
      <button class="btn btn--solid btn--lg btn--full" onclick="go('checkout')">Proceed to checkout</button>
      <button class="linklike" style="text-align:center" onclick="go('shop')">← Continue shopping</button>
    </aside></section>`;
}
function changeLine(pid,d){const l=cart().find(i=>i.pid===pid);if(!l)return;const p=getProduct(pid);
  l.qty=Math.max(0,Math.min(p.stock,l.qty+d));if(l.qty===0)DB._cart=cart().filter(i=>i.pid!==pid);
  save();refreshCart()}
function removeLine(pid){DB._cart=cart().filter(i=>i.pid!==pid);save();refreshCart();toast("Removed from cart.","info")}
function refreshCart(){updateBadge();app.innerHTML=viewCart();afterRender()}
function applyPromo(){const code=$("#promo").value.trim().toUpperCase();
  if(!code){cartPromo="";refreshCart();return}
  if(PROMOS[code]){cartPromo=code;toast("Promo applied.")}else{cartPromo="";toast("That code isn't valid.","error")}refreshCart()}

function viewCheckout(){
  const u=currentUser();
  if(!u){setTimeout(()=>openAuth("login",()=>go("checkout")),50);
    return `<section class="section container"><div class="empty"><span class="empty__mark">◆</span><h2>Please sign in to check out.</h2><button class="btn btn--solid" onclick="openAuth('login',()=>go('checkout'))">Sign in</button></div></section>`}
  const t=cartTotals();
  if(!t.items.length){go("cart");return""}
  const a=u.address||{};
  const bank=DB.settings.bank_account_number?`<label class="check" style="border:1px solid var(--line-dim);border-radius:11px;padding:.7rem .95rem;margin-top:.5rem"><input type="radio" name="pay" value="bank"><span>◆ Bank transfer</span></label>`:"";
  return `<section class="page-hero"><div class="container"><p class="eyebrow">Secure checkout</p><h1 class="page-hero__title">Almost <em>yours.</em></h1></div></section>
  <section class="section container cart-layout">
    <div class="glass" style="padding:1.7rem">
      <h2 style="font-size:1.4rem;margin-bottom:1rem">Delivery details</h2>
      <div class="field"><label>Full name</label><input class="inp" id="c_name" value="${esc(a.name||u.first+" "+u.last)}"></div>
      <div class="field"><label>Address line 1</label><input class="inp" id="c_l1" value="${esc(a.line1||"")}"></div>
      <div class="form-row">
        <div class="field"><label>City</label><input class="inp" id="c_city" value="${esc(a.city||"")}"></div>
        <div class="field"><label>Postal code</label><input class="inp" id="c_post" value="${esc(a.postal||"")}"></div></div>
      <div class="field"><label>Country</label><input class="inp" id="c_country" value="${esc(a.country||"")}"></div>
      <h2 style="font-size:1.4rem;margin:1.4rem 0 1rem">Payment</h2>
      <label class="check" style="border:1px solid var(--mint);border-radius:11px;padding:.7rem .95rem"><input type="radio" name="pay" value="card" checked><span>◆ Card</span></label>
      ${bank}
      <div id="cardFields" style="margin-top:1rem">
        <div class="field"><label>Card number</label><input class="inp" id="c_card" placeholder="4242 4242 4242 4242" inputmode="numeric"><p class="hint">Demo — any 16-digit number works; numbers starting 0000 will decline.</p></div>
        <div class="form-row">
          <div class="field"><label>Expiry</label><input class="inp" id="c_exp" placeholder="12/28"></div>
          <div class="field"><label>CVV</label><input class="inp" id="c_cvv" placeholder="123"></div></div>
      </div>
      <p class="hint" id="bankNote" style="display:none">◆ Your order will wait as "Pending Payment" until the transfer is confirmed. Account details appear on the confirmation page.</p>
    </div>
    <aside class="summary glass">
      <h2 class="summary__title">Your order</h2>
      ${t.items.map(l=>`<div class="rows"><div><dt>${esc(l.p.name)} × ${l.qty}</dt><dd>${money((l.p.sale||l.p.price)*l.qty)}</dd></div></div>`).join("")}
      <dl class="rows" style="border-top:1px solid var(--line-dim);padding-top:.8rem">
        <div><dt>Subtotal</dt><dd>${money(t.sub)}</dd></div>
        ${t.disc?`<div style="color:var(--mint)"><dt>Discount</dt><dd>−${money(t.disc)}</dd></div>`:""}
        <div><dt>Delivery</dt><dd>${t.ship?money(t.ship):"Free"}</dd></div>
        <div><dt>Tax</dt><dd>${money(t.tax)}</dd></div>
        <div class="total"><dt>Total</dt><dd>${money(t.total)}</dd></div></dl>
      <button class="btn btn--solid btn--lg btn--full" id="placeBtn" onclick="placeOrder()">Place order · ${money(t.total)}</button>
    </aside></section>`;
}

function placeOrder(){
  const u=currentUser();const t=cartTotals();
  const name=$("#c_name").value.trim(),l1=$("#c_l1").value.trim(),city=$("#c_city").value.trim(),
    country=$("#c_country").value.trim(),postal=$("#c_post").value.trim();
  if(!name||!l1||!city||!country){toast("Please complete your delivery details.","error");return}
  const pay=$$('input[name=pay]').find(r=>r.checked)?.value||"card";
  if(pay==="card"){
    const num=($("#c_card").value||"").replace(/\D/g,"");
    if(num.length<12){toast("Enter a valid card number.","error");return}
    if(num.startsWith("0000")){toast("Card declined — try a number that doesn't start with 0000.","error");return}
  }
  // check stock, decrement, create order
  for(const l of t.items){if(l.qty>l.p.stock){toast(l.p.name+" is out of stock.","error");return}}
  const btn=$("#placeBtn");if(btn){btn.disabled=true;btn.textContent="Securing your order…"}
  t.items.forEach(l=>{getProduct(l.pid).stock-=l.qty});
  // save address to profile
  u.address={name,line1:l1,city,postal,country};
  const num="TTB-"+new Date().toISOString().slice(0,10).replace(/-/g,"")+"-"+uid().slice(0,6).toUpperCase();
  const order={id:nextId(),number:num,userId:u.id,email:u.email,status:pay==="bank"?"Pending Payment":"Payment Confirmed",
    payment:pay,items:t.items.map(l=>({name:l.p.name,sku:l.p.sku,qty:l.qty,price:l.p.sale||l.p.price,img:l.p.images[0]||""})),
    sub:t.sub,disc:t.disc,ship:t.ship,tax:t.tax,total:t.total,address:{name,line1:l1,city,postal,country},
    created:Date.now(),events:[{status:"Order received",at:Date.now()}]};
  if(pay!=="bank")order.events.push({status:"Payment Confirmed",at:Date.now()});
  DB.orders.push(order);DB._cart=[];cartPromo="";save();
  go("confirm",num);
}

function viewConfirm(num){
  const o=DB.orders.find(x=>x.number===num);
  if(!o)return viewHome();
  const bank=o.payment==="bank"&&DB.settings.bank_account_number?`
    <div class="glass" style="border:1px solid var(--mint);padding:1.3rem 1.5rem;text-align:left;margin-top:1rem">
      <p style="font-family:var(--fd);font-size:1.15rem;color:var(--mint);margin-bottom:.6rem">◆ Complete payment by bank transfer</p>
      <dl class="rows">
        ${DB.settings.bank_name?`<div><dt>Bank</dt><dd>${esc(DB.settings.bank_name)}</dd></div>`:""}
        ${DB.settings.bank_account_name?`<div><dt>Account holder</dt><dd>${esc(DB.settings.bank_account_name)}</dd></div>`:""}
        <div><dt>Account number</dt><dd style="color:var(--mint);letter-spacing:.1em">${esc(DB.settings.bank_account_number)}</dd></div>
        <div><dt>Amount</dt><dd>${money(o.total)}</dd></div>
        <div><dt>Reference</dt><dd>${o.number}</dd></div></dl>
      ${DB.settings.bank_instructions?`<p class="muted" style="font-size:.88rem;margin-top:.6rem">${esc(DB.settings.bank_instructions)}</p>`:""}
    </div>`:"";
  return `<section class="section container">
    <div class="glass" style="max-width:680px;margin:0 auto;padding:clamp(1.8rem,5vw,3rem);text-align:center">
      <svg style="width:80px;margin:0 auto 1rem" viewBox="0 0 40 40" fill="none"><path d="M20 3 L34 20 L20 37 L6 20 Z" stroke="#a9e8cd" stroke-width="1.5"/><path d="M20 11 L27 20 L20 29 L13 20 Z" fill="#a9e8cd" opacity=".85"/></svg>
      <p class="eyebrow">Order ${o.number}</p>
      <h1 style="font-size:clamp(2rem,4.5vw,3rem)">Consider it <em>treasured.</em></h1>
      <p class="muted" style="max-width:46ch;margin:.6rem auto">Thank you, ${esc(o.address.name.split(" ")[0])}. ${o.status==="Pending Payment"?"Your order is reserved pending your bank transfer.":"Your order is confirmed and with the atelier for final inspection."}</p>
      <dl class="rows" style="text-align:left;max-width:420px;margin:1.4rem auto">
        <div><dt>Subtotal</dt><dd>${money(o.sub)}</dd></div>
        ${o.disc?`<div style="color:var(--mint)"><dt>Discount</dt><dd>−${money(o.disc)}</dd></div>`:""}
        <div><dt>Delivery</dt><dd>${o.ship?money(o.ship):"Free"}</dd></div>
        <div><dt>Tax</dt><dd>${money(o.tax)}</dd></div>
        <div class="total"><dt>Total</dt><dd>${money(o.total)}</dd></div></dl>
      ${bank}
      <div style="display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap;margin-top:1.4rem">
        <button class="btn btn--solid" onclick="go('account')">View my orders</button>
        <button class="btn btn--ghost" onclick="go('shop')">Continue shopping</button></div>
    </div></section>`;
}

function viewAccount(){
  const u=currentUser();
  if(!u){go("home");return""}
  const orders=DB.orders.filter(o=>o.userId===u.id).sort((a,b)=>b.created-a.created);
  const a=u.address||{};
  return `<section class="page-hero"><div class="container"><p class="eyebrow">My account</p>
    <h1 class="page-hero__title">Welcome back, <em>${esc(u.first)}.</em></h1></div></section>
  <section class="section container" style="display:grid;gap:1.4rem;max-width:900px">
    <div class="glass" style="padding:1.6rem">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;margin-bottom:1rem">
        <h2 style="font-size:1.4rem">Orders</h2><button class="linklike linklike--danger" onclick="logout()">Sign out</button></div>
      ${orders.length?`<table class="table"><thead><tr><th>Order</th><th>Date</th><th>Status</th><th class="ta-r">Total</th></tr></thead><tbody>
        ${orders.map(o=>`<tr style="cursor:pointer" onclick="go('confirm','${o.number}')"><td>${o.number}</td><td>${new Date(o.created).toLocaleDateString()}</td><td><span class="badge badge--status">${o.status}</span></td><td class="ta-r">${money(o.total)}</td></tr>`).join("")}
      </tbody></table>`:`<p class="muted">No orders yet. <a onclick="go('shop')">Browse the collection.</a></p>`}
    </div>
    <div class="glass" style="padding:1.6rem">
      <h2 style="font-size:1.4rem;margin-bottom:1rem">Profile</h2>
      <div class="form-row">
        <div class="field"><label>First name</label><input class="inp" id="p_first" value="${esc(u.first)}"></div>
        <div class="field"><label>Last name</label><input class="inp" id="p_last" value="${esc(u.last)}"></div></div>
      <div class="form-row">
        <div class="field"><label>Phone <span class="opt">optional</span></label><input class="inp" id="p_phone" value="${esc(u.phone||"")}"></div>
        <div class="field"><label>Date of birth <span class="opt">optional</span></label><input class="inp" id="p_dob" type="date" value="${esc(u.dob||"")}"><p class="hint">${u.dob?"Age: "+ageFrom(u.dob)+" years":"Not set"}</p></div></div>
      <div class="field"><label>Gender <span class="opt">optional</span></label>
        <select class="inp" id="p_gender">${["","Female","Male","Non-binary","Prefer not to say"].map(g=>`<option ${u.gender===g?"selected":""}>${g||"Prefer not to say"}</option>`).join("")}</select></div>
      <h3 style="font-size:1.1rem;margin:1.2rem 0 .3rem;padding-top:1rem;border-top:1px solid var(--line-dim)">Default delivery address</h3>
      <p class="muted" style="font-size:.85rem;margin-bottom:.8rem">Saved here, filled in for you at checkout.</p>
      <div class="field"><label>Address line 1</label><input class="inp" id="p_l1" value="${esc(a.line1||"")}"></div>
      <div class="form-row">
        <div class="field"><label>City</label><input class="inp" id="p_city" value="${esc(a.city||"")}"></div>
        <div class="field"><label>Postal code</label><input class="inp" id="p_post" value="${esc(a.postal||"")}"></div></div>
      <div class="field"><label>Country</label><input class="inp" id="p_country" value="${esc(a.country||"")}"></div>
      <button class="btn btn--solid" onclick="saveProfile()">Save changes</button>
    </div>
  </section>`;
}
function ageFrom(dob){const b=new Date(dob),n=new Date();let a=n.getFullYear()-b.getFullYear();
  if(n.getMonth()<b.getMonth()||(n.getMonth()===b.getMonth()&&n.getDate()<b.getDate()))a--;return a}
function saveProfile(){const u=currentUser();
  u.first=$("#p_first").value.trim()||u.first;u.last=$("#p_last").value.trim()||u.last;
  u.phone=$("#p_phone").value.trim();u.dob=$("#p_dob").value;u.gender=$("#p_gender").value;
  u.address={...u.address,line1:$("#p_l1").value.trim(),city:$("#p_city").value.trim(),
    postal:$("#p_post").value.trim(),country:$("#p_country").value.trim()};
  save();toast("Profile updated.");render()}
function logout(){DB.session=null;save();toast("Signed out.","info");go("home")}

function viewAbout(){
  return `<section class="page-hero"><div class="container"><p class="eyebrow">Since 2016</p>
    <h1 class="page-hero__title">A second life for<br><em>great design.</em></h1>
    <p class="page-hero__sub">The Treasure Box finds, authenticates and restores exceptional pre-owned bags — giving masterpieces a new chapter, and a new owner, at a fraction of boutique prices.</p></div></section>
  <section class="section container" style="max-width:900px">
    <div class="grid grid--3">
      <div class="glass" style="padding:1.6rem"><span style="font-family:var(--fd);font-size:2.2rem;color:var(--mint);opacity:.55">01</span>
        <h3 style="font-size:1.3rem;margin:.3rem 0 .4rem">Authenticated, always</h3><p class="muted">Every bag passes a multi-point inspection before it's ever listed. No exceptions.</p></div>
      <div class="glass" style="padding:1.6rem"><span style="font-family:var(--fd);font-size:2.2rem;color:var(--mint);opacity:.55">02</span>
        <h3 style="font-size:1.3rem;margin:.3rem 0 .4rem">Honestly graded</h3><p class="muted">From Pristine to Fair, each piece carries a clear condition grade and real photographs.</p></div>
      <div class="glass" style="padding:1.6rem"><span style="font-family:var(--fd);font-size:2.2rem;color:var(--mint);opacity:.55">03</span>
        <h3 style="font-size:1.3rem;margin:.3rem 0 .4rem">Luxury, sustained</h3><p class="muted">A bag re-loved is a bag not landfilled. Give a masterpiece its second chapter.</p></div>
    </div></section>`;
}

/* ============================================================ ADMIN ====== */
function viewAdminLogin(){
  return `<section class="section container" style="max-width:460px">
    <div class="glass" style="padding:2.2rem">
      <svg style="width:56px;margin-bottom:1rem" viewBox="0 0 40 40" fill="none"><path d="M20 3 L34 20 L20 37 L6 20 Z" stroke="#a9e8cd" stroke-width="1.5"/><path d="M20 11 L27 20 L20 29 L13 20 Z" fill="#a9e8cd" opacity=".85"/></svg>
      <h1 style="font-size:1.9rem">Admin console</h1>
      <p class="muted" style="margin:.4rem 0 1.4rem">Sign in to manage the boutique.</p>
      <div class="field"><label>E-mail</label><input class="inp" id="a_email" value="csbizcircle18@gmail.com"></div>
      <div class="field"><label>Password</label><input class="inp" id="a_pass" type="password" placeholder="••••••••"></div>
      <button class="btn btn--solid btn--full btn--lg" onclick="adminLogin()">Sign in</button>
      <p class="hint" style="margin-top:1rem">Default: csbizcircle18@gmail.com / cstol89*</p>
    </div></section>`;
}
function adminLogin(){
  const email=$("#a_email").value.trim().toLowerCase(),pass=$("#a_pass").value;
  const u=DB.users.find(x=>x.email===email&&x.role==="admin");
  if(!u||u.pass!==pass){toast("Incorrect e-mail or password.","error");return}
  DB.session=u.id;save();toast("Welcome back.");go("admin");
}
function viewAdmin(){
  const revenue=DB.orders.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+o.total,0);
  const low=DB.products.filter(p=>p.stock<=2&&p.status==="active");
  return `<section class="page-hero"><div class="container" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:1rem">
    <div><p class="eyebrow">Atelier console</p><h1 class="page-hero__title">Dashboard</h1></div>
    <div style="display:flex;gap:.6rem;flex-wrap:wrap"><button class="btn btn--ghost" onclick="adminSettings()">Payment settings</button>
      <button class="btn btn--solid" onclick="go('admin-product','new')">＋ Post a bag</button></div></div></section>
  <section class="section container">
    <div class="statgrid">
      <div class="stat glass"><span class="stat__n">${money(revenue)}</span><span class="stat__l">Revenue</span></div>
      <div class="stat glass"><span class="stat__n">${DB.orders.length}</span><span class="stat__l">Orders</span></div>
      <div class="stat glass"><span class="stat__n">${DB.products.length}</span><span class="stat__l">Products</span></div>
      <div class="stat glass"><span class="stat__n">${DB.users.filter(u=>u.role!=="admin").length}</span><span class="stat__l">Customers</span></div>
    </div>
    <div class="glass" style="padding:1.6rem;margin-bottom:1.4rem">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;margin-bottom:1rem">
        <h2 style="font-size:1.4rem">Products</h2><button class="btn btn--solid btn--sm" onclick="go('admin-product','new')">＋ Post a bag</button></div>
      ${DB.products.length?`<table class="table"><thead><tr><th></th><th>Piece</th><th>Brand</th><th>SKU</th><th class="ta-r">Price</th><th class="ta-r">Stock</th><th>Status</th><th></th></tr></thead><tbody>
        ${DB.products.map(p=>`<tr>
          <td>${p.images[0]?`<img class="table__thumb" src="${p.images[0]}">`:`<div class="table__thumb" style="display:grid;place-items:center;color:var(--slate-dim)">◆</div>`}</td>
          <td><a onclick="go('admin-product',${p.id})">${esc(p.name)}</a></td>
          <td>${esc(p.brand)}</td><td>${esc(p.sku)}</td>
          <td class="ta-r">${p.sale?money(p.sale)+' <s class="muted">'+money(p.price)+"</s>":money(p.price)}</td>
          <td class="ta-r">${p.stock<=2?'<span class="badge badge--low">'+p.stock+"</span>":p.stock}</td>
          <td><span class="badge ${p.status==="active"?"badge--new":"badge--status"}">${p.status}</span></td>
          <td class="ta-r"><button class="linklike linklike--danger" onclick="deleteProduct(${p.id})">Delete</button></td>
        </tr>`).join("")}
      </tbody></table>`:`<p class="muted">No products yet. <a onclick="go('admin-product','new')">Post your first bag.</a></p>`}
    </div>
    <div class="glass" style="padding:1.6rem">
      <h2 style="font-size:1.4rem;margin-bottom:1rem">Orders</h2>
      ${DB.orders.length?`<table class="table"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th class="ta-r">Total</th><th></th></tr></thead><tbody>
        ${[...DB.orders].reverse().map(o=>`<tr><td>${o.number}</td><td>${esc(o.email)}</td>
          <td><select class="inp" style="padding:.3rem .6rem;font-size:.82rem" onchange="setOrderStatus(${o.id},this.value)">
            ${["Pending Payment","Payment Confirmed","Processing","Packaging","Shipped","Delivered","Cancelled"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select></td>
          <td class="ta-r">${money(o.total)}</td>
          <td class="ta-r"><button class="linklike" onclick="go('confirm','${o.number}')">View</button></td></tr>`).join("")}
      </tbody></table>`:`<p class="muted">No orders yet.</p>`}
    </div>
  </section>`;
}
function setOrderStatus(id,status){const o=DB.orders.find(x=>x.id===id);if(!o)return;
  if((status==="Cancelled")&&o.status!=="Cancelled"){o.items.forEach(it=>{const p=DB.products.find(x=>x.sku===it.sku);if(p)p.stock+=it.qty})}
  o.status=status;o.events.push({status,at:Date.now()});save();toast("Order updated to "+status+".");}
function deleteProduct(id){const p=getProduct(id);
  openModal(`<h2 class="modal__title">◆ Delete "${esc(p.name)}"?</h2><p class="muted" style="margin-bottom:1.4rem">This can't be undone.</p>
    <div style="display:flex;gap:.7rem;justify-content:flex-end"><button class="btn btn--ghost" onclick="closeModal()">Keep it</button>
    <button class="btn btn--danger" onclick="confirmDelete(${id})">Delete</button></div>`)}
function confirmDelete(id){DB.products=DB.products.filter(p=>p.id!==id);save();closeModal();toast("Product deleted.","info");render()}

let draftImages=[];
function viewAdminProduct(param){
  const isNew=param==="new";
  const p=isNew?{name:"",brand:"",condition:"Excellent",sku:"TTB-"+(DB.seq),material:"",colour:"",
    price:"",sale:"",stock:1,cat:"",desc:"",status:"active",featured:false,isnew:false,images:[]}:getProduct(param);
  if(!p)return viewAdmin();
  draftImages=[...(p.images||[])];
  return `<section class="page-hero"><div class="container"><p class="eyebrow"><a onclick="go('admin')">Products</a> ◆ ${isNew?"New":"Edit"}</p>
    <h1 class="page-hero__title">${isNew?"Post a bag":esc(p.name)}</h1></div></section>
  <section class="section container" style="max-width:900px">
    <div id="formErrors"></div>
    <div class="glass" style="padding:1.7rem;margin-bottom:1.4rem">
      <h2 style="font-size:1.3rem;margin-bottom:1rem">The piece</h2>
      <div class="field"><label>Name</label><input class="inp" id="f_name" value="${esc(p.name)}" placeholder="e.g. Classic Flap Medium"></div>
      <div class="form-row">
        <div class="field"><label>Brand</label><input class="inp" id="f_brand" value="${esc(p.brand)}" placeholder="e.g. Chanel, Hermès"><p class="hint">Shoppers can search &amp; filter by brand.</p></div>
        <div class="field"><label>Condition</label><select class="inp" id="f_condition">${["Pristine","Excellent","Very Good","Good","Fair"].map(c=>`<option ${p.condition===c?"selected":""}>${c}</option>`).join("")}</select></div></div>
      <div class="form-row">
        <div class="field"><label>SKU</label><input class="inp" id="f_sku" value="${esc(p.sku)}"></div>
        <div class="field"><label>Category <span class="opt">optional</span></label><input class="inp" id="f_cat" value="${esc(p.cat)}" placeholder="e.g. Totes"></div></div>
      <div class="form-row">
        <div class="field"><label>Material <span class="opt">optional</span></label><input class="inp" id="f_material" value="${esc(p.material)}" placeholder="e.g. Caviar leather"></div>
        <div class="field"><label>Colour <span class="opt">optional</span></label><input class="inp" id="f_colour" value="${esc(p.colour)}" placeholder="e.g. Black"></div></div>
      <div class="field"><label>Description</label><textarea class="inp" id="f_desc" rows="5" placeholder="Condition notes, what's included, provenance… (at least 20 characters)">${esc(p.desc)}</textarea></div>
    </div>
    <div class="glass" style="padding:1.7rem;margin-bottom:1.4rem">
      <h2 style="font-size:1.3rem;margin-bottom:1rem">Photos</h2>
      <div class="field"><label>Add images <span class="opt">the first is the cover</span></label>
        <input class="inp" type="file" id="f_images" accept="image/*" multiple onchange="handleImages(this)"></div>
      <div class="imgprev" id="imgPrev"></div>
    </div>
    <div class="glass" style="padding:1.7rem;margin-bottom:1.4rem">
      <h2 style="font-size:1.3rem;margin-bottom:1rem">Pricing &amp; stock</h2>
      <div class="form-row">
        <div class="field"><label>Price (USD)</label><input class="inp" id="f_price" value="${p.price?(p.price/100):""}" placeholder="1450.00"></div>
        <div class="field"><label>Sale price <span class="opt">optional</span></label><input class="inp" id="f_sale" value="${p.sale?(p.sale/100):""}" placeholder=""></div></div>
      <div class="form-row">
        <div class="field"><label>Stock</label><input class="inp" id="f_stock" type="number" value="${p.stock}"></div>
        <div class="field"><label>Status</label><select class="inp" id="f_status">${["active","draft","archived"].map(s=>`<option ${p.status===s?"selected":""}>${s}</option>`).join("")}</select>
          <p class="hint"><strong>Active</strong> = visible to shoppers · <strong>Draft</strong> = hidden.</p></div></div>
      <label class="check"><input type="checkbox" id="f_featured" ${p.featured?"checked":""}><span>Feature on the homepage</span></label>
      <label class="check"><input type="checkbox" id="f_isnew" ${p.isnew?"checked":""}><span>Mark as "New"</span></label>
    </div>
    <div style="display:flex;gap:.8rem;flex-wrap:wrap">
      <button class="btn btn--solid btn--lg" onclick="saveProduct('${isNew?"new":p.id}')">${isNew?"Post this bag":"Save changes"}</button>
      ${!isNew&&p.status==="active"?`<button class="btn btn--ghost btn--lg" onclick="go('product','${p.slug}')">View live listing ↗</button>`:""}
      <button class="btn btn--ghost btn--lg" onclick="go('admin')">Cancel</button>
    </div>
  </section>`;
}
function handleImages(input){
  const files=[...input.files];
  let pending=files.length;
  files.forEach(f=>{if(!f.type.startsWith("image/")||f.size>3*1024*1024){toast(f.name+": skip (not an image or over 3MB).","error");pending--;return}
    const r=new FileReader();r.onload=()=>{draftImages.push(r.result);pending--;renderImgPrev()};r.readAsDataURL(f)})}
function renderImgPrev(){$("#imgPrev").innerHTML=draftImages.map((im,i)=>`<div style="position:relative"><img src="${im}"><button class="linklike linklike--danger" style="position:absolute;top:4px;right:6px;background:rgba(4,7,28,.7);padding:2px 6px;border-radius:6px" onclick="draftImages.splice(${i},1);renderImgPrev()">×</button></div>`).join("")}
function saveProduct(param){
  const isNew=param==="new";
  const d={name:$("#f_name").value.trim(),brand:$("#f_brand").value.trim(),condition:$("#f_condition").value,
    sku:$("#f_sku").value.trim(),cat:$("#f_cat").value.trim(),material:$("#f_material").value.trim(),
    colour:$("#f_colour").value.trim(),desc:$("#f_desc").value.trim(),status:$("#f_status").value,
    featured:$("#f_featured").checked,isnew:$("#f_isnew").checked};
  const price=Math.round(parseFloat($("#f_price").value)*100);
  const sale=$("#f_sale").value?Math.round(parseFloat($("#f_sale").value)*100):0;
  const stock=parseInt($("#f_stock").value)||0;
  const errors=[];
  if(d.name.length<3)errors.push("Product name must be at least 3 characters.");
  if(d.brand.length<2)errors.push("Enter the bag's brand (e.g. Chanel, Hermès, Louis Vuitton).");
  if(d.sku.length<3)errors.push("Enter an SKU.");
  if(d.desc.length<20)errors.push("Description must be at least 20 characters.");
  if(!price||price<0||isNaN(price))errors.push("Enter a valid price.");
  if(sale&&sale>=price)errors.push("Sale price must be lower than the regular price.");
  const skuClash=DB.products.find(p=>p.sku===d.sku&&(isNew||p.id!==+param));
  if(skuClash)errors.push("That SKU is already in use.");
  if(errors.length){$("#formErrors").innerHTML=`<div class="formerrors glass"><p>◆ Please fix ${errors.length} thing${errors.length>1?"s":""} before saving:</p><ul>${errors.map(e=>`<li>${esc(e)}</li>`).join("")}</ul></div>`;
    window.scrollTo(0,0);return}
  if(isNew){
    const p={id:nextId(),slug:slugify(d.name),images:[...draftImages],price,sale,stock,created:Date.now(),...d};
    // ensure unique slug
    let base=p.slug,i=2;while(DB.products.some(x=>x.slug===p.slug)){p.slug=base+"-"+i++;}
    DB.products.push(p);save();
    toast(draftImages.length?`"${d.name}" is now live in the boutique.`:`"${d.name}" was posted — add a photo so shoppers can see it.`,draftImages.length?"success":"info");
    go("admin-product",p.id);
  }else{
    const p=getProduct(+param);Object.assign(p,d,{price,sale,stock,images:[...draftImages]});
    if(d.name)p.slug=p.slug;save();toast("Product updated.");go("admin");
  }
}
function adminSettings(){const s=DB.settings;
  openModal(`<h2 class="modal__title">◆ Payment settings</h2>
    <p class="muted" style="font-size:.88rem;margin-bottom:1.2rem">Enter a bank account to offer <strong>Bank transfer</strong> at checkout. Shoppers see these details on their confirmation. Clear the account number to hide the option.</p>
    <div class="field"><label>Bank name</label><input class="inp" id="s_bank" value="${esc(s.bank_name||"")}" placeholder="e.g. Bank Central Asia (BCA)"></div>
    <div class="field"><label>Account holder</label><input class="inp" id="s_holder" value="${esc(s.bank_account_name||"")}"></div>
    <div class="field"><label>Account number</label><input class="inp" id="s_num" value="${esc(s.bank_account_number||"")}" placeholder="1234 5678 90"></div>
    <div class="field"><label>Instructions <span class="opt">optional</span></label><textarea class="inp" id="s_note" rows="3">${esc(s.bank_instructions||"")}</textarea></div>
    <button class="btn btn--solid btn--full" onclick="saveSettings()">Save settings</button>`)}
function saveSettings(){DB.settings={bank_name:$("#s_bank").value.trim(),bank_account_name:$("#s_holder").value.trim(),
  bank_account_number:$("#s_num").value.replace(/[^\d\s-]/g,"").trim(),bank_instructions:$("#s_note").value.trim()};
  save();closeModal();toast(DB.settings.bank_account_number?"Bank transfer is now available at checkout.":"Settings saved.")}

/* ============================================================ AUTH ======= */
function openAuth(mode,onDone){
  const login=`<div id="authLogin">
    <div class="field"><label>E-mail</label><input class="inp" id="l_email" type="email"></div>
    <div class="field"><label>Password</label><input class="inp" id="l_pass" type="password"></div>
    <button class="btn btn--solid btn--full btn--lg" onclick="doLogin()">Sign in</button></div>`;
  const reg=`<div id="authReg" style="display:none">
    <div class="form-row"><div class="field"><label>First name</label><input class="inp" id="r_first"></div>
      <div class="field"><label>Last name</label><input class="inp" id="r_last"></div></div>
    <div class="field"><label>E-mail</label><input class="inp" id="r_email" type="email"></div>
    <div class="form-row"><div class="field"><label>Phone <span class="opt">optional</span></label><input class="inp" id="r_phone"></div>
      <div class="field"><label>Date of birth <span class="opt">optional</span></label><input class="inp" id="r_dob" type="date"><p class="hint">18+ to purchase.</p></div></div>
    <div class="field"><label>Gender <span class="opt">optional</span></label>
      <select class="inp" id="r_gender"><option>Prefer not to say</option><option>Female</option><option>Male</option><option>Non-binary</option></select></div>
    <div class="field"><label>Password</label><input class="inp" id="r_pass" type="password"><p class="hint">At least 8 characters.</p></div>
    <button class="btn btn--solid btn--full btn--lg" onclick="doRegister()">Create account</button></div>`;
  openModal(`<h2 class="modal__title">◆ The Treasure Box</h2>
    <div class="authtabs"><button class="authtab ${mode!=="register"?"is-active":""}" onclick="authTab('login')">Sign in</button>
      <button class="authtab ${mode==="register"?"is-active":""}" onclick="authTab('register')">Create account</button></div>
    ${login}${reg}`);
  authOnDone=onDone||null;
  if(mode==="register")authTab("register");
}
let authOnDone=null;
function authTab(mode){$("#authLogin").style.display=mode==="login"?"block":"none";
  $("#authReg").style.display=mode==="register"?"block":"none";
  $$(".authtab").forEach((t,i)=>t.classList.toggle("is-active",(mode==="login")===(i===0)))}
function doLogin(){const email=$("#l_email").value.trim().toLowerCase(),pass=$("#l_pass").value;
  const u=DB.users.find(x=>x.email===email);
  if(!u||u.pass!==pass){toast("Incorrect e-mail or password.","error");return}
  DB.session=u.id;save();closeModal();toast("Welcome back, "+u.first+".");
  const cb=authOnDone;authOnDone=null;cb?cb():render()}
function doRegister(){
  const first=$("#r_first").value.trim(),last=$("#r_last").value.trim(),email=$("#r_email").value.trim().toLowerCase(),
    pass=$("#r_pass").value,dob=$("#r_dob").value;
  if(first.length<2||last.length<1)return toast("Please enter your full name.","error");
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return toast("Enter a valid e-mail.","error");
  if(pass.length<8)return toast("Password must be at least 8 characters.","error");
  if(DB.users.some(u=>u.email===email))return toast("That e-mail already has an account.","error");
  if(dob){const a=ageFrom(dob);if(a<18)return toast("You must be 18 or older to open an account.","error")}
  const u={id:nextId(),email,pass,first,last,role:"customer",phone:$("#r_phone").value.trim(),
    dob,gender:$("#r_gender").value,address:{},created:Date.now()};
  DB.users.push(u);DB.session=u.id;save();closeModal();toast("Account created. Welcome, "+first+".");
  const cb=authOnDone;authOnDone=null;cb?cb():render()}

/* ------------------------------------------------------------ boot ------ */
function afterRender(){
  // re-bind burger each render
}
$("#burger").addEventListener("click",()=>$("#navlinks").classList.toggle("is-open"));
document.addEventListener("click",e=>{const n=$("#navlinks");
  if(n.classList.contains("is-open")&&!n.contains(e.target)&&!$("#burger").contains(e.target))n.classList.remove("is-open")});

render();
