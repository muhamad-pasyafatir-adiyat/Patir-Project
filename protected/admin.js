const ordersGrid = document.getElementById('ordersGrid');
const emptyState = document.getElementById('emptyState');
const connectionStatus = document.getElementById('connectionStatus');
const receiptContainer = document.getElementById('receiptContainer');

let orders = []; // local cache for live orders

// Escape HTML untuk mencegah XSS saat render data
function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Format currency
function formatRupiah(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

// Helper to play a "Ting" sound
function playNotificationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); 
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.log('Audio disabled by browser policy until interaction occurs.');
    }
}

// Ensure audio context is ready on first interaction (required by browsers)
document.body.addEventListener('click', () => {}, { once: true });

// Muat pesanan yang masih pending dari database (bertahan setelah refresh)
async function loadPendingOrders() {
    try {
        const res = await fetch('/api/orders/pending');
        if (!res.ok) return;
        orders = await res.json();
        renderOrders();
    } catch (e) {
        console.error('Gagal memuat pesanan aktif', e);
    }
}
loadPendingOrders();

// Connect to Server-Sent Events (SSE) for LIVE Orders
function connectSSE() {
    const eventSource = new EventSource('/api/stream');

    eventSource.onopen = () => {
        connectionStatus.textContent = 'Terhubung & Menunggu Pesanan...';
        connectionStatus.style.color = '#10b981';
    };

    eventSource.onerror = () => {
        connectionStatus.textContent = 'Terputus! Menghubungkan ulang...';
        connectionStatus.style.color = '#ef4444';
    };

    eventSource.addEventListener('new-order', (event) => {
        const newOrder = JSON.parse(event.data);
        orders.unshift(newOrder);
        renderOrders();
        playNotificationSound();
        
        // If history view is open, silently refresh it so the new order appears
        if(document.getElementById('history-view').classList.contains('active')) {
            loadHistory();
        }
    });
}

// Render LIVE orders
function renderOrders() {
    if (orders.length > 0) {
        emptyState.style.display = 'none';
    } else {
        emptyState.style.display = 'block';
    }

    // Keep empty state message, clear the rest
    const cards = ordersGrid.querySelectorAll('.order-card');
    cards.forEach(c => c.remove());

    orders.forEach((order, index) => {
        const card = document.createElement('div');
        card.className = `order-card ${index === 0 ? 'new' : ''}`;
        
        if (index === 0) {
            setTimeout(() => card.classList.remove('new'), 4000);
        }

        const itemsHtml = order.items.map(i => `<li>${i.qty}x ${esc(i.name)} (Rp ${i.price.toLocaleString('id-ID')})</li>`).join('');

        card.innerHTML = `
            <div class="order-header">
                <span class="order-id">#${esc(order.orderId)}</span>
                <span class="order-time">${esc(order.time)}</span>
            </div>
            <div class="customer-name">
                <i class="fa-solid fa-user"></i> ${esc(order.customerName)}
                <div style="font-size:0.8rem; color:#64748b; font-weight:normal; margin-top:2px;">
                    <i class="fa-solid fa-address-book" style="color:var(--primary); width:15px;"></i> ${esc(order.customerContact)}
                </div>
                <br>
                <small style="font-size:0.85rem; color:#64748b; font-weight:600;">
                    <i class="fa-solid ${order.paymentMethod === 'QRIS' ? 'fa-qrcode' : (order.paymentMethod === 'Transfer' ? 'fa-building-columns' : 'fa-money-bill-wave')}" style="color:var(--primary);"></i> Pembayaran: ${esc(order.paymentMethod || 'Cash')}
                </small>
            </div>
            <ul class="order-items">
                ${itemsHtml}
            </ul>
            ${order.notes ? `<div style="background:#fffbeb; padding:10px; border-left:4px solid #f59e0b; font-size:0.85rem; margin-bottom:15px; border-radius:5px;"><i class="fa-solid fa-note-sticky" style="color:#f59e0b;"></i> <b>Catatan:</b> ${esc(order.notes)}</div>` : ''}
            <div class="order-total">Total: ${formatRupiah(order.total)}</div>
            <div class="actions">
                <button class="btn btn-print" onclick="printReceipt('${order.orderId}')">
                    <i class="fa-solid fa-print"></i> Cetak Struk
                </button>
                <button class="btn btn-done" onclick="markDone('${order.orderId}')">
                    <i class="fa-solid fa-check"></i> Selesai
                </button>
            </div>
        `;
        ordersGrid.insertBefore(card, emptyState);
    });
}

