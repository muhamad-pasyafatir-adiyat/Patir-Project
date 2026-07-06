let currentUser = null;

// Escape HTML untuk mencegah XSS saat render
function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Fallback jika server tidak dapat memuat menu dari folder gambar
const fallbackMenuData = [
    // === COFFEE ===
    { id: 1, name: 'Kopi Susu Gula Aren', category: 'coffee', price: 18000, img: 'https://images.unsplash.com/photo-1579992357154-faf4bde95b3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { id: 2, name: 'Americano', category: 'coffee', price: 15000, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { id: 3, name: 'Caffe Latte', category: 'coffee', price: 20000, img: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { id: 4, name: 'Cappuccino', category: 'coffee', price: 20000, img: 'https://images.unsplash.com/photo-1534778101976-62847782c213?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { id: 5, name: 'Caramel Macchiato', category: 'coffee', price: 22000, img: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    
    // === NON-COFFEE ===
    { id: 6, name: 'Matcha Latte', category: 'non-coffee', price: 20000, img: 'https://images.unsplash.com/photo-1515823662972-da6a2b4d3002?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { id: 7, name: 'Red Velvet Latte', category: 'non-coffee', price: 20000, img: 'https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { id: 8, name: 'Taro Latte', category: 'non-coffee', price: 20000, img: 'https://images.unsplash.com/photo-1578848417758-cda63bd302f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { id: 9, name: 'Chocolate Ice', category: 'non-coffee', price: 18000, img: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { id: 10, name: 'Lemon Tea', category: 'non-coffee', price: 15000, img: 'https://images.unsplash.com/photo-1556881286-fc6915169721?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    
    // === SNACK ===
    { id: 11, name: 'French Fries', category: 'snack', price: 15000, img: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { id: 12, name: 'Cireng Bumbu Rujak', category: 'snack', price: 12000, img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { id: 13, name: 'Roti Bakar Coklat Keju', category: 'snack', price: 15000, img: 'https://images.unsplash.com/photo-1525351484163-12bbc974b865?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { id: 14, name: 'Pisang Goreng Keju', category: 'snack', price: 12000, img: 'https://images.unsplash.com/photo-1627429107937-dbce1bfbb046?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { id: 15, name: 'Dimsum Ayam (Isi 4)', category: 'snack', price: 15000, img: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' }
];

let menuData = fallbackMenuData;

let cart = JSON.parse(localStorage.getItem('triicofCart')) || [];

function saveCart() {
    localStorage.setItem('triicofCart', JSON.stringify(cart));
}

// DOM Elements
const menuGrid = document.getElementById('menuGrid');
const tabBtns = document.querySelectorAll('.tab-btn');
const cartBtn = document.getElementById('cartBtn');
const cartModal = document.getElementById('cartModal');
const closeCart = document.getElementById('closeCart');
const cartBadge = document.getElementById('cartBadge');
const cartItemsContainer = document.getElementById('cartItems');
const checkoutForm = document.getElementById('checkoutForm');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const btnOrder = document.getElementById('btnOrder');
const customerNameInput = document.getElementById('customerName');
const toast = document.getElementById('toast');

// Render Menu
function renderMenu(category = 'all') {
    if (!menuGrid) return;
    menuGrid.innerHTML = '';
    const filteredMenu = category === 'all' ? menuData : menuData.filter(item => item.category === category);
    
    filteredMenu.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.innerHTML = `
            <img src="${escHtml(item.img)}" alt="${escHtml(item.name)}" class="menu-img">
            <div class="menu-content">
                <h3 class="menu-title">${escHtml(item.name)}</h3>
                <p class="menu-price">Rp ${item.price.toLocaleString('id-ID')}</p>
                <button class="btn-add" onclick="addToCart(${item.id})">
                    <i class="fa-solid fa-plus"></i> Tambah
                </button>
            </div>
        `;
        menuGrid.appendChild(card);
    });
}

// Category Filtering
if (tabBtns) {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderMenu(btn.dataset.category);
        });
    });
}

// Cart Logic
function addToCart(id) {
    if (!currentUser) {
        window.location.href = '/auth.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }

    const item = menuData.find(m => m.id === id);
    const existing = cart.find(c => c.id === id);
    
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    
    saveCart();
    updateCartIcon();
    renderCart();
    
    // Simple visual feedback
    const btn = event.currentTarget;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Ditambahkan';
    btn.style.background = 'var(--primary)';
    btn.style.color = 'white';
    setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-plus"></i> Tambah';
        btn.style.background = 'var(--bg-glass)';
        btn.style.color = 'var(--primary)';
    }, 1000);
}

