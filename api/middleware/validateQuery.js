import { fail } from '../utils/respond.js';
import { checkRules, pickValidated } from '../utils/validators.js';

// Check the query string with a rule table, because every query value comes from the user.
export const validateQuery = (rules) => {
    return (req, res, next) => {
        const errors = checkRules(req.query, rules);

        if (errors.length > 0) {
            return fail(res, 400, 'Validation failed', errors);
        }

        req.validated = pickValidated(req.query, rules);

        return next();
    };
};

/* ref
https://expressjs.com/en/5x/api/request/#reqquery
*/
