import Service from '../models/Service.js';
import { handleError, notFound } from '../utils/handleError.js';
import { ok, created } from '../utils/respond.js';

export const createService = async (req, res) => {
    try {
        const { category, rate, rateType } = req.validated;

        const newService = await Service.create({
            category,
            rate,
            rateType,
        });

        return created(res, 'Service created', newService);
    } catch (error) {
        return handleError(res, error);
    }
}

export const getServices = async (req, res) => {
    try {
        const services = await Service.find({});
        return ok(res, 'Services retrieved', services, { count: services.length });
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

        return ok(res, 'Service retrieved', service);
    } catch (error) {
        return handleError(res, error);
    }
}

export const updateService = async (req, res) => {
    try {
        const { category, rate, rateType } = req.validated;

        const service = await Service.findByIdAndUpdate(
            req.params.id,
            { category, rate, rateType },
            { returnDocument: 'after', runValidators: true }
        );

        if (!service) {
            return notFound(res, 'Service');
        }

        return ok(res, 'Service updated', service);
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

        return ok(res, 'Service deleted');
    } catch (error) {
        return handleError(res, error);
    }
}
