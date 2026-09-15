const firebaseConfig={apiKey:"AIzaSyDuZpWaZFY18eyJNOMjFap2XVTr6D0cMyE",authDomain:"makasia.firebaseapp.com",projectId:"makasia",storageBucket:"makasia.firebasestorage.app",messagingSenderId:"51102698357",appId:"1:51102698357:web:59f62a3c8e76663947a13c"};
if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
const db=firebase.firestore(),auth=firebase.auth();
let products=[],cart=JSON.parse(localStorage.getItem("makasia_cart"))||[],activeCategory="ყველა",searchQuery="";
const productGrid=document.getElementById("product-grid"),cartCount=document.getElementById("cart-count"),cartItemsContainer=document.getElementById("cart-items"),cartTotal=document.getElementById("cart-total"),cartPanel=document.getElementById("cart-panel"),overlay=document.getElementById("overlay"),toast=document.getElementById("toast");

function injectCartPopupStyles(){
if(document.getElementById("makasia-cart-popup-styles"))return;
const style=document.createElement("style");style.id="makasia-cart-popup-styles";
style.textContent=`#overlay{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;background:rgba(15,23,42,.65)!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;z-index:9998!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;transition:opacity .3s ease,visibility .3s ease!important}#overlay.open,#overlay.show{opacity:1!important;visibility:visible!important;pointer-events:auto!important}
#cart-panel{position:fixed!important;top:50%!important;left:50%!important;right:auto!important;bottom:auto!important;width:min(92vw,520px)!important;max-width:520px!important;height:min(82vh,720px)!important;max-height:720px!important;transform:translate(-50%,-46%) scale(.94)!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;background:rgba(255,255,255,.98)!important;border-radius:28px!important;padding:26px!important;z-index:9999!important;box-shadow:0 30px 80px rgba(30,27,75,.3),0 10px 30px rgba(124,58,237,.15)!important;display:flex!important;flex-direction:column!important;transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .25s ease,visibility .25s ease!important;overflow:hidden!important}#cart-panel.open{transform:translate(-50%,-50%) scale(1)!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important}
#cart-panel .panel-header{flex-shrink:0!important;margin-bottom:18px!important;padding-bottom:16px!important;border-bottom:2px solid #f1f5f9!important}#cart-panel .panel-header h2{font-size:23px!important;color:#1e1b4b!important;font-weight:800!important}#cart-panel .close-btn{width:40px!important;height:40px!important;min-width:40px!important;border-radius:12px!important;font-size:23px!important;transition:all .2s ease!important}#cart-panel .close-btn:hover{transform:rotate(90deg) scale(1.05)!important;background:#fecaca!important}#cart-panel .cart-items{flex:1!important;overflow-y:auto!important;overflow-x:hidden!important;padding:4px 4px 10px 2px!important;margin-bottom:10px!important}#cart-panel .cart-items::-webkit-scrollbar{width:6px}#cart-panel .cart-items::-webkit-scrollbar-track{background:#f8fafc;border-radius:10px}#cart-panel .cart-items::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px}#cart-panel .cart-footer{flex-shrink:0!important;border-top:2px solid #f1f5f9!important;padding-top:18px!important;background:#fff!important}#cart-panel .cart-footer .button{min-height:52px!important;border-radius:16px!important}
.makasia-empty-cart{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:250px;text-align:center;color:#64748b}.makasia-empty-cart-icon{width:72px;height:72px;border-radius:50%;background:#f5f3ff;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:15px}.makasia-empty-cart-title{font-size:17px;font-weight:800;color:#1e1b4b;margin-bottom:5px}.makasia-empty-cart-text{font-size:13px;color:#64748b}
.makasia-cart-item{display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid #eef2f7}.makasia-cart-item-image{width:68px;height:68px;min-width:68px;object-fit:cover;border-radius:14px;background:#f8fafc}.makasia-cart-item-info{flex:1;min-width:0}.makasia-cart-item-name{font-weight:800;color:#1e1b4b;font-size:14px;line-height:1.35;margin-bottom:5px}.makasia-cart-item-price{font-size:13px;color:#64748b}.makasia-cart-remove{width:34px;height:34px;min-width:34px;border:none;border-radius:10px;background:#fef2f2;color:#dc2626;font-size:20px;cursor:pointer;transition:all .2s ease}.makasia-cart-remove:hover{background:#fee2e2;transform:scale(1.08)}
body.makasia-cart-open{overflow:hidden!important}
#makasia-delivery-overlay{position:fixed;inset:0;width:100%;height:100%;background:rgba(15,23,42,.72);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;opacity:0;visibility:hidden;pointer-events:none;z-index:100000;transition:opacity .35s ease,visibility .35s ease}#makasia-delivery-overlay.makasia-delivery-visible{opacity:1;visibility:visible;pointer-events:auto}
#makasia-delivery-popup{position:relative;width:min(92vw,470px);background:linear-gradient(145deg,#fff 0%,#faf9ff 55%,#f5f3ff 100%);border-radius:30px;padding:34px 30px 30px;box-sizing:border-box;text-align:center;box-shadow:0 35px 100px rgba(15,23,42,.35),0 10px 35px rgba(124,58,237,.18);transform:translateY(25px) scale(.92);transition:transform .45s cubic-bezier(.16,1,.3,1);overflow:hidden}#makasia-delivery-overlay.makasia-delivery-visible #makasia-delivery-popup{transform:translateY(0) scale(1)}
#makasia-delivery-popup:before{content:"";position:absolute;width:190px;height:190px;top:-95px;left:-70px;border-radius:50%;background:linear-gradient(135deg,rgba(124,58,237,.14),rgba(99,102,241,.02));pointer-events:none}#makasia-delivery-popup:after{content:"";position:absolute;width:150px;height:150px;right:-75px;bottom:-75px;border-radius:50%;background:linear-gradient(135deg,rgba(5,150,105,.13),rgba(5,150,105,.01));pointer-events:none}
#makasia-delivery-close{position:absolute;top:14px;right:14px;width:38px;height:38px;border:none;border-radius:12px;background:#f1f5f9;color:#475569;font-size:24px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s ease,background .2s ease,color .2s ease;z-index:3}#makasia-delivery-close:hover{transform:rotate(90deg) scale(1.06);background:#ede9fe;color:#6d28d9}
.makasia-delivery-icon{position:relative;z-index:2;width:82px;height:82px;margin:0 auto 18px;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:42px;background:linear-gradient(135deg,#7c3aed,#4f46e5);box-shadow:0 14px 30px rgba(79,70,229,.28);animation:makasiaDeliveryFloat 3s ease-in-out infinite}@keyframes makasiaDeliveryFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.makasia-delivery-badge{position:relative;z-index:2;display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:800;margin-bottom:13px}.makasia-delivery-title{position:relative;z-index:2;margin:0 0 10px;color:#1e1b4b;font-size:clamp(22px,5vw,29px);line-height:1.2;font-weight:900;letter-spacing:-.5px}.makasia-delivery-highlight{color:#059669}.makasia-delivery-text{position:relative;z-index:2;margin:0 auto 22px;max-width:370px;color:#64748b;font-size:15px;line-height:1.65}.makasia-delivery-price{color:#1e1b4b;font-weight:900}
.makasia-delivery-offer{position:relative;z-index:2;display:flex;align-items:center;gap:12px;text-align:left;padding:14px 16px;margin-bottom:22px;border-radius:18px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1px solid #bbf7d0}.makasia-delivery-offer-icon{width:42px;height:42px;min-width:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#dcfce7;font-size:21px}.makasia-delivery-offer-title{color:#166534;font-size:14px;font-weight:900;margin-bottom:2px}.makasia-delivery-offer-subtitle{color:#4b7a5b;font-size:12px;line-height:1.4}
#makasia-delivery-ok{position:relative;z-index:2;width:100%;min-height:52px;border:none;border-radius:16px;padding:14px 20px;background:linear-gradient(135deg,#1e1b4b,#312e81);color:#fff;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 10px 25px rgba(30,27,75,.2);transition:transform .2s ease,box-shadow .2s ease}#makasia-delivery-ok:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(30,27,75,.28)}#makasia-delivery-ok:active{transform:translateY(0)}
@media(max-width:600px){#cart-panel{width:calc(100vw - 24px)!important;max-width:none!important;height:min(84vh,680px)!important;max-height:calc(100vh - 50px)!important;padding:20px!important;border-radius:24px!important}#cart-panel .panel-header h2{font-size:20px!important}#cart-panel .close-btn{width:38px!important;height:38px!important;min-width:38px!important}.makasia-cart-item-image{width:60px;height:60px;min-width:60px}.makasia-cart-item-name{font-size:13px}.makasia-cart-remove{width:32px;height:32px;min-width:32px}#cart-panel .cart-footer{padding-top:14px!important}#makasia-delivery-overlay{padding:14px}#makasia-delivery-popup{width:100%;max-width:430px;padding:30px 20px 22px;border-radius:26px}#makasia-delivery-close{top:10px;right:10px;width:36px;height:36px}.makasia-delivery-icon{width:72px;height:72px;border-radius:21px;font-size:36px;margin-bottom:15px}.makasia-delivery-title{font-size:23px}.makasia-delivery-text{font-size:14px;line-height:1.55;margin-bottom:18px}.makasia-delivery-offer{padding:12px;margin-bottom:18px}#makasia-delivery-ok{min-height:50px}}@media(max-width:380px){#cart-panel{width:calc(100vw - 16px)!important;padding:16px!important;border-radius:20px!important}.makasia-cart-item-image{width:54px;height:54px;min-width:54px}#makasia-delivery-popup{padding:27px 16px 18px}.makasia-delivery-icon{width:66px;height:66px;font-size:32px}.makasia-delivery-title{font-size:21px}.makasia-delivery-text{font-size:13px}}`;
document.head.appendChild(style);
}

