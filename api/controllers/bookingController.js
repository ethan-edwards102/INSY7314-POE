import Booking from '../models/Booking.js';
import { handleError, notFound } from '../utils/handleError.js';
import { ok, created } from '../utils/respond.js';

export const createBooking = async (req, res) => {
    try {
        const { date, quantity, client, freelancer, service } = req.validated;

        const newBooking = await Booking.create({
            date,
            quantity,
            client,
            freelancer,
            service,
        });

        return created(res, 'Booking created', newBooking);
    } catch (error) {
        return handleError(res, error);
    }
}

export const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({});
        return ok(res, 'Bookings retrieved', bookings, { count: bookings.length });
    } catch (error) {
        return handleError(res, error);
    }
}

export const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return notFound(res, 'Booking');
        }

        return ok(res, 'Booking retrieved', booking);
    } catch (error) {
        return handleError(res, error);
    }
}

export const updateBooking = async (req, res) => {
    try {
        const { date, quantity, client, freelancer, service } = req.validated;

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { date, quantity, client, freelancer, service },
            { returnDocument: 'after', runValidators: true }
        );

        if (!booking) {
            return notFound(res, 'Booking');
        }

        return ok(res, 'Booking updated', booking);
    } catch (error) {
        return handleError(res, error);
    }
}

export const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return notFound(res, 'Booking');
        }

        return ok(res, 'Booking deleted');
    } catch (error) {
        return handleError(res, error);
    }
}
