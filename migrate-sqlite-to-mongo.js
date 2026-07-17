require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const { connectToDatabase, mongoose, Customer, Order } = require('./db');

const sqlitePath = process.env.SQLITE_PATH || path.join(__dirname, 'triicof.db');

function openSqliteDatabase(filePath) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, (err) => {
            if (err) reject(err);
            else resolve(db);
        });
    });
}

function allAsync(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function closeSqliteDatabase(db) {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function parseLegacyDate(value) {
    if (!value) return undefined;
    const parsed = new Date(String(value).trim().replace(/\s+/g, 'T'));
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

async function migrateCustomers(rows) {
    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
        const contact = String(row.contact || '').trim().toLowerCase();
        if (!contact) {
            skipped += 1;
            continue;
        }

        const existing = await Customer.findOne({ contact }).select('_id').lean();
        if (existing) {
            skipped += 1;
            continue;
        }

        const customer = new Customer({
            customerId: row.id || `CUST-${crypto.randomUUID()}`,
            name: String(row.name || '').trim(),
            contact,
            password: String(row.password || ''),
            createdAt: parseLegacyDate(row.created_at),
            updatedAt: parseLegacyDate(row.created_at)
        });

        await customer.save();
        inserted += 1;
    }

    return { inserted, skipped };
}

async function migrateOrders(rows) {
    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
        const orderId = String(row.order_id || '').trim();
        if (!orderId) {
            skipped += 1;
            continue;
        }

        const existing = await Order.findOne({ orderId }).select('_id').lean();
        if (existing) {
            skipped += 1;
            continue;
        }

        let items = [];
        try {
            items = JSON.parse(row.items || '[]');
            if (!Array.isArray(items)) items = [];
        } catch {
            items = [];
        }

        const order = new Order({
            orderId,
            customerName: String(row.customer_name || '').trim(),
            customerContact: String(row.customer_contact || '').trim().toLowerCase(),
            items,
            itemDetails: String(row.item_details || '').trim(),
            total: Number(row.total || 0),
            paymentMethod: String(row.payment_method || 'Cash').trim() || 'Cash',
            notes: String(row.notes || '').trim(),
            date: String(row.date || '').trim(),
            time: String(row.time || '').trim(),
            status: String(row.status || 'pending').trim() || 'pending',
            createdAt: parseLegacyDate(row.created_at),
            updatedAt: parseLegacyDate(row.created_at)
        });

        await order.save();
        inserted += 1;
    }

    return { inserted, skipped };
}

async function main() {
    if (!fs.existsSync(sqlitePath)) {
        throw new Error(`File SQLite tidak ditemukan: ${sqlitePath}`);
    }

    await connectToDatabase();
    const sqliteDb = await openSqliteDatabase(sqlitePath);

    try {
        const customerRows = await allAsync(sqliteDb, 'SELECT * FROM customers');
        const orderRows = await allAsync(sqliteDb, 'SELECT * FROM orders');

        const customerResult = await migrateCustomers(customerRows);
        const orderResult = await migrateOrders(orderRows);

        console.log(`Migrasi customers selesai. Ditambahkan: ${customerResult.inserted}, dilewati: ${customerResult.skipped}`);
        console.log(`Migrasi orders selesai. Ditambahkan: ${orderResult.inserted}, dilewati: ${orderResult.skipped}`);
    } finally {
        await closeSqliteDatabase(sqliteDb);
        await mongoose.disconnect();
    }
}

main().catch(async (err) => {
    console.error('Migrasi gagal:', err.message);
    try {
        await mongoose.disconnect();
    } catch {}
    process.exit(1);
});
