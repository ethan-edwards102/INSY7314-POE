// Check the configuration and load the certificate before other code runs.
import { config } from './config/env.js';

import https from 'node:https';
import mongoose from 'mongoose';
import app from './app.js';
import User from './models/User.js';
import Gig from './models/Gig.js';
import Booking from './models/Booking.js';
import Transaction from './models/Transaction.js';

await mongoose.connect(config.mongoUri);
console.log('Connected to MongoDB');

// Build every index before the server accepts traffic, so the database rejects the first duplicate.
await Promise.all([User.init(), Gig.init(), Booking.init(), Transaction.init()]);

https.createServer(config.ssl, app).listen(config.port, () => {
    console.log(`Server started on https://localhost:${config.port}`);
});
