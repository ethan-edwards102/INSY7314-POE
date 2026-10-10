import sanitizeHtml from 'sanitize-html';
import { NAME_PATTERN, EMAIL_PATTERN, PASSWORD_PATTERN, USER_ROLES } from '../models/User.js';
import { GIG_CATEGORIES, RATE_TYPES as GIG_RATE_TYPES } from '../models/Gig.js';
import { MAX_QUANTITY } from '../models/Booking.js';
import { OBJECT_ID_PATTERN } from '../middleware/validateObjectId.js';

const NAME_MESSAGE = 'Name must be 2-50 letters and may contain spaces, hyphens and apostrophes';

// Remove the Admin role. This stops a user from giving themselves the Admin role.
export const SELF_SERVICE_ROLES = USER_ROLES.filter((role) => role !== 'Admin');

// Remove every tag and attribute. Restore the ampersand so "Mowing & edging" stays readable.
export const stripHtml = (value) =>
    sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).replaceAll('&amp;', '&');

// Treat undefined, null, and a string of only spaces as "not supplied".
const isMissing = (value) =>
    value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

// Check one field. Return an error object, or return null if the field is
// valid. This function returns the error instead of throwing it. This lets
// the caller collect every problem in a request, not only the first one.
//
// The typeof check guards against NoSQL operator injection. A JSON body such
// as { "email": { "$ne": null } } arrives as an object. If this object went
// into a Mongoose query, an attacker could match a document without knowing
// the real value. This function rejects any value that is not a plain string.
export const checkString = (
    value,
    { field, label, pattern, message, allowed, minLength, maxLength, trim = true, required = true, freeText = false }
) => {
    if (isMissing(value)) {
        return required ? { field, message: `${label} is required` } : null;
    }

    if (typeof value !== 'string') {
        return { field, message: `${label} must be text` };
    }

    // Strip the markup first, so the length rules apply to the text that the server stores.
    const text = freeText ? stripHtml(value) : value;
    const candidate = trim ? text.trim() : text;

    if (allowed && !allowed.includes(candidate)) {
        return { field, message: `${label} must be one of: ${allowed.join(', ')}` };
    }

    if (minLength !== undefined && candidate.length < minLength) {
        return { field, message: `${label} must be at least ${minLength} characters` };
    }

    if (maxLength !== undefined && candidate.length > maxLength) {
        return { field, message: `${label} must be ${maxLength} characters or fewer` };
    }

    if (pattern && !pattern.test(candidate)) {
        return { field, message };
    }

    return null;
};

// These are the field rules for registration. Login and other endpoints
// that accept these values also use these same rules.
export const REGISTRATION_RULES = {
    name: {
        field: 'name',
        label: 'Name',
        pattern: NAME_PATTERN,
        message: NAME_MESSAGE,
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
        // Do not trim a password. A space at the start or end is a valid
        // character. If this function removed the space, the password would
        // not match the password the user chose.
        trim: false,
    },
    role: {
        field: 'role',
        label: 'Role',
        allowed: SELF_SERVICE_ROLES,
        required: false,
    },
};

export const LOGIN_RULES = {
    email: REGISTRATION_RULES.email,
    password: {
        field: 'password',
        label: 'Password',
        required: true,
        trim: false,
    },
};

