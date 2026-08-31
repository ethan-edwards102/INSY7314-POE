import { fail } from '../utils/respond.js';

// Use this function after authenticate, so req.user is already set. This
// function returns a middleware, it is not a middleware itself. This lets a
// route name exactly which roles it allows, for example
// requireRole('Admin') or requireRole('Freelancer', 'Admin').
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return fail(res, 403, 'You do not have permission to perform this action');
        }

        return next();
    };
};
