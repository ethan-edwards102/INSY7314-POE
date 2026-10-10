import Booking from '../models/Booking.js';
import Gig from '../models/Gig.js';
import { handleError, notFound } from '../utils/handleError.js';
import { buildBrowseFilter } from '../utils/gigFilter.js';
import { ok, created } from '../utils/respond.js';

// Populate only the freelancer name, so no other User field leaves the API.
const OWNER_FIELDS = 'name';

export const getGigs = async (req, res) => {
    try {
        const gigs = await Gig.find(buildBrowseFilter(req.validated))
            .sort({ createdAt: -1 })
            .populate('freelancer', OWNER_FIELDS);

        return ok(res, 'Gigs retrieved', gigs, { count: gigs.length });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getMyGigs = async (req, res) => {
    try {
        const gigs = await Gig.find({ freelancer: req.user.id }).sort({ createdAt: -1 });

        return ok(res, 'Gigs retrieved', gigs, { count: gigs.length });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getGigById = async (req, res) => {
    try {
        // Hide an inactive gig from everyone except its owner and the Admin.
        const filter = { _id: req.params.id };

        if (req.user.role !== 'Admin') {
            filter.$or = [{ isActive: true }, { freelancer: req.user.id }];
        }

        const gig = await Gig.findOne(filter).populate('freelancer', OWNER_FIELDS);

        if (!gig) {
            return notFound(res, 'Gig');
        }

        return ok(res, 'Gig retrieved', gig);
    } catch (error) {
        return handleError(res, error);
    }
};

export const createGig = async (req, res) => {
    try {
        const gig = await Gig.create({ ...req.validated, freelancer: req.user.id });

        return created(res, 'Gig created', gig);
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateGig = async (req, res) => {
    try {
        const gig = await Gig.findOneAndUpdate(
            { _id: req.params.id, freelancer: req.user.id },
            req.validated,
            { returnDocument: 'after', runValidators: true }
        );

        if (!gig) {
            return notFound(res, 'Gig');
        }

        return ok(res, 'Gig updated', gig);
    } catch (error) {
        return handleError(res, error);
    }
};

export const deleteGig = async (req, res) => {
    try {
        const filter = { _id: req.params.id };

        // Limit a Freelancer to their own gigs, because the Admin may delete any gig.
        if (req.user.role !== 'Admin') {
            filter.freelancer = req.user.id;
        }

        const gig = await Gig.findOne(filter);

        if (!gig) {
            return notFound(res, 'Gig');
        }

        // Keep a booked gig, because its bookings and transactions still point to it.
        if (await Booking.exists({ gig: gig._id })) {
            gig.isActive = false;
            await gig.save();

            return ok(res, 'Gig deactivated because it has bookings', gig);
        }

        await gig.deleteOne();

        return ok(res, 'Gig deleted');
    } catch (error) {
        return handleError(res, error);
    }
};

/* ref
https://mongoosejs.com/docs/populate.html#field-selection
*/
