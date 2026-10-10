// Build the list filter from the role, so each person sees only their own side.
export const listScope = (user) => {
    if (user.role === 'Admin') {
        return {};
    }

    return user.role === 'Client' ? { client: user.id } : { freelancer: user.id };
};

// Match only a record where the caller is a party, so a stranger gets 404.
export const partyScope = (user) => {
    if (user.role === 'Admin') {
        return {};
    }

    return { $or: [{ client: user.id }, { freelancer: user.id }] };
};

/* ref
https://www.mongodb.com/docs/manual/reference/operator/query/or/
*/
