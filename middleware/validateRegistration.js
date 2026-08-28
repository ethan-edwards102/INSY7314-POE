import { fail } from '../utils/respond.js';
import { checkString, REGISTRATION_RULES } from '../utils/validators.js';

// Rejects a malformed registration request before it reaches the controller
export const validateRegistration = (req, res, next) => {
    // req.body is undefined when no body was sent, or when the request did not
    // carry a JSON content type, so it therefore cant be destructured directly
    const { name, email, password, role } = req.body ?? {};

    const errors = [
        checkString(name, REGISTRATION_RULES.name),
        checkString(email, REGISTRATION_RULES.email),
        checkString(password, REGISTRATION_RULES.password),
        checkString(role, REGISTRATION_RULES.role),
    ].filter(Boolean);

    if (errors.length > 0) {
        return fail(res, 400, 'Validation failed', errors);
    }

    // Only these four values are passed on. Reading from req.validated rather
    // than req.body means any extra field an attacker adds to the request is
    // discarded instead of being written to the database.
    req.validated = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        ...(role ? { role: role.trim() } : {}),
    };

    return next();
};
