import { NAME_PATTERN, EMAIL_PATTERN, PASSWORD_PATTERN, USER_ROLES } from '../models/User.js';
import { SERVICE_CATEGORIES, RATE_TYPES } from '../models/Service.js';
import { GIG_CATEGORIES } from '../models/Gig.js';

// Users, clients and freelancers share this message.
const NAME_MESSAGE = 'Name must be 2-50 letters and may contain spaces, hyphens and apostrophes';

// Remove the Admin role. This stops a user from giving themselves the Admin role.
export const SELF_SERVICE_ROLES = USER_ROLES.filter((role) => role !== 'Admin');

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
    { field, label, pattern, message, allowed, minLength, maxLength, trim = true, required = true }
) => {
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

// A date arrives as a string. This function parses the string. If the
// function cannot read the date, it returns a 400 error that names the
// field, not a CastError.
export const checkDate = (value, { field, label, required = true }) => {
    if (isMissing(value)) {
        return required ? { field, message: `${label} is required` } : null;
    }

    if (typeof value !== 'string') {
        return { field, message: `${label} must be a date` };
    }

    if (Number.isNaN(new Date(value).getTime())) {
        return { field, message: `${label} must be a valid date, for example 2026-09-01T09:00:00.000Z` };
    }

    return null;
};

// Accept only a real boolean. The string "false" is truthy in many checks, so
// the function rejects it instead of guessing.
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
    boolean: checkBoolean,
};

// Run a rule table. Return every problem found. For a nested object or
// array, the error path shows the location, for example
// 'service.category' or 'services[0].rate'.
export const checkRules = (source, rules) => {
    const errors = [];
    const body = source ?? {};

    for (const rule of Object.values(rules)) {
        const value = body[rule.field];

        if (rule.type === 'object' || rule.type === 'array') {
            errors.push(...checkNested(value, rule));
            continue;
        }

        const error = CHECKERS[rule.type ?? 'string'](value, rule);

        if (error) {
            errors.push(error);
        }
    }

    return errors;
};

const prefix = (errors, path) => errors.map((error) => ({ ...error, field: `${path}${error.field}` }));

const checkNested = (value, rule) => {
    const { field, label, rules, of, required = true } = rule;

    if (value === undefined || value === null) {
        return required ? [{ field, message: `${label} is required` }] : [];
    }

    if (rule.type === 'array') {
        if (!Array.isArray(value)) {
            return [{ field, message: `${label} must be a list` }];
        }

        return value.flatMap((entry, index) =>
            typeof entry === 'object' && entry !== null && !Array.isArray(entry)
                ? prefix(checkRules(entry, of), `${field}[${index}].`)
                : [{ field: `${field}[${index}]`, message: `${label} must contain objects` }]
        );
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
        return [{ field, message: `${label} must be an object` }];
    }

    return prefix(checkRules(value, rules), `${field}.`);
};

// Rebuild the body from the rule table only, at every level of nesting.
// This function drops any field that is not in the rule table. It does not
// pass an undeclared field to Mongoose.
export const pickValidated = (source, rules) => {
    const validated = {};
    const body = source ?? {};

    for (const rule of Object.values(rules)) {
        const value = body[rule.field];

        // The checkers above treat null as "not supplied". For the same
        // reason, this function drops a null value here. It does not pass
        // the null to Mongoose, which would report it in its own wording,
        // or, for a list, try to map over the null value.
        if (value === undefined || value === null) {
            continue;
        }

        if (rule.type === 'object') {
            validated[rule.field] = pickValidated(value, rule.rules);
        } else if (rule.type === 'array') {
            validated[rule.field] = value.map((entry) => pickValidated(entry, rule.of));
        } else if (typeof value === 'string' && rule.trim !== false) {
            validated[rule.field] = value.trim();
        } else {
            validated[rule.field] = value;
        }
    }

    return validated;
};

// These are the rule tables for the six marketplace resources. Each table
// matches the requirements of its schema.

// Every role is allowed here, including Admin. requireRole('Admin') on the
// route makes this safe, not a restricted set of values.
export const ROLE_RULES = {
    role: { field: 'role', label: 'Role', allowed: USER_ROLES },
};

export const CLIENT_RULES = {
    name: { field: 'name', label: 'Name', pattern: NAME_PATTERN, message: NAME_MESSAGE },
};

export const SERVICE_RULES = {
    category: { field: 'category', label: 'Category', allowed: SERVICE_CATEGORIES },
    rate: { field: 'rate', label: 'Rate', type: 'number', min: 0 },
    rateType: { field: 'rateType', label: 'Rate type', allowed: RATE_TYPES },
};

export const FREELANCER_RULES = {
    name: { field: 'name', label: 'Name', pattern: NAME_PATTERN, message: NAME_MESSAGE },
    // This field is optional. If the request supplies a list, this function
    // checks each entry as a service.
    services: { field: 'services', label: 'Services', type: 'array', of: SERVICE_RULES, required: false },
};

export const POP_RULES = {
    datePaid: { field: 'datePaid', label: 'Date paid', type: 'date', required: false },
};

export const INVOICE_RULES = {
    amount: { field: 'amount', label: 'Amount', type: 'number', min: 0 },
    dateIssued: { field: 'dateIssued', label: 'Date issued', type: 'date', required: false },
    pop: { field: 'pop', label: 'Proof of payment', type: 'object', rules: POP_RULES, required: false },
};

export const BOOKING_RULES = {
    date: { field: 'date', label: 'Date', type: 'date' },
    // The schema sets this field to 1 by default, so it is optional.
    quantity: { field: 'quantity', label: 'Quantity', type: 'number', min: 1, integer: true, required: false },
    client: { field: 'client', label: 'Client', type: 'object', rules: CLIENT_RULES },
    freelancer: { field: 'freelancer', label: 'Freelancer', type: 'object', rules: FREELANCER_RULES },
    service: { field: 'service', label: 'Service', type: 'object', rules: SERVICE_RULES },
};

// The server sets the owner, so the table has no freelancer field. A later
// stage adds a freeText flag to title and description to strip HTML.
export const GIG_RULES = {
    title: { field: 'title', label: 'Title', minLength: 3, maxLength: 80 },
    description: { field: 'description', label: 'Description', minLength: 10, maxLength: 1000 },
    category: { field: 'category', label: 'Category', allowed: GIG_CATEGORIES },
    // The smallest rate is 0.01, because a gig must cost more than nothing.
    rate: { field: 'rate', label: 'Rate', type: 'number', min: 0.01, max: 100000 },
    rateType: { field: 'rateType', label: 'Rate type', allowed: RATE_TYPES },
    isActive: { field: 'isActive', label: 'Active flag', type: 'boolean', required: false },
};

// Browse filters arrive in the query string. The search text stays short
// because the server turns it into a pattern.
export const GIG_QUERY_RULES = {
    category: { field: 'category', label: 'Category', allowed: GIG_CATEGORIES, required: false },
    search: { field: 'search', label: 'Search', maxLength: 50, required: false },
};
