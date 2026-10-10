import express from 'express';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import gigRoutes from './routes/gigRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { ok } from './utils/respond.js';

const app = express();

// Limit the payload size. This stops an attacker from using a large
// payload to exhaust server memory.
app.use(express.json({ limit: '10kb' }));

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
