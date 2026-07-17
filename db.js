const mongoose = require('mongoose');
const crypto = require('crypto');

const mongoUri = process.env.MONGODB_URI;

const customerSchema = new mongoose.Schema({
    customerId: {
        type: String,
        unique: true,
        default: () => `CUST-${crypto.randomUUID()}`
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60
    },
    contact: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 60
    },
    password: {
        type: String,
        required: true
    }
}, {
    collection: 'customers',
    timestamps: true
});

const orderItemSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    customerName: {
        type: String,
        trim: true,
        default: ''
    },
    customerContact: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    items: {
        type: [orderItemSchema],
        default: []
    },
    itemDetails: {
        type: String,
        default: ''
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        default: 'Cash'
    },
    notes: {
        type: String,
        default: ''
    },
    date: {
        type: String,
        default: ''
    },
    time: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'done'],
        default: 'pending'
    }
}, {
    collection: 'orders',
    timestamps: true
});

customerSchema.index({ contact: 1 }, { unique: true });
orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ customerContact: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

async function connectToDatabase() {
    if (!mongoUri) {
        throw new Error('MONGODB_URI belum diatur. Tambahkan MONGODB_URI pada file .env.');
    }

    if (mongoose.connection.readyState === 1) return mongoose.connection;

    await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000
    });

    return mongoose.connection;
}

module.exports = {
    mongoose,
    connectToDatabase,
    Customer,
    Order
};
