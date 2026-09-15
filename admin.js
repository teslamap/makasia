// Firebase-ის ინიციალიზაცია
const db = firebase.firestore();
const auth = firebase.auth();

const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');
const ordersList = document.getElementById('ordersList');

// ფიქსირებული ადმინის მეილი
const ADMIN_EMAIL = "suloanani1@gmail.com";

// ადმინად შესვლა (მხოლოდ პაროლით)
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const passwordInput = document.getElementById('adminPassword');
        const password = passwordInput ? passwordInput.value : '';

        if (!password) {
            if(loginError) loginError.textContent = "გთხოვთ შეიყვანოთ პაროლი!";
            return;
        }

        auth.signInWithEmailAndPassword(ADMIN_EMAIL, password)
            .then(() => {
                if(loginError) loginError.textContent = "";
            })
            .catch((error) => {
                if(loginError) loginError.textContent = "არასწორი პაროლი!";
                console.error(error);
            });
    });
}

// პაროლის აღდგენის ფუნქცია
window.resetAdminPassword = function() {
    auth.sendPasswordResetEmail(ADMIN_EMAIL)
        .then(() => {
            if(loginError) {
                loginError.style.color = "green";
                loginError.textContent = "აღდგენის ლინკი გაიგზავნა თქვენს ელ-ფოსტაზე!";
            }
        })
        .catch((error) => {
            if(loginError) {
                loginError.style.color = "red";
                loginError.textContent = "შეცდომა აღდგენის მოთხოვნისას.";
            }
            console.error(error);
        });
};

// გამოსვლა
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });
}

// ავტორიზაციის სტატუსის კონტროლი
auth.onAuthStateChanged((user) => {
    if (user && user.email === ADMIN_EMAIL) {
        if(loginSection) loginSection.style.display = 'none';
        if(adminSection) adminSection.style.display = 'block';
        loadOrders();
    } else {
        if(loginSection) loginSection.style.display = 'block';
        if(adminSection) adminSection.style.display = 'none';
        if(user && user.email !== ADMIN_EMAIL) {
            auth.signOut(); // თუ სხვა იუზერმა სცადა შესვლა
        }
    }
});

// შეკვეთების წამოღება ბაზიდან და სრული დეტალიზაციით გამოტანა
function loadOrders() {
    if (!ordersList) return;
    
    db.collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        ordersList.innerHTML = "";
        
        if (snapshot.empty) {
            ordersList.innerHTML = `<p class="no-orders">ჯერ შეკვეთები არ არის.</p>`;
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString('ka-GE') : 'უცნობი დრო';

            const card = document.createElement('div');
            card.className = 'order-card';
            card.innerHTML = `
                <div class="order-header">
                    <span>მომხმარებელი: ${data.customerName || 'არ არის მითითებული'}</span>
                    <span>ფასი: ${data.totalPrice || '0'}</span>
                </div>
                <div class="order-body">
                    <p><span>ტელეფონი:</span> ${data.phone || '-'}</p>
                    <p><span>მისამართი:</span> ${data.address || '-'}</p>
                    <p><span>პროდუქტი/დეტალები:</span> ${data.productDetails || '-'}</p>
                    <p><span>რაოდენობა:</span> ${data.quantity || '1'}</p>
                    <p style="color: #888; font-size: 12px; margin-top: 8px;">შეკვეთის დრო: ${dateStr}</p>
                </div>
            `;
            ordersList.appendChild(card);
        });
    });
}
