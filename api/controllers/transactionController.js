import Transaction from '../models/Transaction.js';
import { handleError, notFound } from '../utils/handleError.js';
import { listScope, partyScope } from '../utils/ownerScope.js';
import { ok } from '../utils/respond.js';

// Populate names only, so no other User field leaves the API.
const withParties = (query) => query.populate('client', 'name').populate('freelancer', 'name');

export const getTransactions = async (req, res) => {
    try {
        const transactions = await withParties(Transaction.find(listScope(req.user)).sort({ createdAt: -1 }));

        return ok(res, 'Transactions retrieved', transactions, { count: transactions.length });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getTransactionById = async (req, res) => {
    try {
        const transaction = await withParties(Transaction.findOne({ _id: req.params.id, ...partyScope(req.user) }));

        if (!transaction) {
            return notFound(res, 'Transaction');
        }

        return ok(res, 'Transaction retrieved', transaction);
    } catch (error) {
        return handleError(res, error);
    }
};

/* ref
https://mongoosejs.com/docs/populate.html#field-selection
*/
