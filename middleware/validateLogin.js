import { fail } from '../utils/respond.js';
import { checkString, LOGIN_RULES } from '../utils/validators.js';

// Reject a malformed login request before it reaches the controller.
export const validateLogin = (req, res, next) => {
    const { email, password } = req.body ?? {};

    const errors = [checkString(email, LOGIN_RULES.email), checkString(password, LOGIN_RULES.password)].filter(
        Boolean
    );

    if (errors.length > 0) {
        return fail(res, 400, 'Validation failed', errors);
    }

    req.validated = {
        email: email.trim().toLowerCase(),
        password,
    };

    return next();
};
