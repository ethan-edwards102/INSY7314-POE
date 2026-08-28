/* 
Builds every response the api sends in one shape:
-> success, message and data are read the same way on every route.
-> The status code sits with the body that explains it.
*/

// "data" is whatever the route produced. "extra" carries the fields only some
// routes have, such as "count" on a list or "token" on a login. An undefined
// "data" is dropped by JSON.stringify.
const success = (res, status, message, data, extra = {}) => {
    return res.status(status).json({
        success: true,
        message,
        data,
        ...extra,
    });
};

// 201, for something that now exists at a new id.
export const created = (res, message, data, extra) => {
    return success(res, 201, message, data, extra);
};

// 200, for everything else that worked.
export const ok = (res, message, data, extra) => {
    return success(res, 200, message, data, extra);
};

// Failures never carry "data". "errors" is the per-field list from validation
// and is left off when there is no field to blame.
export const fail = (res, status, message, errors) => {
    return res.status(status).json({
        success: false,
        message,
        ...(errors ? { errors } : {}),
    });
};
