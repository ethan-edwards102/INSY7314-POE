import express from 'express';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import freelancerRoutes from './routes/freelancerRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import popRoutes from './routes/popRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
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
app.use('/clients', clientRoutes);
app.use('/freelancers', freelancerRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/pops', popRoutes);
app.use('/services', serviceRoutes);
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
