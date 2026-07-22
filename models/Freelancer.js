import mongoose from 'mongoose'
import { serviceSchema } from './Service.js'

export const freelancerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    services: [serviceSchema]
});

export default mongoose.model('Freelancer', freelancerSchema);