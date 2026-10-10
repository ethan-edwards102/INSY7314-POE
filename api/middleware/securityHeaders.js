import cors from 'cors';
import helmet from 'helmet';
import { config } from '../config/env.js';
import { isAllowedOrigin } from '../utils/isAllowedOrigin.js';

// This API sends JSON only, so drop the Helmet defaults that allow scripts and styles.
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'none'"],
            formAction: ["'none'"],
        },
    },
    // Match frame-ancestors for older browsers that ignore the CSP.
    xFrameOptions: { action: 'deny' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    strictTransportSecurity: true,
});

// Send no Allow-Origin header to a disallowed origin, so the browser blocks the response.
// Skip credentials because the token travels in the Authorization header, not a cookie.
export const corsPolicy = cors({
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin, config.clientOrigins)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 600,
});

/* ref
https://helmet.js.org/
https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
https://expressjs.com/en/resources/middleware/cors.html
https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
*/
