import 'dotenv/config'

import fs from 'node:fs';
import https from 'node:https';
import mongoose from 'mongoose';
import app from './app.js';
import User from './models/User.js';

const port = process.env.PORT;
const keyPath = process.env.SSL_KEY_PATH;
const certPath = process.env.SSL_CERT_PATH;

// The API is served over HTTPS only. Registration and login carry credentials
// in the request body, and over plain HTTP those would cross the network as
// readable text: hashing protects a password once it is stored, but does
// nothing while it is in transit.
if (!keyPath || !certPath || !fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.error('SSL certificate not found. Run `npm run certs` to generate one, and check');
    console.error('that SSL_KEY_PATH and SSL_CERT_PATH in your .env point at the result.');
    process.exit(1);
}

const credentials = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
};

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

// Waits for the unique index on User.email to exist before the server accepts
// traffic, so the first duplicate registration is rejected by the database
// rather than slipping through while the index is still being built.
await User.init();

https.createServer(credentials, app).listen(port, () => {
    console.log(`Server started on https://localhost:${port}`);
});