function printReceipt(orderId) {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    const itemsRows = order.items.map(i => `
        <tr>
            <td class="item-name">${i.name}</td>
            <td class="item-qty">${i.qty}x</td>
            <td class="item-subtotal">${formatRupiah(i.qty * i.price)}</td>
        </tr>
    `).join('');

    receiptContainer.innerHTML = `
        <div class="receipt-header">
            <h2>TRIICOF</h2>
            <p>COFFEE & SNACK</p>
            <p>Buka 09.00 - 21.00</p>
        </div>
        <div class="receipt-meta">
            <div><span>ID/No</span> <span>${order.orderId}</span></div>
            <div><span>Waktu</span> <span>${order.date} ${order.time}</span></div>
            <div><span>Pelanggan</span> <span>${order.customerName}</span></div>
            <div><span>Kontak</span> <span>${order.customerContact}</span></div>
            <div><span>Metode</span> <span>${order.paymentMethod || 'Cash'}</span></div>
        </div>
        <table class="receipt-items">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Harga</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRows}
            </tbody>
        </table>
        ${order.notes ? `<div style="font-size:0.9rem; margin: 10px 0; border:1px dashed #000; padding:5px;"><b>Catatan:</b> ${order.notes}</div>` : ''}
        <div class="receipt-total">
            TOTAL: ${formatRupiah(order.total)}
        </div>
        <div class="receipt-footer">
            <p>Terima Kasih atas kunjungan Anda!</p>
            <p>IG: @triicof</p>
        </div>
    `;
    window.print();
}

async function markDone(orderId) {
    try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/done`, { method: 'POST' });
        if (!res.ok) {
            alert('Gagal menandai pesanan selesai. Coba lagi.');
            return;
        }
    } catch (e) {
        alert('Tidak dapat menghubungi server.');
        return;
    }
    orders = orders.filter(o => o.orderId !== orderId);
    renderOrders();
}

/* =========================================
   TAB SWITCHING LOGIC
========================================= */
const adminTabs = document.querySelectorAll('.admin-tab');
const viewSections = document.querySelectorAll('.view-section');

adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        adminTabs.forEach(t => t.classList.remove('active'));
        viewSections.forEach(v => v.classList.remove('active'));
        
        tab.classList.add('active');
        const target = tab.getAttribute('data-target');
        document.getElementById(target).classList.add('active');
        
        if(target === 'history-view') {
            loadHistory();
        }
    });
});

/* =========================================
   REPORTS & HISTORY LOGIC
========================================= */
const reportFilters = document.querySelectorAll('.filter-btn');
const historyTableBody = document.getElementById('historyTableBody');
const summaryTotal = document.getElementById('summaryTotal');
const summaryLabel = document.getElementById('summaryLabel');
const customMonthInput = document.getElementById('customMonth');

// Logout Button Logic
const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        if (confirm('Yakin ingin keluar dari kasir?')) {
            try {
                await fetch('/api/logout', { method: 'POST' });
                window.location.href = '/login.html';
            } catch (e) {
                console.error('Gagal logout', e);
            }
        }
    });
}

let historyData = [];

async function loadHistory() {
    try {
        const res = await fetch('/api/history');
        if (!res.ok) throw new Error('Network error');
        historyData = await res.json();
        
        // Apply current filter
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const filter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'daily';
        renderHistory(filter);
    } catch (e) {
        historyTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red; padding: 30px;">Gagal terhubung ke database Riwayat Excel.</td></tr>`;
    }
}

