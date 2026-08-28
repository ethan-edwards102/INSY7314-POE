import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validateBody.js';
import { ROLE_RULES } from '../utils/validators.js';

const router = express.Router();

router.patch('/:id/role', authenticate, requireRole('Admin'), validateBody(ROLE_RULES), userController.updateUserRole);

export default router;
