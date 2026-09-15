// Firebase კავშირი და მთავარი ლოგიკა
const firebaseConfig = {
  apiKey: "AIzaSyDuZpWaZFY18eyJNOMjFap2XVTr6D0cMyE",
  authDomain: "makasia.firebaseapp.com",
  projectId: "makasia",
  storageBucket: "makasia.firebasestorage.app",
  messagingSenderId: "51102698357",
  appId: "1:51102698357:web:59f62a3c8e76663947a13c"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

let products = []; // პროდუქტები იტვირთება Firestore ბაზიდან
let cart = JSON.parse(localStorage.getItem('makasia_cart')) || [];
let activeCategory = "ყველა";
let searchQuery = "";

// DOM ელემენტები
const productGrid = document.getElementById('product-grid');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartPanel = document.getElementById('cart-panel');
const overlay = document.getElementById('overlay');
const toast = document.getElementById('toast');

// ინიციალიზაცია
document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromDB();
    updateCartUI();
    initEvents();
    checkAuthStatus();
});

// პროდუქტების წამოღება Firestore-დან რეალურ დროში
function loadProductsFromDB() {
    db.collection("products").onSnapshot((snapshot) => {
        products = [];
        snapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        renderProducts();
    }, (error) => {
        console.error("პროდუქტების ჩატვირთვის შეცდომა: ", error);
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #d32f2f; padding: 40px;">ვერ მოხერხდა პროდუქტების ჩატვირთვა ბაზიდან.</p>`;
    });
}

// პროდუქტების გამოტანა ეკრანზე
function renderProducts() {
    productGrid.innerHTML = "";
    
    const filtered = products.filter(p => {
        const matchesCategory = activeCategory === "ყველა" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #777; padding: 40px;">პროდუქტები ვერ მოიძებნა.</p>`;
        return;
    }

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div style="position: relative; overflow: hidden; border-radius: 8px; margin-bottom: 12px; background: #eee;">
                <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 260px; object-fit: cover; display: block;">
            </div>
            <span style="font-size: 12px; color: #666; text-transform: uppercase;">${product.category}</span>
            <h3 style="font-size: 16px; font-weight: 600; margin: 4px 0 8px 0;">${product.name}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${product.price} ₾</strong>
                <button onclick="addToCart('${product.id}')" class="button button-dark" style="padding: 8px 14px; font-size: 13px;">დამატება</button>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

// კალათაში დამატება
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    showToast("პროდუქტი დაემატა კალათაში");
};

function saveCart() {
    localStorage.setItem('makasia_cart', JSON.stringify(cart));
}

// კალათის ინტერფეისის განახლება
function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalCount;

    cartItemsContainer.innerHTML = "";
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p style="text-align: center; color: #777; padding: 30px;">კალათა ცარიელია</p>`;
        cartTotal.textContent = "0 ₾";
        return;
    }

    let totalPrice = 0;
    cart.forEach(item => {
        totalPrice += item.price * item.quantity;
        const div = document.createElement('div');
        div.style.cssText = "display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;";
        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
                <div>
                    <div style="font-weight: 600; font-size: 14px;">${item.name}</div>
                    <div style="font-size: 13px; color: #666;">${item.price} ₾ x ${item.quantity}</div>
                </div>
            </div>
            <button onclick="removeFromCart('${item.id}')" style="background: none; border: none; color: #d32f2f; cursor: pointer; font-size: 18px;">×</button>
        `;
        cartItemsContainer.appendChild(div);
    });

    cartTotal.textContent = totalPrice + " ₾";
}

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
};

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// მიწოდების თანხის დაანგარიშება (150 ლარზე ზევით უფასოა)
function calculateCheckout() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const deliverySelect = document.querySelector('[name="delivery"]');
    let deliveryBasePrice = 8; // თბილისი ნაგულისხმევად
    
    if (deliverySelect) {
        const val = deliverySelect.value || '';
        if (val.includes('რეგიონ') || val.includes('ფოსტა')) {
            deliveryBasePrice = 12;
        }
    }

    const deliveryCost = subtotal >= 150 ? 0 : deliveryBasePrice;
    const finalTotal = subtotal + deliveryCost;

    const subtotalEl = document.getElementById('checkout-subtotal');
    const deliveryEl = document.getElementById('checkout-delivery');
    const totalEl = document.getElementById('checkout-total');

    if (subtotalEl) subtotalEl.textContent = subtotal + " ₾";
    if (deliveryEl) deliveryEl.textContent = deliveryCost === 0 ? "უფასო (0 ₾)" : deliveryCost + " ₾";
    if (totalEl) totalEl.textContent = finalTotal + " ₾";
}

// ავტორიზაციის სტატუსის შემოწმება და ტექსტის შეცვლა
function checkAuthStatus() {
    auth.onAuthStateChanged((user) => {
        const accountToggle = document.getElementById('account-toggle');
        if (accountToggle) {
            if (user) {
                accountToggle.textContent = user.email === "suloanani1@gmail.com" ? "ადმინი" : "პროფილი";
            } else {
                accountToggle.textContent = "შესვლა";
            }
        }
    });
}

