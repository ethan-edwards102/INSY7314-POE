import { describe, expect, test } from '@jest/globals';
import { docsPolicy } from '../middleware/docsPolicy.js';

// Run the nonce step and the policy step in order, and return the policy header.
const policyFor = () => {
    const headers = {};
    const res = {
        locals: {},
        setHeader(name, value) {
            headers[name.toLowerCase()] = value;
        },
        removeHeader() {},
    };

    for (const step of docsPolicy) {
        step({}, res, () => {});
    }

    return { csp: headers['content-security-policy'], nonce: res.locals.cspNonce };
};

describe('docsPolicy', () => {
    test('allows only the scripts that carry the nonce of this response', () => {
        const { csp, nonce } = policyFor();
        const scriptSrc = csp.split(';').find((directive) => directive.startsWith('script-src'));

        expect(scriptSrc).toBe(`script-src 'nonce-${nonce}'`);
        expect(csp).not.toContain('unsafe-eval');
    });

    test('makes a new nonce for each response', () => {
        expect(policyFor().nonce).not.toBe(policyFor().nonce);
    });

    test('lets the page load and call this API only, and stops other sites from framing it', () => {
        const { csp } = policyFor();

        expect(csp).toContain("default-src 'none'");
        expect(csp).toContain("connect-src 'self'");
        expect(csp).toContain("img-src 'self' data:");
        expect(csp).not.toContain('font-src');
        expect(csp).toContain("frame-ancestors 'none'");
        expect(csp).not.toMatch(/https?:/);
    });
});
