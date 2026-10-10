import express from 'express';
import * as serviceController from '../controllers/serviceController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validateBody.js';
import { SERVICE_RULES } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validateBody(SERVICE_RULES), serviceController.createService);
router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);
router.put('/:id', validateBody(SERVICE_RULES), serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

export default router;
