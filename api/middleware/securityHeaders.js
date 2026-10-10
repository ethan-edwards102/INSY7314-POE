import helmet from 'helmet';

// This API sends JSON only, so the policy blocks every resource type and every embedding.
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'none'"],
            formAction: ["'none'"],
        },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    strictTransportSecurity: true,
});

/* ref
https://helmet.js.org/
https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
*/
