import 'dotenv/config';

import fs from 'node:fs';

/*
Check the environment configuration at startup, before other code runs:
-> This finds a missing value early.
-> This gives a clear startup message instead of a confusing runtime error.
The message names the missing keys.
*/

// This list has each required value and the reason for it.
const REQUIRED = [
    ['PORT', 'the port the HTTPS server listens on, e.g. 5001'],
    ['MONGO_URI', 'the MongoDB connection string, e.g. mongodb://127.0.0.1:27017/hustle_hub_plus'],
    ['JWT_SECRET', 'the secret that signs and verifies authentication tokens'],
    ['JWT_EXPIRES_IN', 'how long an issued token stays valid, e.g. 1h'],
    ['SSL_KEY_PATH', 'path to the TLS private key, e.g. ./certs/localhost-key.pem'],
    ['SSL_CERT_PATH', 'path to the TLS certificate, e.g. ./certs/localhost-cert.pem'],
];

const missing = REQUIRED.filter(([key]) => !process.env[key]?.trim());

// Show all missing keys in one message.
if (missing.length > 0) {
    console.error(`Missing required configuration in .env (${missing.length} value(s)):\n`);
    for (const [key, description] of missing) {
        console.error(`  ${key}: ${description}`);
    }
    console.error('\nCopy .env.example to .env and fill in every value, then start again.');
    process.exit(1);
}

// Check that JWT_SECRET is not the example placeholder value.
if (process.env.JWT_SECRET === 'GENERATE_ME') {
    console.error('JWT_SECRET is still set to the .env.example placeholder.');
    console.error('Replace it with a long random value, for example the output of:');
    console.error('  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
    process.exit(1);
}

// Check that the SSL certificate files exist.

const certificate = {
    keyPath: process.env.SSL_KEY_PATH,
    certPath: process.env.SSL_CERT_PATH,
};

const absent = Object.values(certificate).filter((path) => !fs.existsSync(path));

// Show all missing certificate files in one message.
if (absent.length > 0) {
    console.error('TLS certificate not found. Expected:\n');
    console.error(`  ${certificate.keyPath}`);
    console.error(`  ${certificate.certPath}`);
    console.error('\nRun `npm run certs` to generate one, and check that SSL_KEY_PATH and');
    console.error('SSL_CERT_PATH in your .env point at the result.');
    process.exit(1);
}

// Read an optional positive whole number and fall back to a default when the key is absent.
const positiveInteger = (key, fallback) => {
    const raw = process.env[key]?.trim();

    if (!raw) {
        return fallback;
    }

    const value = Number(raw);

    if (!Number.isInteger(value) || value <= 0) {
        console.error(`${key} must be a positive whole number. It is "${raw}".`);
        process.exit(1);
    }

    return value;
};

// Split a comma separated list into trimmed, non-empty origins.
const origins = (process.env.CLIENT_ORIGIN?.trim() || 'https://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

// Reject an origin with a path, a trailing slash or a scheme other than https, because it never matches.
const isOrigin = (value) => {
    try {
        const url = new URL(value);

        return url.protocol === 'https:' && url.origin === value;
    } catch {
        return false;
    }
};

const badOrigins = origins.filter((origin) => !isOrigin(origin));

if (badOrigins.length > 0) {
    console.error(`CLIENT_ORIGIN must hold https origins with no path or trailing slash. Found: ${badOrigins.join(', ')}`);
    process.exit(1);
}

// Export the config object. Other modules in the application use it.
export const config = {
    port: process.env.PORT,
    mongoUri: process.env.MONGO_URI,
    clientOrigins: origins,
    // Hide the /docs page in production, so a live server does not publish a map of its routes.
    serveApiDocs: process.env.NODE_ENV !== 'production',
    rateLimits: {
        global: {
            windowMinutes: positiveInteger('RATE_LIMIT_GLOBAL_WINDOW_MINUTES', 15),
            max: positiveInteger('RATE_LIMIT_GLOBAL_MAX', 300),
        },
        login: {
            windowMinutes: positiveInteger('RATE_LIMIT_LOGIN_WINDOW_MINUTES', 15),
            max: positiveInteger('RATE_LIMIT_LOGIN_MAX', 5),
        },
        loginIp: {
            windowMinutes: positiveInteger('RATE_LIMIT_LOGIN_IP_WINDOW_MINUTES', 15),
            max: positiveInteger('RATE_LIMIT_LOGIN_IP_MAX', 20),
        },
        register: {
            windowMinutes: positiveInteger('RATE_LIMIT_REGISTER_WINDOW_MINUTES', 60),
            max: positiveInteger('RATE_LIMIT_REGISTER_MAX', 20),
        },
        booking: {
            windowMinutes: positiveInteger('RATE_LIMIT_BOOKING_WINDOW_MINUTES', 10),
            max: positiveInteger('RATE_LIMIT_BOOKING_MAX', 10),
        },
    },
    ssl: {
        key: fs.readFileSync(certificate.keyPath),
        cert: fs.readFileSync(certificate.certPath),
    },
};

/* ref
https://developer.mozilla.org/en-US/docs/Web/API/URL/origin
https://expressjs.com/en/advanced/best-practice-performance/#set-node_env-to-production
*/
