import crypto from 'node:crypto';
import helmet from 'helmet';

// Make a new nonce for each page, so an injected script cannot guess the value.
const addNonce = (req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');

    return next();
};

const nonce = (req, res) => `'nonce-${res.locals.cspNonce}'`;

// Replace the JSON policy on the documentation page only, and allow only the scripts that carry the nonce.
const policy = helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
        defaultSrc: ["'none'"],
        scriptSrc: [nonce],
        // Allow inline styles, because Scalar adds some style tags and style attributes with no nonce.
        // The source rules still stop CSS from sending data to another host.
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
    },
});

export const docsPolicy = [addNonce, policy];

/* ref
https://helmet.js.org/
https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce
https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html#nonce-based
https://nodejs.org/api/crypto.html#cryptorandombytessize-callback
*/
