import express from 'express';
import * as authController from '../controllers/authController.js';
import { validateRegistration } from '../middleware/validateRegistration.js';

const router = express.Router();

// Validation runs as middleware ahead of the controller, so an invalid request
// is answered before any database work is attempted.
router.post('/register', validateRegistration, authController.register);

export default router;
