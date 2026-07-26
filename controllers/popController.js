import Pop from '../models/Pop.js';
import { handleError, notFound } from '../utils/handleError.js';

export const createPop = async (req, res) => {
    try {
        const { datePaid } = req.body;

        const newPop = await Pop.create({
            datePaid,
        });

        return res.status(201).json(newPop);
    } catch (error) {
        return handleError(res, error);
    }
}

export const getPops = async (req, res) => {
    try {
        const pops = await Pop.find({});
        return res.status(200).json({
            success: true,
            count: pops.length,
            data: pops,
        });
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

        return res.status(200).json(pop);
    } catch (error) {
        return handleError(res, error);
    }
}

export const updatePop = async (req, res) => {
    try {
        const { datePaid } = req.body;

        const pop = await Pop.findByIdAndUpdate(
            req.params.id,
            { datePaid },
            { new: true, runValidators: true }
        );

        if (!pop) {
            return notFound(res, 'Pop');
        }

        return res.status(200).json(pop);
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

        return res.status(200).json({
            success: true,
            message: 'Pop deleted',
        });
    } catch (error) {
        return handleError(res, error);
    }
}
