import express from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = express.Router();

router.use(authenticate);

// Only reads exist, because a transaction is a permanent record.
router.get('/', transactionController.getTransactions);
router.get('/:id', validateObjectId, transactionController.getTransactionById);

export default router;
