import User from '../models/User.js';
import { OBJECT_ID_PATTERN } from './validateObjectId.js';
import { fail } from '../utils/respond.js';
import { verifyToken } from '../utils/token.js';

// Read the role from the database so a demoted or deleted user loses access on the next request.
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

    // Reject an id that is not a plain string so a signed payload cannot inject a query operator.
    if (typeof payload.id !== 'string' || !OBJECT_ID_PATTERN.test(payload.id)) {
        return fail(res, 401, 'Invalid token');
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
