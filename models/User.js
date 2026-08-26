import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// Every account is one of these. The role travels in the JWT payload so that
// route-level access control can be enforced without a second database lookup.
export const USER_ROLES = ['Client', 'Freelancer', 'Admin']

// Work factor for bcrypt. Higher is slower to brute force but slower to log in
// with; 12 is the current sensible default for an interactive login.
const SALT_ROUNDS = 12

// patterns to ensure the data that we save matches the shape we expect
export const NAME_PATTERN = /^[A-Za-z][A-Za-z' -]{0,48}[A-Za-z]$/
export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/

// we require one lower, one upper, one number and one symbol
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/

export const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            match: [NAME_PATTERN, 'Name may only contain letters, spaces, hyphens and apostrophes'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
            unique: true,
            match: [EMAIL_PATTERN, 'Email format is invalid'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            match: [
                PASSWORD_PATTERN,
                'Password must be 8-72 characters and include an uppercase letter, a lowercase letter, a number and a symbol',
            ],
            // Excluded from every query by default so a stray find() can never
            // leak the hash. Login must ask for it explicitly with
            // .select('+password').
            select: false,
        },
        role: {
            type: String,
            enum: {
                values: USER_ROLES,
                message: 'Role must be one of: ' + USER_ROLES.join(', '),
            },
            default: 'Client',
        },
    },
    {
        timestamps: true,
    }
)

// Mongoose runs validation before this hook, so the pattern above is checked
// against the plain-text password while it is still readable. Only then is it
// replaced by its hash, which is the only form ever written to the database.
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return
    }

    this.password = await bcrypt.hash(this.password, SALT_ROUNDS)
})

// Used by login. bcrypt re-hashes the candidate with the salt embedded in the
// stored hash and compares the results, so the plain-text password is never
// needed for the check.
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password)
}

// Belt and braces alongside `select: false`: even if a document is fetched with
// the hash attached, serialising it to JSON drops the field.
userSchema.set('toJSON', {
    transform: (document, plain) => {
        delete plain.password
        delete plain.__v
        return plain
    },
})

export default mongoose.model('User', userSchema)
