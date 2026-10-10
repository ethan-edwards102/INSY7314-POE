import mongoose from 'mongoose';
import Transaction, { CURRENCY } from '../models/Transaction.js';

// Round to whole cents, because a sum of decimals can drift.
const toCents = (value) => Math.round(value * 100) / 100;

// Turn the monthly rows from the database into the income summary.
export const shapeIncome = (rows) => {
    const byMonth = rows
        .map((row) => ({ month: row._id, total: toCents(row.total), count: row.count }))
        .sort((a, b) => a.month.localeCompare(b.month));

    return {
        currency: CURRENCY,
        total: toCents(byMonth.reduce((sum, row) => sum + row.total, 0)),
        count: byMonth.reduce((sum, row) => sum + row.count, 0),
        byMonth,
    };
};

export const getIncome = async (freelancerId) => {
    // Mongoose does not cast a pipeline, so convert the id here.
    const rows = await Transaction.aggregate([
        { $match: { freelancer: new mongoose.Types.ObjectId(freelancerId), status: 'Completed' } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                total: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
    ]);

    return shapeIncome(rows);
};

/* ref
https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateToString/
https://mongoosejs.com/docs/api/model.html#Model.aggregate()
*/
