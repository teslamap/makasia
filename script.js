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

// 🌟 სრულიად უნივერსალური და ავტომატური პოაპის დამჭერი (Alert-ისა და Confirm-ის ნაცვლად)
window.showModalMessage = function(title, text, type = 'info', onConfirm = null) {
    let modal = document.getElementById('universalModal');
    
    if (!modal) {
        const div = document.createElement('div');
        div.innerHTML = `
            <dialog id="universalModal" class="admin-modal" style="border: none; border-radius: 30px; padding: 0; width: 100%; max-width: 400px; box-shadow: 0 30px 60px rgba(79, 70, 229, 0.3); background: white; margin: auto;">
              <div style="padding: 30px; text-align: center; font-family: 'Noto Sans Georgian', sans-serif;">
                <div id="uniModalIcon" style="font-size: 42px; margin-bottom: 15px;">✨</div>
                <h3 id="uniModalTitle" style="font-size: 20px; font-weight: 800; color: #312e81; margin-bottom: 10px;">შეტყობინება</h3>
                <p id="uniModalText" style="color: #64748b; font-size: 14px; margin-bottom: 25px; line-height: 1.5;"></p>
                <div id="uniModalActions" style="display: flex; gap: 14px;"></div>
              </div>
            </dialog>
        `;
        document.body.appendChild(div);
        modal = document.getElementById('universalModal');
    }

    document.getElementById('uniModalTitle').textContent = title;
    document.getElementById('uniModalText').textContent = text;
    
    const iconEl = document.getElementById('uniModalIcon');
    const actionsEl = document.getElementById('uniModalActions');
    
    if (type === 'confirm' || type === 'danger') {
        iconEl.textContent = '⚠️';
    } else if (type === 'success') {
        iconEl.textContent = '✅';
    } else {
        iconEl.textContent = '✨';
    }

    actionsEl.innerHTML = '';

    if (onConfirm) {
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.style.cssText = 'background: #e2e8f0; color: #475569; flex: 1; padding: 14px; border-radius: 14px; border: none; font-weight: 700; cursor: pointer; font-size: 14px;';
        cancelBtn.textContent = 'გაუქმება';
        cancelBtn.onclick = () => modal.close();

        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.style.cssText = 'flex: 1; padding: 14px; border-radius: 14px; border: none; font-weight: 700; cursor: pointer; color: white; font-size: 14px; ' + (type === 'danger' ? 'background: linear-gradient(135deg, #ef4444, #b91c1c);' : 'background: #1e1b4b;');
        okBtn.textContent = 'დიახ';
        okBtn.onclick = () => {
            modal.close();
            onConfirm();
        };

        actionsEl.appendChild(cancelBtn);
        actionsEl.appendChild(okBtn);
    } else {
        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.style.cssText = 'width: 100%; padding: 14px; border-radius: 14px; border: none; font-weight: 700; cursor: pointer; background: #1e1b4b; color: white; font-size: 14px;';
        okBtn.textContent = 'კარგი';
        okBtn.onclick = () => modal.close();

        actionsEl.appendChild(okBtn);
    }

    if (!modal.open) {
        modal.showModal();
    }
};

// 🛡️ ავტომატური გადაფარვა ბრაუზერის ძველი ფანჯრებისთვის
window.alert = function(msg) {
    window.showModalMessage("ყურადღება", msg, "info");
};

window.confirm = function(msg) {
    return window.showModalMessage("დადასტურება", msg, "danger");
};

// ინიციალიზაცია
document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromDB();
    updateCartUI();
    initEvents();
    checkAuthStatus();
    setupProfileDropdown();
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
        if(productGrid) {
            productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #d32f2f; padding: 40px;">ვერ მოხერხდა პროდუქტების ჩატვირთვა ბაზიდან.</p>`;
        }
    });
}

// პროდუქტების გამოტანა ეკრანზე
function renderProducts() {
    if (!productGrid) return;
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
    if (!cartCount || !cartItemsContainer || !cartTotal) return;
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
        const itemPrice = Number(item.price) || 0;
        const itemQty = Number(item.quantity) || 1;
        totalPrice += itemPrice * itemQty;
        
        const div = document.createElement('div');
        div.style.cssText = "display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;";
        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
                <div>
                    <div style="font-weight: 600; font-size: 14px;">${item.name}</div>
                    <div style="font-size: 13px; color: #666;">${itemPrice} ₾ x ${itemQty}</div>
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
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// მიწოდების თანხის დაანგარიშება (150 ლარზე ზევით უფასოა)
function calculateCheckout() {
    const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    
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
                accountToggle.textContent = user.email === "suloanani1@gmail.com" ? "ადმინი ▼" : "პროფილი ▼";
            } else {
                accountToggle.textContent = "შესვლა";
            }
        }
    });
}

