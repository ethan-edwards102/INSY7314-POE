import express from 'express';
import * as freelancerController from '../controllers/freelancerController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.use(authenticate);

router.post('/', freelancerController.createFreelancer);
router.get('/', freelancerController.getFreelancers);
router.get('/:id', freelancerController.getFreelancerById);
router.put('/:id', freelancerController.updateFreelancer);
router.delete('/:id', freelancerController.deleteFreelancer);

export default router;
