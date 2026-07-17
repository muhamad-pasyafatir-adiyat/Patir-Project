require('dotenv').config();
const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const xss = require('xss');
const { connectToDatabase, Customer, Order } = require('./db.js');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH || bcrypt.hashSync(process.env.ADMIN_PASS || 'triicof2026', 10);
const createCustomerId = () => `CUST-${crypto.randomUUID()}`;

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            frameSrc: ["'self'", 'https://www.google.com']
        }
    }
}));

if (IS_PROD) app.set('trust proxy', 1);

app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: IS_PROD,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const orderLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: { error: 'Terlalu banyak mencoba memesan. Harap tunggu beberapa saat.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' }
});

const readLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: { error: 'Terlalu banyak permintaan. Harap tunggu sebentar.' }
});

const adminActionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Terlalu banyak aksi admin. Harap tunggu sebentar.' }
});

function issueCsrfToken(req) {
    if (!req.session) return null;
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    return req.session.csrfToken;
}

function requireCsrfToken(req, res, next) {
    const sessionToken = req.session ? req.session.csrfToken : null;
    const headerToken = req.get('x-csrf-token');
    const bodyToken = req.body && typeof req.body._csrf === 'string' ? req.body._csrf : null;

    if (!sessionToken || (headerToken !== sessionToken && bodyToken !== sessionToken)) {
        return res.status(403).json({ success: false, message: 'Token keamanan tidak valid.' });
    }

    next();
}

const requireAuth = (req, res, next) => {
    if (req.session && req.session.admin) {
        next();
    } else {
        res.status(401).send('Akses Ditolak. Silakan masuk melalui <a href="/login.html">Halaman Login</a>');
    }
};

app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.use(express.json({ limit: '50kb' }));

app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: issueCsrfToken(req) });
});

app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    return requireCsrfToken(req, res, next);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portfolio', 'index.html'));
});

app.get('/admin.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'protected', 'admin.html'));
});
app.get('/admin.js', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'protected', 'admin.js'));
});

let clients = [];
function sendEventToClients(event, data) {
    clients.forEach(client => {
        client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    });
}

function buildMenu() {
    const menuDir = path.join(__dirname, 'public', 'img', 'menu');
    let files;
    try {
        files = fs.readdirSync(menuDir);
    } catch (err) {
        return [];
    }
    let idCounter = 1;
    return files.filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i)).map(file => {
        let rawName = file.replace(/\.[^/.]+$/, '').trim();
        let price = 15000;
        const parts = rawName.split('-');
        if (parts.length > 1) {
            const potentialPrice = parseInt(parts[parts.length - 1].trim());
            if (!isNaN(potentialPrice) && potentialPrice >= 1000) {
                price = potentialPrice;
                rawName = parts.slice(0, parts.length - 1).join('-').trim();
            }
        }
        if (rawName.startsWith('WhatsApp')) rawName = 'Menu ' + idCounter;

        let category = 'snack';
        const nameLower = rawName.toLowerCase();
        if (nameLower.includes('kopi') || nameLower.includes('coffee') || nameLower.includes('espresso') || nameLower.includes('americano') || nameLower.includes('latte') || nameLower.includes('cappuccino')) category = 'coffee';
        else if (nameLower.includes('tea') || nameLower.includes('matcha') || nameLower.includes('taro') || nameLower.includes('velvet') || nameLower.includes('squash') || nameLower.includes('coklat') || nameLower.includes('milk') || nameLower.includes('drink')) category = 'non-coffee';

        return { id: idCounter++, name: rawName, category, price, img: `img/menu/${file}` };
    });
}

function mapOrderForAdmin(order) {
    return {
        date: order.date,
        time: order.time,
        orderId: order.orderId,
        customerName: order.customerName,
        customerContact: order.customerContact,
        notes: order.notes,
        items: Array.isArray(order.items) ? order.items : [],
        itemDetails: order.itemDetails,
        total: order.total,
        paymentMethod: order.paymentMethod,
        status: order.status
    };
}

app.get('/api/menu', (req, res) => {
    res.json(buildMenu());
});

