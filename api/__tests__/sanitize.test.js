import { describe, expect, test } from '@jest/globals';
import { findForbiddenKeys, isTooDeep, sanitizeRequest } from '../middleware/sanitize.js';
import { GIG_RULES, checkRules, pickValidated, stripHtml } from '../utils/validators.js';

describe('findForbiddenKeys', () => {
    test('accepts a clean body', () => {
        expect(findForbiddenKeys({ title: 'Garden care', rate: 250, tags: ['a', { b: 1 }] }, 'body')).toEqual([]);
    });

    test('finds a dollar key at any depth and names its path', () => {
        expect(findForbiddenKeys({ email: { $gt: '' }, a: { b: { $where: 'x' } } }, 'body')).toEqual([
            'body.email.$gt',
            'body.a.b.$where',
        ]);
    });

    test('finds a dotted key', () => {
        expect(findForbiddenKeys({ 'profile.role': 'Admin' }, 'body')).toEqual(['body.profile.role']);
    });

    test('finds a key inside an array', () => {
        expect(findForbiddenKeys({ items: [{ ok: 1 }, { $ne: 1 }] }, 'body')).toEqual(['body.items[1].$ne']);
    });

    test('finds a bracket operator key that the simple query parser leaves flat', () => {
        expect(findForbiddenKeys({ 'category[$ne]': 'x' }, 'query')).toEqual(['query.category[$ne]']);
    });

    test('allows a dollar sign that is not at the start of a key', () => {
        expect(findForbiddenKeys({ price$: 1 }, 'body')).toEqual([]);
    });
});

describe('isTooDeep', () => {
    test('accepts ordinary nesting and rejects extreme nesting', () => {
        expect(isTooDeep({ items: [{ tags: ['a'] }] })).toBe(false);
        expect(isTooDeep(JSON.parse(`${'['.repeat(5000)}${']'.repeat(5000)}`))).toBe(true);
    });
});

describe('sanitizeRequest', () => {
    const run = (req) => {
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
        let called = false;
        sanitizeRequest(req, res, () => {
            called = true;
        });
        return { res, called };
    };

    test('answers 400 and stops the request on a forbidden key', () => {
        const { res, called } = run({ body: { email: { $ne: null } }, query: {}, params: {} });

        expect(called).toBe(false);
        expect(res.code).toBe(400);
        expect(res.body).toEqual({
            success: false,
            message: 'Request contains a forbidden key',
            errors: [{ field: 'body.email.$ne', message: 'This key is not allowed' }],
        });
    });

    test('checks the query as well as the body', () => {
        const { res } = run({ body: undefined, query: { 'search[$regex]': '.*' }, params: {} });

        expect(res.body.errors.map((e) => e.field)).toEqual(['query.search[$regex]']);
    });

    test('answers 400 and does not throw on a 5000 level nested array', () => {
        const deep = { a: JSON.parse(`${'['.repeat(5000)}${']'.repeat(5000)}`) };
        let outcome;

        expect(() => {
            outcome = run({ body: deep, query: {}, params: {} });
        }).not.toThrow();
        expect(outcome.called).toBe(false);
        expect(outcome.res.code).toBe(400);
        expect(outcome.res.body.message).toBe('Request is nested too deeply');
    });

    test('passes a clean request to the next handler', () => {
        const { res, called } = run({ body: { title: 'Garden care' }, query: { category: 'Gardening' }, params: {} });

        expect(called).toBe(true);
        expect(res.code).toBeUndefined();
    });
});

describe('free text stripping', () => {
    const gig = { title: 'Garden care', description: 'Lawn mowing and hedge trimming.', category: 'Gardening', rate: 100, rateType: 'Hour' };

    test('removes tags and keeps the text', () => {
        expect(stripHtml('<b>Garden</b> care')).toBe('Garden care');
    });

    test('removes a script element with its content', () => {
        expect(stripHtml('<script>alert(1)</script>')).toBe('');
    });

    test('keeps an ampersand and angle brackets readable instead of storing entities', () => {
        expect(stripHtml('Mowing & edging')).toBe('Mowing & edging');
        expect(stripHtml('Callout > 2 hours')).toBe('Callout > 2 hours');
        expect(stripHtml('Ages 5 < 10')).toBe('Ages 5 < 10');
    });

    test('strips encoded markup instead of decoding it into a live tag', () => {
        expect(stripHtml('&lt;img src=x onerror=alert(1)&gt;Lawn care')).toBe('Lawn care');
        expect(stripHtml('&#60;script&#62;alert(1)&#60;/script&#62;')).toBe('');
        expect(stripHtml('&amp;lt;b&amp;gt;Lawn')).toBe('Lawn');
    });

    test('counts an angle bracket as one character toward the title limit', () => {
        expect(checkRules({ ...gig, title: `${'>'.repeat(80)}` }, GIG_RULES)).toEqual([]);
    });

    test('rejects a title that is only a script tag, because the length rule runs after stripping', () => {
        const errors = checkRules({ ...gig, title: '<script>alert(1)</script>' }, GIG_RULES);

        expect(errors).toEqual([{ field: 'title', message: 'Title must be at least 3 characters' }]);
    });

    test('does not count markup toward the maximum length', () => {
        const title = `<b>${'a'.repeat(80)}</b>`;

        expect(checkRules({ ...gig, title }, GIG_RULES)).toEqual([]);
    });

    test('stores the stripped text for the title and the description', () => {
        const stored = pickValidated(
            { ...gig, title: '<b>Garden</b> care', description: '<img src=x onerror=alert(1)>Lawn mowing and hedge trimming.' },
            GIG_RULES
        );

        expect(stored.title).toBe('Garden care');
        expect(stored.description).toBe('Lawn mowing and hedge trimming.');
    });
});