// ღონისძიებების მართვა
function initEvents() {
    // კალათის გახსნა
    document.getElementById('cart-toggle').addEventListener('click', () => {
        cartPanel.classList.add('open');
        overlay.classList.add('show');
    });

    // სრული დახურვის ლოგიკა (ყველა მოდალისთვის და × ღილაკებისთვის)
    function closeAllModals() {
        if(cartPanel) cartPanel.classList.remove('open');
        if(overlay) overlay.classList.remove('show');
        
        const authDialog = document.getElementById('auth-dialog');
        const checkoutDialog = document.getElementById('checkout-dialog');
        
        if(authDialog) {
            authDialog.close();
            authDialog.style.display = 'none';
        }
        if(checkoutDialog) {
            checkoutDialog.close();
            checkoutDialog.style.display = 'none';
        }
    }

    // overlay-ზე დაჭერით დახურვა
    if(overlay) {
        overlay.addEventListener('click', closeAllModals);
    }

    // უნივერსალური მომართვა ნებისმიერ × ღილაკზე ან დახურვის ელემენტზე
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.textContent.trim() === '×' || target.classList.contains('close-modal') || target.classList.contains('close-btn') || target.hasAttribute('data-close')) {
            closeAllModals();
        }
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }

    document.querySelectorAll('.filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeCategory = e.target.getAttribute('data-category');
            renderProducts();
        });
    });

    // ავტორიზაციის ფანჯრის გახსნა
    const accountToggle = document.getElementById('account-toggle');
    if (accountToggle) {
        accountToggle.addEventListener('click', () => {
            const user = auth.currentUser;
            if (user) {
                if(confirm("გსურთ სისტემიდან გასვლა?")) {
                    auth.signOut().then(() => {
                        showToast("გახვედით სისტემიდან");
                    });
                }
            } else {
                const authDialog = document.getElementById('auth-dialog');
                if(authDialog) {
                    authDialog.style.display = 'block';
                    authDialog.showModal();
                    if(overlay) overlay.classList.add('show');
                }
            }
        });
    }

    // შეკვეთის გაფორმების ფანჯრის გახსნა
    const checkoutBtn = document.getElementById('checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert("კალათა ცარიელია!");
                return;
            }
            if(cartPanel) cartPanel.classList.remove('open');
            calculateCheckout();
            const checkoutDialog = document.getElementById('checkout-dialog');
            if(checkoutDialog) {
                checkoutDialog.style.display = 'block';
                checkoutDialog.showModal();
                if(overlay) overlay.classList.add('show');
            }
        });
    }

    const deliveryInput = document.querySelector('[name="delivery"]');
    if (deliveryInput) {
        deliveryInput.addEventListener('change', calculateCheckout);
    }

    // შეკვეთის გაგზავნა ბაზაში
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const deliveryType = formData.get('delivery') || '';
            
            let deliveryBasePrice = deliveryType.includes('რეგიონ') || deliveryType.includes('ფოსტა') ? 12 : 8;
            const deliveryCost = subtotal >= 150 ? 0 : deliveryBasePrice;
            const totalFinal = subtotal + deliveryCost;

            const itemsFormatted = cart.map(item => `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                    <img src="${item.image}" alt="" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                    <div>
                        <div style="font-weight: 600;">${item.name}</div>
                        <div style="font-size: 12px; color: #666;">რაოდენობა: ${item.quantity} x ${item.price} ₾</div>
                    </div>
                </div>
            `).join('');

            db.collection("orders").add({
                customerName: formData.get('customerName'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                delivery: deliveryType + (deliveryCost === 0 ? ' (უფასო)' : ''),
                totalPrice: totalFinal + ' ₾',
                productDetails: itemsFormatted,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: "ახალი"
            }).then(() => {
                alert("შეკვეთა წარმატებით გაფორმდა!");
                cart = [];
                saveCart();
                updateCartUI();
                closeAllModals();
                e.target.reset();
            }).catch(err => {
                const errEl = document.getElementById('checkout-error');
                if(errEl) errEl.textContent = "შეცდომა შეკვეთის გაფორმებისას.";
            });
        });
    }

    // ავტორიზაციის ტაბების გადართვა
    window.switchAuthTab = function(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        if(tab === 'login') {
            document.querySelectorAll('.tab-btn')[0].classList.add('active');
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('register-form').style.display = 'none';
        } else {
            document.querySelectorAll('.tab-btn')[1].classList.add('active');
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        }
    };

    // მომხმარებლის შესვლა
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = e.target.loginEmail.value;
            const password = e.target.loginPassword.value;
            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    closeAllModals();
                    showToast("წარმატებით შეხვედით სისტემაში");
                })
                .catch(() => {
                    const loginErr = document.getElementById('login-error');
                    if(loginErr) loginErr.textContent = "არასწორი მეილი ან პაროლი";
                });
        });
    }

    // მომხმარებლის რეგისტრაცია
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = e.target.regName.value;
            const email = e.target.regEmail.value;
            const password = e.target.regPassword.value;
            auth.createUserWithEmailAndPassword(email, password)
                .then((cred) => {
                    return db.collection("users").doc(cred.user.uid).set({ name, email, role: "user" });
                })
                .then(() => {
                    closeAllModals();
                    showToast("რეგისტრაცია წარმატებულია");
                })
                .catch(() => {
                    const regErr = document.getElementById('reg-error');
                    if(regErr) regErr.textContent = "შეცდომა რეგისტრაციისას";
                });
        });
    }
}
