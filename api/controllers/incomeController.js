import { handleError } from '../utils/handleError.js';
import { ok } from '../utils/respond.js';
import { getIncome } from '../services/incomeService.js';

export const getMyIncome = async (req, res) => {
    try {
        return ok(res, 'Income retrieved', await getIncome(req.user.id));
    } catch (error) {
        return handleError(res, error);
    }
};
