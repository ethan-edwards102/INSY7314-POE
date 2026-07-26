import Client from '../models/Client.js';
import { handleError, notFound } from '../utils/handleError.js';

export const createClient = async (req, res) => {
    try {
        const { name } = req.body;

        const newClient = await Client.create({
            name,
        });

        return res.status(201).json(newClient);
    } catch (error) {
        return handleError(res, error);
    }
}

export const getClients = async (req, res) => {
    try {
        const clients = await Client.find({});
        return res.status(200).json({
            success: true,
            count: clients.length,
            data: clients,
        });
    } catch (error) {
        return handleError(res, error);
    }
}

export const getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return notFound(res, 'Client');
        }

        return res.status(200).json(client);
    } catch (error) {
        return handleError(res, error);
    }
}

export const updateClient = async (req, res) => {
    try {
        const { name } = req.body;

        const client = await Client.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true, runValidators: true }
        );

        if (!client) {
            return notFound(res, 'Client');
        }

        return res.status(200).json(client);
    } catch (error) {
        return handleError(res, error);
    }
}

export const deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);

        if (!client) {
            return notFound(res, 'Client');
        }

        return res.status(200).json({
            success: true,
            message: 'Client deleted',
        });
    } catch (error) {
        return handleError(res, error);
    }
}
