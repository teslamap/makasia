const firebaseConfig = {
  apiKey: "AIzaSyDuZpWaZFY18eyJNOMjFap2XVTr6D0cMyE",
  authDomain: "makasia.firebaseapp.com",
  projectId: "makasia",
  storageBucket: "makasia.firebasestorage.app",
  messagingSenderId: "51102698357",
  appId: "1:51102698357:web:59f62a3c8e76663947a13c"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const products = [
    { id: 1, title: "მინიმალისტური ტყავის ჩანთა", category: "ყოველდღიური", price: 140, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80" },
    { id: 2, title: "ელეგანტური საღამოს კლატჩი", category: "საღამოს", price: 95, image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80" },
    { id: 3, title: "ქალაქის ტყავის ზურგჩანთა", category: "ზურგჩანთა", price: 180, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80" },
    { id: 4, title: "კლასიკური ხელჩანთა", category: "ყოველდღიური", price: 160, image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80" }
];

let cart = JSON.parse(localStorage.getItem('feshven_cart')) || [];
let currentUser = null;

auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            currentUser = { uid: user.uid, email: user.email, ...userDoc.data() };
        } else {
            currentUser = { uid: user.uid, email: user.email, name: 'მომხმარებელი' };
        }
    } else {
        currentUser = null;
    }
    updateAuthUI();
});

function renderProducts(filterCat = "ყველა", searchQuery = "") {
    const grid = document.getElementById('product-grid');
    if(!grid) return;
    grid.innerHTML = "";

    const filtered = products.filter(p => {
        const matchCat = filterCat === "ყველა" || p.category === filterCat;
        const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = "product-card";
        card.innerHTML = `
            <div class="product-image"><img src="${p.image}" alt="${p.title}"></div>
            <div class="product-info">
                <h3>${p.title}</h3>
                <p><b>${p.price} ₾</b></p>
                <button class="button button-dark" onclick="addToCart(${p.id})">კალათაში დამატება</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);
    if(existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCart();
    alert("პროდუქტი დამატებულია კალათაში!");
}

function updateCart() {
    localStorage.setItem('feshven_cart', JSON.stringify(cart));
    const countEl = document.getElementById('cart-count');
    if(countEl) countEl.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const container = document.getElementById('cart-items');
    if(container) {
        container.innerHTML = "";
        let total = 0;
        cart.forEach(item => {
            total += item.price * item.quantity;
            container.innerHTML += `<div class="cart-item"><span>${item.title} (${item.quantity} ც)</span> <b>${item.price * item.quantity} ₾</b></div>`;
        });
        document.getElementById('cart-total').textContent = total + " ₾";
    }
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab-btn');
    if(!tabs.length) return;
    tabs.forEach(t => t.classList.remove('active'));
    
    if(tab === 'login') {
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
        event.target.classList.add('active');
    } else {
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        event.target.classList.add('active');
    }
}

document.addEventListener('submit', async function(e) {
    if(e.target && e.target.id === 'register-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
            const cred = await auth.createUserWithEmailAndPassword(fd.get('regEmail'), fd.get('regPassword'));
            await db.collection('users').doc(cred.user.uid).set({
                name: fd.get('regName'),
                email: fd.get('regEmail'),
                createdAt: new Date().toISOString()
            });
            alert('რეგისტრაცია წარმატებით დასრულდა!');
            document.getElementById('auth-dialog').close();
        } catch(err) {
            document.getElementById('reg-error').textContent = err.message;
        }
    }

    if(e.target && e.target.id === 'login-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
            await auth.signInWithEmailAndPassword(fd.get('loginEmail'), fd.get('loginPassword'));
            alert('წარმატებული ავტორიზაცია!');
            document.getElementById('auth-dialog').close();
        } catch(err) {
            document.getElementById('login-error').textContent = 'არასწორი მონაცემები!';
        }
    }

    if(e.target && e.target.id === 'checkout-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const orderData = {
            customerName: fd.get('customerName'),
            phone: fd.get('phone'),
            address: fd.get('address'),
            delivery: fd.get('delivery'),
            items: cart,
            total: document.getElementById('cart-total').textContent,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
            await db.collection('orders').add(orderData);
            alert('შეკვეთა წარმატებით გაფორმდა!');
            cart = [];
            updateCart();
            document.getElementById('checkout-dialog').close();
        } catch(err) {
            alert('შეცდომა შეკვეთისას.');
        }
    }
});

function updateAuthUI() {
    const btn = document.getElementById('account-toggle');
    if(btn) {
        if(currentUser) {
            btn.textContent = currentUser.name;
            btn.onclick = () => { if(confirm('გსურთ გასვლა?')) auth.signOut().then(() => location.reload()); }
        } else {
            btn.textContent = 'შესვლა';
            btn.onclick = () => document.getElementById('auth-dialog').showModal();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCart();
    
    const searchInput = document.getElementById('search-input');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => renderProducts("ყველა", e.target.value));
    }

    document.querySelectorAll('.filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderProducts(e.target.dataset.category);
        });
    });

    const cartToggle = document.getElementById('cart-toggle');
    const cartPanel = document.getElementById('cart-panel');
    if(cartToggle && cartPanel) {
        cartToggle.onclick = () => cartPanel.classList.toggle('open');
    }
    
    const checkoutBtn = document.getElementById('checkout');
    if(checkoutBtn) {
        checkoutBtn.onclick = () => {
            if(cart.length === 0) { alert('კალათა ცარიელია!'); return; }
            document.getElementById('checkout-dialog').showModal();
            document.getElementById('cart-panel').classList.remove('open');
        };
    }

    document.querySelectorAll('.dialog-close').forEach(b => {
        b.onclick = (e) => e.target.closest('dialog').close();
    });
});