reportFilters.forEach(btn => {
    btn.addEventListener('click', () => {
        reportFilters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (customMonthInput) customMonthInput.value = ''; // clear month picker
        const filter = btn.getAttribute('data-filter');
        
        const textMap = { 'daily': 'Hari Ini', 'weekly': 'Minggu Ini', 'last-month': 'Bulan Lalu' };
        summaryLabel.textContent = `Total Pendapatan (${textMap[filter]})`;
        
        renderHistory(filter);
    });
});

if (customMonthInput) {
    customMonthInput.addEventListener('change', (e) => {
        const val = e.target.value; // YYYY-MM
        if (!val) return;
        
        reportFilters.forEach(b => b.classList.remove('active'));
        
        const [y, m] = val.split('-');
        const formattedLabel = `${m}/${y}`;
        summaryLabel.textContent = `Total Pendapatan (${formattedLabel})`;
        
        renderHistory('custom-month', val);
    });
}

function isWithinTimeframe(dateStr, filterStr, customDateVal = null) {
    if (filterStr === 'all') return true;
    
    // dateStr format expected from server: "10/4/2026"
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    
    const now = new Date();
    const currD = now.getDate();
    const currM = now.getMonth() + 1;
    const currY = now.getFullYear();
    
    if (filterStr === 'custom-month' && customDateVal) {
        const [cy, cm] = customDateVal.split('-');
        return m === parseInt(cm, 10) && y === parseInt(cy, 10);
    }
    
    if (filterStr === 'daily') {
        return d === currD && m === currM && y === currY;
    }
    if (filterStr === 'last-month') {
        let targetM = currM - 1;
        let targetY = currY;
        if (targetM === 0) {
            targetM = 12;
            targetY = currY - 1;
        }
        return m === targetM && y === targetY;
    }
    if (filterStr === 'weekly') {
        const rowDate = new Date(y, m-1, d);
        const timeDiff = now.getTime() - rowDate.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays >= 0 && diffDays <= 7;
    }
    return false;
}

function renderHistory(filter, customDateVal = null) {
    if(!historyData || !Array.isArray(historyData)) return;

    // Clone and reverse to show newest first!
    const reversedData = [...historyData].reverse();
    
    const filtered = reversedData.filter(row => {
        const dateStr = row['Tanggal'];
        if (!dateStr) return false;
        return isWithinTimeframe(dateStr, filter, customDateVal);
    });
    
    let totalIncome = 0;
    historyTableBody.innerHTML = '';
    
    if (filtered.length === 0) {
        historyTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px;">Belum ada riwayat transaksi untuk rentang waktu ini.</td></tr>`;
    } else {
        filtered.forEach(row => {
            const price = parseInt(row['Total Harga']) || 0;
            totalIncome += price;
            
            const paymentMethodStr = row['Metode Pembayaran'] || 'Cash';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row['Tanggal']} <br><small style="color: #64748b; font-weight: bold;">${row['Waktu']}</small></td>
                <td class="row-id">#${row['ID Pesanan']}</td>
                <td style="font-weight: 600;">
                    ${row['Nama Pelanggan']}
                    <br>
                    <small style="color: var(--primary); font-size: 0.8rem;">
                        <i class="fa-solid ${paymentMethodStr.toUpperCase() === 'QRIS' ? 'fa-qrcode' : (paymentMethodStr.toUpperCase() === 'TRANSFER' ? 'fa-building-columns' : 'fa-money-bill-wave')}"></i> ${paymentMethodStr}
                    </small>
                </td>
                <td style="font-size: 0.95rem; line-height: 1.4;">${row['Rincian Pesanan']}</td>
                <td class="row-total">${formatRupiah(price)}</td>
            `;
            historyTableBody.appendChild(tr);
        });
    }
    
    summaryTotal.textContent = formatRupiah(totalIncome);
}

// Boot up
connectSSE();
