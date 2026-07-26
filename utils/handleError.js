// Mongoose reports bad input as ValidationError (schema rules) or CastError
// (malformed ObjectId / wrong type), both of which are client mistakes.
export const handleError = (res, error) => {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
        return res.status(400).json({
            message: error.message,
        });
    }

    return res.status(500).json({
        message: error.message,
    });
}

export const notFound = (res, resource) => {
    return res.status(404).json({
        message: `${resource} not found`,
    });
}
