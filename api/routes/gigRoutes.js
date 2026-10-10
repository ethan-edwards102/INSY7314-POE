import express from 'express';
import * as gigController from '../controllers/gigController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validateBody.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { validateQuery } from '../middleware/validateQuery.js';
import { GIG_QUERY_RULES, GIG_RULES } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

router.get('/', validateQuery(GIG_QUERY_RULES), gigController.getGigs);
// Declare this route before /:id, or Express reads "mine" as an id.
router.get('/mine', requireRole('Freelancer'), gigController.getMyGigs);
router.get('/:id', validateObjectId, gigController.getGigById);
router.post('/', requireRole('Freelancer'), validateBody(GIG_RULES), gigController.createGig);
router.put('/:id', requireRole('Freelancer'), validateObjectId, validateBody(GIG_RULES), gigController.updateGig);
router.delete('/:id', requireRole('Freelancer', 'Admin'), validateObjectId, gigController.deleteGig);

export default router;
