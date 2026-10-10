// Build the list filter from the role, so each person sees only their own side.
export const listScope = (user) => {
    if (user.role === 'Admin') {
        return {};
    }

    return user.role === 'Client' ? { client: user.id } : { freelancer: user.id };
};

// Build the single record filter. A person outside the record gets no match, so the route answers 404.
export const partyScope = (user) => {
    if (user.role === 'Admin') {
        return {};
    }

    return { $or: [{ client: user.id }, { freelancer: user.id }] };
};
