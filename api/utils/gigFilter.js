// Escape the search text so a character such as "." or "(" matches itself.
export const buildBrowseFilter = ({ category, search } = {}) => {
    const filter = { isActive: true };

    if (category) {
        filter.category = category;
    }

    if (search) {
        filter.title = new RegExp(RegExp.escape(search), 'i');
    }

    return filter;
};

/* ref
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape
*/
