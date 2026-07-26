import Booking from '../models/Booking.js';
import { handleError, notFound } from '../utils/handleError.js';

export const createBooking = async (req, res) => {
    try {
        const { date, quantity, client, freelancer, service } = req.body;

        const newBooking = await Booking.create({
            date,
            quantity,
            client,
            freelancer,
            service,
        });

        return res.status(201).json(newBooking);
    } catch (error) {
        return handleError(res, error);
    }
}

export const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({});
        return res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
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

        return res.status(200).json(booking);
    } catch (error) {
        return handleError(res, error);
    }
}

export const updateBooking = async (req, res) => {
    try {
        const { date, quantity, client, freelancer, service } = req.body;

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { date, quantity, client, freelancer, service },
            { new: true, runValidators: true }
        );

        if (!booking) {
            return notFound(res, 'Booking');
        }

        return res.status(200).json(booking);
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

        return res.status(200).json({
            success: true,
            message: 'Booking deleted',
        });
    } catch (error) {
        return handleError(res, error);
    }
}
