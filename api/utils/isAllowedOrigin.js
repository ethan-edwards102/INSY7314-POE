// Match the origin exactly, so a look-alike host or a "*" entry never passes.
// A request with no Origin header is not a cross origin browser call, so it passes.
export const isAllowedOrigin = (origin, allowedOrigins) =>
    origin === undefined || allowedOrigins.includes(origin);

/* ref
https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
*/
