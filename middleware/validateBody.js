import { fail } from '../utils/respond.js';
import { checkRules, pickValidated } from '../utils/validators.js';

/* 
Rejects a malformed request body before it reaches a controller:
-> Reports every bad field at once so a caller fixes one request
instead of discovering the problems one at a time.
-> Rebuilds req.validated from the rule table so a field nobody
declared never reaches the database.
*/

// Returns a middleware rather than being one itself so a route can name the
// rule table it wants: validateBody(SERVICE_RULES).
export const validateBody = (rules) => {
    return (req, res, next) => {
        // req.body is undefined when no body was sent or when the request did
        // not carry a JSON content type, so it cannot be read directly.
        const errors = checkRules(req.body, rules);

        if (errors.length > 0) {
            return fail(res, 400, 'Validation failed', errors);
        }

        req.validated = pickValidated(req.body, rules);

        return next();
    };
};
