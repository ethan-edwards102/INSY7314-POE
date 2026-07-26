import express from 'express';
import * as clientController from '../controllers/clientController.js';

const router = express.Router();

router.post('/', clientController.createClient);
router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientById);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

export default router;