// The typeof check rejects both "250" and { "$gt": 0 }. Neither value can
// reach a query or a document.
export const checkNumber = (value, { field, label, min, max, integer = false, required = true }) => {
    if (value === undefined || value === null || value === '') {
        return required ? { field, message: `${label} is required` } : null;
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return { field, message: `${label} must be a number` };
    }

    if (integer && !Number.isInteger(value)) {
        return { field, message: `${label} must be a whole number` };
    }

    if (min !== undefined && value < min) {
        return { field, message: `${label} must be ${min} or more` };
    }

    if (max !== undefined && value > max) {
        return { field, message: `${label} must be ${max} or less` };
    }

    return null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Return an error that names the field, so a bad date never reaches Mongoose as a CastError.
export const checkDate = (value, { field, label, required = true, future = false, maxDaysAhead }, now = Date.now()) => {
    if (isMissing(value)) {
        return required ? { field, message: `${label} is required` } : null;
    }

    if (typeof value !== 'string') {
        return { field, message: `${label} must be a date` };
    }

    const time = new Date(value).getTime();

    if (Number.isNaN(time)) {
        return { field, message: `${label} must be a valid date, for example 2026-09-01T09:00:00.000Z` };
    }

    if (future && time <= now) {
        return { field, message: `${label} must be in the future` };
    }

    if (maxDaysAhead !== undefined && time > now + maxDaysAhead * DAY_MS) {
        return { field, message: `${label} must be within ${maxDaysAhead} days` };
    }

    return null;
};

// Accept only a 24 character hex string, so an operator object cannot reach a query.
export const checkObjectId = (value, { field, label, required = true }) => {
    if (isMissing(value)) {
        return required ? { field, message: `${label} is required` } : null;
    }

    if (typeof value !== 'string' || !OBJECT_ID_PATTERN.test(value)) {
        return { field, message: `${label} must be a valid id` };
    }

    return null;
};

// Accept only a real boolean, because the string "false" is truthy.
export const checkBoolean = (value, { field, label, required = true }) => {
    if (value === undefined || value === null) {
        return required ? { field, message: `${label} is required` } : null;
    }

    if (typeof value !== 'boolean') {
        return { field, message: `${label} must be true or false` };
    }

    return null;
};

// Pick the checker that a rule names. If a rule has no type, treat the
// field as a string.
const CHECKERS = {
    string: checkString,
    number: checkNumber,
    date: checkDate,
    objectId: checkObjectId,
    boolean: checkBoolean,
};

// Run a rule table. Return every problem found.
export const checkRules = (source, rules) => {
    const errors = [];
    const body = source ?? {};

    for (const rule of Object.values(rules)) {
        const error = CHECKERS[rule.type ?? 'string'](body[rule.field], rule);

        if (error) {
            errors.push(error);
        }
    }

    return errors;
};

// Rebuild the body from the rule table only, so an undeclared field never reaches Mongoose.
export const pickValidated = (source, rules) => {
    const validated = {};
    const body = source ?? {};

    for (const rule of Object.values(rules)) {
        const value = body[rule.field];

        // Drop a null value, because the checkers treat null as a field that is not supplied.
        if (value === undefined || value === null) {
            continue;
        }

        if (typeof value === 'string' && rule.freeText) {
            validated[rule.field] = stripHtml(value).trim();
        } else if (typeof value === 'string' && rule.trim !== false) {
            validated[rule.field] = value.trim();
        } else {
            validated[rule.field] = value;
        }
    }

    return validated;
};

// These are the rule tables for the marketplace resources. Each table
// matches the requirements of its schema.

// Every role is allowed here, including Admin. requireRole('Admin') on the
// route makes this safe, not a restricted set of values.
export const ROLE_RULES = {
    role: { field: 'role', label: 'Role', allowed: USER_ROLES },
};

// The table has no client, freelancer or total field, because the server sets them.
export const BOOKING_RULES = {
    gig: { field: 'gig', label: 'Gig', type: 'objectId' },
    scheduledFor: { field: 'scheduledFor', label: 'Scheduled date', type: 'date', future: true, maxDaysAhead: 365 },
    quantity: { field: 'quantity', label: 'Quantity', type: 'number', min: 1, max: MAX_QUANTITY, integer: true, required: false },
};

// The table has no freelancer field, because the server sets the owner from the token.
export const GIG_RULES = {
    title: { field: 'title', label: 'Title', minLength: 3, maxLength: 80, freeText: true },
    description: { field: 'description', label: 'Description', minLength: 10, maxLength: 1000, freeText: true },
    category: { field: 'category', label: 'Category', allowed: GIG_CATEGORIES },
    // The smallest rate is 0.01, because a gig must cost more than nothing.
    rate: { field: 'rate', label: 'Rate', type: 'number', min: 0.01, max: 100000 },
    rateType: { field: 'rateType', label: 'Rate type', allowed: GIG_RATE_TYPES },
    isActive: { field: 'isActive', label: 'Active flag', type: 'boolean', required: false },
};

export const GIG_QUERY_RULES = {
    category: { field: 'category', label: 'Category', allowed: GIG_CATEGORIES, required: false },
    // Keep the search short, because the server turns the search text into a pattern.
    search: { field: 'search', label: 'Search', maxLength: 50, required: false },
};

/* ref
https://github.com/apostrophecms/apostrophe/tree/main/packages/sanitize-html
https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
*/
