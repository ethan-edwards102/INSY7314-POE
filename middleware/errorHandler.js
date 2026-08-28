import { logServerError } from '../utils/handleError.js';
import { fail } from '../utils/respond.js';

// Reached when no route matched the request.
export const notFoundHandler = (req, res) => {
    return fail(res, 404, 'Route not found');
};

// The last middleware in the stack. Express routes any error raised before a
// response was sent here, including failures thrown by the JSON body parser
// before our own code runs. Without it Express falls back to its default
// handler, which returns the stack trace as an HTML page.
//
// Express identifies an error handler by its four parameters, so `next` must
// stay in the signature even though it is only used for the headers-sent case.
export const errorHandler = (error, req, res, next) => {
    // The response has already started, so the only correct action is to hand
    // back to Express and let it abort the connection.
    if (res.headersSent) {
        return next(error);
    }

    if (error.type === 'entity.parse.failed') {
        return fail(res, 400, 'Request body is not valid JSON');
    }

    if (error.type === 'entity.too.large') {
        return fail(res, 413, 'Request body is too large');
    }

    logServerError(error);

    return fail(res, 500, 'An unexpected error occurred');
};