function createFreeDeliveryPopup(){
if(document.getElementById("makasia-delivery-overlay"))return;
const wrap=document.createElement("div");
wrap.innerHTML=`<div id="makasia-delivery-overlay" role="dialog" aria-modal="true" aria-labelledby="makasia-delivery-title"><div id="makasia-delivery-popup"><button id="makasia-delivery-close" type="button" aria-label="დახურვა" title="დახურვა">×</button><div class="makasia-delivery-icon">🚚</div><div class="makasia-delivery-badge">✨ სპეციალური შეთავაზება</div><h2 id="makasia-delivery-title" class="makasia-delivery-title">მიწოდება <span class="makasia-delivery-highlight">ჩვენგან საჩუქრად!</span></h2><p class="makasia-delivery-text">შეიძინე <span class="makasia-delivery-price">150 ₾-ზე მეტი</span> და ისარგებლე მთელი საქართველოს მასშტაბით <strong>სრულიად უფასო მიწოდებით.</strong> 🎁</p><div class="makasia-delivery-offer"><div class="makasia-delivery-offer-icon">🎁</div><div><div class="makasia-delivery-offer-title">150 ₾+ შეკვეთა</div><div class="makasia-delivery-offer-subtitle">მიწოდების საფასური — 0 ₾</div></div></div><button id="makasia-delivery-ok" type="button">გასაგებია, დავიწყოთ შოპინგი 🛍️</button></div></div>`;
document.body.appendChild(wrap);
const deliveryOverlay=document.getElementById("makasia-delivery-overlay"),closeButton=document.getElementById("makasia-delivery-close"),okButton=document.getElementById("makasia-delivery-ok");
const closeFreeDeliveryPopup=()=>{
deliveryOverlay.classList.remove("makasia-delivery-visible");
document.body.style.overflow="";
localStorage.setItem("makasia_delivery_popup_seen",Date.now().toString());
setTimeout(showFreeDeliveryPopupOnFirstVisit,5*60*1000);
};
closeButton?.addEventListener("click",closeFreeDeliveryPopup);
okButton?.addEventListener("click",closeFreeDeliveryPopup);
deliveryOverlay.addEventListener("click",e=>{if(e.target===deliveryOverlay)closeFreeDeliveryPopup()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&deliveryOverlay.classList.contains("makasia-delivery-visible"))closeFreeDeliveryPopup()});
return{show(){deliveryOverlay.classList.add("makasia-delivery-visible");document.body.style.overflow="hidden";setTimeout(()=>closeButton?.focus(),100)},close:closeFreeDeliveryPopup};
}

