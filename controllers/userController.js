import User, { USER_ROLES } from '../models/User.js';
import { handleError, notFound } from '../utils/handleError.js';
import { ok, fail } from '../utils/respond.js';
import { checkString } from '../utils/validators.js';

// Every role, including Admin, is a valid target here: unlike registration,
// which restricts self-service sign-up to SELF_SERVICE_ROLES, this is the one
// endpoint meant to be able to grant Admin. What keeps that safe is
// requireRole('Admin') on the route, not a restricted set of allowed values.
export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body ?? {};

        const error = checkString(role, {
            field: 'role',
            label: 'Role',
            allowed: USER_ROLES,
        });

        if (error) {
            return fail(res, 400, 'Validation failed', [error]);
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });

        if (!user) {
            return notFound(res, 'User');
        }

        return ok(res, 'Role updated', user);
    } catch (error) {
        return handleError(res, error);
    }
};
