import User from '../models/User.js';
import { handleError, notFound } from '../utils/handleError.js';
import { ok, fail } from '../utils/respond.js';

// Every role, including Admin, is a valid target here. Registration
// restricts self-service sign-up to SELF_SERVICE_ROLES, but this endpoint
// is the one endpoint that can grant the Admin role. requireRole('Admin')
// on the route makes this safe, not a restricted set of allowed values.
export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.validated;

        // Block a self change so the last Admin cannot lock themselves out.
        if (req.params.id === req.user.id) {
            return fail(res, 400, 'You cannot change your own role');
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { returnDocument: 'after', runValidators: true });

        if (!user) {
            return notFound(res, 'User');
        }

        return ok(res, 'Role updated', user);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('name email role createdAt').sort({ createdAt: 1 });

        return ok(res, 'Users retrieved', users, { count: users.length });
    } catch (error) {
        return handleError(res, error);
    }
};
