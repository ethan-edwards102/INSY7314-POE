import crypto from 'node:crypto';
import mongoose from 'mongoose';

export const CURRENCY = 'ZAR';

// Make a reference that a person can read out, for example HH-3F9A1C7E5B2D4A60.
export const makeReference = () => `HH-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

export const transactionSchema = new mongoose.Schema(
    {
        // The unique index allows one transaction for each booking.
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
            unique: true,
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },
        currency: {
            type: String,
            enum: [CURRENCY],
            default: CURRENCY,
        },
        // The payment is simulated, so every transaction is complete when it exists.
        status: {
            type: String,
            enum: ['Completed'],
            default: 'Completed',
        },
        reference: {
            type: String,
            unique: true,
            default: makeReference,
        },
    },
    { timestamps: true }
);

// Serve the income summary and the transaction list of a Freelancer.
transactionSchema.index({ freelancer: 1, createdAt: -1 });
// Serve the transaction list of a Client.
transactionSchema.index({ client: 1, createdAt: -1 });

// Block every update and delete query, because a financial record is append only.
const BLOCKED = [
    'updateOne',
    'updateMany',
    'findOneAndUpdate',
    'findOneAndReplace',
    'replaceOne',
    'deleteOne',
    'deleteMany',
    'findOneAndDelete',
    'bulkWrite',
];

// Block a save of a stored document, because save writes straight to the collection without a query hook.
transactionSchema.pre('save', function () {
    if (!this.isNew) {
        throw new Error('A transaction cannot be changed or deleted');
    }
});

for (const operation of BLOCKED) {
    transactionSchema.pre(operation, function () {
        throw new Error('A transaction cannot be changed or deleted');
    });
}

export default mongoose.model('Transaction', transactionSchema);

/* ref
https://mongoosejs.com/docs/middleware.html#pre
https://mongoosejs.com/docs/guide.html#indexes
https://nodejs.org/api/crypto.html#cryptorandombytessize-callback
*/
