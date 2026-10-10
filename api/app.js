import express from 'express';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import gigRoutes from './routes/gigRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { corsPolicy, securityHeaders } from './middleware/securityHeaders.js';
import { globalLimiter } from './middleware/rateLimiters.js';
import { sanitizeRequest } from './middleware/sanitize.js';
import { ok } from './utils/respond.js';

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

// Keep this route public so a monitor can check the API without a token.
app.get('/health', (req, res) => ok(res, 'OK'));

app.use('/auth', authRoutes);
app.use('/bookings', bookingRoutes);
app.use('/gigs', gigRoutes);
app.use('/income', incomeRoutes);
app.use('/transactions', transactionRoutes);
app.use('/users', userRoutes);

// Register these after the routes. This way, they only see a request that
// no route handled. The error handler must come last. Express only
// recognizes a handler as an error handler when it comes last.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

/* ref
https://expressjs.com/en/guide/routing/
*/
