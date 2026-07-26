import express from 'express';
import bookingRoutes from './routes/bookingRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import freelancerRoutes from './routes/freelancerRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import popRoutes from './routes/popRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';

const app = express();

app.use(express.json());

app.use('/bookings', bookingRoutes);
app.use('/clients', clientRoutes);
app.use('/freelancers', freelancerRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/pops', popRoutes);
app.use('/services', serviceRoutes);

export default app;
