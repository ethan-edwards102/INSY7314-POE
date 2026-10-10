import express from 'express';
import { ok } from '../utils/respond.js';

const router = express.Router();

// Keep this route public so a monitor can check the API without a token.
router.get('/', (req, res) => ok(res, 'OK'));

export default router;
