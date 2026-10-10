// Match the origin exactly, and let a request with no Origin header pass because it is not a browser call.
export const isAllowedOrigin = (origin, allowedOrigins) =>
    origin === undefined || allowedOrigins.includes(origin);

/* ref
https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
*/
