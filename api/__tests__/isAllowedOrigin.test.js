import { describe, expect, test } from '@jest/globals';
import { isAllowedOrigin } from '../utils/isAllowedOrigin.js';

const allowed = ['https://localhost:5173'];

describe('isAllowedOrigin', () => {
    test('accepts the exact client origin', () => {
        expect(isAllowedOrigin('https://localhost:5173', allowed)).toBe(true);
    });

    test('rejects an unlisted origin', () => {
        expect(isAllowedOrigin('https://evil.example', allowed)).toBe(false);
    });

    test('rejects a look-alike origin that only starts with the client origin', () => {
        expect(isAllowedOrigin('https://localhost:5173.evil.example', allowed)).toBe(false);
        expect(isAllowedOrigin('http://localhost:5173', allowed)).toBe(false);
    });

    test('does not treat a star as a wildcard', () => {
        expect(isAllowedOrigin('https://evil.example', ['*'])).toBe(false);
    });

    test('lets a request with no Origin header pass', () => {
        expect(isAllowedOrigin(undefined, allowed)).toBe(true);
    });
});