app.post('/api/order', orderLimiter, async (req, res) => {
    if (!req.session || !req.session.customer) {
        return res.status(401).json({ error: 'Harap masuk atau daftar ke akun Anda sebelum memesan.' });
    }

    const { items, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Order cannot be empty' });
    if (items.length > 50) return res.status(400).json({ error: 'Terlalu banyak item dalam satu pesanan.' });

    const menu = buildMenu();
    const validatedItems = [];
    let total = 0;
    for (const i of items) {
        const qty = parseInt(i.qty);
        if (isNaN(qty) || qty < 1 || qty > 99) return res.status(400).json({ error: 'Jumlah item tidak valid.' });
        const menuItem = menu.find(m => m.id === parseInt(i.id));
        if (!menuItem) return res.status(400).json({ error: `Item menu tidak ditemukan: ${xss(String(i.name || i.id))}` });
        validatedItems.push({ id: menuItem.id, name: menuItem.name, price: menuItem.price, qty });
        total += menuItem.price * qty;
    }

    const customer = req.session.customer;
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID');
    const timeStr = now.toLocaleTimeString('id-ID');
    const orderId = 'ORD-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    let itemDetails = validatedItems.map(i => `${i.qty}x ${i.name}`).join(', ');
    const safeNotes = req.body.notes ? xss(String(req.body.notes).trim().slice(0, 300)) : '';
    if (safeNotes) itemDetails += `\n[Catatan: ${safeNotes}]`;

    const ALLOWED_PAYMENTS = ['Cash', 'QRIS', 'Transfer'];
    const payMethod = ALLOWED_PAYMENTS.includes(paymentMethod) ? paymentMethod : 'Cash';

    const newOrder = {
        date: dateStr,
        time: timeStr,
        orderId,
        customerName: customer.name,
        customerContact: customer.contact,
        notes: safeNotes,
        items: validatedItems,
        itemDetails,
        total,
        paymentMethod: payMethod,
        status: 'pending'
    };

    try {
        await Order.create(newOrder);
        console.log(`[ORDER DB] Saved order ${orderId} to MongoDB.`);
    } catch (err) {
        console.error('Database insertion error:', err);
        return res.status(500).json({ error: 'Gagal memproses ke Database.' });
    }

    sendEventToClients('new-order', newOrder);
    res.status(200).json({ success: true, orderId, message: 'Pesanan berhasil dibuat!' });
});

app.post('/api/customer/register', authLimiter, async (req, res) => {
    let { name, contact, password } = req.body;
    if (!name || !contact || !password) return res.status(400).json({ success: false, message: 'Isi semua form.' });

    name = xss(String(name).trim().slice(0, 60));
    contact = xss(String(contact).trim().toLowerCase().slice(0, 60));

    if (name.length < 2) return res.status(400).json({ success: false, message: 'Nama minimal 2 karakter.' });
    if (String(password).length < 6) return res.status(400).json({ success: false, message: 'Kata sandi minimal 6 karakter.' });

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const isPhone = /^(\+62|62|0)8[0-9]{7,13}$/.test(contact);
    if (!isEmail && !isPhone) return res.status(400).json({ success: false, message: 'Masukkan email atau nomor HP yang valid.' });

    try {
        const passwordHash = await bcrypt.hash(String(password), 10);
        await Customer.create({ customerId: createCustomerId(), name, contact, password: passwordHash });
        req.session.regenerate((err) => {
            if (err) return res.status(500).json({ success: false, message: 'Kesalahan sesi.' });
            req.session.customer = { name, contact };
            res.json({ success: true });
        });
    } catch (err) {
        if (err && err.code === 11000) {
            const duplicateField = err.keyPattern ? Object.keys(err.keyPattern)[0] : '';
            const duplicateMessage = duplicateField === 'customerId'
                ? 'ID pelanggan bentrok. Silakan coba lagi.'
                : 'Email/Nomor HP sudah terdaftar!';
            return res.status(400).json({ success: false, message: duplicateMessage });
        }
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

app.post('/api/customer/login', authLimiter, async (req, res) => {
    const { contact, password } = req.body;
    if (!contact || !password) return res.status(400).json({ success: false, message: 'Isi semua form.' });
    try {
        const normalizedContact = String(contact).trim().toLowerCase();
        const customer = await Customer.findOne({ contact: normalizedContact });
        let valid = false;
        if (customer) {
            if (customer.password.startsWith('$2')) {
                valid = await bcrypt.compare(String(password), customer.password);
            } else {
                valid = customer.password === String(password);
                if (valid) {
                    customer.password = await bcrypt.hash(String(password), 10);
                    await customer.save();
                }
            }
        }
        if (valid) {
            return req.session.regenerate((err) => {
                if (err) return res.status(500).json({ success: false, message: 'Kesalahan sesi.' });
                req.session.customer = { name: customer.name, contact: customer.contact };
                res.json({ success: true });
            });
        }
        res.status(401).json({ success: false, message: 'Kontak atau sandi salah.' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem.' });
    }
});

app.get('/api/customer/me', (req, res) => {
    if (req.session && req.session.customer) res.json({ loggedIn: true, customer: req.session.customer });
    else res.json({ loggedIn: false });
});

app.post('/api/customer/logout', (req, res) => {
    req.session.customer = null;
    res.json({ success: true });
});

app.get('/api/customer/orders', readLimiter, async (req, res) => {
    if (!req.session || !req.session.customer) return res.status(401).json({ error: 'Belum login.' });
    try {
        const orders = await Order.find({ customerContact: req.session.customer.contact })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json(orders.map(order => ({
            order_id: order.orderId,
            item_details: order.itemDetails,
            total: order.total,
            payment_method: order.paymentMethod,
            date: order.date,
            time: order.time,
            status: order.status
        })));
    } catch (err) {
        res.status(500).json({ error: 'Gagal memuat riwayat.' });
    }
});

app.post('/api/login', authLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password && await bcrypt.compare(String(password), ADMIN_PASS_HASH)) {
        return req.session.regenerate((err) => {
            if (err) return res.status(500).json({ success: false, message: 'Kesalahan sesi.' });
            req.session.admin = true;
            res.json({ success: true });
        });
    }
    res.status(401).json({ success: false, message: 'Username atau sandi anda salah!' });
});
app.post('/api/logout', (req, res) => {
    if (req.session.admin) req.session.admin = null;
    res.json({ success: true });
});

app.get('/api/stream', requireAuth, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);
    console.log(`[SSE] Admin connected. Total active: ${clients.length}`);

    req.on('close', () => {
        console.log('[SSE] Admin disconnected.');
        clients = clients.filter(c => c.id !== clientId);
    });
});

app.get('/api/orders/pending', requireAuth, readLimiter, async (req, res) => {
    try {
        const rows = await Order.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
        res.json(rows.map(mapOrderForAdmin));
    } catch (err) {
        res.status(500).json({ error: 'Gagal memuat pesanan aktif.' });
    }
});

app.post('/api/orders/:orderId/done', requireAuth, adminActionLimiter, async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { orderId: req.params.orderId },
            { status: 'done' },
            { new: true }
        );
        if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal memperbarui status.' });
    }
});

