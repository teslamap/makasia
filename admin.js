// Firebase-ის ინიციალიზაცია (თუ უკვე აწერია თავში, მხოლოდ ლოგიკა გამოიყენე)
const db = firebase.firestore();
const auth = firebase.auth();

const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');
const ordersList = document.getElementById('ordersList');

// ადმინად შესვლა
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                loginError.textContent = "";
            })
            .catch((error) => {
                loginError.textContent = "არასწორი ელ-ფოსტა ან პაროლი!";
                console.error(error);
            });
    });
}

// გამოსვლა
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });
}

// ავტორიზაციის სტატუსის კონტროლი
auth.onAuthStateChanged((user) => {
    if (user) {
        loginSection.style.display = 'none';
        adminSection.style.display = 'block';
        loadOrders();
    } else {
        loginSection.style.display = 'block';
        adminSection.style.display = 'none';
    }
});

// შეკვეთების წამოღება ბაზიდან და სრული დეტალიზაციით გამოტანა
function loadOrders() {
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
