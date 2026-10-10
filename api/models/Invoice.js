import mongoose from 'mongoose'
import { popSchema } from './Pop.js'

export const invoiceSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    dateIssued: {
        type: Date,
        required: true,
        default: Date.now
    },
    pop: popSchema
});

export default mongoose.model('Invoice', invoiceSchema);