import express from 'express';
import * as invoiceController from '../controllers/invoiceController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validateBody.js';
import { INVOICE_RULES } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validateBody(INVOICE_RULES), invoiceController.createInvoice);
router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.put('/:id', validateBody(INVOICE_RULES), invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);

export default router;
