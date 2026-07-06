const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'triicof.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database', err.message);
    } else {
        console.log('Connected to the SQLite database (triicof.db).');
    }
});

// Initialize Tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL UNIQUE,
        customer_name TEXT,
        customer_contact TEXT,
        items TEXT NOT NULL,
        item_details TEXT,
        total INTEGER NOT NULL,
        payment_method TEXT,
        notes TEXT,
        date TEXT,
        time TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )`);

    // Migration for old databases: add missing columns silently
    db.run(`ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending'`, () => {});
    db.run(`ALTER TABLE orders ADD COLUMN created_at TEXT`, () => {});
    db.run(`ALTER TABLE customers ADD COLUMN created_at TEXT`, () => {});
});

// Helper functions using Promises
const runAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const getAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const allAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

module.exports = {
    db,
    runAsync,
    getAsync,
    allAsync
};