function showFreeDeliveryPopupOnFirstVisit(){
const lastShown=Number(localStorage.getItem("makasia_delivery_popup_seen")||0);
if(Date.now()-lastShown<5*60*1000)return;
const popup=createFreeDeliveryPopup();
if(popup)setTimeout(popup.show,700);
}

window.showModalMessage=function(title,text,type="info",onConfirm=null){
let modal=document.getElementById("universalModal");
if(!modal){
const div=document.createElement("div");
div.innerHTML=`<dialog id="universalModal" class="admin-modal" style="border:none;border-radius:30px;padding:0;width:100%;max-width:400px;box-shadow:0 30px 60px rgba(79,70,229,.3);background:white;margin:auto"><div style="padding:30px;text-align:center;font-family:'Noto Sans Georgian',sans-serif"><div id="uniModalIcon" style="font-size:42px;margin-bottom:15px">✨</div><h3 id="uniModalTitle" style="font-size:20px;font-weight:800;color:#312e81;margin-bottom:10px">შეტყობინება</h3><p id="uniModalText" style="color:#64748b;font-size:14px;margin-bottom:25px;line-height:1.5"></p><div id="uniModalActions" style="display:flex;gap:14px"></div></div></dialog>`;
document.body.appendChild(div);modal=document.getElementById("universalModal");
}
document.getElementById("uniModalTitle").textContent=title;
document.getElementById("uniModalText").textContent=text;
const iconEl=document.getElementById("uniModalIcon"),actionsEl=document.getElementById("uniModalActions");
iconEl.textContent=type==="confirm"||type==="danger"?"⚠️":type==="success"?"✅":"✨";actionsEl.innerHTML="";
if(onConfirm){
const cancelBtn=document.createElement("button");cancelBtn.type="button";cancelBtn.style.cssText="background:#e2e8f0;color:#475569;flex:1;padding:14px;border-radius:14px;border:none;font-weight:700;cursor:pointer;font-size:14px";cancelBtn.textContent="გაუქმება";cancelBtn.onclick=()=>modal.close();
const okBtn=document.createElement("button");okBtn.type="button";okBtn.style.cssText=`flex:1;padding:14px;border-radius:14px;border:none;font-weight:700;cursor:pointer;color:white;font-size:14px;${type==="danger"?"background:linear-gradient(135deg,#ef4444,#b91c1c);":"background:#1e1b4b;"}`;okBtn.textContent="დიახ";okBtn.onclick=()=>{modal.close();if(typeof onConfirm==="function")onConfirm()};actionsEl.append(cancelBtn,okBtn);
}else{
const okBtn=document.createElement("button");okBtn.type="button";okBtn.style.cssText="width:100%;padding:14px;border-radius:14px;border:none;font-weight:700;cursor:pointer;background:#1e1b4b;color:white;font-size:14px";okBtn.textContent="კარგი";okBtn.onclick=()=>modal.close();actionsEl.appendChild(okBtn);
}
if(!modal.open)modal.showModal();
};

