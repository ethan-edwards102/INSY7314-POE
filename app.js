import express from 'express';
import serviceRoutes from './routes/serviceRoutes.js';

const app = express();

app.use(express.json());

app.use('/services', serviceRoutes);

export default app;