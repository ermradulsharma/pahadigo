/**
 * Extracts standard request metadata like IP address and User Agent.
 * Used for logging and security audits.
 * 
 * @param {Request} req - The incoming Next.js Request object.
 * @returns {Object} { ipAddress, userAgent }
 */
export const getRequestMetadata = (req) => {
    if (!req) {
        return {
            ipAddress: 'system',
            userAgent: 'system'
        };
    }

    const getHeader = (name) => {
        if (typeof req.headers?.get === 'function') return req.headers.get(name);
        return req.headers?.[name] || req.headers?.[name.toLowerCase()];
    };

    const ipAddress = getHeader('x-forwarded-for') || getHeader('x-real-ip') || 'unknown';
    const userAgent = getHeader('user-agent') || 'unknown';

    return { ipAddress, userAgent };
};

export default { getRequestMetadata };
