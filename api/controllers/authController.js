import User from '../models/User.js';
import { handleError } from '../utils/handleError.js';
import { ok, created, fail } from '../utils/respond.js';
import { signToken } from '../utils/token.js';

// req has already passed validateRegistration. req.validated holds checked
// values. Use req.validated in place of req.body.
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.validated;

        // The model's pre-save hook hashes the password. The plain text
        // value stops here. The database never stores the plain text value.
        //
        // This code does not run a query first to check if the email
        // already exists. Two requests could both pass such a check before
        // either request wrote its document. Instead, the unique index on
        // the collection enforces uniqueness. The database enforces this
        // index atomically. handleError turns the resulting duplicate key
        // error into a 409 response.
        const user = await User.create({ name, email, password, role });

        const token = signToken(user);

        // The model's toJSON transform removes the password hash. The
        // created document is safe to return as-is.
        return created(res, 'Registration successful', user, { token });
    } catch (error) {
        return handleError(res, error);
    }
};

// req has already passed validateLogin. req.validated holds a trimmed,
// lowercase email and the untouched password.
export const login = async (req, res) => {
    try {
        const { email, password } = req.validated;

        // The schema sets password to select: false. This code must ask
        // for the password explicitly, so it is available for
        // comparePassword below.
        const user = await User.findOne({ email }).select('+password');

        // Use the same message whether the email is not registered or the
        // password is wrong. This stops an attacker from using the
        // response to find out which emails have accounts.
        if (!user || !(await user.comparePassword(password))) {
            return fail(res, 401, 'Invalid email or password');
        }

        const token = signToken(user);

        // The model's toJSON transform removes the password hash. The
        // fetched document is safe to return as-is.
        return ok(res, 'Login successful', user, { token });
    } catch (error) {
        return handleError(res, error);
    }
};

// Read the user again, because the token only holds the id.
export const me = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return fail(res, 401, 'Invalid token');
        }

        return ok(res, 'User retrieved', user);
    } catch (error) {
        return handleError(res, error);
    }
};
