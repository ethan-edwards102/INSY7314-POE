import { checkString, LOGIN_RULES } from '../utils/validators.js';

// Rejects a malformed login request before it reaches the controller
export const validateLogin = (req, res, next) => {
    const { email, password } = req.body ?? {};

    const errors = [checkString(email, LOGIN_RULES.email), checkString(password, LOGIN_RULES.password)].filter(
        Boolean
    );

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
        });
    }

    req.validated = {
        email: email.trim().toLowerCase(),
        password,
    };

    return next();
};
