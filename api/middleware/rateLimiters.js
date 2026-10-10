import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { config } from '../config/env.js';
import { fail } from '../utils/respond.js';

// Build a limiter with the shared options. Each limiter adds its own key and message.
const buildLimiter = ({ windowMinutes, max }, action, extra = {}) =>
    rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        limit: max,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        handler: (req, res) =>
            fail(res, 429, `Too many ${action}. Try again in ${windowMinutes} minutes.`),
        ...extra,
    });

const { rateLimits } = config;

export const globalLimiter = buildLimiter(rateLimits.global, 'requests');

// Count failed logins only, so a correct login never uses up an attempt.
// Include the email so one attacker cannot lock out every account behind a shared IP.
export const loginLimiter = buildLimiter(rateLimits.login, 'login attempts', {
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        const email = req.body?.email;
        const ip = ipKeyGenerator(req.ip);

        return typeof email === 'string' ? `${ip}|${email.trim().toLowerCase()}` : ip;
    },
});

export const registerLimiter = buildLimiter(rateLimits.register, 'registrations');

// Run this after authenticate so req.user exists. Every attempt counts, even an invalid one.
export const bookingLimiter = buildLimiter(rateLimits.booking, 'booking attempts', {
    keyGenerator: (req) => req.user.id,
});

/* ref
https://express-rate-limit.mintlify.app/reference/configuration
https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#protect-against-automated-attacks
*/
