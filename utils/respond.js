/* 
Builds every response the api sends in one shape:
-> A client reads success, message and data the same way on every
route, instead of an envelope on some and a bare document on others.
-> Puts the status code next to the body that explains it, so a
route cannot answer 201 with a body that says something else.
*/

// Success responses share this shape. 
// - "data" is whatever the route produced.
// - "extra" carries the few fields only some routes have, such as the "count" on
// a list or the "token" on a login. An undefined "data" is dropped by
// - JSON.stringify so a delete answers with just success and message.
const success = (res, status, message, data, extra = {}) => {
    return res.status(status).json({
        success: true,
        message,
        data,
        ...extra,
    });
};

// Something was created and now exists at a new id.
export const created = (res, message, data, extra) => {
    return success(res, 201, message, data, extra);
};

// Everything else that worked.
export const ok = (res, message, data, extra) => {
    return success(res, 200, message, data, extra);
};

// Failure responses never carry "data", so a client that checks "success"
// first can never read a incomplete body. "errors" is the per-field list from
// validation and is left off entirely when the failure has no field to blame.
export const fail = (res, status, message, errors) => {
    return res.status(status).json({
        success: false,
        message,
        ...(errors ? { errors } : {}),
    });
};
