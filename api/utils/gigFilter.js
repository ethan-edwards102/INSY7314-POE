export const buildBrowseFilter = ({ category, search } = {}) => {
    const filter = { isActive: true };

    if (category) {
        filter.category = category;
    }

    if (search) {
        // Escape the pattern characters so the text matches itself and MongoDB accepts the pattern.
        filter.title = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    return filter;
};

/* ref
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#escaping
*/
