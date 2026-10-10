import { logServerError } from '../utils/handleError.js';
import { fail } from '../utils/respond.js';

// This handler runs when no route matches the request.
export const notFoundHandler = (req, res) => {
    return fail(res, 404, 'Route not found');
};

// This is the last middleware in the stack. Express sends every error
// raised before a response was sent to this handler. This includes a
// failure thrown by the JSON body parser, before our own code runs.
// Without this handler, Express uses its default handler instead, which
// returns the stack trace as an HTML page.
//
// Express identifies an error handler by its four parameters. Because of
// this, `next` must stay in the signature, even though this code uses
// `next` only for the headers-sent case.
export const errorHandler = (error, req, res, next) => {
    // The response has already started. The only correct action is to
    // hand the error back to Express and let Express abort the connection.
    if (res.headersSent) {
        return next(error);
    }

    if (error.type === 'entity.parse.failed') {
        return fail(res, 400, 'Request body is not valid JSON');
    }

    if (error.type === 'entity.too.large') {
        return fail(res, 413, 'Request body is too large');
    }

    // Answer a client fault from the body parser, such as a bad charset, without a server error log.
    if (error.expose === true && error.status >= 400 && error.status < 500) {
        return fail(res, error.status, 'Request body could not be read');
    }

    logServerError(error);

    return fail(res, 500, 'An unexpected error occurred');
};
