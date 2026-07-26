import express from 'express';
import * as popController from '../controllers/popController.js';

const router = express.Router();

router.post('/', popController.createPop);
router.get('/', popController.getPops);
router.get('/:id', popController.getPopById);
router.put('/:id', popController.updatePop);
router.delete('/:id', popController.deletePop);

export default router;
