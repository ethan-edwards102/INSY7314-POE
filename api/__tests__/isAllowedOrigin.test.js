import { describe, expect, test } from '@jest/globals';
import { isAllowedOrigin } from '../utils/isAllowedOrigin.js';

const allowed = ['https://localhost:5173'];

describe('isAllowedOrigin', () => {
    test('accepts the exact client origin', () => {
        expect(isAllowedOrigin('https://localhost:5173', allowed)).toBe(true);
    });

    test('rejects an unlisted origin, a look-alike origin and a star wildcard', () => {
        expect(isAllowedOrigin('https://evil.example', allowed)).toBe(false);
        expect(isAllowedOrigin('https://localhost:5173.evil.example', allowed)).toBe(false);
        expect(isAllowedOrigin('http://localhost:5173', allowed)).toBe(false);
        expect(isAllowedOrigin('https://evil.example', ['*'])).toBe(false);
    });

    test('lets a request with no Origin header pass', () => {
        expect(isAllowedOrigin(undefined, allowed)).toBe(true);
    });
});
