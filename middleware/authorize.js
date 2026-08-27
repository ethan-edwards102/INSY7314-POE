// Used after authenticate, so req.user is already populated. Returns a
// middleware rather than being one itself, so a route can name exactly which
// roles are allowed: requireRole('Admin'), requireRole('Freelancer', 'Admin').
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action',
            });
        }

        return next();
    };
};
