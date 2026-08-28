import Invoice from '../models/Invoice.js';
import { handleError, notFound } from '../utils/handleError.js';
import { ok, created } from '../utils/respond.js';

export const createInvoice = async (req, res) => {
    try {
        const { amount, dateIssued, pop } = req.body;

        const newInvoice = await Invoice.create({
            amount,
            dateIssued,
            pop,
        });

        return created(res, 'Invoice created', newInvoice);
    } catch (error) {
        return handleError(res, error);
    }
}

export const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({});
        return ok(res, 'Invoices retrieved', invoices, { count: invoices.length });
    } catch (error) {
        return handleError(res, error);
    }
}

export const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return notFound(res, 'Invoice');
        }

        return ok(res, 'Invoice retrieved', invoice);
    } catch (error) {
        return handleError(res, error);
    }
}

export const updateInvoice = async (req, res) => {
    try {
        const { amount, dateIssued, pop } = req.body;

        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { amount, dateIssued, pop },
            { new: true, runValidators: true }
        );

        if (!invoice) {
            return notFound(res, 'Invoice');
        }

        return ok(res, 'Invoice updated', invoice);
    } catch (error) {
        return handleError(res, error);
    }
}

export const deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);

        if (!invoice) {
            return notFound(res, 'Invoice');
        }

        return ok(res, 'Invoice deleted');
    } catch (error) {
        return handleError(res, error);
    }
}
