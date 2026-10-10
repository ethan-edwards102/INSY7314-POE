// Escape only the ASCII pattern characters, because MongoDB rejects the \u escapes that RegExp.escape writes.
export const buildBrowseFilter = ({ category, search } = {}) => {
    const filter = { isActive: true };

    if (category) {
        filter.category = category;
    }

    if (search) {
        filter.title = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    return filter;
};

/* ref
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#escaping
*/
