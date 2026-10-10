import { afterEach, describe, expect, jest, test } from '@jest/globals';
import Booking from '../models/Booking.js';
import Gig from '../models/Gig.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { computeTotal, createBooking } from '../services/bookingService.js';
import { BOOKING_RULES, checkDate, checkObjectId, checkRules } from '../utils/validators.js';
import { listScope, partyScope } from '../utils/ownerScope.js';

describe('computeTotal', () => {
    test('multiplies the rate by the quantity', () => {
        expect(computeTotal(333.33, 3)).toBe(999.99);
    });

    test('gives an exact total where a decimal product drifts', () => {
        expect(computeTotal(0.1, 3)).toBe(0.3);
        expect(computeTotal(1.15, 3)).toBe(3.45);
    });
});

describe('booking date rule', () => {
    const now = Date.parse('2026-10-10T08:00:00.000Z');
    const rule = BOOKING_RULES.scheduledFor;

    test('rejects a past date', () => {
        expect(checkDate('2026-10-09T08:00:00.000Z', rule, now)?.message).toBe('Scheduled date must be in the future');
    });

    test('rejects a date more than a year ahead', () => {
        expect(checkDate('2027-11-01T08:00:00.000Z', rule, now)?.field).toBe('scheduledFor');
    });

    test('accepts a date next week', () => {
        expect(checkDate('2026-10-17T08:00:00.000Z', rule, now)).toBeNull();
    });
});

describe('booking rules', () => {
    test('reject a quantity sent as an empty string', () => {
        const errors = checkRules({ gig: 'a'.repeat(24), scheduledFor: '2999-01-01', quantity: '' }, BOOKING_RULES);

        expect(errors).toContainEqual({ field: 'quantity', message: 'Quantity must be a number' });
    });

    test('reject a gig sent as an operator object', () => {
        expect(checkObjectId({ $ne: null }, BOOKING_RULES.gig)?.field).toBe('gig');
    });

    test('reject a quantity of 0, 101 or 1.5', () => {
        for (const quantity of [0, 101, 1.5]) {
            const errors = checkRules({ gig: 'a'.repeat(24), scheduledFor: '2999-01-01', quantity }, BOOKING_RULES);
            expect(errors.map((error) => error.field)).toContain('quantity');
        }
    });
});

describe('owner scope', () => {
    const user = { id: 'u1' };

    test('a Client lists as client and a Freelancer as freelancer', () => {
        expect(listScope({ ...user, role: 'Client' })).toEqual({ client: 'u1' });
        expect(listScope({ ...user, role: 'Freelancer' })).toEqual({ freelancer: 'u1' });
    });

    test('only the Admin has an empty filter', () => {
        expect(listScope({ ...user, role: 'Admin' })).toEqual({});
        expect(partyScope({ ...user, role: 'Admin' })).toEqual({});
        expect(partyScope({ ...user, role: 'Client' })).toEqual({ $or: [{ client: 'u1' }, { freelancer: 'u1' }] });
    });
});

describe('append only transaction', () => {
    test('the model refuses an update and a delete', async () => {
        await expect(Transaction.updateOne({}, { amount: 1 })).rejects.toThrow('cannot be changed');
        await expect(Transaction.deleteMany({})).rejects.toThrow('cannot be changed');
    });

    test('a save of a stored transaction is refused, because save skips the query hooks', async () => {
        const stored = Transaction.hydrate({
            booking: 'a'.repeat(24),
            client: 'b'.repeat(24),
            freelancer: 'c'.repeat(24),
            amount: 10,
        });

        stored.amount = 1;

        await expect(stored.save()).rejects.toThrow('cannot be changed');
    });
});

describe('createBooking when the transaction fails', () => {
    const gig = { _id: 'g1', freelancer: 'f1', rate: 100, rateType: 'Hour' };
    const booking = { _id: 'b1', client: 'c1', freelancer: 'f1', total: 100 };

    const setup = () => {
        jest.spyOn(Gig, 'findOne').mockResolvedValue(gig);
        jest.spyOn(User, 'exists').mockResolvedValue({ _id: 'f1' });
        jest.spyOn(Booking, 'create').mockResolvedValue(booking);
        jest.spyOn(Transaction, 'create').mockRejectedValue(new Error('transaction write failed'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
    };

    afterEach(() => jest.restoreAllMocks());

    test('deletes the booking so no booking exists without a payment', async () => {
        setup();
        jest.spyOn(Transaction, 'findOne').mockResolvedValue(null);
        const remove = jest.spyOn(Booking, 'deleteOne').mockResolvedValue({});

        await expect(createBooking('c1', { gig: 'g1', scheduledFor: '2026-12-01' })).rejects.toThrow('transaction write failed');
        expect(remove).toHaveBeenCalledWith({ _id: 'b1' });
    });

    test('keeps the booking when the transaction was stored and only the reply failed', async () => {
        setup();
        jest.spyOn(Transaction, 'findOne').mockResolvedValue({ _id: 't1' });
        const remove = jest.spyOn(Booking, 'deleteOne').mockResolvedValue({});

        const result = await createBooking('c1', { gig: 'g1', scheduledFor: '2026-12-01' });

        expect(result.transaction._id).toBe('t1');
        expect(remove).not.toHaveBeenCalled();
    });

    test('reports the original error when the cleanup also fails', async () => {
        setup();
        jest.spyOn(Transaction, 'findOne').mockResolvedValue(null);
        jest.spyOn(Booking, 'deleteOne').mockRejectedValue(new Error('connection lost'));

        await expect(createBooking('c1', { gig: 'g1', scheduledFor: '2026-12-01' })).rejects.toThrow('transaction write failed');
    });

    test('refuses a gig whose owner is no longer a Freelancer', async () => {
        setup();
        User.exists.mockResolvedValue(null);

        await expect(createBooking('c1', { gig: 'g1', scheduledFor: '2026-12-01' })).resolves.toBeNull();
        expect(Booking.create).not.toHaveBeenCalled();
    });
});
