import express from 'express';
import * as authController from '../controllers/authController.js';
import { validateRegistration } from '../middleware/validateRegistration.js';
import { validateLogin } from '../middleware/validateLogin.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// This middleware validates the request before the controller runs. This
// way, the server answers an invalid request before it does any database work.
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/me', authenticate, authController.me);

export default router;
