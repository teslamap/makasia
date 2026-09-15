// Firebase-ის ინიციალიზაცია
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminLogout = document.getElementById('adminLogout');
const loginError = document.getElementById('loginError');
const ordersList = document.getElementById('ordersList');

// ფიქსირებული ადმინის მეილი
const ADMIN_EMAIL = "suloanani1@gmail.com";

// 🌟 უნივერსალური შეტყობინების ფუნქცია ძველი alert-ების ნაცვლად
window.showModalMessage = function(title, text, type = 'error') {
    const modal = document.getElementById('universalModal');
    if (!modal) {
        alert(text);
        return;
    }
    document.getElementById('uniModalTitle').textContent = title;
    document.getElementById('uniModalText').textContent = text;
    
    const iconEl = document.getElementById('uniModalIcon');
    if (iconEl) {
        iconEl.textContent = type === 'success' ? '✅' : '⚠️';
    }

    if (!modal.open) {
        modal.showModal();
    }
}

// 🛡️ ძველი alert-ების გადაფარვა შენი დიზაინის მოდალით
window.alert = function(msg) {
    window.showModalMessage("ყურადღება", msg, "error");
};

// ადმინად შესვლა (პაროლით)
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

// გამოსვლა
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });
}
if (adminLogout) {
    adminLogout.addEventListener('click', () => {
        auth.signOut();
    });
}

// ავტორიზაციის სტატუსის კონტროლი
auth.onAuthStateChanged((user) => {
    if (user && user.email === ADMIN_EMAIL) {
        if(loginSection) loginSection.style.display = 'none';
        if(adminSection) adminSection.style.display = 'block';
        loadOrders();
        loadProducts();
    } else {
        if(loginSection) loginSection.style.display = 'flex';
        if(adminSection) adminSection.style.display = 'none';
        if(user && user.email !== ADMIN_EMAIL) {
            auth.signOut(); 
        }
    }
});

// პროდუქტის დამატების/რედაქტირების მოდალის მართვა
const productModal = document.getElementById('productModal');
const catalogModal = document.getElementById('catalogModal');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');
const editProductId = document.getElementById('editProductId');

const openAddProdBtn = document.getElementById('openAddProductModal');
if (openAddProdBtn) {
    openAddProdBtn.addEventListener('click', () => {
        if(modalTitle) modalTitle.textContent = "✨ ახალი პროდუქტის დამატება";
        if(editProductId) editProductId.value = "";
        if(productForm) productForm.reset();
        if(productModal) productModal.showModal();
    });
}

const openCatBtn = document.getElementById('openCatalogModal');
if (openCatBtn) {
    openCatBtn.addEventListener('click', () => {
        if(catalogModal) catalogModal.showModal();
    });
}

function closeProductModal() {
    if(productModal) productModal.close();
}

// 🌟 ფოტოს ატვირთვა Firebase Storage-ში
async function uploadImageIfNeeded() {
    const fileInput = document.getElementById('prodImageFile');
    const urlInput = document.getElementById('prodImage') ? document.getElementById('prodImage').value.trim() : '';

    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        if (urlInput) return urlInput;
        window.showModalMessage("შეცდომა", "გთხოვთ აირჩიოთ სურათის ფაილი ან ჩასვათ სურათის ბმული (URL)!", "error");
        return null;
    }

    const file = fileInput.files[0];
    const storageRef = storage.ref();
    const imageRef = storageRef.child('products/' + Date.now() + '_' + file.name);

    try {
        const snapshot = await imageRef.put(file);
        const downloadUrl = await snapshot.ref.getDownloadURL();
        return downloadUrl;
    } catch (err) {
        if (urlInput) return urlInput; 
        window.showModalMessage("შეცდომა", "ფოტოს ატვირთვა Firebase-ში ვერ მოხერხდა: " + err.message, "error");
        return null;
    }
}

// ფორმის გაგზავნა (დამატება / განახლება)
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editProductId ? editProductId.value : '';
        const name = document.getElementById('prodName').value;
        const price = Number(document.getElementById('prodPrice').value);
        const category = document.getElementById('prodCategory').value;
        
        const imageUrl = await uploadImageIfNeeded();
        if (!imageUrl) return;

        if (id) {
            db.collection("products").doc(id).update({ name, price, category, image: imageUrl })
            .then(() => {
                showToast("პროდუქტი წარმატებით განახლდა!");
                closeProductModal();
            });
        } else {
            db.collection("products").add({ 
                name, price, category, image: imageUrl, 
                createdAt: firebase.firestore.FieldValue.serverTimestamp() 
            })
            .then(() => {
                showToast("პროდუქტი წარმატებით დაემატა!");
                closeProductModal();
            });
        }
    });
}

