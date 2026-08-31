// Check the configuration and load the certificate before other code runs.
import { config } from './config/env.js';

import https from 'node:https';
import mongoose from 'mongoose';
import app from './app.js';
import User from './models/User.js';

await mongoose.connect(config.mongoUri);
console.log('Connected to MongoDB');

// Wait for the unique index on User.email to build before the server accepts
// traffic. This way, the database rejects the first duplicate registration.
// Without this wait, that registration could pass while the index still builds.
await User.init();

https.createServer(config.ssl, app).listen(config.port, () => {
    console.log(`Server started on https://localhost:${config.port}`);
});
