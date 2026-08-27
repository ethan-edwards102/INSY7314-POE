import express from 'express';
import * as popController from '../controllers/popController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.use(authenticate);

router.post('/', popController.createPop);
router.get('/', popController.getPops);
router.get('/:id', popController.getPopById);
router.put('/:id', popController.updatePop);
router.delete('/:id', popController.deletePop);

export default router;
