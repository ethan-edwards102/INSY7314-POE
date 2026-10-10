import { BOOKING_STATUSES, MAX_QUANTITY } from '../models/Booking.js';
import { GIG_CATEGORIES, RATE_TYPES } from '../models/Gig.js';
import { CURRENCY } from '../models/Transaction.js';
import { EMAIL_PATTERN, NAME_PATTERN, PASSWORD_PATTERN, USER_ROLES } from '../models/User.js';
import { OBJECT_ID_PATTERN } from '../middleware/validateObjectId.js';
import { BOOKING_RULES, GIG_QUERY_RULES, GIG_RULES, SELF_SERVICE_ROLES } from '../utils/validators.js';

// Read the limits from the rule tables, so the document and the validation never disagree.
const { title, description, rate } = GIG_RULES;

const schema = (name) => ({ $ref: `#/components/schemas/${name}` });
const response = (name) => ({ $ref: `#/components/responses/${name}` });

const objectId = { type: 'string', pattern: OBJECT_ID_PATTERN.source, example: '6a91e48284e36fb40ec00de6' };

// Describe a success envelope, so each operation names only its message and its data.
const success = (summary, message, data, extra = {}) => ({
    description: summary,
    content: {
        'application/json': {
            schema: {
                type: 'object',
                required: ['success', 'message'],
                properties: {
                    success: { const: true },
                    message: { type: 'string', example: message },
                    ...(data ? { data } : {}),
                    ...extra,
                },
            },
        },
    },
});

const list = (summary, message, item) =>
    success(summary, message, { type: 'array', items: item }, { count: { type: 'integer', minimum: 0 } });

const idParameter = (resource) => ({
    name: 'id',
    in: 'path',
    required: true,
    description: `The id of the ${resource}. A value that is not 24 hex characters gets 400.`,
    schema: objectId,
});

const jsonBody = (name) => ({
    required: true,
    content: { 'application/json': { schema: schema(name) } },
});

// Add the answers that every route can give, because the sanitiser, the limiter and the error handler cover all routes.
const operation = ({ responses, ...rest }) => ({
    ...rest,
    responses: {
        400: response('BadRequest'),
        ...responses,
        429: response('TooManyRequests'),
        500: response('ServerError'),
    },
});

const failure = (summary, message) => ({
    description: summary,
    content: { 'application/json': { schema: schema('Error'), example: { success: false, message } } },
});

// Give each resource its own 404 example, because the message names the resource.
const notFound = (resource) =>
    failure(`No ${resource.toLowerCase()} has this id, or it belongs to another user.`, `${resource} not found`);

const limit = ({ max, windowMinutes }) => `${max} in ${windowMinutes} minutes`;

