import express from 'express';
import * as invoiceController from '../controllers/invoiceController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.use(authenticate);

router.post('/', invoiceController.createInvoice);
router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.put('/:id', invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);

export default router;