function updateCartIcon() {
    if (!cartBadge) return;
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartBadge.textContent = totalItems;
}

function updateQty(id, change) {
    const item = cart.find(c => c.id === id);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) {
            cart = cart.filter(c => c.id !== id);
        }
        saveCart();
        updateCartIcon();
        renderCart();
    }
}

function renderCart() {
    if (!cartItemsContainer || !checkoutForm) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Keranjang Anda masih kosong.</p>';
        checkoutForm.style.display = 'none';
        return;
    }

    checkoutForm.style.display = 'block';
    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="item-info">
                <h4>${escHtml(item.name)}</h4>
                <div class="item-price">Rp ${item.price.toLocaleString('id-ID')}</div>
            </div>
            <div class="item-qty-controls">
                <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });

    if (cartTotalPrice) {
        cartTotalPrice.textContent = `Rp ${total.toLocaleString('id-ID')}`;
        cartTotalPrice.dataset.rawTotal = total;
    }
}

// Modal handling
if (cartBtn && cartModal && closeCart) {
    cartBtn.addEventListener('click', () => {
        cartModal.style.display = 'flex';
        renderCart();
    });
    closeCart.addEventListener('click', () => cartModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) cartModal.style.display = 'none';
    });
}

function showToast() {
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Payment Gateway Logic
const payBtns = document.querySelectorAll('.pay-btn');
const qrisContainer = document.getElementById('qrisContainer');
const transferContainer = document.getElementById('transferContainer');
let selectedPaymentMethod = 'Cash';

if (payBtns.length > 0) {
    payBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            payBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedPaymentMethod = btn.getAttribute('data-method');
            
            if (qrisContainer) qrisContainer.classList.remove('active');
            if (transferContainer) transferContainer.classList.remove('active');
            
            if (selectedPaymentMethod === 'QRIS') {
                if (qrisContainer) qrisContainer.classList.add('active');
                if (btnOrder) btnOrder.textContent = 'Selesaikan Pembayaran';
            } else if (selectedPaymentMethod === 'Transfer') {
                if (transferContainer) transferContainer.classList.add('active');
                if (btnOrder) btnOrder.textContent = 'Selesaikan Pembayaran';
            } else {
                if (btnOrder) btnOrder.textContent = 'Kirim Pesanan Sekarang!';
            }
        });
    });
}

// Order Submission
if (btnOrder && customerNameInput && cartTotalPrice) {
    btnOrder.addEventListener('click', async () => {
        const name = customerNameInput.value.trim();
        if (!name) {
            alert('Tolong masukkan nama Anda terlebih dahulu!');
            customerNameInput.focus();
            return;
        }

        const total = parseInt(cartTotalPrice.dataset.rawTotal || 0);
        const orderNotes = document.getElementById('orderNotes') ? document.getElementById('orderNotes').value.trim() : '';

        const orderPayload = {
            customerName: name,
            items: cart.map(c => ({ id: c.id, name: c.name, qty: c.qty })),
            paymentMethod: selectedPaymentMethod,
            notes: orderNotes
        };

        btnOrder.textContent = 'Mengirim...';
        btnOrder.disabled = true;

        try {
            const res = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });

            if (res.ok) {
                cart = [];
                saveCart();
                updateCartIcon();
                cartModal.style.display = 'none';
                customerNameInput.value = '';
                if(document.getElementById('orderNotes')) document.getElementById('orderNotes').value = '';
                showToast();
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.error || 'Gagal mengirim pesanan. Coba lagi.');
            }
        } catch (err) {
            console.error(err);
            alert('Koneksi lambat atau terputus.');
        } finally {
            btnOrder.textContent = (selectedPaymentMethod === 'QRIS' || selectedPaymentMethod === 'Transfer') ? 'Selesaikan Pembayaran' : 'Kirim Pesanan Sekarang!';
            btnOrder.disabled = false;
        }
    });
}

// Initialize Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');

if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

// =============================
// PESANAN SAYA (Riwayat Pelanggan)
// =============================
function createMyOrdersModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'myOrdersModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fa-solid fa-receipt"></i> Pesanan Saya</h2>
                <span class="close-btn" id="closeMyOrders">&times;</span>
            </div>
            <div class="modal-body" id="myOrdersBody">
                <p style="text-align:center; color:#64748b;">Memuat...</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#closeMyOrders').addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    return modal;
}

