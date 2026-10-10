import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Gig from '../models/Gig.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { logServerError } from '../utils/handleError.js';

// Multiply in whole cents, because a decimal product can round the wrong way.
export const computeTotal = (unitRate, quantity) => (Math.round(unitRate * 100) * quantity) / 100;

// Return null when the gig is not open to this client, so the caller answers 404.
export const createBooking = async (clientId, { gig: gigId, scheduledFor, quantity }) => {
    // Mark the operator as trusted, because sanitizeFilter wraps any other operator object.
    const gig = await Gig.findOne({
        _id: gigId,
        isActive: true,
        freelancer: mongoose.trusted({ $ne: clientId }),
    });

    if (!gig) {
        return null;
    }

    // Refuse a gig whose owner lost the Freelancer role, because that owner cannot read the booking or the income.
    if (!(await User.exists({ _id: gig.freelancer, role: 'Freelancer' }))) {
        return null;
    }

    const booking = await Booking.create({
        gig: gig._id,
        client: clientId,
        freelancer: gig.freelancer,
        scheduledFor,
        quantity,
        unitRate: gig.rate,
        rateType: gig.rateType,
        total: computeTotal(gig.rate, quantity ?? 1),
    });

    try {
        const transaction = await Transaction.create({
            booking: booking._id,
            client: booking.client,
            freelancer: booking.freelancer,
            amount: booking.total,
        });

        return { booking, transaction };
    } catch (error) {
        // A standalone mongod has no multi document transaction, so undo the booking by hand.
        try {
            const stored = await Transaction.findOne({ booking: booking._id });

            // Keep the booking when the insert succeeded and only the reply failed.
            if (stored) {
                return { booking, transaction: stored };
            }

            await Booking.deleteOne({ _id: booking._id });
        } catch (cleanupError) {
            logServerError(cleanupError);
        }

        throw error;
    }
};

/* ref
https://www.mongodb.com/docs/manual/core/transactions/
https://mongoosejs.com/docs/api/mongoose.html#Mongoose.prototype.trusted()
*/
