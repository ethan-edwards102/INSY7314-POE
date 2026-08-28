import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validateBody.js';
import { BOOKING_RULES } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validateBody(BOOKING_RULES), bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBookingById);
// PUT replaces the whole document, so it uses the same rules as a create.
router.put('/:id', validateBody(BOOKING_RULES), bookingController.updateBooking);
router.delete('/:id', bookingController.deleteBooking);

export default router;
