import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Gig from '../models/Gig.js';
import Transaction from '../models/Transaction.js';

// Round to whole cents, because money has no smaller unit.
export const computeTotal = (unitRate, quantity) => Math.round(unitRate * quantity * 100) / 100;

// Return null when the gig is not open to this client, so the caller answers 404.
export const createBooking = async (clientId, { gig: gigId, scheduledFor, quantity }) => {
    // Refuse an inactive gig and the own gig of the caller.
    // Mark the operator as trusted, because sanitizeFilter wraps any other operator object.
    const gig = await Gig.findOne({
        _id: gigId,
        isActive: true,
        freelancer: mongoose.trusted({ $ne: clientId }),
    });

    if (!gig) {
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
        await Booking.deleteOne({ _id: booking._id });
        throw error;
    }
};

/* ref
https://www.mongodb.com/docs/manual/core/transactions/
https://mongoosejs.com/docs/api/mongoose.html#Mongoose.prototype.trusted()
*/
