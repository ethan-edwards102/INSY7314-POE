import express from 'express';
import * as serviceController from '../controllers/serviceController.js';

const router = express.Router();

router.post('/', serviceController.createService);
router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

export default router;
