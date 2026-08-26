import { logServerError } from '../utils/handleError.js';

// Reached when no route matched the request.
export const notFoundHandler = (req, res) => {
    return res.status(404).json({
        success: false,
        message: 'Route not found',
    });
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
        return res.status(400).json({
            success: false,
            message: 'Request body is not valid JSON',
        });
    }

    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            message: 'Request body is too large',
        });
    }

    logServerError(error);

    return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
    });
};
