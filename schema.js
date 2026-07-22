const mongoose = require('mongoose')

const SERVICE_CATEGORIES = ['HouseCleaning', 'DogGrooming']
const RATE_TYPES = ['Once','Hour','Day']

const serviceSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: SERVICE_CATEGORIES,
        required: true,
    },
    rate: {
        type: Number,
        required: true,
        min: 0
    },
    rateType: {
        type: String,
        enum: RATE_TYPES,
        required: true,
    }
});

const freelancerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    services: [serviceSchema]
});

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }
});

const popSchema = new mongoose.Schema({
    datePaid: {
        type: Date,
        required: true,
        default: Date.now
    }
});

const invoiceSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    dateIssued: {
        type: Date,
        required: true,
        default: Date.now
    },
    pop: popSchema
});

const bookingSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        client: {
            type: clientSchema,
            required: true,
        },
        freelancer: {
            type: clientSchema,
            required: true,
        },
        service: {
            type: clientSchema,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);