import { fail } from './respond.js';

// Errors are logged in full on the server, where the detail is useful, and
// never returned to the client, where a stack trace or file path would tell an
// attacker how the system is built.
export const logServerError = (error) => {
    console.error(`[${new Date().toISOString()}]`, error);
};

// Translates an error raised while talking to the database into a response.
// Anything not recognised here is treated as a fault on our side and answered
// with a generic 500, because an unrecognised error is exactly the kind whose
// message is most likely to contain internal detail.
export const handleError = (res, error) => {
    // Schema rules rejected the document. Report which fields failed, in the
    // same shape the request validation middleware uses.
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

    // A value could not be coerced to the type the schema expects, typically a
    // malformed ObjectId in the URL.
    if (error.name === 'CastError') {
        return fail(res, 400, `Invalid value supplied for '${error.path}'`);
    }

    // A unique index was violated. Mongo raises this at write time, so it
    // arrives as a driver error rather than a Mongoose ValidationError.
    if (error.code === 11000) {
        const [field = 'value'] = Object.keys(error.keyPattern ?? {});

        return fail(res, 409, `An account with that ${field} already exists`);
    }

    logServerError(error);

    return fail(res, 500, 'An unexpected error occurred');
};

export const notFound = (res, resource) => {
    return fail(res, 404, `${resource} not found`);
};
