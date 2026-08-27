import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';

const router = express.Router();

router.patch('/:id/role', authenticate, requireRole('Admin'), userController.updateUserRole);

export default router;