window.alert=msg=>window.showModalMessage("ყურადღება",msg,"info");

document.addEventListener("DOMContentLoaded",()=>{
injectCartPopupStyles();loadProductsFromDB();updateCartUI();initEvents();checkAuthStatus();setupProfileDropdown();showFreeDeliveryPopupOnFirstVisit();
});

function loadProductsFromDB(){
db.collection("products").onSnapshot(snapshot=>{
products=[];snapshot.forEach(doc=>products.push({id:doc.id,...doc.data()}));renderProducts();
},error=>{
console.error("პროდუქტების ჩატვირთვის შეცდომა:",error);
if(productGrid)productGrid.innerHTML=`<p style="grid-column:1/-1;text-align:center;color:#d32f2f;padding:40px">ვერ მოხერხდა პროდუქტების ჩატვირთვა ბაზიდან.</p>`;
});
}

function renderProducts(){
if(!productGrid)return;
productGrid.innerHTML="";
const filtered=products.filter(p=>{
const name=String(p.name||"");
return(activeCategory==="ყველა"||p.category===activeCategory)&&name.toLowerCase().includes(searchQuery.toLowerCase());
});
if(!filtered.length){productGrid.innerHTML=`<p style="grid-column:1/-1;text-align:center;color:#777;padding:40px">პროდუქტები ვერ მოიძებნა.</p>`;return}
filtered.forEach(product=>{
const card=document.createElement("div");card.className="product-card";
card.innerHTML=`<div style="position:relative;overflow:hidden;border-radius:8px;margin-bottom:12px;background:#eee"><img src="${product.image||""}" alt="${product.name||""}" style="width:100%;height:260px;object-fit:cover;display:block"></div><span style="font-size:12px;color:#666;text-transform:uppercase">${product.category||""}</span><h3 style="font-size:16px;font-weight:600;margin:4px 0 8px">${product.name||""}</h3><div style="display:flex;justify-content:space-between;align-items:center"><strong>${product.price||0} ₾</strong><button onclick="addToCart('${product.id}')" class="button button-dark" style="padding:8px 14px;font-size:13px">დამატება</button></div>`;
productGrid.appendChild(card);
});
}

