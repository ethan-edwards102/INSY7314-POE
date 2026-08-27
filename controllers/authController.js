import User from '../models/User.js';
import { handleError } from '../utils/handleError.js';
import { signToken } from '../utils/token.js';

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

        const token = signToken(user);

        // The model's toJSON transform removes the password hash, so the
        // created document is safe to return as-is.
        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: user,
            token,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// req already passed validateLogin, so req.validated holds a trimmed,
// lowercase email and the untouched password.
export const login = async (req, res) => {
    try {
        const { email, password } = req.validated;

        // password is select: false on the schema, so it has to be asked for
        // explicitly here to be available for comparePassword below.
        const user = await User.findOne({ email }).select('+password');

        // Same message whether the email isn't registered or the password is
        // wrong, so the response can't be used to enumerate which emails
        // have accounts.
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        const token = signToken(user);

        // The model's toJSON transform removes the password hash, so the
        // fetched document is safe to return as-is.
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: user,
            token,
        });
    } catch (error) {
        return handleError(res, error);
    }
};
