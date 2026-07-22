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
 * Allowlist-based HTML sanitizer for rendering CMS content safely server-side.
 * Strips dangerous tags (script, iframe, object, embed) and all event handler attributes.
 * Preserves safe formatting tags needed for Terms/Privacy policy content.
 * @param {string} html - The HTML string to sanitize.
 * @returns {string} The sanitized HTML string safe for dangerouslySetInnerHTML.
 */
export const sanitizeHTML = (html) => {
    if (typeof html !== 'string') return '';

    // Allowlisted tags that are safe for CMS content rendering
    const ALLOWED_TAGS = new Set([
        'p', 'br', 'b', 'i', 'strong', 'em', 'u', 's', 'strike',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'blockquote', 'pre', 'code', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'a', 'span', 'div', 'section', 'article', 'aside',
        'img', 'figure', 'figcaption'
    ]);

    // Allowlisted attributes per tag
    const ALLOWED_ATTRS = new Set(['href', 'title', 'alt', 'src', 'width', 'height', 'class', 'id', 'target', 'rel']);

    // Strip all dangerous tags entirely (including their content)
    const STRIP_TAGS_WITH_CONTENT = /(<(script|style|iframe|object|embed|form|input|button|select|textarea|base|link|meta|applet)[^>]*>[\s\S]*?<\/\2>|<(script|style|iframe|object|embed|form|input|button|select|textarea|base|link|meta|applet)[^>]*\/?>)/gi;

    // Remove dangerous tags with content first, iteratively to handle nested tags (e.g. <scr<script>ipt>)
    let clean = html;
    let prev = '';
    let iterations = 0;
    while (clean !== prev && iterations < 10) {
        prev = clean;
        clean = clean.replace(STRIP_TAGS_WITH_CONTENT, '');
        iterations++;
    }
    // Apply allowlist and attribute stripping iteratively as well
    prev = '';
    iterations = 0;
    while (clean !== prev && iterations < 10) {
        prev = clean;
        clean = clean.replace(/(<\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (match, prefix, tag, attrs) => {
            const tagLower = tag.toLowerCase();
            if (!ALLOWED_TAGS.has(tagLower)) return '';

            if (prefix === '</') {
                return `</${tag}>`;
            }

            // Strip all event handler attributes and dangerous attrs from allowed tags
            const safeAttrs = attrs.replace(/\s([a-zA-Z\-:]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/g, (attrMatch, attrName, attrValue) => {
                const name = attrName.toLowerCase();
                // Block all event handlers (onclick, onerror, onload, etc.)
                if (name.startsWith('on')) return '';
                // Block javascript: protocol in href/src
                if ((name === 'href' || name === 'src') && /javascript:/i.test(attrValue)) return '';
                // Only allow allowlisted attribute names
                if (!ALLOWED_ATTRS.has(name)) return '';
                // Force target="_blank" links to have rel="noopener noreferrer"
                return attrMatch;
            });

            return `<${tag}${safeAttrs}>`;
        });
        iterations++;
    }

    return clean;
};

/**
 * Recursively redacts sensitive fields from an object to prevent logging PII/PCI data.
 * @param {any} details - The object to sanitize.
 * @returns {any} A cleanly cloned and sanitized object.
 */
export const redactSensitiveData = (details) => {
    if (!details || typeof details !== 'object') return details;
    const sensitiveKeys = ['password', 'token', 'otp', 'cardNumber', 'cvv', 'key_secret', 'accountNumber', 'razorpay_signature', 'panNumber', 'aadharNumber'];

    const seen = new WeakSet();

    const cloneAndRedact = (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (seen.has(obj)) return '[Circular]';
        seen.add(obj);

        if (Array.isArray(obj)) {
            return obj.map(item => cloneAndRedact(item));
        }

        const newObj = {};
        for (const key of Object.keys(obj)) {
            if (sensitiveKeys.includes(key)) {
                newObj[key] = '***REDACTED***';
            } else {
                newObj[key] = cloneAndRedact(obj[key]);
            }
        }
        return newObj;
    };

    try {
        return cloneAndRedact(details);
    } catch (e) {
        return details;
    }
};

export default { sanitizeNoSQL, sanitizeHTML, redactSensitiveData };