window.addToCart=productId=>{
const product=products.find(p=>p.id===productId);if(!product)return;
const existing=cart.find(item=>item.id===productId);
if(existing)existing.quantity+=1;else cart.push({...product,quantity:1});
saveCart();updateCartUI();showToast("პროდუქტი დაემატა კალათაში");
};

function saveCart(){localStorage.setItem("makasia_cart",JSON.stringify(cart))}

function updateCartUI(){
if(!cartCount||!cartItemsContainer||!cartTotal)return;
cartCount.textContent=cart.reduce((sum,item)=>sum+(Number(item.quantity)||0),0);cartItemsContainer.innerHTML="";
if(!cart.length){
cartItemsContainer.innerHTML=`<div class="makasia-empty-cart"><div class="makasia-empty-cart-icon">🛍️</div><div class="makasia-empty-cart-title">კალათა ცარიელია</div><div class="makasia-empty-cart-text">დაამატეთ სასურველი პროდუქტი</div></div>`;
cartTotal.textContent="0 ₾";return;
}
let totalPrice=0;
cart.forEach(item=>{
const price=Number(item.price)||0,qty=Number(item.quantity)||1;totalPrice+=price*qty;
const div=document.createElement("div");div.className="makasia-cart-item";
div.innerHTML=`<img src="${item.image||""}" class="makasia-cart-item-image" alt="${item.name||""}"><div class="makasia-cart-item-info"><div class="makasia-cart-item-name">${item.name||""}</div><div class="makasia-cart-item-price">${price} ₾ × ${qty}</div><div style="color:#059669;font-weight:800;font-size:14px;margin-top:3px">${price*qty} ₾</div></div><button class="makasia-cart-remove" onclick="removeFromCart('${item.id}')" aria-label="წაშლა">×</button>`;
cartItemsContainer.appendChild(div);
});
cartTotal.textContent=totalPrice+" ₾";
}

window.removeFromCart=productId=>{cart=cart.filter(item=>item.id!==productId);saveCart();updateCartUI()};

function showToast(msg){
if(!toast)return;
toast.textContent=msg;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2500);
}

function openCart(){
if(!cartPanel)return;
cartPanel.classList.add("open");overlay?.classList.add("open","show");document.body.classList.add("makasia-cart-open");
}

function closeCart(){
cartPanel?.classList.remove("open");overlay?.classList.remove("open","show");document.body.classList.remove("makasia-cart-open");
}

function calculateCheckout(){
const subtotal=cart.reduce((sum,item)=>sum+(Number(item.price)||0)*(Number(item.quantity)||1),0);
const deliverySelect=document.querySelector('[name="delivery"]');let deliveryBasePrice=8;
if(deliverySelect&&(deliverySelect.value||"").match(/რეგიონ|ფოსტა/))deliveryBasePrice=12;
const deliveryCost=subtotal>=150?0:deliveryBasePrice,finalTotal=subtotal+deliveryCost;
const subtotalEl=document.getElementById("checkout-subtotal"),deliveryEl=document.getElementById("checkout-delivery"),totalEl=document.getElementById("checkout-total");
if(subtotalEl)subtotalEl.textContent=subtotal+" ₾";
if(deliveryEl)deliveryEl.textContent=deliveryCost===0?"უფასო (0 ₾)":deliveryCost+" ₾";
if(totalEl)totalEl.textContent=finalTotal+" ₾";
}

function checkAuthStatus(){
auth.onAuthStateChanged(user=>{
const accountToggle=document.getElementById("account-toggle");if(!accountToggle)return;
accountToggle.textContent=user?(user.email==="suloanani1@gmail.com"?"ადმინი ▼":"პროფილი ▼"):"შესვლა";
});
}

