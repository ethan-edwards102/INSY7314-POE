import Service from '../models/Service.js';
import { handleError, notFound } from '../utils/handleError.js';

export const createService = async (req, res) => {
    try {
        const { category, rate, rateType } = req.body;

        const newService = await Service.create({
            category,
            rate,
            rateType,
        });

        return res.status(201).json(newService);
    } catch (error) {
        return handleError(res, error);
    }
}

export const getServices = async (req, res) => {
    try {
        const services = await Service.find({});
        return res.status(200).json({
            success: true,
            count: services.length,
            data: services,
        });
    } catch (error) {
        return handleError(res, error);
    }
}

export const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return notFound(res, 'Service');
        }

        return res.status(200).json(service);
    } catch (error) {
        return handleError(res, error);
    }
}

export const updateService = async (req, res) => {
    try {
        const { category, rate, rateType } = req.body;

        const service = await Service.findByIdAndUpdate(
            req.params.id,
            { category, rate, rateType },
            { new: true, runValidators: true }
        );

        if (!service) {
            return notFound(res, 'Service');
        }

        return res.status(200).json(service);
    } catch (error) {
        return handleError(res, error);
    }
}

export const deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);

        if (!service) {
            return notFound(res, 'Service');
        }

        return res.status(200).json({
            success: true,
            message: 'Service deleted',
        });
    } catch (error) {
        return handleError(res, error);
    }
}
