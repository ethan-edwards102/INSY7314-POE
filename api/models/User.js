import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// Every account has one of these roles, and authenticate reads the current role from the database.
export const USER_ROLES = ['Client', 'Freelancer', 'Admin']

// This is the work factor for bcrypt. A higher number is slower to brute
// force, but also slower for a normal login. 12 is a good default value
// for an interactive login.
const SALT_ROUNDS = 12

// Use these patterns to check that saved data has the expected shape.
export const NAME_PATTERN = /^[A-Za-z][A-Za-z' -]{0,48}[A-Za-z]$/
export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/

// This pattern requires one lowercase letter, one uppercase letter, one
// number, and one symbol.
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
            // Exclude this field from every query by default. This stops a
            // stray find() call from leaking the hash. Login must ask for
            // this field with .select('+password').
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

// Mongoose runs validation before this hook. The pattern above checks the
// plain-text password while it is still readable. Only after that check
// does this hook replace the password with its hash. The database only
// ever stores the hash, never the plain-text password.
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return
    }

    this.password = await bcrypt.hash(this.password, SALT_ROUNDS)
})

// Login uses this method. bcrypt re-hashes the candidate password with the
// salt from the stored hash, then compares the two hashes. This check
// never needs the plain-text stored password.
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password)
}

// This is a second safeguard, in addition to `select: false`. Even if a
// query fetches a document with the hash attached, converting the document
// to JSON removes the password field.
userSchema.set('toJSON', {
    transform: (document, plain) => {
        delete plain.password
        delete plain.__v
        return plain
    },
})

export default mongoose.model('User', userSchema)
