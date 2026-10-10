import { fail } from './respond.js';

// Log the full error on the server. Do not send it to the client. A stack
// trace or file path could tell an attacker how the system is built.
export const logServerError = (error) => {
    console.error(`[${new Date().toISOString()}]`, error);
};

// Turn a database error into a response. If this function does not
// recognize the error, it treats the error as a server fault and sends a
// generic 500 response. An unrecognized error is likely to contain internal
// detail, so this function does not send its message to the client.
export const handleError = (res, error) => {
    // The schema rules reject the document. Report the fields that failed.
    // Use the same response shape as the request validation middleware.
    if (error.name === 'ValidationError') {
        return fail(
            res,
            400,
            'Validation failed',
            Object.values(error.errors).map((fieldError) => ({
                field: fieldError.path,
                message: fieldError.message,
            }))
        );
    }

    // The schema cannot convert a value to the type it expects. This usually
    // means the URL has a malformed ObjectId.
    if (error.name === 'CastError') {
        return fail(res, 400, `Invalid value supplied for '${error.path}'`);
    }

    // The write violates a unique index. Mongo raises this error at write
    // time. Because of this, it arrives as a driver error, not as a
    // Mongoose ValidationError.
    if (error.code === 11000) {
        const fields = Object.keys(error.keyPattern ?? {});

        if (fields.includes('email')) {
            return fail(res, 409, 'An account with that email already exists');
        }

        if (fields.includes('scheduledFor')) {
            return fail(res, 409, 'You already booked this gig for that time');
        }

        return fail(res, 409, 'That record already exists');
    }

    logServerError(error);

    return fail(res, 500, 'An unexpected error occurred');
};

export const notFound = (res, resource) => {
    return fail(res, 404, `${resource} not found`);
};
