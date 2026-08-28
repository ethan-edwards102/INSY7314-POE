import Client from '../models/Client.js';
import { handleError, notFound } from '../utils/handleError.js';
import { ok, created } from '../utils/respond.js';

export const createClient = async (req, res) => {
    try {
        const { name } = req.validated;

        const newClient = await Client.create({
            name,
        });

        return created(res, 'Client created', newClient);
    } catch (error) {
        return handleError(res, error);
    }
}

export const getClients = async (req, res) => {
    try {
        const clients = await Client.find({});
        return ok(res, 'Clients retrieved', clients, { count: clients.length });
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

        return ok(res, 'Client retrieved', client);
    } catch (error) {
        return handleError(res, error);
    }
}

export const updateClient = async (req, res) => {
    try {
        const { name } = req.validated;

        const client = await Client.findByIdAndUpdate(
            req.params.id,
            { name },
            { returnDocument: 'after', runValidators: true }
        );

        if (!client) {
            return notFound(res, 'Client');
        }

        return ok(res, 'Client updated', client);
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

        return ok(res, 'Client deleted');
    } catch (error) {
        return handleError(res, error);
    }
}
