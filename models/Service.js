import mongoose from 'mongoose'

// Exported so request validation can reject an unknown value before the
// document is built, rather than leaving it to the schema enum.
export const SERVICE_CATEGORIES = ['HouseCleaning', 'DogGrooming']
export const RATE_TYPES = ['Once', 'Hour', 'Day']

export const serviceSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: SERVICE_CATEGORIES,
        required: true,
    },
    rate: {
        type: Number,
        required: true,
        min: 0
    },
    rateType: {
        type: String,
        enum: RATE_TYPES,
        required: true,
    }
});

export default mongoose.model('Service', serviceSchema);
