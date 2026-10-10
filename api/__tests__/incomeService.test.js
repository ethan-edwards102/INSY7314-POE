import { describe, expect, test } from '@jest/globals';
import { shapeIncome } from '../services/incomeService.js';

describe('shapeIncome', () => {
    test('an empty result gives zero income', () => {
        expect(shapeIncome([])).toEqual({ currency: 'ZAR', total: 0, count: 0, byMonth: [] });
    });

    test('sorts the months in ascending order and sums them', () => {
        const income = shapeIncome([
            { _id: '2026-10', total: 500, count: 1 },
            { _id: '2026-09', total: 250.5, count: 2 },
        ]);

        expect(income.byMonth.map((row) => row.month)).toEqual(['2026-09', '2026-10']);
        expect(income.total).toBe(750.5);
        expect(income.count).toBe(3);
    });

    test('rounds a floating point sum to whole cents', () => {
        const income = shapeIncome([{ _id: '2026-10', total: 0.1 + 0.2, count: 2 }]);

        expect(income.total).toBe(0.3);
        expect(income.byMonth[0].total).toBe(0.3);
    });
});
