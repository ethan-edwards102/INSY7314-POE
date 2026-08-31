import { fail } from '../utils/respond.js';
import { verifyToken } from '../utils/token.js';

// Set req.user from the Authorization header. A route behind this
// middleware can then trust req.user.id and req.user.role, without a
// second check of the token.
export const authenticate = (req, res, next) => {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return fail(res, 401, 'Authentication required');
    }

    try {
        const payload = verifyToken(token);
        req.user = { id: payload.id, role: payload.role };
        return next();
    } catch (error) {
        // Handle the error here. Do not pass it to the global error
        // handler. An expired or tampered token is not a database fault or
        // a server fault. It needs its own message, not a generic 500.
        const message = error.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';

        return fail(res, 401, message);
    }
};
