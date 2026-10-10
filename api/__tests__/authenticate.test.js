import { beforeAll, describe, expect, jest, test } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/authenticate.js';

beforeAll(() => {
    process.env.JWT_SECRET = 'a-test-secret-that-is-long-enough-for-hs256';
});

const run = async (payload) => {
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
    const next = jest.fn();
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    await authenticate({ headers: { authorization: `Bearer ${token}` } }, res, next);

    return { res, next };
};

describe('authenticate', () => {
    test('refuses a signed token whose id is a query operator before any query runs', async () => {
        const { res, next } = await run({ id: { $ne: null }, role: 'Admin' });

        expect(res.code).toBe(401);
        expect(res.body.message).toBe('Invalid token');
        expect(next).not.toHaveBeenCalled();
    });

    test('refuses a signed token whose id is not an ObjectId string', async () => {
        const { res, next } = await run({ id: 'abc', role: 'Admin' });

        expect(res.code).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });
});
