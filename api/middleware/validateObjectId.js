import { fail } from '../utils/respond.js';

// Accept 24 hex characters only, because mongoose.isValidObjectId also accepts any 12 character string.
export const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

// Answer 400 before any query runs, so a bad id never reaches the driver.
export const validateObjectId = (req, res, next) => {
    if (!OBJECT_ID_PATTERN.test(req.params.id)) {
        return fail(res, 400, 'Invalid id');
    }

    return next();
};
