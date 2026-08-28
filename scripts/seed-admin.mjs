import 'dotenv/config';

import mongoose from 'mongoose';
import User, { PASSWORD_PATTERN } from '../models/User.js';

/* 
Creates the first Admin account:
-> Registration blocks the Admin role and changing a role is itself
Admin only, so no request can produce the first Admin.
*/

const DEFAULT_NAME = 'Site Admin';
const PLACEHOLDER_PASSWORD = 'CHANGE_ME';

// Every value the seed cannot run without with the reason it exists.
const REQUIRED = [
    ['MONGO_URI', 'the MongoDB connection string, e.g. mongodb://127.0.0.1:27017/hustle_hub_plus'],
    ['ADMIN_EMAIL', 'the email address the Admin account signs in with'],
    ['ADMIN_PASSWORD', 'the password the Admin account signs in with'],
];

const missing = REQUIRED.filter(([key]) => !process.env[key]?.trim());

// Reports every missing key at once
if (missing.length > 0) {
    console.error(`Missing required configuration in .env (${missing.length} value(s)):\n`);
    for (const [key, description] of missing) {
        console.error(`  ${key} - ${description}`);
    }
    console.error('\nAdd every value to your .env, then run `npm run seed:admin` again.');
    process.exit(1);
}

const name = process.env.ADMIN_NAME?.trim() || DEFAULT_NAME;
const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

// Verify that ADMIN_PASSWORD is not the placeholder value from .env.example.
if (password === PLACEHOLDER_PASSWORD) {
    console.error('ADMIN_PASSWORD is still set to the .env.example placeholder.');
    console.error('Choose a real password before seeding an account that can change anyone\'s role.');
    process.exit(1);
}

// Verify the password before the database is touched. The schema would reject weak passwords anyway
if (!PASSWORD_PATTERN.test(password)) {
    console.error('ADMIN_PASSWORD does not meet the password rules.');
    console.error('It must be 8-72 characters and include an uppercase letter, a');
    console.error('lowercase letter, a number and a symbol.');
    process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

try {
    const existing = await User.findOne({ email });

    if (existing) {
        if (existing.role === 'Admin') {
            console.log(`${email} is already an Admin. Nothing to do.`);
        } else {
            // Promote in place, leaving the password alone. This script must not
            // double as a way to overwrite somebody's credentials.
            const previousRole = existing.role;
            existing.role = 'Admin';
            await existing.save();
            console.log(`Promoted ${email} from ${previousRole} to Admin.`);
            console.log('Their existing password was left unchanged.');
        }
    } else {
        // .save() rather than an upsert, so the pre('save') hook runs and hashes
        // the password. findOneAndUpdate skips it and stores the plain text.
        await new User({ name, email, password, role: 'Admin' }).save();
        console.log(`Created Admin ${email}.`);
        console.log('Sign in at POST /auth/login with the credentials from your .env.');
    }
} catch (error) {
    // Reports every rejected field at once
    if (error.name === 'ValidationError') {
        console.error('The Admin account was rejected by the User model:\n');
        for (const detail of Object.values(error.errors)) {
            console.error(`  ${detail.message}`);
        }
        console.error('\nCorrect the ADMIN_ values in your .env and run this again.');
    } else {
        console.error(`Could not seed the Admin account: ${error.message}`);
    }
    await mongoose.disconnect();
    process.exit(1);
}

await mongoose.disconnect();
