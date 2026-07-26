import express from 'express';
import * as freelancerController from '../controllers/freelancerController.js';

const router = express.Router();

router.post('/', freelancerController.createFreelancer);
router.get('/', freelancerController.getFreelancers);
router.get('/:id', freelancerController.getFreelancerById);
router.put('/:id', freelancerController.updateFreelancer);
router.delete('/:id', freelancerController.deleteFreelancer);

export default router;
