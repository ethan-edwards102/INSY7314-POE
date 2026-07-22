import express from 'express';
import * as serviceController from '../controllers/serviceController.js';

const router = express.Router();

router.post('/', serviceController.createService);
router.get('/', serviceController.getServices);

export default router;