import express from 'express';
import * as freelancerController from '../controllers/freelancerController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validateBody.js';
import { FREELANCER_RULES } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validateBody(FREELANCER_RULES), freelancerController.createFreelancer);
router.get('/', freelancerController.getFreelancers);
router.get('/:id', freelancerController.getFreelancerById);
router.put('/:id', validateBody(FREELANCER_RULES), freelancerController.updateFreelancer);
router.delete('/:id', freelancerController.deleteFreelancer);

export default router;
