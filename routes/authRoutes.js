import express from 'express';
import * as authController from '../controllers/authController.js';
import { validateRegistration } from '../middleware/validateRegistration.js';
import { validateLogin } from '../middleware/validateLogin.js';

const router = express.Router();

// Validation runs as middleware ahead of the controller, so an invalid request
// is answered before any database work is attempted.
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);

export default router;
