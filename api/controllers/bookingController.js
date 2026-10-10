import Booking from '../models/Booking.js';
import { createBooking as bookGig } from '../services/bookingService.js';
import { handleError, notFound } from '../utils/handleError.js';
import { listScope, partyScope } from '../utils/ownerScope.js';
import { ok, created } from '../utils/respond.js';

// Populate names and the gig title only, so no other User field leaves the API.
const withParties = (query) =>
    query.populate('gig', 'title').populate('client', 'name').populate('freelancer', 'name');

export const createBooking = async (req, res) => {
    try {
        const result = await bookGig(req.user.id, req.validated);

        if (!result) {
            return notFound(res, 'Gig');
        }

        return created(res, 'Booking confirmed', result);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getBookings = async (req, res) => {
    try {
        const bookings = await withParties(Booking.find(listScope(req.user)).sort({ createdAt: -1 }));

        return ok(res, 'Bookings retrieved', bookings, { count: bookings.length });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getBookingById = async (req, res) => {
    try {
        const booking = await withParties(Booking.findOne({ _id: req.params.id, ...partyScope(req.user) }));

        if (!booking) {
            return notFound(res, 'Booking');
        }

        return ok(res, 'Booking retrieved', booking);
    } catch (error) {
        return handleError(res, error);
    }
};