async function showMyOrders() {
    let modal = document.getElementById('myOrdersModal') || createMyOrdersModal();
    modal.style.display = 'flex';
    const body = modal.querySelector('#myOrdersBody');
    body.innerHTML = '<p style="text-align:center; color:#64748b;">Memuat...</p>';

    try {
        const res = await fetch('/api/customer/orders');
        if (!res.ok) throw new Error('unauthorized');
        const myOrders = await res.json();

        if (myOrders.length === 0) {
            body.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">Belum ada pesanan. Yuk pesan sekarang!</p>';
            return;
        }

        body.innerHTML = myOrders.map(o => `
            <div style="border:1px solid rgba(0,0,0,0.08); border-radius:12px; padding:15px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <strong style="color:var(--primary);">#${escHtml(o.order_id)}</strong>
                    <span style="font-size:0.8rem; padding:3px 10px; border-radius:20px; font-weight:700; ${o.status === 'done' ? 'background:#dcfce7; color:#16a34a;' : 'background:#fef9c3; color:#ca8a04;'}">
                        ${o.status === 'done' ? 'Selesai' : 'Diproses'}
                    </span>
                </div>
                <div style="font-size:0.85rem; color:#64748b; margin-bottom:6px;">${escHtml(o.date)} • ${escHtml(o.time)} • ${escHtml(o.payment_method || 'Cash')}</div>
                <div style="font-size:0.9rem; white-space:pre-line;">${escHtml(o.item_details)}</div>
                <div style="margin-top:8px; font-weight:800;">Total: Rp ${(o.total || 0).toLocaleString('id-ID')}</div>
            </div>
        `).join('');
    } catch (e) {
        body.innerHTML = '<p style="text-align:center; color:#ef4444; padding:20px;">Gagal memuat riwayat pesanan.</p>';
    }
}

// Global Init
async function initApp() {
    // 1. Authenticate user
    try {
        const res = await fetch('/api/customer/me');
        const data = await res.json();
        const navLinks = document.getElementById('navLinks');
        
        if (data.loggedIn) {
            currentUser = data.customer;
            // Add user profile to nav
            const profileLi = document.createElement('li');
            profileLi.innerHTML = `<a href="#" style="color:var(--primary); font-weight:800;"><i class="fa-solid fa-circle-user"></i> Halo, ${escHtml(currentUser.name.split(' ')[0])}</a>`;
            const myOrdersLi = document.createElement('li');
            myOrdersLi.innerHTML = `<a href="#" id="navMyOrders"><i class="fa-solid fa-receipt"></i> Pesanan Saya</a>`;
            const logoutLi = document.createElement('li');
            logoutLi.innerHTML = `<a href="#" id="navLogout" style="color:#ef4444;"><i class="fa-solid fa-right-from-bracket"></i> Keluar</a>`;
            navLinks.appendChild(profileLi);
            navLinks.appendChild(myOrdersLi);
            navLinks.appendChild(logoutLi);

            document.getElementById('navMyOrders').addEventListener('click', (e) => {
                e.preventDefault();
                showMyOrders();
            });

            document.getElementById('navLogout').addEventListener('click', async (e) => {
                e.preventDefault();
                await fetch('/api/customer/logout', { method: 'POST' });
                window.location.reload();
            });
            
            // Hide customer name input in cart modal since we know who they are
            const nameInput = document.getElementById('customerName');
            if(nameInput) {
                nameInput.value = currentUser.name;
                nameInput.parentElement.style.display = 'none';
            }
        } else {
            // Add login button
            const loginLi = document.createElement('li');
            loginLi.innerHTML = `<a href="auth.html"><i class="fa-solid fa-user-lock"></i> Masuk / Daftar</a>`;
            navLinks.appendChild(loginLi);
        }
    } catch(e) {}

    // 2. Load the menu from server (harga resmi dari server)
    try {
        const menuRes = await fetch('/api/menu');
        if (menuRes.ok) {
            const serverMenu = await menuRes.json();
            if (Array.isArray(serverMenu) && serverMenu.length > 0) menuData = serverMenu;
        }
    } catch(e) {}

    updateCartIcon();
    if (menuGrid) renderMenu();
}

initApp();
