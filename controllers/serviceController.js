import Service from '../models/Service.js';

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
        return res.status(500).json({
            message: error.message,
        })
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
        return res.status(500).json({
            message: error.message,
        })
    }
}