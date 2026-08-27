import express from 'express';
import * as serviceController from '../controllers/serviceController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.use(authenticate);

router.post('/', serviceController.createService);
router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

export default router;
