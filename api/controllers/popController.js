import Pop from '../models/Pop.js';
import { handleError, notFound } from '../utils/handleError.js';
import { ok, created } from '../utils/respond.js';

export const createPop = async (req, res) => {
    try {
        const { datePaid } = req.validated;

        const newPop = await Pop.create({
            datePaid,
        });

        return created(res, 'Pop created', newPop);
    } catch (error) {
        return handleError(res, error);
    }
}

export const getPops = async (req, res) => {
    try {
        const pops = await Pop.find({});
        return ok(res, 'Pops retrieved', pops, { count: pops.length });
    } catch (error) {
        return handleError(res, error);
    }
}

export const getPopById = async (req, res) => {
    try {
        const pop = await Pop.findById(req.params.id);

        if (!pop) {
            return notFound(res, 'Pop');
        }

        return ok(res, 'Pop retrieved', pop);
    } catch (error) {
        return handleError(res, error);
    }
}

export const updatePop = async (req, res) => {
    try {
        const { datePaid } = req.validated;

        const pop = await Pop.findByIdAndUpdate(
            req.params.id,
            { datePaid },
            { returnDocument: 'after', runValidators: true }
        );

        if (!pop) {
            return notFound(res, 'Pop');
        }

        return ok(res, 'Pop updated', pop);
    } catch (error) {
        return handleError(res, error);
    }
}

export const deletePop = async (req, res) => {
    try {
        const pop = await Pop.findByIdAndDelete(req.params.id);

        if (!pop) {
            return notFound(res, 'Pop');
        }

        return ok(res, 'Pop deleted');
    } catch (error) {
        return handleError(res, error);
    }
}
