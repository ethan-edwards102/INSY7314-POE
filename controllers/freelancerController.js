import Freelancer from '../models/Freelancer.js';
import { handleError, notFound } from '../utils/handleError.js';

export const createFreelancer = async (req, res) => {
    try {
        const { name, services } = req.body;

        const newFreelancer = await Freelancer.create({
            name,
            services,
        });

        return res.status(201).json(newFreelancer);
    } catch (error) {
        return handleError(res, error);
    }
}

export const getFreelancers = async (req, res) => {
    try {
        const freelancers = await Freelancer.find({});
        return res.status(200).json({
            success: true,
            count: freelancers.length,
            data: freelancers,
        });
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

        return res.status(200).json(freelancer);
    } catch (error) {
        return handleError(res, error);
    }
}

export const updateFreelancer = async (req, res) => {
    try {
        const { name, services } = req.body;

        const freelancer = await Freelancer.findByIdAndUpdate(
            req.params.id,
            { name, services },
            { new: true, runValidators: true }
        );

        if (!freelancer) {
            return notFound(res, 'Freelancer');
        }

        return res.status(200).json(freelancer);
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

        return res.status(200).json({
            success: true,
            message: 'Freelancer deleted',
        });
    } catch (error) {
        return handleError(res, error);
    }
}
