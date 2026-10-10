import 'dotenv/config';

import https from 'node:https';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import newman from 'newman';

/* 
Runs the Postman collection against the local server.
Supplies baseUrl and the admin credentials from .env.
*/

// Resolve the path from this file so the run works from any folder.
const COLLECTION = fileURLToPath(new URL('../postman/HustleHub-Plus.postman_collection.json', import.meta.url));
const REPORTS = fileURLToPath(new URL('../postman/reports/', import.meta.url));

const REQUIRED = [
    ['PORT', 'the port the HTTPS server listens on, e.g. 5001'],
    ['ADMIN_EMAIL', 'the email address of the seeded Admin the role tests sign in as'],
    ['ADMIN_PASSWORD', 'the password of the seeded Admin'],
    ['MONGO_URI', 'the MongoDB connection string, checked before the run starts'],
];

const missing = REQUIRED.filter(([key]) => !process.env[key]?.trim());

// Reports every missing key at once
if (missing.length > 0) {
    console.error(`Missing required configuration in .env (${missing.length} value(s)):\n`);
    for (const [key, description] of missing) {
        console.error(`  ${key}: ${description}`);
    }
    console.error('\nAdd every value to your .env, then run `npm run test:api` again.');
    process.exit(1);
}

const baseUrl = `https://localhost:${process.env.PORT}`;

// True if anything answers. The self signed certificate is not verified.
const serverIsUp = () =>
    new Promise((resolve) => {
        const probe = https.get(`${baseUrl}/`, { rejectUnauthorized: false }, (response) => {
            response.resume();
            resolve(true);
        });

        probe.on('error', () => resolve(false));
        probe.setTimeout(3000, () => {
            probe.destroy();
            resolve(false);
        });
    });

if (!(await serverIsUp())) {
    console.error(`Nothing answered at ${baseUrl}.`);
    console.error('Start the api with `npm start` in another terminal, then try again.');
    process.exit(1);
}

// The suite expects a database holding only the seeded Admin.
await mongoose.connect(process.env.MONGO_URI);
const accounts = await mongoose.connection.db.collection('users').countDocuments();
await mongoose.disconnect();

if (accounts !== 1) {
    console.error(
        accounts === 0
            ? 'No accounts found, so there is no Admin for the role tests to sign in as.'
            : `The database holds ${accounts} accounts, and the suite expects only the seeded Admin.`
    );
    console.error('Run `npm run db:reset` to empty it and seed the Admin, then try again.');
    process.exit(1);
}

newman.run(
    {
        collection: COLLECTION,
        reporters: ['cli', 'htmlextra', 'json'],
        reporter: {
            htmlextra: {
                export: `${REPORTS}newman-report.html`,
                title: 'HustleHub+ API test run',
                browserTitle: 'HustleHub+ API test run',
                // Hide the Admin password and the bearer tokens, because a report can leave the machine.
                skipEnvironmentVars: ['adminPassword'],
                skipSensitiveData: true,
            },
            json: { export: `${REPORTS}newman-report.json` },
        },
        // The development certificate is self signed.
        insecure: true,
        // Environment values override the collection defaults.
        envVar: [
            { key: 'baseUrl', value: `https://localhost:${process.env.PORT}` },
            { key: 'adminEmail', value: process.env.ADMIN_EMAIL },
            { key: 'adminPassword', value: process.env.ADMIN_PASSWORD },
        ],
    },
    (error, summary) => {
        if (error) {
            console.error(`Could not run the collection: ${error.message}`);
            process.exit(1);
        }

        // The Newman callback does not set an exit code.
        if (summary.run.failures.length > 0) {
            // The limiters keep their counters in memory, so only a restart clears them.
            console.error('If a request answered 429, restart the API and reset the database before a new run.');
            process.exit(1);
        }
    }
);

/* ref
https://nodejs.org/api/url.html
https://github.com/DannyDainton/newman-reporter-htmlextra
*/
