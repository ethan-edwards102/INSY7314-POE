import { fail } from '../utils/respond.js';

// Match a leading "$", a dot, or a "[$" bracket key, which the query string parser leaves flat.
const FORBIDDEN_KEY = /^\$|\.|\[\s*\$/;

const MAX_DEPTH = 20;

// Report a value nested deeper than the limit, so the walker never overflows the stack.
export const isTooDeep = (value, depth = 0) => {
    if (value === null || typeof value !== 'object') {
        return false;
    }

    if (depth >= MAX_DEPTH) {
        return true;
    }

    return Object.values(value).some((child) => isTooDeep(child, depth + 1));
};

// Return the path of every forbidden key, so the client sees where the problem is.
export const findForbiddenKeys = (value, path = '') => {
    if (value === null || typeof value !== 'object') {
        return [];
    }

    const found = [];

    for (const [key, child] of Object.entries(value)) {
        const childPath = Array.isArray(value) ? `${path}[${key}]` : path ? `${path}.${key}` : key;

        if (FORBIDDEN_KEY.test(key)) {
            found.push(childPath);
        }

        found.push(...findForbiddenKeys(child, childPath));
    }

    return found;
};

// Reject the request instead of rewriting it, so an attacker gets no silent success.
export const sanitizeRequest = (req, res, next) => {
    if ([req.body, req.query, req.params].some((part) => isTooDeep(part))) {
        return fail(res, 400, 'Request is nested too deeply');
    }

    const errors = [
        ...findForbiddenKeys(req.body, 'body'),
        ...findForbiddenKeys(req.query, 'query'),
        ...findForbiddenKeys(req.params, 'params'),
    ].map((path) => ({ field: path, message: 'This key is not allowed' }));

    if (errors.length > 0) {
        return fail(res, 400, 'Request contains a forbidden key', errors);
    }

    return next();
};

/* ref
https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
https://expressjs.com/en/5x/api/request/#reqquery
*/