export const buildOpenApiDocument = (rateLimits) => ({
    openapi: '3.1.1',
    info: {
        title: 'HustleHub+ API',
        version: '2.0.0',
        description: [
            'The HustleHub+ marketplace API for INSY7314 Part 2.',
            '',
            '## Authentication',
            'Register or log in to get a JSON Web Token. Send the token in the `Authorization` header as `Bearer <token>`.',
            'The API reads the role of the user from the database on each request, so a role change applies at once.',
            '',
            '## Response format',
            'Every response is JSON with `success` and `message`. A list also has `count`.',
            'A failed validation has `errors`, with one `field` and `message` for each bad field.',
            '',
            '## Rate limits',
            `- All requests from one IP address: ${limit(rateLimits.global)}.`,
            `- Failed logins for one IP address and email: ${limit(rateLimits.login)}.`,
            `- Failed logins for one IP address across all emails: ${limit(rateLimits.loginIp)}.`,
            `- Registrations from one IP address: ${limit(rateLimits.register)}.`,
            `- Booking attempts by one signed in user: ${limit(rateLimits.booking)}.`,
            '',
            'A request over a limit gets 429 and a `RateLimit` header that tells the client when to try again.',
        ].join('\n'),
    },
    servers: [{ url: '/', description: 'The API that serves this page' }],
    security: [{ bearerAuth: [] }],
    tags: [
        { name: 'Health', description: 'A public check that the API is running.' },
        { name: 'Auth', description: 'Registration, login and the current user.' },
        { name: 'Gigs', description: 'Services that a Freelancer offers. A Freelancer manages only their own gigs.' },
        { name: 'Bookings', description: 'A Client books a gig. Each booking creates one transaction.' },
        { name: 'Transactions', description: 'Read only payment records. Nobody can change or delete a transaction.' },
        { name: 'Income', description: 'The income summary of a Freelancer.' },
        { name: 'Users', description: 'Account management for the Admin.' },
    ],
    paths: {
        '/health': {
            get: operation({
                tags: ['Health'],
                operationId: 'getHealth',
                summary: 'Check that the API is running',
                security: [],
                responses: { 200: success('The API is running.', 'OK') },
            }),
        },
        '/auth/register': {
            post: operation({
                tags: ['Auth'],
                operationId: 'register',
                summary: 'Create an account',
                description: `Creates a Client or a Freelancer and returns a token. The API refuses the Admin role here. Limit: ${limit(rateLimits.register)} for each IP address.`,
                security: [],
                requestBody: jsonBody('RegisterInput'),
                responses: {
                    201: success('The account exists and the token is valid.', 'Registration successful', schema('User'), {
                        token: { type: 'string', description: 'A signed JWT.' },
                    }),
                    400: response('BadRequest'),
                    409: failure('The email already has an account.', 'An account with that email already exists'),
                    413: response('PayloadTooLarge'),
                },
            }),
        },
        '/auth/login': {
            post: operation({
                tags: ['Auth'],
                operationId: 'login',
                summary: 'Log in',
                description: `Returns a token. An unknown email and a wrong password get the same 401 message. Limit: ${limit(rateLimits.login)} failed logins for each IP address and email, and ${limit(rateLimits.loginIp)} for each IP address.`,
                security: [],
                requestBody: jsonBody('LoginInput'),
                responses: {
                    200: success('The credentials are correct.', 'Login successful', schema('User'), {
                        token: { type: 'string', description: 'A signed JWT.' },
                    }),
                    400: response('BadRequest'),
                    401: failure('The email or the password is wrong.', 'Invalid email or password'),
                    413: response('PayloadTooLarge'),
                },
            }),
        },
        '/auth/me': {
            get: operation({
                tags: ['Auth'],
                operationId: 'getCurrentUser',
                summary: 'Get the current user',
                responses: {
                    200: success('The user that owns the token.', 'User retrieved', schema('User')),
                    401: response('Unauthorized'),
                },
            }),
        },
        '/gigs': {
            get: operation({
                tags: ['Gigs'],
                operationId: 'listGigs',
                summary: 'Browse active gigs',
                description: 'Returns active gigs, newest first. Any signed in user can browse.',
                parameters: [
                    {
                        name: 'category',
                        in: 'query',
                        schema: { type: 'string', enum: GIG_QUERY_RULES.category.allowed },
                    },
                    {
                        name: 'search',
                        in: 'query',
                        description: 'Text to find in the gig title. Case does not matter.',
                        schema: { type: 'string', maxLength: GIG_QUERY_RULES.search.maxLength },
                    },
                ],
                responses: {
                    200: list('The active gigs.', 'Gigs retrieved', schema('Gig')),
                    400: response('BadRequest'),
                    401: response('Unauthorized'),
                },
            }),
            post: operation({
                tags: ['Gigs'],
                operationId: 'createGig',
                summary: 'Create a gig',
                description: 'Freelancer only. The API sets the owner from the token.',
                requestBody: jsonBody('GigInput'),
                responses: {
                    201: success('The gig exists.', 'Gig created', schema('Gig')),
                    400: response('BadRequest'),
                    401: response('Unauthorized'),
                    403: response('Forbidden'),
                    413: response('PayloadTooLarge'),
                },
            }),
        },
        '/gigs/mine': {
            get: operation({
                tags: ['Gigs'],
                operationId: 'listMyGigs',
                summary: 'List my gigs',
                description: 'Freelancer only. Returns the active and the inactive gigs of the caller.',
                responses: {
                    200: list('The gigs of the caller.', 'Gigs retrieved', schema('Gig')),
                    401: response('Unauthorized'),
                    403: response('Forbidden'),
                },
            }),
        },
        '/gigs/{id}': {
            parameters: [idParameter('gig')],
            get: operation({
                tags: ['Gigs'],
                operationId: 'getGig',
                summary: 'Get one gig',
                description: 'An inactive gig is visible only to its owner and the Admin. Other users get 404.',
                responses: {
                    200: success('The gig.', 'Gig retrieved', schema('Gig')),
                    400: response('BadRequest'),
                    401: response('Unauthorized'),
                    404: notFound('Gig'),
                },
            }),
            put: operation({
                tags: ['Gigs'],
                operationId: 'updateGig',
                summary: 'Replace a gig',
                description:
                    'Freelancer only. The owner sends every field again. A gig of another user, or a gig that the Admin removed, gets 404.',
                requestBody: jsonBody('GigInput'),
                responses: {
                    200: success('The gig after the change.', 'Gig updated', schema('Gig')),
                    400: response('BadRequest'),
                    401: response('Unauthorized'),
                    403: response('Forbidden'),
                    404: notFound('Gig'),
                    413: response('PayloadTooLarge'),
                },
            }),
            delete: operation({
                tags: ['Gigs'],
                operationId: 'deleteGig',
                summary: 'Delete a gig',
                description:
                    'A Freelancer deletes their own gig. The Admin deletes any gig. A gig with bookings becomes inactive and stays, because its bookings and transactions point to it.',
                responses: {
                    200: success(
                        'The message is "Gig deleted" with no data, or "Gig deactivated because it has bookings" with the gig in data.',
                        'Gig deactivated because it has bookings',
                        schema('Gig')
                    ),
                    400: response('BadRequest'),
                    401: response('Unauthorized'),
                    403: response('Forbidden'),
                    404: notFound('Gig'),
                },
            }),
        },
        '/bookings': {
            get: operation({
                tags: ['Bookings'],
                operationId: 'listBookings',
                summary: 'List bookings',
                description: 'A Client sees their own bookings. A Freelancer sees bookings of their gigs. The Admin sees all.',
                responses: {
                    200: list('The bookings that the caller can see.', 'Bookings retrieved', schema('Booking')),
                    401: response('Unauthorized'),
                },
            }),
            post: operation({
                tags: ['Bookings'],
                operationId: 'createBooking',
                summary: 'Book a gig',
                description: `Client only. The API copies the rate from the gig, calculates the total and records a simulated payment as a transaction. Limit: ${limit(rateLimits.booking)} for each user.`,
                requestBody: jsonBody('BookingInput'),
                responses: {
                    201: success('The booking and its transaction exist.', 'Booking confirmed', {
                        type: 'object',
                        required: ['booking', 'transaction'],
                        properties: { booking: schema('Booking'), transaction: schema('Transaction') },
                    }),
                    400: response('BadRequest'),
                    401: response('Unauthorized'),
                    403: response('Forbidden'),
                    404: failure('The gig is not active, is your own, or has no Freelancer owner.', 'Gig not found'),
                    409: failure(
                        'You already have a confirmed booking for this gig at this time.',
                        'You already booked this gig for that time'
                    ),
                    413: response('PayloadTooLarge'),
                },
            }),
        },
        '/bookings/{id}': {
            parameters: [idParameter('booking')],
            get: operation({
                tags: ['Bookings'],
                operationId: 'getBooking',
                summary: 'Get one booking',
                description: 'Only the Client, the Freelancer and the Admin can see a booking. Other users get 404.',
                responses: {
                    200: success('The booking.', 'Booking retrieved', schema('Booking')),
                    400: response('BadRequest'),
                    401: response('Unauthorized'),
                    404: notFound('Booking'),
                },
            }),
        },
        '/transactions': {
            get: operation({
                tags: ['Transactions'],
                operationId: 'listTransactions',
                summary: 'List transactions',
                description: 'A Client sees their payments. A Freelancer sees payments to them. The Admin sees all.',
                responses: {
                    200: list('The transactions that the caller can see.', 'Transactions retrieved', schema('Transaction')),
                    401: response('Unauthorized'),
                },
            }),
        },
        '/transactions/{id}': {
            parameters: [idParameter('transaction')],
            get: operation({
                tags: ['Transactions'],
                operationId: 'getTransaction',
                summary: 'Get one transaction',
                description: 'Only the two parties and the Admin can see a transaction. Other users get 404.',
                responses: {
                    200: success('The transaction.', 'Transaction retrieved', schema('Transaction')),
                    400: response('BadRequest'),
                    401: response('Unauthorized'),
                    404: notFound('Transaction'),
                },
            }),
        },
        '/income/me': {
            get: operation({
                tags: ['Income'],
                operationId: 'getMyIncome',
                summary: 'Get my income',
                description: 'Freelancer only. Adds up the completed transactions of the caller, in total and for each month.',
                responses: {
                    200: success('The income summary.', 'Income retrieved', schema('Income')),
                    401: response('Unauthorized'),
                    403: response('Forbidden'),
                },
            }),
        },
        '/users': {
            get: operation({
                tags: ['Users'],
                operationId: 'listUsers',
                summary: 'List all users',
                description: 'Admin only. Returns the name, email, role and creation date of each account.',
                responses: {
                    200: list('Every account, oldest first.', 'Users retrieved', schema('UserSummary')),
                    401: response('Unauthorized'),
                    403: response('Forbidden'),
                },
            }),
        },
        '/users/{id}/role': {
            parameters: [idParameter('user')],
            patch: operation({
                tags: ['Users'],
                operationId: 'updateUserRole',
                summary: 'Change the role of a user',
                description:
                    'Admin only. The Admin cannot change their own role, so that request gets 400 "You cannot change your own role". The new role applies on the next request of that user.',
                requestBody: jsonBody('RoleInput'),
                responses: {
                    200: success('The user after the change.', 'Role updated', schema('User')),
                    400: response('BadRequest'),
                    401: response('Unauthorized'),
                    403: response('Forbidden'),
                    404: notFound('User'),
                    413: response('PayloadTooLarge'),
                },
            }),
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'The token from register or login.',
            },
        },
        schemas: {
            Error: {
                type: 'object',
                required: ['success', 'message'],
                properties: {
                    success: { const: false },
                    message: { type: 'string' },
                    errors: {
                        type: 'array',
                        description: 'Present only when one or more fields fail validation.',
                        items: {
                            type: 'object',
                            required: ['field', 'message'],
                            properties: { field: { type: 'string' }, message: { type: 'string' } },
                        },
                    },
                },
            },
            ObjectId: objectId,
            PartyName: {
                type: 'object',
                description: 'A user with the name only. The API never sends other user fields here.',
                properties: { _id: objectId, name: { type: 'string' } },
            },
            User: {
                type: 'object',
                description: 'An account. The API never sends the password hash.',
                properties: {
                    _id: objectId,
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: USER_ROLES },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            UserSummary: {
                type: 'object',
                properties: {
                    _id: objectId,
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: USER_ROLES },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            RegisterInput: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: { type: 'string', pattern: NAME_PATTERN.source, example: 'Ethan Edwards' },
                    email: { type: 'string', pattern: EMAIL_PATTERN.source, example: 'ethan.edwards@hustlehub.test' },
                    password: {
                        type: 'string',
                        pattern: PASSWORD_PATTERN.source,
                        description: '8 to 72 characters with an uppercase letter, a lowercase letter, a number and a symbol.',
                        example: 'Ethan!Pass1',
                    },
                    role: { type: 'string', enum: SELF_SERVICE_ROLES, default: 'Client' },
                },
            },
            LoginInput: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', pattern: EMAIL_PATTERN.source, example: 'ethan.edwards@hustlehub.test' },
                    password: { type: 'string', example: 'Ethan!Pass1' },
                },
            },
            RoleInput: {
                type: 'object',
                required: ['role'],
                properties: { role: { type: 'string', enum: USER_ROLES } },
            },
            GigInput: {
                type: 'object',
                required: ['title', 'description', 'category', 'rate', 'rateType'],
                description: 'The API removes HTML markup from the title and the description before it checks the length.',
                properties: {
                    title: { type: 'string', minLength: title.minLength, maxLength: title.maxLength, example: 'Deep house clean' },
                    description: {
                        type: 'string',
                        minLength: description.minLength,
                        maxLength: description.maxLength,
                        example: 'A full clean of a three bedroom house, with my own products.',
                    },
                    category: { type: 'string', enum: GIG_CATEGORIES },
                    rate: { type: 'number', minimum: rate.min, maximum: rate.max, multipleOf: 0.01, example: 300 },
                    rateType: { type: 'string', enum: RATE_TYPES },
                    isActive: { type: 'boolean', default: true },
                },
            },
            Gig: {
                type: 'object',
                properties: {
                    _id: objectId,
                    freelancer: { oneOf: [schema('ObjectId'), schema('PartyName')] },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string', enum: GIG_CATEGORIES },
                    rate: { type: 'number' },
                    rateType: { type: 'string', enum: RATE_TYPES },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            BookingInput: {
                type: 'object',
                required: ['gig', 'scheduledFor'],
                description: 'The API sets the Client, the Freelancer, the rate and the total. It ignores any other field.',
                properties: {
                    gig: objectId,
                    scheduledFor: {
                        type: 'string',
                        format: 'date-time',
                        description: `A time in the future, no more than ${BOOKING_RULES.scheduledFor.maxDaysAhead} days ahead.`,
                    },
                    quantity: { type: 'integer', minimum: 1, maximum: MAX_QUANTITY, default: 1 },
                },
            },
            Booking: {
                type: 'object',
                properties: {
                    _id: objectId,
                    gig: {
                        oneOf: [
                            schema('ObjectId'),
                            { type: 'object', properties: { _id: objectId, title: { type: 'string' } } },
                        ],
                    },
                    client: { oneOf: [schema('ObjectId'), schema('PartyName')] },
                    freelancer: { oneOf: [schema('ObjectId'), schema('PartyName')] },
                    scheduledFor: { type: 'string', format: 'date-time' },
                    quantity: { type: 'integer' },
                    unitRate: { type: 'number', description: 'The gig rate when the Client booked.' },
                    rateType: { type: 'string', enum: RATE_TYPES },
                    total: { type: 'number', description: 'The unit rate times the quantity, rounded to the cent.' },
                    status: { type: 'string', enum: BOOKING_STATUSES },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            Transaction: {
                type: 'object',
                properties: {
                    _id: objectId,
                    booking: objectId,
                    client: { oneOf: [schema('ObjectId'), schema('PartyName')] },
                    freelancer: { oneOf: [schema('ObjectId'), schema('PartyName')] },
                    amount: { type: 'number' },
                    currency: { const: CURRENCY },
                    status: { const: 'Completed' },
                    reference: { type: 'string', pattern: '^HH-[0-9A-F]{16}$', example: 'HH-3F9A1C7E5B2D4A60' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            Income: {
                type: 'object',
                properties: {
                    currency: { const: CURRENCY },
                    total: { type: 'number' },
                    count: { type: 'integer' },
                    byMonth: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                month: { type: 'string', pattern: '^\\d{4}-\\d{2}$', example: '2026-10' },
                                total: { type: 'number' },
                                count: { type: 'integer' },
                            },
                        },
                    },
                },
            },
        },
        responses: {
            BadRequest: {
                description: 'The request failed validation, has a bad id, has bad JSON, or has a forbidden key such as "$where".',
                content: {
                    'application/json': {
                        schema: schema('Error'),
                        example: {
                            success: false,
                            message: 'Validation failed',
                            errors: [{ field: 'email', message: 'Email must be text' }],
                        },
                    },
                },
            },
            Unauthorized: failure('The token is missing, not valid or expired.', 'Authentication required'),
            Forbidden: failure('The role of the caller cannot do this action.', 'You do not have permission to perform this action'),
            PayloadTooLarge: failure('The body is larger than 10 kB.', 'Request body is too large'),
            TooManyRequests: {
                description: 'The caller went over a rate limit.',
                headers: {
                    RateLimit: { description: 'The remaining requests and the seconds until the window resets.', schema: { type: 'string' } },
                    'RateLimit-Policy': { description: 'The limit and the window of this policy.', schema: { type: 'string' } },
                    'Retry-After': { description: 'The seconds to wait before the next request.', schema: { type: 'integer' } },
                },
                content: {
                    'application/json': {
                        schema: schema('Error'),
                        example: { success: false, message: 'Too many requests. Try again in 15 minutes.' },
                    },
                },
            },
            ServerError: failure('An unexpected fault. The server logs the detail and sends none of it.', 'An unexpected error occurred'),
        },
    },
});

/* ref
https://spec.openapis.org/oas/v3.1.1.html#paths-object
https://spec.openapis.org/oas/v3.1.1.html#security-scheme-object
*/
