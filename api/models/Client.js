import mongoose from 'mongoose'

export const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }
});

export default mongoose.model('Client', clientSchema);
