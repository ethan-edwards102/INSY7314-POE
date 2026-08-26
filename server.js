import 'dotenv/config'

import mongoose from 'mongoose';
import app from './app.js';
import User from './models/User.js';

const port = process.env.PORT;

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

// Waits for the unique index on User.email to exist before the server accepts
// traffic, so the first duplicate registration is rejected by the database
// rather than slipping through while the index is still being built.
await User.init();

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});