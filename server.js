import 'dotenv/config'

import mongoose from 'mongoose';
import app from './app.js';

const port = process.env.PORT;

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});