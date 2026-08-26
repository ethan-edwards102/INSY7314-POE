import { NAME_PATTERN, EMAIL_PATTERN, PASSWORD_PATTERN, USER_ROLES } from '../models/User.js';

// removing admin role so that users cannot self-promote
export const SELF_SERVICE_ROLES = USER_ROLES.filter((role) => role !== 'Admin');

// Treats undefined, null and whitespace-only strings as "not supplied".
const isMissing = (value) =>
    value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

// Validates one field and returns either an error object or null. Returning
// rather than throwing lets the caller gather every problem in a request
// instead of reporting only the first one.
//
// The typeof check is the guard against NoSQL operator injection: a JSON body
// such as { "email": { "$ne": null } } arrives as an object, and handing that
// to a Mongoose query would let an attacker match a document without knowing
// the real value. Anything that is not a plain string is refused outright.
export const checkString = (value, { field, label, pattern, message, allowed, trim = true, required = true }) => {
    if (isMissing(value)) {
        return required ? { field, message: `${label} is required` } : null;
    }

    if (typeof value !== 'string') {
        return { field, message: `${label} must be text` };
    }

    const candidate = trim ? value.trim() : value;

    if (allowed && !allowed.includes(candidate)) {
        return { field, message: `${label} must be one of: ${allowed.join(', ')}` };
    }

    if (pattern && !pattern.test(candidate)) {
        return { field, message };
    }

    return null;
};

// The field rules for registration, kept here so the same definitions can be
// reused by login and by any later endpoint that accepts these values.
export const REGISTRATION_RULES = {
    name: {
        field: 'name',
        label: 'Name',
        pattern: NAME_PATTERN,
        message: 'Name must be 2-50 letters and may contain spaces, hyphens and apostrophes',
    },
    email: {
        field: 'email',
        label: 'Email',
        pattern: EMAIL_PATTERN,
        message: 'Email must be a valid address, for example name@example.com',
    },
    password: {
        field: 'password',
        label: 'Password',
        pattern: PASSWORD_PATTERN,
        message:
            'Password must be 8-72 characters and include an uppercase letter, a lowercase letter, a number and a symbol',
        // Passwords are never trimmed: a leading or trailing space is a
        // legitimate character and silently removing it would change the
        // password the user believes they chose.
        trim: false,
    },
    role: {
        field: 'role',
        label: 'Role',
        allowed: SELF_SERVICE_ROLES,
        required: false,
    },
};
