import { fail } from '../utils/respond.js';
import { verifyToken } from '../utils/token.js';

// Populates req.user from the Authorization header, so any route behind this
// middleware can trust req.user.id / req.user.role without re-verifying the
// token itself.
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
        // Handled here rather than passed to the global error handler: an
        // expired or tampered token isn't a database or server fault, and
        // deserves its own message rather than a generic 500.
        const message = error.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';

        return fail(res, 401, message);
    }
};
