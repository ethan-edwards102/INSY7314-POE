import 'dotenv/config';

import mongoose from 'mongoose';

/* 
Drops the database and prints what each collection held.
*/

if (!process.env.MONGO_URI?.trim()) {
    console.error('Missing required configuration in .env (1 value):\n');
    console.error('  MONGO_URI — the MongoDB connection string, e.g. mongodb://127.0.0.1:27017/hustle_hub_plus');
    console.error('\nAdd it to your .env, then run `npm run db:reset` again.');
    process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

const { db } = mongoose.connection;
const collections = await db.listCollections().toArray();

// Counted before the drop.
const counted = await Promise.all(
    collections.map(async ({ name }) => [name, await db.collection(name).countDocuments()])
);

await db.dropDatabase();

console.log(`Dropped ${db.databaseName}.`);

if (counted.length === 0) {
    console.log('It was already empty.');
} else {
    for (const [name, count] of counted.sort(([a], [b]) => a.localeCompare(b))) {
        console.log(`  ${name}: ${count} removed`);
    }
}

await mongoose.disconnect();