function setupProfileDropdown(){
const accountToggle=document.getElementById("account-toggle"),profilePopup=document.getElementById("profilePopup");if(!accountToggle||!profilePopup)return;
accountToggle.addEventListener("click",e=>{
const user=auth.currentUser;
if(!user){
const authDialog=document.getElementById("auth-dialog");
if(authDialog){authDialog.style.display="block";authDialog.showModal();overlay?.classList.add("open","show")}
}else{e.stopPropagation();profilePopup.style.display=profilePopup.style.display==="block"?"none":"block"}
});
document.addEventListener("click",e=>{if(!accountToggle.contains(e.target)&&!profilePopup.contains(e.target))profilePopup.style.display="none"});

const myOrdersLink=document.getElementById("myOrdersLink");
if(myOrdersLink)myOrdersLink.addEventListener("click",async e=>{
e.preventDefault();const user=auth.currentUser;
if(!user){showModalMessage("ყურადღება","გთხოვთ გაიაროთ ავტორიზაცია","info");return}
const ordersSection=document.getElementById("popup-orders-section"),ordersListContainer=document.getElementById("popup-orders-list");
if(ordersSection){
if(ordersSection.style.display==="block"){ordersSection.style.display="none";return}
ordersSection.style.display="block";
}
if(ordersListContainer)ordersListContainer.innerHTML=`<p style="text-align:center;color:#666;font-size:13px;padding:10px">იტვირთება...</p>`;
try{
const snapshot=await db.collection("orders").where("userId","==",user.uid).orderBy("createdAt","desc").get();
if(snapshot.empty){if(ordersListContainer)ordersListContainer.innerHTML=`<p style="text-align:center;color:#777;font-size:13px;padding:10px">შეკვეთები არ მოიძებნა.</p>`;return}
let html="";
snapshot.forEach(doc=>{
const order=doc.data(),date=order.createdAt?order.createdAt.toDate().toLocaleString("ka-GE"):"ახალი";
html+=`<div style="border:1px solid #eee;border-radius:6px;padding:8px;margin-bottom:8px;background:#fafafa;font-size:12px"><div style="display:flex;justify-content:space-between;color:#666;margin-bottom:4px"><span>${date}</span><strong style="color:#2e7d32">${order.status}</strong></div><div style="margin-bottom:4px"><strong>თანხა:</strong> ${order.totalPrice}</div><div style="background:white;padding:6px;border-radius:4px;border:1px solid #eee">${order.productDetails}</div></div>`;
});
if(ordersListContainer)ordersListContainer.innerHTML=html;
}catch(error){
console.error("შეკვეთების წამოღების შეცდომა:",error);
if(ordersListContainer)ordersListContainer.innerHTML=`<p style="text-align:center;color:#d32f2f;font-size:13px;padding:10px">ვერ მოხერხდა ჩატვირთვა.</p>`;
}
});

const logoutLink=document.getElementById("logoutLink");
if(logoutLink)logoutLink.addEventListener("click",e=>{
e.preventDefault();profilePopup.style.display="none";
auth.signOut().then(()=>{showToast("წარმატებით გავედით სისტემიდან");setTimeout(()=>location.reload(),1000)});
});
}

function initEvents(){
const cartToggle=document.getElementById("cart-toggle");if(cartToggle)cartToggle.addEventListener("click",()=>{updateCartUI();openCart()});
const closeCartButton=document.getElementById("closeCart");if(closeCartButton)closeCartButton.addEventListener("click",closeCart);

function closeAllModals(){
closeCart();
const authDialog=document.getElementById("auth-dialog"),checkoutDialog=document.getElementById("checkout-dialog"),profilePopup=document.getElementById("profilePopup");
if(profilePopup)profilePopup.style.display="none";
if(authDialog){if(authDialog.open)authDialog.close();authDialog.style.display="none"}
if(checkoutDialog){if(checkoutDialog.open)checkoutDialog.close();checkoutDialog.style.display="none"}
overlay?.classList.remove("open","show");document.body.classList.remove("makasia-cart-open");
}

overlay?.addEventListener("click",closeAllModals);
document.addEventListener("click",e=>{if(e.target.classList.contains("close-modal"))closeAllModals()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeAllModals()});

const searchInput=document.getElementById("search-input");
if(searchInput)searchInput.addEventListener("input",e=>{searchQuery=e.target.value;renderProducts()});

document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",e=>{
e.preventDefault();document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));e.currentTarget.classList.add("active");activeCategory=e.currentTarget.getAttribute("data-category");renderProducts();
const shop=document.getElementById("shop");if(e.currentTarget.tagName==="A"&&shop)shop.scrollIntoView({behavior:"smooth"});
}));

