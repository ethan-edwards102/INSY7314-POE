import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authenticate.js';
import { bookingLimiter } from '../middleware/rateLimiters.js';
import { requireRole } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validateBody.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { BOOKING_RULES } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

router.post('/', bookingLimiter, requireRole('Client'), validateBody(BOOKING_RULES), bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/:id', validateObjectId, bookingController.getBookingById);

export default router;
