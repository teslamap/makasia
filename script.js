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

// პროდუქტების მონაცემთა ბაზა
const products = [
  { id: 1, name: "მინიმალისტური შავი ჩანთა", category: "ყოველდღიური", price: 120, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80" },
  { id: 2, name: "ელეგანტური საღამოს კლატჩი", category: "საღამოს", price: 95, image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=600&q=80" },
  { id: 3, name: "ტყავის ზურგჩანთა", category: "ზურგჩანთა", price: 160, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80" },
  { id: 4, name: "ყოველდღიური კრემისფერი შოპერი", category: "ყოველდღიური", price: 85, image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80" }
];

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
    renderProducts();
    updateCartUI();
    initEvents();
});

// პროდუქტების გამოტანა
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
                <button onclick="addToCart(${product.id})" class="button button-dark" style="padding: 8px 14px; font-size: 13px;">დამატება</button>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

// კალათაში დამატება
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
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
            <button onclick="removeFromCart(${item.id})" style="background: none; border: none; color: #d32f2f; cursor: pointer; font-size: 18px;">×</button>
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

// ღონისძიებების მართვა
function initEvents() {
    document.getElementById('cart-toggle').addEventListener('click', () => {
        cartPanel.classList.add('open');
        overlay.classList.add('show');
    });

    document.querySelectorAll('[data-close="cart-panel"], #overlay').forEach(el => {
        el.addEventListener('click', () => {
            cartPanel.classList.remove('open');
            overlay.classList.remove('show');
            document.getElementById('auth-dialog').close();
            document.getElementById('checkout-dialog').close();
        });
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProducts();
    });

    document.querySelectorAll('.filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeCategory = e.target.getAttribute('data-category');
            renderProducts();
        });
    });

    document.getElementById('account-toggle').addEventListener('click', () => {
        document.getElementById('auth-dialog').showModal();
        overlay.classList.add('show');
    });

    // შეკვეთის გაფორმების ფანჯრის გახსნა
    document.getElementById('checkout').addEventListener('click', () => {
        if (cart.length === 0) {
            alert("კალათა ცარიელია!");
            return;
        }
        cartPanel.classList.remove('open');
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('checkout-subtotal').textContent = subtotal + " ₾";
        document.getElementById('checkout-delivery').textContent = "8 ₾";
        document.getElementById('checkout-total').textContent = (subtotal + 8) + " ₾";
        document.getElementById('checkout-dialog').showModal();
    });

    // შეკვეთის გაგზავნა ბაზაში (სურათებით და დეტალებით)
    document.getElementById('checkout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryCost = formData.get('delivery').includes('თბილისში') ? 8 : 12;
        const totalFinal = subtotal + deliveryCost;

        // თითოეული პროდუქტის ფორმატირება პრევიუ ფოტოთი და დეტალებით ადმინისთვის
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
            delivery: formData.get('delivery'),
            totalPrice: totalFinal + ' ₾',
            productDetails: itemsFormatted, // სურათებიანი დეტალური სტრუქტურა
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: "ახალი"
        }).then(() => {
            alert("შეკვეთა წარმატებით გაფორმდა!");
            cart = [];
            saveCart();
            updateCartUI();
            document.getElementById('checkout-dialog').close();
            overlay.classList.remove('show');
            e.target.reset();
        }).catch(err => {
            document.getElementById('checkout-error').textContent = "შეცდომა შეკვეთის გაფორმებისას.";
        });
    });

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
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.loginEmail.value;
        const password = e.target.loginPassword.value;
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                document.getElementById('auth-dialog').close();
                overlay.classList.remove('show');
                showToast("წარმატებით შეხვედით სისტემაში");
            })
            .catch(() => {
                document.getElementById('login-error').textContent = "არასწორი მეილი ან პაროლი";
            });
    });

    // მომხმარებლის რეგისტრაცია
    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = e.target.regName.value;
        const email = e.target.regEmail.value;
        const password = e.target.regPassword.value;
        auth.createUserWithEmailAndPassword(email, password)
            .then((cred) => {
                return db.collection("users").doc(cred.user.uid).set({ name, email, role: "user" });
            })
            .then(() => {
                document.getElementById('auth-dialog').close();
                overlay.classList.remove('show');
                showToast("რეგისტრაცია წარმატებულია");
            })
            .catch((err) => {
                document.getElementById('reg-error').textContent = "შეცდომა რეგისტრაციისას";
            });
    });
}
