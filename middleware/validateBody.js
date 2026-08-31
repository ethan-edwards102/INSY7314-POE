import { fail } from '../utils/respond.js';
import { checkRules, pickValidated } from '../utils/validators.js';

/*
Reject a malformed request body before it reaches a controller:
-> Report every bad field in one response.
-> Rebuild req.validated from the rule table. This way, an undeclared
field never reaches the database.
*/

// Return a middleware. This lets a route name its rule table, for example
// validateBody(SERVICE_RULES).
export const validateBody = (rules) => {
    return (req, res, next) => {
        // req.body is undefined when the request has no body, or when the
        // request has no JSON content type.
        const errors = checkRules(req.body, rules);

        if (errors.length > 0) {
            return fail(res, 400, 'Validation failed', errors);
        }

        req.validated = pickValidated(req.body, rules);

        return next();
    };
};
