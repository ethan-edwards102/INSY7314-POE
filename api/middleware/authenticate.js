import User from '../models/User.js';
import { fail } from '../utils/respond.js';
import { verifyToken } from '../utils/token.js';

// Set req.user from the Authorization header. The role comes from the
// database, so a demoted or deleted user loses access at once.
export const authenticate = async (req, res, next) => {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return fail(res, 401, 'Authentication required');
    }

    let payload;

    try {
        payload = verifyToken(token);
    } catch (error) {
        // Handle the error here. Do not pass it to the global error
        // handler. An expired or tampered token is not a database fault or
        // a server fault. It needs its own message, not a generic 500.
        const message = error.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';

        return fail(res, 401, message);
    }

    try {
        const user = await User.findById(payload.id).select('role').lean();

        if (!user) {
            return fail(res, 401, 'Invalid token');
        }

        req.user = { id: payload.id, role: user.role };

        return next();
    } catch (error) {
        return next(error);
    }
};

/* ref
https://mongoosejs.com/docs/api/query.html#Query.prototype.lean()
*/
