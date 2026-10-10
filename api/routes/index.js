import authRoutes from './authRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import gigRoutes from './gigRoutes.js';
import healthRoutes from './healthRoutes.js';
import incomeRoutes from './incomeRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import userRoutes from './userRoutes.js';

// Keep every API router in one table, so app.js and the documentation test read the same list.
export const apiRouters = [
    ['/health', healthRoutes],
    ['/auth', authRoutes],
    ['/bookings', bookingRoutes],
    ['/gigs', gigRoutes],
    ['/income', incomeRoutes],
    ['/transactions', transactionRoutes],
    ['/users', userRoutes],
];
