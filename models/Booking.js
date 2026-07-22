import mongoose from 'mongoose'
import { clientSchema } from './Client.js'
import { freelancerSchema } from './Freelancer.js'
import { serviceSchema } from './Service.js'

export const bookingSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        client: {
            type: clientSchema,
            required: true,
        },
        freelancer: {
            type: freelancerSchema,
            required: true,
        },
        service: {
            type: serviceSchema,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Booking', bookingSchema);
