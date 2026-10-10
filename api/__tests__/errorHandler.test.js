import { describe, expect, jest, test } from '@jest/globals';
import { errorHandler } from '../middleware/errorHandler.js';

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

    errorHandler(error, {}, res, () => {});

    return res;
};

describe('errorHandler', () => {
    test('answers a client fault from the body parser with its 4xx status and a fixed message', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = run(Object.assign(new Error('unsupported charset "LATIN1" at /app/node_modules/x.js'), {
            expose: true,
            status: 415,
            type: 'charset.unsupported',
        }));

        expect(res.code).toBe(415);
        expect(res.body.message).toBe('Request body could not be read');
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });

    test('hides the detail of an unknown error behind a generic 500 and logs it', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = run(new Error('connect ECONNREFUSED 127.0.0.1:27017'));

        expect(res.code).toBe(500);
        expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });
});
