/*
Build every API response in one shape:
-> success, message and data have the same meaning on every route.
-> The status code sits together with the body that explains it.
*/

// "data" is the output of the route. "extra" carries fields that only some
// routes have, such as "count" on a list or "token" on a login.
// JSON.stringify drops an undefined "data" field from the response.
const success = (res, status, message, data, extra = {}) => {
    return res.status(status).json({
        success: true,
        message,
        data,
        ...extra,
    });
};

// Use status 201 when a new item now exists at a new id.
export const created = (res, message, data, extra) => {
    return success(res, 201, message, data, extra);
};

// Use status 200 for every other successful response.
export const ok = (res, message, data, extra) => {
    return success(res, 200, message, data, extra);
};

// A failure response never carries "data". "errors" is the per-field list
// from validation. Leave "errors" off when there is no field at fault.
export const fail = (res, status, message, errors) => {
    return res.status(status).json({
        success: false,
        message,
        ...(errors ? { errors } : {}),
    });
};
