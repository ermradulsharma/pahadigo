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

    const ipAddress = req.headers?.get('x-forwarded-for') || req.headers?.get('x-real-ip') || 'unknown';
    const userAgent = req.headers?.get('user-agent') || 'unknown';

    return { ipAddress, userAgent };
};
