import express from 'express';
import { config } from './config/env.js';
import { apiRouters } from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { corsPolicy, securityHeaders } from './middleware/securityHeaders.js';
import { globalLimiter } from './middleware/rateLimiters.js';
import { sanitizeRequest } from './middleware/sanitize.js';

const app = express();

// Hide the framework name from an attacker, even if a later change removes Helmet.
app.disable('x-powered-by');

// Keep this order: headers, CORS, limiter, parser, sanitiser, routes, then error handlers.
app.use(securityHeaders);

app.use(corsPolicy);

// Count each request before any parsing so a flood stops before database work.
app.use(globalLimiter);

// End a preflight here, after the limiter counts it, because no route handles OPTIONS.
app.options('/{*path}', (req, res) => res.sendStatus(204));

// Limit the payload size. This stops an attacker from using a large
// payload to exhaust server memory.
app.use(express.json({ limit: '10kb' }));

// Run this before the routes so no controller sees a key that starts with a dollar sign.
app.use(sanitizeRequest);

// Load the documentation page outside production only, because the Scalar packages are development tools.
if (config.serveApiDocs) {
    try {
        const { default: docsRoutes } = await import('./routes/docsRoutes.js');

        app.use('/docs', docsRoutes);
    } catch (error) {
        // Start without the page when an install leaves out the development packages.
        if (error.code !== 'ERR_MODULE_NOT_FOUND') {
            throw error;
        }

        console.warn('The /docs page is off, because the Scalar packages are not installed.');
    }
}

for (const [mountPath, router] of apiRouters) {
    app.use(mountPath, router);
}

// Register these after the routes. This way, they only see a request that
// no route handled. The error handler must come last. Express only
// recognizes a handler as an error handler when it comes last.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

/* ref
https://expressjs.com/en/guide/routing/
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import
*/
