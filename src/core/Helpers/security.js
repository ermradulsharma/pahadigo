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

/**
 * Recursively redacts sensitive fields from an object to prevent logging PII/PCI data.
 * @param {any} details - The object to sanitize.
 * @returns {any} A cleanly cloned and sanitized object.
 */
export const redactSensitiveData = (details) => {
    const sanitizedDetails = JSON.parse(JSON.stringify(details || {}));
    const sensitiveKeys = ['password', 'token', 'otp', 'cardNumber', 'cvv', 'key_secret', 'accountNumber', 'razorpay_signature', 'panNumber', 'aadharNumber'];

    const redact = (obj) => {
        for (const key in obj) {
            if (sensitiveKeys.includes(key)) obj[key] = '***REDACTED***';
            else if (typeof obj[key] === 'object' && obj[key] !== null) redact(obj[key]);
        }
    };

    redact(sanitizedDetails);
    return sanitizedDetails;
};

export default { sanitizeNoSQL, sanitizeHTML, redactSensitiveData };
