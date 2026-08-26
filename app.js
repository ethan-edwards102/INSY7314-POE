import express from 'express';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import freelancerRoutes from './routes/freelancerRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import popRoutes from './routes/popRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// keeps an oversized payload from being used to exhaust server memory.
app.use(express.json({ limit: '10kb' }));

app.use('/auth', authRoutes);
app.use('/bookings', bookingRoutes);
app.use('/clients', clientRoutes);
app.use('/freelancers', freelancerRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/pops', popRoutes);
app.use('/services', serviceRoutes);

// Registered after the routes so they only see requests nothing else handled.
// The error handler must be last for Express to recognise it as one.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
