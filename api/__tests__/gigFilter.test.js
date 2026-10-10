import { describe, expect, test } from '@jest/globals';
import { buildBrowseFilter } from '../utils/gigFilter.js';

describe('buildBrowseFilter', () => {
    test('always limits the browse list to active gigs', () => {
        expect(buildBrowseFilter({})).toEqual({ isActive: true });
    });

    test('matches the title without regard to case', () => {
        const { title } = buildBrowseFilter({ search: 'clean' });

        expect(title.test('Weekly House CLEANING')).toBe(true);
    });

    test('treats regex characters in the search text as plain text', () => {
        const { title } = buildBrowseFilter({ search: '.*' });

        expect(title.test('Weekly house cleaning')).toBe(false);
        expect(title.test('Is it 100.* off?')).toBe(true);
    });
});
