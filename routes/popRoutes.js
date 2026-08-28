import express from 'express';
import * as popController from '../controllers/popController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validateBody.js';
import { POP_RULES } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validateBody(POP_RULES), popController.createPop);
router.get('/', popController.getPops);
router.get('/:id', popController.getPopById);
router.put('/:id', validateBody(POP_RULES), popController.updatePop);
router.delete('/:id', popController.deletePop);

export default router;
