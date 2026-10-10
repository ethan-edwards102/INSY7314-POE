import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { apiReference } from '@scalar/express-api-reference';
import { config } from '../config/env.js';
import { docsPolicy } from '../middleware/docsPolicy.js';
import { buildOpenApiDocument } from '../openapi/openapi.js';

const router = express.Router();

// Serve the browser bundle from node_modules, so the page loads no script from a CDN.
const SCALAR_BUNDLE = path.join(
    path.dirname(fileURLToPath(import.meta.resolve('@scalar/api-reference'))),
    'browser',
    'standalone.js'
);

const SCALAR_CONFIG = {
    pageTitle: 'HustleHub+ API reference',
    content: buildOpenApiDocument(config.rateLimits),
    cdn: '/docs/scalar.js',
    // Turn off each feature that calls a Scalar server, so the page talks only to this API.
    telemetry: false,
    withDefaultFonts: false,
    agent: { disabled: true },
    mcp: { disabled: true },
    showDeveloperTools: 'never',
    // Keep a pasted token out of localStorage, so it ends when the tab closes.
    persistAuth: false,
    documentDownloadType: 'json',
};

// Send HTML and a script here, because the documentation page is not a JSON API response.
router.get('/', docsPolicy, (req, res) => {
    // Do not cache the page, because each copy carries a nonce for one response only.
    res.set('Cache-Control', 'no-store');

    return apiReference({ ...SCALAR_CONFIG, nonce: res.locals.cspNonce })(req, res);
});

router.get('/scalar.js', (req, res, next) => {
    res.sendFile(SCALAR_BUNDLE, (error) => {
        if (error) {
            next(error);
        }
    });
});

export default router;

/* ref
https://scalar.com/products/api-references/integrations/express#custom-cdn
https://nodejs.org/api/esm.html#importmetaresolvespecifier
https://expressjs.com/en/5x/api/response/#ressendfile
https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
*/
