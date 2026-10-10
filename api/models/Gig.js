import mongoose from 'mongoose';

// Request validation also uses these lists.
export const GIG_CATEGORIES = [
    'HouseCleaning',
    'DogGrooming',
    'Gardening',
    'Tutoring',
    'Plumbing',
    'Electrical',
    'Moving',
    'Photography',
];
export const RATE_TYPES = ['Once', 'Hour', 'Day'];

export const gigSchema = new mongoose.Schema(
    {
        // The server sets this field from the token, never from the request body.
        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            minlength: [3, 'Title must be at least 3 characters'],
            maxlength: [80, 'Title must be 80 characters or fewer'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            minlength: [10, 'Description must be at least 10 characters'],
            maxlength: [1000, 'Description must be 1000 characters or fewer'],
        },
        category: {
            type: String,
            enum: GIG_CATEGORIES,
            required: true,
        },
        rate: {
            type: Number,
            required: true,
            min: [0.01, 'Rate must be more than 0'],
            max: [100000, 'Rate must be 100000 or less'],
        },
        rateType: {
            type: String,
            enum: RATE_TYPES,
            required: true,
        },
        // An inactive gig stays out of the browse list.
        isActive: {
            type: Boolean,
            default: true,
        },
        // Only the Admin sets this flag, so the owner cannot switch a moderated gig back on.
        removedByAdmin: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Serve the browse query: active gigs in one category, newest first.
gigSchema.index({ isActive: 1, category: 1, createdAt: -1 });
// Serve the owner query: all gigs of one freelancer.
gigSchema.index({ freelancer: 1, createdAt: -1 });

export default mongoose.model('Gig', gigSchema);

/* ref
https://mongoosejs.com/docs/guide.html#indexes
https://mongoosejs.com/docs/guide.html#timestamps
*/
