import mongoose from 'mongoose';
import { RATE_TYPES } from './Gig.js';

export const BOOKING_STATUSES = ['Confirmed', 'Cancelled'];
export const MAX_QUANTITY = 100;

export const bookingSchema = new mongoose.Schema(
    {
        gig: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Gig',
            required: true,
        },
        // The server sets this field from the token, never from the request body.
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // The server copies this field from the gig.
        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        scheduledFor: {
            type: Date,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            max: MAX_QUANTITY,
            validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' },
            default: 1,
        },
        // Copy the rate from the gig so a later price change does not alter this booking.
        unitRate: {
            type: Number,
            required: true,
            min: 0.01,
        },
        rateType: {
            type: String,
            enum: RATE_TYPES,
            required: true,
        },
        // The server computes this field, so a client cannot choose the price.
        total: {
            type: Number,
            required: true,
            min: 0.01,
        },
        status: {
            type: String,
            enum: BOOKING_STATUSES,
            default: 'Confirmed',
        },
    },
    { timestamps: true }
);

// Serve the list query of a Client.
bookingSchema.index({ client: 1, createdAt: -1 });
// Serve the list query of a Freelancer.
bookingSchema.index({ freelancer: 1, createdAt: -1 });
// Serve the check that a gig has bookings.
bookingSchema.index({ gig: 1 });
// Refuse the same Client, gig and time twice, so a retried request cannot charge twice.
bookingSchema.index(
    { client: 1, gig: 1, scheduledFor: 1 },
    { unique: true, partialFilterExpression: { status: 'Confirmed' } }
);

export default mongoose.model('Booking', bookingSchema);

/* ref
https://mongoosejs.com/docs/guide.html#indexes
https://mongoosejs.com/docs/guide.html#timestamps
https://mongoosejs.com/docs/validation.html#custom-validators
https://www.mongodb.com/docs/manual/core/index-partial/
*/
