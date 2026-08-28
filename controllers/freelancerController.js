import Freelancer from '../models/Freelancer.js';
import { handleError, notFound } from '../utils/handleError.js';
import { ok, created } from '../utils/respond.js';

export const createFreelancer = async (req, res) => {
    try {
        const { name, services } = req.validated;

        const newFreelancer = await Freelancer.create({
            name,
            services,
        });

        return created(res, 'Freelancer created', newFreelancer);
    } catch (error) {
        return handleError(res, error);
    }
}

export const getFreelancers = async (req, res) => {
    try {
        const freelancers = await Freelancer.find({});
        return ok(res, 'Freelancers retrieved', freelancers, { count: freelancers.length });
    } catch (error) {
        return handleError(res, error);
    }
}

export const getFreelancerById = async (req, res) => {
    try {
        const freelancer = await Freelancer.findById(req.params.id);

        if (!freelancer) {
            return notFound(res, 'Freelancer');
        }

        return ok(res, 'Freelancer retrieved', freelancer);
    } catch (error) {
        return handleError(res, error);
    }
}

export const updateFreelancer = async (req, res) => {
    try {
        const { name, services } = req.validated;

        const freelancer = await Freelancer.findByIdAndUpdate(
            req.params.id,
            { name, services },
            { new: true, runValidators: true }
        );

        if (!freelancer) {
            return notFound(res, 'Freelancer');
        }

        return ok(res, 'Freelancer updated', freelancer);
    } catch (error) {
        return handleError(res, error);
    }
}

export const deleteFreelancer = async (req, res) => {
    try {
        const freelancer = await Freelancer.findByIdAndDelete(req.params.id);

        if (!freelancer) {
            return notFound(res, 'Freelancer');
        }

        return ok(res, 'Freelancer deleted');
    } catch (error) {
        return handleError(res, error);
    }
}
