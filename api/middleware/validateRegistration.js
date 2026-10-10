import { fail } from '../utils/respond.js';
import { checkString, REGISTRATION_RULES } from '../utils/validators.js';

// Reject a malformed registration request before it reaches the controller.
export const validateRegistration = (req, res, next) => {
    // req.body is undefined when the request has no body, or when the
    // request has no JSON content type. Because of this, do not
    // destructure req.body directly.
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

    // Pass on only these four values. The controller reads from
    // req.validated, not req.body. This way, the server discards any extra
    // field that an attacker adds to the request. It does not write the
    // extra field to the database.
    req.validated = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        ...(role ? { role: role.trim() } : {}),
    };

    return next();
};
