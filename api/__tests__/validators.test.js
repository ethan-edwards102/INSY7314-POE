import { describe, expect, test } from '@jest/globals';
import {
    checkBoolean,
    checkNumber,
    checkRules,
    checkString,
    GIG_RULES,
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

describe('GIG_RULES', () => {
    const valid = {
        title: 'Weekly house cleaning',
        description: 'Two hours of cleaning for a small flat.',
        category: 'HouseCleaning',
        rate: 250,
        rateType: 'Hour',
    };

    test('accepts a valid gig', () => {
        expect(checkRules(valid, GIG_RULES)).toEqual([]);
    });

    test('rejects a title that is too short or too long, measured after trimming', () => {
        expect(checkRules({ ...valid, title: ' ab ' }, GIG_RULES)[0].field).toBe('title');
        expect(checkRules({ ...valid, title: 'a'.repeat(81) }, GIG_RULES)[0].message).toBe(
            'Title must be 80 characters or fewer'
        );
    });

    test('rejects a zero rate, a rate above the cap and a category outside the list', () => {
        const fields = checkRules({ ...valid, rate: 0, category: 'Hacking' }, GIG_RULES).map((e) => e.field);

        expect(fields).toEqual(['category', 'rate']);
        expect(checkRules({ ...valid, rate: 100001 }, GIG_RULES)[0].field).toBe('rate');
    });

    test('drops an owner id sent in the body', () => {
        const body = { ...valid, freelancer: '64b7f0c2a1d3e4f5a6b7c8d9' };

        expect(pickValidated(body, GIG_RULES)).not.toHaveProperty('freelancer');
    });
});

describe('checkBoolean', () => {
    const flag = { field: 'isActive', label: 'Active flag', required: false };

    test('rejects the string "false" so it cannot count as true', () => {
        expect(checkBoolean('false', flag)?.message).toBe('Active flag must be true or false');
    });

    test('allows a missing optional flag', () => {
        expect(checkBoolean(undefined, flag)).toBeNull();
    });
});

/* ref
https://jestjs.io/docs/ecmascript-modules
*/
