import express from 'express';
import * as clientController from '../controllers/clientController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validateBody.js';
import { CLIENT_RULES } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validateBody(CLIENT_RULES), clientController.createClient);
router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientById);
router.put('/:id', validateBody(CLIENT_RULES), clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

export default router;