const checkoutBtn=document.getElementById("checkout");
if(checkoutBtn)checkoutBtn.addEventListener("click",()=>{
if(!cart.length){showModalMessage("ყურადღება","კალათა ცარიელია!","info");return}
closeCart();calculateCheckout();
const checkoutDialog=document.getElementById("checkout-dialog");
if(checkoutDialog){checkoutDialog.style.display="block";checkoutDialog.showModal();overlay?.classList.add("open","show")}
});

const deliveryInput=document.querySelector('[name="delivery"]');if(deliveryInput)deliveryInput.addEventListener("change",calculateCheckout);

const checkoutForm=document.getElementById("checkout-form");
if(checkoutForm)checkoutForm.addEventListener("submit",e=>{
e.preventDefault();
const formData=new FormData(e.target),subtotal=cart.reduce((sum,item)=>sum+(Number(item.price)||0)*(Number(item.quantity)||1),0),deliveryType=formData.get("delivery")||"",deliveryBasePrice=/რეგიონ|ფოსტა/.test(deliveryType)?12:8,deliveryCost=subtotal>=150?0:deliveryBasePrice,totalFinal=subtotal+deliveryCost;
const itemsFormatted=cart.map(item=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><img src="${item.image||""}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:4px"><div><div style="font-weight:600">${item.name}</div><div style="font-size:12px;color:#666">რაოდენობა: ${item.quantity} × ${item.price} ₾</div></div></div>`).join("");
const submitButton=checkoutForm.querySelector('button[type="submit"]');
if(submitButton){submitButton.disabled=true;submitButton.textContent="იგზავნება..."}
db.collection("orders").add({
userId:auth.currentUser?auth.currentUser.uid:"guest",
userEmail:auth.currentUser?auth.currentUser.email:formData.get("email")||"მითითებული არ არის",
customerName:formData.get("customerName"),phone:formData.get("phone"),address:formData.get("address"),
delivery:deliveryType+(deliveryCost===0?" (უფასო)":""),totalPrice:totalFinal+" ₾",productDetails:itemsFormatted,
createdAt:firebase.firestore.FieldValue.serverTimestamp(),status:"ახალი"
}).then(()=>{
showModalMessage("წარმატება","შეკვეთა წარმატებით გაფორმდა!","success");cart=[];saveCart();updateCartUI();closeAllModals();e.target.reset();
}).catch(err=>{
console.error("შეკვეთის შეცდომა:",err);
const errEl=document.getElementById("checkout-error");if(errEl)errEl.textContent="შეცდომა შეკვეთის გაფორმებისას.";
}).finally(()=>{if(submitButton){submitButton.disabled=false;submitButton.textContent="შეკვეთის დადასტურება"}});
});

window.switchAuthTab=tab=>{
const tabBtns=document.querySelectorAll(".tab-btn");
tabBtns.forEach(b=>{b.classList.remove("active");b.style.background="#e2e8f0";b.style.color="#333";b.style.boxShadow="none"});
const login=tab==="login";
if(tabBtns[login?0:1]){tabBtns[login?0:1].classList.add("active");tabBtns[login?0:1].style.background="var(--primary-gradient)";tabBtns[login?0:1].style.color="white"}
const loginForm=document.getElementById("login-form"),registerForm=document.getElementById("register-form");
if(loginForm)loginForm.style.display=login?"block":"none";
if(registerForm)registerForm.style.display=login?"none":"block";
};

const loginForm=document.getElementById("login-form");
if(loginForm)loginForm.addEventListener("submit",e=>{
e.preventDefault();const email=e.target.loginEmail.value,password=e.target.loginPassword.value;
auth.signInWithEmailAndPassword(email,password).then(()=>{closeAllModals();showToast("წარმატებით შეხვედით სისტემაში")}).catch(()=>{
const loginErr=document.getElementById("login-error");if(loginErr)loginErr.textContent="არასწორი მეილი ან პაროლი";
});
});

const registerForm=document.getElementById("register-form");
if(registerForm)registerForm.addEventListener("submit",e=>{
e.preventDefault();const name=e.target.regName.value,email=e.target.regEmail.value,password=e.target.regPassword.value;
auth.createUserWithEmailAndPassword(email,password).then(cred=>db.collection("users").doc(cred.user.uid).set({name,email,role:"user"})).then(()=>{closeAllModals();showToast("რეგისტრაცია წარმატებულია")}).catch(error=>{
console.error("რეგისტრაციის შეცდომა:",error);const regErr=document.getElementById("reg-error");if(regErr)regErr.textContent="შეცდომა რეგისტრაციისას";
});
});
}