// პროფილის პოაპ დროპდაუნ მენიუს და შეკვეთების ისტორიის მართვა
function setupProfileDropdown() {
    const accountToggle = document.getElementById('account-toggle');
    const profilePopup = document.getElementById('profilePopup');

    if (!accountToggle || !profilePopup) return;

    accountToggle.addEventListener('click', (e) => {
        const user = auth.currentUser;
        if (!user) {
            const authDialog = document.getElementById('auth-dialog');
            if(authDialog) {
                authDialog.style.display = 'block';
                authDialog.showModal();
                if(overlay) overlay.classList.add('show');
            }
        } else {
            e.stopPropagation();
            profilePopup.style.display = profilePopup.style.display === 'block' ? 'none' : 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (!accountToggle.contains(e.target) && !profilePopup.contains(e.target)) {
            profilePopup.style.display = 'none';
        }
    });

    // ჩემი შეკვეთების ისტორიის გამოტანა ბაზიდან
    const myOrdersLink = document.getElementById('myOrdersLink');
    if (myOrdersLink) {
        myOrdersLink.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const user = auth.currentUser;
            if (!user) {
                showModalMessage("ყურადღება", "გთხოვთ გაიაროთ ავტორიზაცია", "info");
                return;
            }

            const ordersSection = document.getElementById('popup-orders-section');
            const ordersListContainer = document.getElementById('popup-orders-list');
            
            if (ordersSection) {
                if (ordersSection.style.display === 'block') {
                    ordersSection.style.display = 'none';
                    return;
                }
                ordersSection.style.display = 'block';
            }

            if (ordersListContainer) {
                ordersListContainer.innerHTML = `<p style="text-align: center; color: #666; font-size: 13px; padding: 10px;">იტვირთება...</p>`;
            }

            try {
                const snapshot = await db.collection('orders')
                    .where('userId', '==', user.uid)
                    .orderBy('createdAt', 'desc')
                    .get();

                if (snapshot.empty) {
                    if (ordersListContainer) {
                        ordersListContainer.innerHTML = `<p style="text-align: center; color: #777; font-size: 13px; padding: 10px;">შეკვეთები არ მოიძებნა.</p>`;
                    }
                    return;
                }

                let html = '';
                snapshot.forEach(doc => {
                    const order = doc.data();
                    const date = order.createdAt ? order.createdAt.toDate().toLocaleString('ka-GE') : 'ახალი';
                    html += `
                        <div style="border: 1px solid #eee; border-radius: 6px; padding: 8px; margin-bottom: 8px; background: #fafafa; font-size: 12px;">
                            <div style="display: flex; justify-content: space-between; color: #666; margin-bottom: 4px;">
                                <span>${date}</span>
                                <strong style="color: #2e7d32;">${order.status}</strong>
                            </div>
                            <div style="margin-bottom: 4px;">
                                <strong>თანხა:</strong> ${order.totalPrice}
                            </div>
                            <div style="background: white; padding: 6px; border-radius: 4px; border: 1px solid #eee;">
                                ${order.productDetails}
                            </div>
                        </div>
                    `;
                });
                if (ordersListContainer) {
                    ordersListContainer.innerHTML = html;
                }

            } catch (error) {
                console.error("შეკვეთების წამოღების შეცდომა:", error);
                if (ordersListContainer) {
                    ordersListContainer.innerHTML = `<p style="text-align: center; color: #d32f2f; font-size: 13px; padding: 10px;">ვერ მოხერხდა ჩატვირთვა.</p>`;
                }
            }
        });
    }

    // გასვლის (Logout) ლინკი
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            profilePopup.style.display = 'none';
            auth.signOut().then(() => {
                showToast("წარმატებით გავედით სისტემიდან");
                setTimeout(() => location.reload(), 1000);
            });
        });
    }
}

// ღონისძიებების მართვა
function initEvents() {
    const cartToggle = document.getElementById('cart-toggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', () => {
            if(cartPanel) cartPanel.classList.add('open');
            if(overlay) overlay.classList.add('show');
        });
    }

    function closeAllModals() {
        if(cartPanel) cartPanel.classList.remove('open');
        if(overlay) overlay.classList.remove('show');
        
        const authDialog = document.getElementById('auth-dialog');
        const checkoutDialog = document.getElementById('checkout-dialog');
        const profilePopup = document.getElementById('profilePopup');
        
        if(profilePopup) profilePopup.style.display = 'none';
        if(authDialog) {
            authDialog.close();
            authDialog.style.display = 'none';
        }
        if(checkoutDialog) {
            checkoutDialog.close();
            checkoutDialog.style.display = 'none';
        }
    }

    if(overlay) {
        overlay.addEventListener('click', closeAllModals);
    }

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

    const checkoutBtn = document.getElementById('checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showModalMessage("ყურადღება", "კალათა ცარიელია!", "info");
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
            
            const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
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
                userId: auth.currentUser ? auth.currentUser.uid : "guest",
                userEmail: auth.currentUser ? auth.currentUser.email : formData.get('email') || "მითითებული არ არის",
                customerName: formData.get('customerName'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                delivery: deliveryType + (deliveryCost === 0 ? ' (უფასო)' : ''),
                totalPrice: totalFinal + ' ₾',
                productDetails: itemsFormatted,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: "ახალი"
            }).then(() => {
                showModalMessage("წარმატება", "შეკვეთა წარმატებით გაფორმდა!", "success");
                cart = [];
                saveCart();
                updateCartUI();
                closeAllModals();
                e.target.reset();
            }).catch(err => {
                console.error(err);
                const errEl = document.getElementById('checkout-error');
                if(errEl) errEl.textContent = "შეცდომა შეკვეთის გაფორმებისას.";
            });
        });
    }

    window.switchAuthTab = function(tab) {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(b => {
            b.classList.remove('active');
            b.style.background = '#e2e8f0';
            b.style.color = '#333';
            b.style.boxShadow = 'none';
        });

        if(tab === 'login') {
            if(tabBtns[0]) {
                tabBtns[0].classList.add('active');
                tabBtns[0].style.background = 'var(--primary-gradient)';
                tabBtns[0].style.color = 'white';
            }
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('register-form').style.display = 'none';
        } else {
            if(tabBtns[1]) {
                tabBtns[1].classList.add('active');
                tabBtns[1].style.background = 'var(--primary-gradient)';
                tabBtns[1].style.color = 'white';
            }
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        }
    };

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