// პროდუქტების კატალოგის ჩატვირთვა ადმინისთვის
function loadProducts() {
    const adminProductTable = document.getElementById('adminProductTable');
    if (!adminProductTable) return;

    db.collection("products").onSnapshot((snapshot) => {
        adminProductTable.innerHTML = "";
        if(snapshot.empty) {
            adminProductTable.innerHTML = `<tr><td colspan="5" style="text-align:center; color: #818cf8; font-weight: 600;">პროდუქტები არ მოიძებნა</td></tr>`;
            return;
        }
        snapshot.forEach((doc) => {
            const p = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${p.image}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 12px; border: 2px solid #e0e7ff;"></td>
                <td><strong style="color: #312e81;">${p.name}</strong></td>
                <td><span style="background: #eef2ff; color: #4338ca; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;">${p.category}</span></td>
                <td><strong style="color: #059669;">${p.price} ₾</strong></td>
                <td>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-glow-blue" style="padding: 6px 12px; font-size: 12px; box-shadow: none; width: auto;" onclick="openEditModal('${doc.id}', '${escapeHtml(p.name)}', ${p.price}, '${p.category}', '${p.image}')">✏️</button>
                    <button class="btn btn-glow-red" style="padding: 6px 12px; font-size: 12px; box-shadow: none; width: auto;" onclick="confirmDeleteProduct('${doc.id}')">🗑️</button>
                  </div>
                </td>
            `;
            adminProductTable.appendChild(tr);
        });
    });
}

function escapeHtml(text) {
    return text.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
}

window.openEditModal = function(id, name, price, category, image) {
    if(modalTitle) modalTitle.textContent = "✏️ პროდუქტის რედაქტირება";
    if(editProductId) editProductId.value = id;
    document.getElementById('prodName').value = name;
    document.getElementById('prodPrice').value = price;
    document.getElementById('prodCategory').value = category;
    if(document.getElementById('prodImage')) document.getElementById('prodImage').value = image;
    if(document.getElementById('prodImageFile')) document.getElementById('prodImageFile').value = "";
    if(catalogModal) catalogModal.close();
    if(productModal) productModal.showModal();
}

window.confirmDeleteProduct = function(id) {
    showCustomConfirm("პროდუქტის წაშლა", "ნამდვილად გსურთ ამ პროდუქტის წაშლა?", () => {
        db.collection("products").doc(id).delete().then(() => {
            showToast("პროდუქტი წარმატებით წაიშალა!");
        });
    });
};

// შეკვეთების წამოღება და გამოტანა
function loadOrders() {
    const adminOrdersTable = document.getElementById('adminOrdersTable');
    if (!adminOrdersTable && !ordersList) return;

    db.collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        if (adminOrdersTable) adminOrdersTable.innerHTML = "";
        if (ordersList) ordersList.innerHTML = "";
        
        if (snapshot.empty) {
            const emptyHtml = `<tr><td colspan="7" style="text-align:center; color: #818cf8; font-weight: 600;">შეკვეთები ჯერ არ არის</td></tr>`;
            if (adminOrdersTable) adminOrdersTable.innerHTML = emptyHtml;
            if (ordersList) ordersList.innerHTML = `<p class="no-orders">ჯერ შეკვეთები არ არის.</p>`;
            return;
        }

        snapshot.forEach((doc) => {
            const o = doc.data();
            const dateStr = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleString('ka-GE') : 'ახლახანს';
            
            // ცხრილის ფორმატი
            if (adminOrdersTable) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span style="font-size: 12px; color: #64748b; font-weight: 600;">${dateStr}</span></td>
                    <td><strong style="color: #312e81;">${o.customerName || 'უცნობი'}</strong></td>
                    <td>${o.phone || '-'}<br><span style="font-size: 12px; color: #64748b;">${o.address || '-'}</span></td>
                    <td><div style="max-height: 80px; overflow-y: auto; font-size: 13px;">${o.productDetails || o.productName || '-'}</div><span style="font-size: 11px; color: #7c3aed; font-weight: 700;">მიწოდება: ${o.delivery || 'სტანდარტული'}</span></td>
                    <td><strong style="color: #059669; font-size: 15px;">${o.totalPrice || '0'} ₾</strong></td>
                    <td><span style="background: linear-gradient(135deg, #fef08a, #fde047); color: #854d0e; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">${o.status || 'ახალი'}</span></td>
                    <td>
                      <button class="btn btn-glow-red" style="padding: 6px 12px; font-size: 12px; box-shadow: none; width: auto;" onclick="confirmDeleteOrder('${doc.id}')">🗑️ წაშლა</button>
                    </td>
                `;
                adminOrdersTable.appendChild(tr);
            }

            // ქარდების ფორმატი (თუ HTML-ში ordersList-ს იყენებ)
            if (ordersList) {
                const card = document.createElement('div');
                card.className = 'order-card';
                card.innerHTML = `
                    <div class="order-header">
                        <span>მომხმარებელი: ${o.customerName || 'არ არის მითითებული'}</span>
                        <span>ფასი: ${o.totalPrice || '0'} ₾</span>
                    </div>
                    <div class="order-body">
                        <p><span>ტელეფონი:</span> ${o.phone || '-'}</p>
                        <p><span>მისამართი:</span> ${o.address || '-'}</p>
                        <p><span>პროდუქტი/დეტალები:</span> ${o.productDetails || '-'}</p>
                        <p><span>მიწოდება:</span> ${o.delivery || '-'}</p>
                        <p style="color: #888; font-size: 12px; margin-top: 8px;">შეკვეთის დრო: ${dateStr}</p>
                        <button class="btn btn-glow-red" style="margin-top: 10px; padding: 6px 12px; font-size: 12px;" onclick="confirmDeleteOrder('${doc.id}')">🗑️ შეკვეთის წაშლა</button>
                    </div>
                `;
                ordersList.appendChild(card);
            }
        });
    });
}

window.confirmDeleteOrder = function(id) {
    showCustomConfirm("შეკვეთის წაშლა", "ნამდვილად გსურთ ამ შეკვეთის წაშლა?", () => {
        db.collection("orders").doc(id).delete().then(() => {
            showToast("შეკვეთა წარმატებით წაიშალა!");
        }).catch((error) => {
            window.showModalMessage("შეცდომა", "შეცდომა წაშლისას: " + error.message, "error");
        });
    });
};

function showCustomConfirm(title, text, onConfirm) {
    const modal = document.getElementById('confirmModal');
    if (!modal) {
        if (confirm(text)) onConfirm();
        return;
    }
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmText').textContent = text;
    
    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');

    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newOkBtn.addEventListener('click', () => {
        modal.close();
        onConfirm();
    });

    newCancelBtn.addEventListener('click', () => {
        modal.close();
    });

    modal.showModal();
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