app.get('/api/history', requireAuth, readLimiter, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: 1 }).lean();
        const mappedData = orders.map(o => ({
            'Tanggal': o.date,
            'Waktu': o.time,
            'ID Pesanan': o.orderId,
            'Nama Pelanggan': `${o.customerName} - ${o.customerContact}`,
            'Rincian Pesanan': o.itemDetails,
            'Total Harga': o.total,
            'Metode Pembayaran': o.paymentMethod,
            'Status': o.status || 'pending'
        }));
        res.json(mappedData);
    } catch (err) {
        console.error('DB History Error:', err);
        res.status(500).json({ error: 'Failed DB read' });
    }
});

app.get('/api/export', requireAuth, readLimiter, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: 1 }).lean();
        const wsData = [['Tanggal', 'Waktu', 'ID Pesanan', 'Nama Pelanggan', 'Rincian Pesanan', 'Total Harga', 'Metode Pembayaran', 'Catatan']];
        orders.forEach(o => {
            wsData.push([
                o.date,
                o.time,
                o.orderId,
                `${o.customerName} - ${o.customerContact}`,
                o.itemDetails,
                o.total,
                o.paymentMethod,
                o.notes || ''
            ]);
        });
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet(wsData);
        xlsx.utils.book_append_sheet(wb, ws, 'Laporan Database');

        const fileBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Database_Triicof.xlsx"');
        res.send(fileBuffer);
    } catch (err) {
        console.error('Export Error:', err);
        res.status(500).send('Terjadi kesalahan ekspor data.');
    }
});

async function startServer() {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            console.log('=========================================');
            console.log(`TRIICOF DATABASE SERVER RUNNING ON PORT ${PORT}`);
            console.log('- Database: MongoDB');
            console.log(`- Customer View: http://localhost:${PORT}/`);
            console.log(`- Cashier Admin: http://localhost:${PORT}/admin.html`);
            console.log('=========================================');
        });
    } catch (err) {
        console.error('Gagal terhubung ke MongoDB:', err.message);
        process.exit(1);
    }
}

startServer();
