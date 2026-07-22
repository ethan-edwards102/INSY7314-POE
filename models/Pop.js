import mongoose from 'mongoose'

export const popSchema = new mongoose.Schema({
    datePaid: {
        type: Date,
        required: true,
        default: Date.now
    }
});

export default mongoose.model('Pop', popSchema);