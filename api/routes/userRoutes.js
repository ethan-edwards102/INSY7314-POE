import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { validateBody } from '../middleware/validateBody.js';
import { ROLE_RULES } from '../utils/validators.js';

const router = express.Router();

// Every user route is for the Admin, so a later route is protected by default.
router.use(authenticate, requireRole('Admin'));

router.get('/', userController.getUsers);
router.patch('/:id/role', validateObjectId, validateBody(ROLE_RULES), userController.updateUserRole);

export default router;
