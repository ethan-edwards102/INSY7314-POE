import { describe, expect, test } from '@jest/globals';
import {
    checkNumber,
    checkRules,
    checkString,
    pickValidated,
    REGISTRATION_RULES,
    SELF_SERVICE_ROLES,
} from '../utils/validators.js';

describe('checkString', () => {
    test('accepts a valid email', () => {
        expect(checkString('ethan.edwards@hustlehub.test', REGISTRATION_RULES.email)).toBeNull();
    });

    test('rejects a NoSQL operator object in place of a string', () => {
        expect(checkString({ $ne: null }, REGISTRATION_RULES.email)).toEqual({
            field: 'email',
            message: 'Email must be text',
        });
    });

    test('rejects a missing required value', () => {
        expect(checkString('   ', REGISTRATION_RULES.name)).toEqual({ field: 'name', message: 'Name is required' });
    });

    test('rejects a weak password', () => {
        expect(checkString('password', REGISTRATION_RULES.password)?.field).toBe('password');
    });
});

describe('self service roles', () => {
    test('never include Admin', () => {
        expect(SELF_SERVICE_ROLES).not.toContain('Admin');
    });
});

describe('checkNumber', () => {
    const rate = { field: 'rate', label: 'Rate', min: 0 };

    test('rejects a number sent as a string', () => {
        expect(checkNumber('250', rate)).toEqual({ field: 'rate', message: 'Rate must be a number' });
    });

    test('rejects an operator object', () => {
        expect(checkNumber({ $gt: 0 }, rate)?.message).toBe('Rate must be a number');
    });

    test('rejects a value below the minimum', () => {
        expect(checkNumber(-1, rate)?.message).toBe('Rate must be 0 or more');
    });
});

describe('checkRules and pickValidated', () => {
    const body = {
        name: 'Ndumsio J',
        email: 'ndumsio.j@hustlehub.test',
        password: 'Ndumsio!Pass1',
        role: 'Freelancer',
        isAdmin: true,
    };

    test('report no errors for a valid registration', () => {
        expect(checkRules(body, REGISTRATION_RULES)).toEqual([]);
    });

    test('drop a field that the rule table does not declare', () => {
        expect(pickValidated(body, REGISTRATION_RULES)).not.toHaveProperty('isAdmin');
    });
});

/* ref
https://jestjs.io/docs/ecmascript-modules
*/
