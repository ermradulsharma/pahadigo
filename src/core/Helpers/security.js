/**
 * Sanitizes an object by removing any keys that start with '$' to prevent NoSQL injection.
 * @param {any} obj - The object to sanitize.
 * @returns {any} The sanitized object.
 */
export const sanitizeNoSQL = (obj) => {
    if (obj instanceof Array) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = sanitizeNoSQL(obj[i]);
        }
    } else if (obj !== null && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
            if (key.startsWith('$')) {
                console.warn(`[Security] Stripping NoSQL operator: ${key}`);
                delete obj[key];
            } else {
                obj[key] = sanitizeNoSQL(obj[key]);
            }
        });
    }
    return obj;
};

/**
 * Basic HTML sanitizer to strip <script> tags and other dangerous elements.
 * Note: Use a robust library like DOMPurify in production.
 * @param {string} html - The HTML string to sanitize.
 * @returns {string} The sanitized HTML.
 */
export const sanitizeHTML = (html) => {
    if (typeof html !== 'string') return html;
    
    // Safely escape HTML entities to prevent XSS instead of using fragile regex parsing
    return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};
