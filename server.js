// Validates configuration and loads the certificate before anything else
import { config } from './config/env.js';

import https from 'node:https';
import mongoose from 'mongoose';
import app from './app.js';
import User from './models/User.js';

await mongoose.connect(config.mongoUri);
console.log('Connected to MongoDB');

// Waits for the unique index on User.email to exist before the server accepts
// traffic, so the first duplicate registration is rejected by the database
// rather than slipping through while the index is still being built.
await User.init();

https.createServer(config.ssl, app).listen(config.port, () => {
    console.log(`Server started on https://localhost:${config.port}`);
});
