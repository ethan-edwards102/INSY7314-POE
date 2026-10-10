import { describe, expect, jest, test } from '@jest/globals';
import { OBJECT_ID_PATTERN, validateObjectId } from '../middleware/validateObjectId.js';

describe('OBJECT_ID_PATTERN', () => {
    test('accepts a 24 character hex id', () => {
        expect(OBJECT_ID_PATTERN.test('64b7f0c2a1d3e4f5a6b7c8d9')).toBe(true);
    });

    test('rejects a 12 character string that mongoose.isValidObjectId accepts', () => {
        expect(OBJECT_ID_PATTERN.test('abcdefghijkl')).toBe(false);
    });

    test('rejects an id with trailing characters', () => {
        expect(OBJECT_ID_PATTERN.test('64b7f0c2a1d3e4f5a6b7c8d9\n')).toBe(false);
    });
});

describe('validateObjectId', () => {
    const run = (id) => {
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();
        validateObjectId({ params: { id } }, res, next);
        return { res, next };
    };

    test('answers 400 in the standard envelope and stops the request', () => {
        const { res, next } = run('not-an-id');

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid id' });
        expect(next).not.toHaveBeenCalled();
    });

    test('passes a valid id to the next handler', () => {
        const { next } = run('64b7f0c2a1d3e4f5a6b7c8d9');

        expect(next).toHaveBeenCalledTimes(1);
    });
});
