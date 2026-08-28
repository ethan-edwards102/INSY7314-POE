import { NAME_PATTERN, EMAIL_PATTERN, PASSWORD_PATTERN, USER_ROLES } from '../models/User.js';
import { SERVICE_CATEGORIES, RATE_TYPES } from '../models/Service.js';

// Clients, freelancers and users are all people here, so all three names are
// held to the same rule and get the same wording when they break it.
const NAME_MESSAGE = 'Name must be 2-50 letters and may contain spaces, hyphens and apostrophes';

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

export const LOGIN_RULES = {
    email: REGISTRATION_RULES.email,
    password: {
        field: 'password',
        label: 'Password',
        required: true,
        trim: false,
    },
};

// Numbers arrive from JSON already typed, so the typeof check does double duty:
// it rejects "250" as much as it rejects { "$gt": 0 }, and an operator object
// can never reach a query or a document.
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

// Dates are accepted as strings and parsed here, so an unparseable value is
// answered with a 400 naming the field instead of becoming a CastError.
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

// Picks the checker a rule asks for. Rules without a type are strings, which
// keeps the registration and login tables above unchanged.
const CHECKERS = {
    string: checkString,
    number: checkNumber,
    date: checkDate,
};

// Runs a whole rule table and returns every problem it found. Nested objects
// and arrays report with a path e.g. 'service.category' or 'services[0].rate',
// so a caller can tell which of two identically named fields failed.
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

// Rebuilds the body from the rule table alone so a field nobody declared is
// dropped rather than handed to Mongoose. This is what stops a request adding
// its own _id or role to an embedded document, at every level of nesting.
export const pickValidated = (source, rules) => {
    const validated = {};
    const body = source ?? {};

    for (const rule of Object.values(rules)) {
        const value = body[rule.field];

        if (value === undefined) {
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

// The rule tables for the six marketplace resources. Each one mirrors what its
// schema requires, so the api answers a bad request with a field-by-field 400
// instead of letting the database raise the objection.

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
    // A freelancer may be created before they list anything, so an absent list
    // is allowed, a present one has every entry checked as a service.
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
    // The schema defaults this to 1, so it is optional, a supplied value still
    // has to be a whole number of at least one.
    quantity: { field: 'quantity', label: 'Quantity', type: 'number', min: 1, integer: true, required: false },
    client: { field: 'client', label: 'Client', type: 'object', rules: CLIENT_RULES },
    freelancer: { field: 'freelancer', label: 'Freelancer', type: 'object', rules: FREELANCER_RULES },
    service: { field: 'service', label: 'Service', type: 'object', rules: SERVICE_RULES },
};
