import { describe, expect, jest, test } from '@jest/globals';
import { handleError } from '../utils/handleError.js';

const run = (error) => {
    const res = {
        status(code) {
            this.code = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };

    handleError(res, error);

    return res;
};

describe('handleError for a unique index violation', () => {
    test('names the account for a duplicate email', () => {
        const res = run({ code: 11000, keyPattern: { email: 1 } });

        expect(res.code).toBe(409);
        expect(res.body.message).toBe('An account with that email already exists');
    });

    test('names the booking for a repeated Client, gig and time', () => {
        const res = run({ code: 11000, keyPattern: { client: 1, gig: 1, scheduledFor: 1 } });

        expect(res.code).toBe(409);
        expect(res.body.message).toBe('You already booked this gig for that time');
    });

    test('does not call any other duplicate an account', () => {
        const res = run({ code: 11000, keyPattern: { reference: 1 } });

        expect(res.body.message).toBe('That record already exists');
    });
});

describe('handleError for an unknown error', () => {
    test('sends a generic 500 and no driver detail', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = run(new Error('connect ECONNREFUSED 127.0.0.1:27017'));

        expect(res.code).toBe(500);
        expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
        spy.mockRestore();
    });
});
