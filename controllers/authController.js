import User from '../models/User.js';
import { handleError } from '../utils/handleError.js';

// req already passed validateRegistration, so req.validated holds checked values and is used in
// place of req.body.
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.validated;

        // The password is hashed by the model's pre-save hook, so the plain
        // text value ends here and is never written to the database.
        //
        // No "does this email already exist" query is run first. Two requests
        // could both pass such a check before either had written, so
        // uniqueness is left to the unique index on the collection, which the
        // database enforces atomically. The resulting duplicate key error is
        // translated into a 409 by handleError.
        const user = await User.create({ name, email, password, role });

        // The model's toJSON transform removes the password hash, so the
        // created document is safe to return as-is.
        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: user,
        });
    } catch (error) {
        return handleError(res, error);
    }
};
