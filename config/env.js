import 'dotenv/config';

import fs from 'node:fs';

/* 
Validates env config at startup before anything else runs:
-> Prevents a missing value failing late and unhelpfully.
-> Converts a confusing runtime error into a simple startup
message that names the missing keys. 
*/

// Every value the api cannot run without with the reason it exists.
const REQUIRED = [
    ['PORT', 'the port the HTTPS server listens on, e.g. 5001'],
    ['MONGO_URI', 'the MongoDB connection string, e.g. mongodb://127.0.0.1:27017/hustle_hub_plus'],
    ['JWT_SECRET', 'the secret that signs and verifies authentication tokens'],
    ['JWT_EXPIRES_IN', 'how long an issued token stays valid, e.g. 1h'],
    ['SSL_KEY_PATH', 'path to the TLS private key, e.g. ./certs/localhost-key.pem'],
    ['SSL_CERT_PATH', 'path to the TLS certificate, e.g. ./certs/localhost-cert.pem'],
];

const missing = REQUIRED.filter(([key]) => !process.env[key]?.trim());

// Reports every missing key at once
if (missing.length > 0) {
    console.error(`Missing required configuration in .env (${missing.length} value(s)):\n`);
    for (const [key, description] of missing) {
        console.error(`  ${key} — ${description}`);
    }
    console.error('\nCopy .env.example to .env and fill in every value, then start again.');
    process.exit(1);
}

// Verify that JWT_SECRET is not the placeholder value from .env.example.
if (process.env.JWT_SECRET === 'GENERATE_ME') {
    console.error('JWT_SECRET is still set to the .env.example placeholder.');
    console.error('Replace it with a long random value, for example the output of:');
    console.error('  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
    process.exit(1);
}

// Verify the SSL certificate files exist

const certificate = {
    keyPath: process.env.SSL_KEY_PATH,
    certPath: process.env.SSL_CERT_PATH,
};

const absent = Object.values(certificate).filter((path) => !fs.existsSync(path));

// Reports every missing certificate file at once
if (absent.length > 0) {
    console.error('TLS certificate not found. Expected:\n');
    console.error(`  ${certificate.keyPath}`);
    console.error(`  ${certificate.certPath}`);
    console.error('\nRun `npm run certs` to generate one, and check that SSL_KEY_PATH and');
    console.error('SSL_CERT_PATH in your .env point at the result.');
    process.exit(1);
}

// Export the config object for use in the rest of the application
export const config = {
    port: process.env.PORT,
    mongoUri: process.env.MONGO_URI,
    ssl: {
        key: fs.readFileSync(certificate.keyPath),
        cert: fs.readFileSync(certificate.certPath),
    },
};
