import express from 'express';
import * as incomeController from '../controllers/incomeController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticate);

// Only a Freelancer earns income, so the other roles get 403.
router.get('/me', requireRole('Freelancer'), incomeController.getMyIncome);

export default router;
