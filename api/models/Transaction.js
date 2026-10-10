import crypto from 'node:crypto';
import mongoose from 'mongoose';

export const CURRENCY = 'ZAR';

// Make a reference that a person can read out, for example HH-3F9A1C7E.
export const makeReference = () => `HH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

export const transactionSchema = new mongoose.Schema(
    {
        // The unique index allows one transaction for each booking, so a retry cannot charge twice.
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
];

for (const operation of BLOCKED) {
    transactionSchema.pre(operation, function () {
        throw new Error('A transaction cannot be changed or deleted');
    });
}

export default mongoose.model('Transaction', transactionSchema);

/* ref
https://mongoosejs.com/docs/middleware.html#pre
https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
*/
